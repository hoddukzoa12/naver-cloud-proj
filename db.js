'use strict';

const DB_AVAILABLE = !!(
  process.env.DB_DOMAIN &&
  process.env.DB_NAME &&
  process.env.DB_USER_ID &&
  process.env.DB_USER_PASSWORD
);

let Pool;
let pool = null;

if (DB_AVAILABLE) {
  try {
    ({ Pool } = require('pg'));
    pool = new Pool({
      host: process.env.DB_DOMAIN,
      port: Number(process.env.DB_PORT || 5432),
      database: process.env.DB_NAME,
      user: process.env.DB_USER_ID,
      password: process.env.DB_USER_PASSWORD,
      ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
      max: 5,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });
    pool.on('error', (err) => {
      console.error('[db] pool error:', err.message);
    });
  } catch (err) {
    console.warn('[db] pg module load failed:', err.message);
    pool = null;
  }
}

async function query(sql, params = []) {
  if (!pool) throw new Error('DB not configured');
  const client = await pool.connect();
  try {
    return await client.query(sql, params);
  } finally {
    client.release();
  }
}

module.exports = { DB_AVAILABLE: DB_AVAILABLE && pool !== null, query, pool };
