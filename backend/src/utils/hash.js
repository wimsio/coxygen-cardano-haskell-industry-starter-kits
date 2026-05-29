'use strict';
const crypto = require('crypto');

function buildCanonicalPayload(data) {
  return JSON.stringify({
    institution:  data.institutionSlug,
    type:         data.credentialType,
    title:        data.title,
    holder_email: data.holderEmail,
    issue_date:   data.issueDate,
    grade:        data.grade || null,
  });
}

function hashCredential(data) {
  const payload  = buildCanonicalPayload(data);
  const fullHash = crypto.createHash('sha256').update(payload, 'utf8').digest('hex');
  return fullHash.slice(0, 56);
}

function verifyCredentialHash(data, suppliedHash) {
  return hashCredential(data) === suppliedHash;
}

function generateClaimToken() {
  return crypto.randomBytes(32).toString('hex');
}

module.exports = { hashCredential, verifyCredentialHash, generateClaimToken, buildCanonicalPayload };
