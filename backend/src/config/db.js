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

// Run initialization SQL migration on startup
export const initDb = async () => {
  try {
    const client = await pool.connect();
    console.log(' Connected to PostgreSQL database successfully.');
    
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const initSqlPath = path.join(__dirname, '../db/init.sql');
    
    if (fs.existsSync(initSqlPath)) {
      const sql = fs.readFileSync(initSqlPath, 'utf8');
      await client.query(sql);
      console.log(' Database schema verified and initialized.');
    }
    client.release();
  } catch (err) {
    console.warn(' Database connection warning (if database is not running yet, backend will retry upon requests):', err.message);
  }
};

export const query = (text, params) => pool.query(text, params);
export default pool;
