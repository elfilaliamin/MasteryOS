import pg from 'pg';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres123',
  database: process.env.DB_NAME || 'tasktracker_db',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on('error', (err) => {
  console.error('Unexpected database client error:', err);
});

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Run initialization SQL migration on startup with retry logic
export const initDb = async () => {
  const isProd = process.env.NODE_ENV === 'production';
  const dbHost = process.env.DB_HOST || 'localhost';
  const dbName = process.env.DB_NAME || 'tasktracker_db';
  const maxRetries = 10;
  const retryIntervalMs = 3000;

  let client = null;
  let attempt = 0;

  while (attempt < maxRetries) {
    attempt++;
    try {
      client = await pool.connect();
      break;
    } catch (err) {
      if (isProd) {
        console.warn(`[DB Connection] Attempt ${attempt}/${maxRetries} failed: ${err.message}`);
        if (attempt < maxRetries) {
          await sleep(retryIntervalMs);
        }
      } else {
        console.warn(`[DB Connection] Attempt ${attempt}/${maxRetries} failed (dev fallback active): ${err.message}`);
        break;
      }
    }
  }

  if (!client) {
    if (isProd) {
      console.error(`[DB Fatal] Could not connect to PostgreSQL after ${maxRetries} attempts. Exiting...`);
      process.exit(1);
    }
    console.warn('[DB Dev] PostgreSQL unavailable; running with local in-memory fallback.');
    return;
  }

  try {
    console.log(`Connected to PostgreSQL db=${dbName} host=${dbHost}`);

    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const initSqlPath = path.join(__dirname, '../db/init.sql');

    if (fs.existsSync(initSqlPath)) {
      const sql = fs.readFileSync(initSqlPath, 'utf8');
      await client.query(sql);
      console.log('Database schema verified and initialized.');
    }
  } catch (err) {
    console.error('Error running init.sql migration:', err.message);
    if (isProd) {
      process.exit(1);
    }
  } finally {
    client.release();
  }
};

export const query = (text, params) => pool.query(text, params);
export default pool;
