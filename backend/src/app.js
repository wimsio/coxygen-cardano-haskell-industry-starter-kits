'use strict';
require('dotenv').config();
const express   = require('express');
const helmet    = require('helmet');
const cors      = require('cors');
const morgan    = require('morgan');
const rateLimit = require('express-rate-limit');

const authRoutes       = require('./routes/auth');
const credentialRoutes = require('./routes/credentials');
const verifyRoutes     = require('./routes/verify');

const app  = express();
const PORT = process.env.PORT || 3000;

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({ origin: (process.env.CORS_ORIGINS || 'http://localhost:8080').split(','),
  methods: ['GET','POST','PATCH','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization'], credentials: true }));
app.use(morgan('dev'));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

app.use('/api/', rateLimit({ windowMs: 15*60*1000, max: 200 }));
app.use('/api/auth/login', rateLimit({ windowMs: 15*60*1000, max: 20 }));
app.use('/api/verify', rateLimit({ windowMs: 60*1000, max: 60 }));

app.use('/api/auth',        authRoutes);
app.use('/api/credentials', credentialRoutes);
app.use('/api/verify',      verifyRoutes);

app.get('/health', (_req, res) => res.json({ status: 'ok', ts: new Date().toISOString() }));

app.use((err, _req, res, _next) => {
  console.error('[App] Error:', err);
  res.status(500).json({ error: 'An unexpected error occurred' });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`[App] EduCredentials API running on port ${PORT}`);
    console.log(`[App] Network: ${process.env.CARDANO_NETWORK || 'preview'}`);
  });
}

module.exports = app;
