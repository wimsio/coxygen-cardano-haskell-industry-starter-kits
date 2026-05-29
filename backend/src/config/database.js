'use strict';
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host:              process.env.DB_HOST     || 'localhost',
  port:              parseInt(process.env.DB_PORT || '3306'),
  database:          process.env.DB_NAME     || 'edu_credentials',
  user:              process.env.DB_USER     || 'edu_user',
  password:          process.env.DB_PASS     || '',
  waitForConnections: true,
  connectionLimit:   10,
  queueLimit:        0,
  timezone:          'Z',
  charset:           'utf8mb4'
});

pool.getConnection()
  .then(conn => { console.log('[DB] MySQL connected'); conn.release(); })
  .catch(err => { console.error('[DB] Connection failed:', err.message); process.exit(1); });

module.exports = pool;
