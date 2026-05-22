'use strict';
const express = require('express');
const { body, validationResult } = require('express-validator');
const QRCode  = require('qrcode');
const db      = require('../config/database');
const { requireAuth } = require('../middleware/auth');
const { hashCredential, generateClaimToken } = require('../utils/hash');
const router  = express.Router();

router.get('/', requireAuth, async (req, res) => {
  const { status, type, search } = req.query;
  let sql = `SELECT id,credential_type,title,holder_name,holder_email,issue_date,
             expiry_date,grade,status,credential_hash,tx_hash,claimed_at,created_at
             FROM credentials WHERE institution_id = ?`;
  const params = [req.user.institution_id];
  if (status) { sql += ' AND status = ?'; params.push(status); }
  if (type)   { sql += ' AND credential_type = ?'; params.push(type); }
  if (search) { sql += ' AND (holder_name LIKE ? OR holder_email LIKE ? OR title LIKE ?)';
    const like = `%${search}%`; params.push(like, like, like); }
  sql += ' ORDER BY created_at DESC LIMIT 200';
  const [rows] = await db.query(sql, params);
  res.json(rows);
});

router.post('/', requireAuth, [
  body('credential_type').isIn(['diploma','certificate','micro_credential']),
  body('title').trim().isLength({ min: 2, max: 255 }),
  body('holder_name').trim().notEmpty(),
  body('holder_email').isEmail().normalizeEmail(),
  body('issue_date').isISO8601(),
  body('grade').optional().trim(),
  body('expiry_date').optional().isISO8601(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  const { credential_type, title, holder_name, holder_email, issue_date, expiry_date, grade, description } = req.body;
  const [instRows] = await db.query('SELECT slug FROM institutions WHERE id = ?', [req.user.institution_id]);
  if (!instRows.length) return res.status(400).json({ error: 'Institution not found' });
  const issueDateStr = typeof issue_date === 'string' ? issue_date.slice(0,10) : new Date(issue_date).toISOString().slice(0,10);
  const credentialHash = hashCredential({ institutionSlug: instRows[0].slug, credentialType: credential_type,
    title, holderEmail: holder_email, issueDate: issueDateStr, grade: grade || null });
  const claimToken  = generateClaimToken();
  const claimExpiry = new Date(Date.now() + 72 * 3600000);
  try {
    const [result] = await db.query(
      `INSERT INTO credentials (credential_type,title,description,institution_id,holder_name,holder_email,
       issue_date,expiry_date,grade,credential_hash,status,claim_token,claim_expires_at)
       VALUES (?,?,?,?,?,?,?,?,?,?,'issued',?,?)`,
      [credential_type, title, description||null, req.user.institution_id, holder_name, holder_email,
       issueDateStr, expiry_date ? expiry_date.slice(0,10) : null, grade||null,
       credentialHash, claimToken, claimExpiry]);
    const claimUrl  = `${process.env.QR_BASE_URL || 'http://localhost:8080/verifier.html'}?hash=${credentialHash}`;
    const qrDataUrl = await QRCode.toDataURL(claimUrl);
    const [newCred] = await db.query('SELECT * FROM credentials WHERE id = ?', [result.insertId]);
    res.status(201).json({ credential: newCred[0], claim_url: claimUrl, claim_token: claimToken, qr_code: qrDataUrl });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Credential already exists' });
    console.error('[Credentials]', err);
    res.status(500).json({ error: 'Failed to issue credential' });
  }
});

router.get('/claim/:token', async (req, res) => {
  const [rows] = await db.query(
    `SELECT c.*, i.name AS institution_name, i.logo_url FROM credentials c
     JOIN institutions i ON i.id = c.institution_id
     WHERE c.claim_token = ? AND c.status = 'issued'`, [req.params.token]);
  if (!rows.length) return res.status(404).json({ error: 'Invalid or expired claim link' });
  const cred = rows[0];
  if (cred.claim_expires_at && new Date(cred.claim_expires_at) < new Date())
    return res.status(410).json({ error: 'Claim link has expired' });
  if (!cred.claimed_at) await db.query('UPDATE credentials SET claimed_at = NOW() WHERE id = ?', [cred.id]);
  res.json({ id: cred.id, credential_type: cred.credential_type, title: cred.title,
    holder_name: cred.holder_name, issue_date: cred.issue_date, expiry_date: cred.expiry_date,
    grade: cred.grade, credential_hash: cred.credential_hash, tx_hash: cred.tx_hash,
    institution_name: cred.institution_name, status: cred.status });
});

router.get('/:id', requireAuth, async (req, res) => {
  const [rows] = await db.query('SELECT * FROM credentials WHERE id = ? AND institution_id = ?',
    [req.params.id, req.user.institution_id]);
  if (!rows.length) return res.status(404).json({ error: 'Not found' });
  res.json(rows[0]);
});

router.patch('/:id/revoke', requireAuth, async (req, res) => {
  const [rows] = await db.query('SELECT * FROM credentials WHERE id = ? AND institution_id = ?',
    [req.params.id, req.user.institution_id]);
  if (!rows.length) return res.status(404).json({ error: 'Not found' });
  if (rows[0].status === 'revoked') return res.status(409).json({ error: 'Already revoked' });
  await db.query(`UPDATE credentials SET status='revoked', revoked_at=NOW(), revocation_reason=? WHERE id=?`,
    [req.body.reason||null, req.params.id]);
  res.json({ message: 'Credential revoked', id: req.params.id });
});

module.exports = router;
