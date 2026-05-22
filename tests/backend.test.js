'use strict';
const request = require('supertest');
const app     = require('../backend/src/app');
const { hashCredential, verifyCredentialHash, generateClaimToken } = require('../backend/src/utils/hash');

// ---------------------------------------------------------------------------
// Hash utility tests
// ---------------------------------------------------------------------------
describe('hashCredential()', () => {
  const sample = {
    institutionSlug: 'demo-university',
    credentialType:  'diploma',
    title:           'Bachelor of Science',
    holderEmail:     'student@example.com',
    issueDate:       '2024-06-01',
    grade:           'First Class',
  };

  test('returns a 56-character hex string', () => {
    const hash = hashCredential(sample);
    expect(hash).toHaveLength(56);
    expect(hash).toMatch(/^[0-9a-f]+$/);
  });

  test('is deterministic — same input always gives same hash', () => {
    expect(hashCredential(sample)).toBe(hashCredential(sample));
  });

  test('different emails produce different hashes', () => {
    const other = { ...sample, holderEmail: 'other@example.com' };
    expect(hashCredential(sample)).not.toBe(hashCredential(other));
  });

  test('different titles produce different hashes', () => {
    const other = { ...sample, title: 'Master of Science' };
    expect(hashCredential(sample)).not.toBe(hashCredential(other));
  });

  test('null grade and missing grade produce same hash', () => {
    const withNull    = { ...sample, grade: null };
    const withMissing = { ...sample };
    delete withMissing.grade;
    expect(hashCredential(withNull)).toBe(hashCredential(withMissing));
  });
});

describe('verifyCredentialHash()', () => {
  const sample = {
    institutionSlug: 'demo-university',
    credentialType:  'certificate',
    title:           'Web Development',
    holderEmail:     'dev@example.com',
    issueDate:       '2024-01-15',
    grade:           null,
  };

  test('returns true for correct hash', () => {
    const hash = hashCredential(sample);
    expect(verifyCredentialHash(sample, hash)).toBe(true);
  });

  test('returns false for tampered hash', () => {
    const hash = hashCredential(sample);
    const tampered = hash.slice(0, -2) + 'ff';
    expect(verifyCredentialHash(sample, tampered)).toBe(false);
  });
});

describe('generateClaimToken()', () => {
  test('returns a 64-character hex string', () => {
    const token = generateClaimToken();
    expect(token).toHaveLength(64);
    expect(token).toMatch(/^[0-9a-f]+$/);
  });

  test('each call returns a unique token', () => {
    expect(generateClaimToken()).not.toBe(generateClaimToken());
  });
});

// ---------------------------------------------------------------------------
// API endpoint tests
// ---------------------------------------------------------------------------
describe('GET /health', () => {
  test('returns 200 with status ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});

describe('POST /api/auth/login — validation', () => {
  test('returns 400 for missing email', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ password: 'password123' });
    expect(res.status).toBe(400);
  });

  test('returns 400 for invalid email format', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'notanemail', password: 'password123' });
    expect(res.status).toBe(400);
  });

  test('returns 401 for wrong credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nobody@nowhere.com', password: 'wrongpassword' });
    expect(res.status).toBe(401);
  });
});

describe('GET /api/verify — validation', () => {
  test('returns 400 when hash is missing', async () => {
    const res = await request(app).get('/api/verify');
    expect(res.status).toBe(400);
  });

  test('returns 400 when hash is wrong length', async () => {
    const res = await request(app).get('/api/verify?hash=abc123');
    expect(res.status).toBe(400);
  });

  test('returns not_found for valid-length unknown hash', async () => {
    const fakeHash = 'a'.repeat(56);
    const res = await request(app).get(`/api/verify?hash=${fakeHash}`);
    expect(res.status).toBe(200);
    expect(res.body.result).toBe('not_found');
  });
});

describe('GET /api/credentials — auth guard', () => {
  test('returns 401 without token', async () => {
    const res = await request(app).get('/api/credentials');
    expect(res.status).toBe(401);
  });

  test('returns 401 with malformed token', async () => {
    const res = await request(app)
      .get('/api/credentials')
      .set('Authorization', 'Bearer not_a_real_token');
    expect(res.status).toBe(401);
  });
});

describe('POST /api/credentials — auth guard', () => {
  test('returns 401 without auth header', async () => {
    const res = await request(app)
      .post('/api/credentials')
      .send({ title: 'Test Cert' });
    expect(res.status).toBe(401);
  });
});
