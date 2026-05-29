'use strict';
const express = require('express');
const bcrypt  = require('bcrypt');
const jwt     = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const db      = require('../config/database');
const { requireAuth } = require('../middleware/auth');
const router  = express.Router();

router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  const { email, password } = req.body;
  try {
    const [rows] = await db.query(
      `SELECT au.*, i.name AS institution_name, i.slug AS institution_slug, i.wallet_address, i.policy_id
       FROM admin_users au LEFT JOIN institutions i ON i.id = au.institution_id
       WHERE au.email = ? AND au.is_active = 1`, [email]);
    if (!rows.length) return res.status(401).json({ error: 'Invalid credentials' });
    const user  = rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });
    const token = jwt.sign(
      { sub: user.id, email: user.email, role: user.role,
        institution_id: user.institution_id, institution_name: user.institution_name },
      process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '8h' });
    res.json({ token, user: { id: user.id, email: user.email, role: user.role,
      institution_name: user.institution_name, wallet_address: user.wallet_address }});
  } catch (err) {
    console.error('[Auth] Login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

router.get('/me', requireAuth, async (req, res) => {
  const [rows] = await db.query(
    `SELECT au.id, au.email, au.role, i.id AS institution_id,
            i.name AS institution_name, i.slug, i.wallet_address, i.policy_id, i.logo_url
     FROM admin_users au LEFT JOIN institutions i ON i.id = au.institution_id
     WHERE au.id = ?`, [req.user.sub]);
  if (!rows.length) return res.status(404).json({ error: 'User not found' });
  res.json(rows[0]);
});

router.post('/setup', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 12 }),
  body('institution_name').notEmpty(),
  body('wallet_address').notEmpty(),
  body('setup_key').notEmpty(),
], async (req, res) => {
  if (req.body.setup_key !== process.env.SETUP_KEY)
    return res.status(403).json({ error: 'Invalid setup key' });
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  const { email, password, institution_name, wallet_address } = req.body;
  const hash = await bcrypt.hash(password, 12);
  const slug = institution_name.toLowerCase().replace(/\s+/g,'-').replace(/[^a-z0-9-]/g,'');
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const [inst] = await conn.query(
      'INSERT INTO institutions (name, slug, wallet_address) VALUES (?,?,?)',
      [institution_name, slug, wallet_address]);
    await conn.query(
      'INSERT INTO admin_users (email, password_hash, role, institution_id) VALUES (?,?,?,?)',
      [email, hash, 'institution_admin', inst.insertId]);
    await conn.commit();
    res.status(201).json({ message: 'Setup complete' });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ error: 'Setup failed' });
  } finally { conn.release(); }
});

module.exports = router;
