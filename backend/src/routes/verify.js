'use strict';
const express = require('express');
const { query: qv, validationResult } = require('express-validator');
const db      = require('../config/database');
const { checkCredentialOnChain } = require('../utils/cardano');
const router  = express.Router();

router.get('/', [
  qv('hash').isLength({ min: 56, max: 56 }).withMessage('Hash must be 56 hex characters'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  const { hash } = req.query;
  const ip = req.ip;
  const [rows] = await db.query(
    `SELECT c.id, c.credential_type, c.title, c.holder_name, c.issue_date,
            c.expiry_date, c.grade, c.credential_hash, c.tx_hash, c.status,
            c.revoked_at, c.revocation_reason, c.policy_id,
            i.name AS institution_name, i.logo_url, i.wallet_address
     FROM credentials c JOIN institutions i ON i.id = c.institution_id
     WHERE c.credential_hash = ?`, [hash]);
  if (!rows.length) {
    await logV(null, hash, ip, req.headers['user-agent'], 'not_found', false);
    return res.json({ result: 'not_found', message: 'No credential found with this hash.', hash });
  }
  const cred = rows[0];
  if (cred.status === 'revoked') {
    await logV(cred.id, hash, ip, req.headers['user-agent'], 'revoked', false);
    return res.json({ result: 'revoked', message: 'This credential has been revoked.',
      revoked_at: cred.revoked_at, revocation_reason: cred.revocation_reason, credential: sanitize(cred) });
  }
  if (cred.expiry_date && new Date(cred.expiry_date) < new Date())
    return res.json({ result: 'expired', message: 'This credential has expired.',
      expiry_date: cred.expiry_date, credential: sanitize(cred) });
  let chainConfirmed = false, chainData = { found: false, txHash: null };
  try { chainData = await checkCredentialOnChain(hash); chainConfirmed = chainData.found; }
  catch (err) { console.warn('[Verify] Chain check failed:', err.message); }
  await logV(cred.id, hash, ip, req.headers['user-agent'], 'valid', chainConfirmed);
  res.json({ result: 'valid', message: 'Credential is authentic and valid.',
    chain_confirmed: chainConfirmed, credential: sanitize(cred),
    chain: chainConfirmed ? { tx_hash: cred.tx_hash || chainData.txHash, policy_id: cred.policy_id } : null });
});

function sanitize(c) {
  return { credential_type: c.credential_type, title: c.title, holder_name: c.holder_name,
    issue_date: c.issue_date, expiry_date: c.expiry_date, grade: c.grade,
    credential_hash: c.credential_hash, tx_hash: c.tx_hash,
    institution_name: c.institution_name, institution_logo: c.logo_url };
}

async function logV(credId, hash, ip, agent, result, chainConfirmed) {
  try {
    await db.query(
      `INSERT INTO verification_logs (credential_id,credential_hash,verifier_ip,verifier_agent,result,chain_confirmed)
       VALUES (?,?,?,?,?,?)`,
      [credId||null, hash, ip?.slice(0,45)||null, agent?.slice(0,500)||null, result, chainConfirmed?1:0]);
  } catch(e) { console.warn('[Verify] Log failed:', e.message); }
}

module.exports = router;
