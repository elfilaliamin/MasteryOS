import { query } from '../config/db.js';
import crypto from 'crypto';

// In-memory fallback cache when PostgreSQL is offline
const fallbackUsers = new Map();

export const findUserByEmail = async (email) => {
  try {
    const res = await query('SELECT * FROM users WHERE email = $1', [email.toLowerCase().trim()]);
    if (res && res.rows) {
      return res.rows[0];
    }
  } catch (err) {
    console.warn('[DB Fallback] Querying local user store:', err.message);
  }
  return fallbackUsers.get(email.toLowerCase().trim()) || null;
};

export const findUserById = async (id) => {
  try {
    const res = await query('SELECT id, email, password_hash, full_name, avatar_url, created_at FROM users WHERE id = $1', [id]);
    if (res && res.rows && res.rows[0]) {
      return res.rows[0];
    }
  } catch (err) {
    console.warn('[DB Fallback] Querying local user store by ID:', err.message);
  }
  for (const user of fallbackUsers.values()) {
    if (user.id === id) {
      return user;
    }
  }
  return null;
};

export const createUser = async ({ email, password_hash, full_name }) => {
  const normalizedEmail = email.toLowerCase().trim();
  try {
    const res = await query(
      `INSERT INTO users (email, password_hash, full_name)
       VALUES ($1, $2, $3)
       RETURNING id, email, full_name, avatar_url, created_at`,
      [normalizedEmail, password_hash, full_name]
    );
    if (res && res.rows) {
      return res.rows[0];
    }
  } catch (err) {
    console.warn('[DB Fallback] Storing user in fallback store:', err.message);
  }

  const id = crypto.randomUUID();
  const newUser = {
    id,
    email: normalizedEmail,
    password_hash,
    full_name,
    avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(full_name)}`,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  fallbackUsers.set(normalizedEmail, newUser);
  const { password_hash: _, ...safeUser } = newUser;
  return safeUser;
};

export const updateUserPassword = async (userId, newPasswordHash) => {
  try {
    const res = await query(
      `UPDATE users
       SET password_hash = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING id, email, full_name, avatar_url`,
      [newPasswordHash, userId]
    );
    if (res && res.rows && res.rows[0]) {
      return res.rows[0];
    }
  } catch (err) {
    console.warn('[DB Fallback] Updating password in memory store:', err.message);
  }

  for (const user of fallbackUsers.values()) {
    if (user.id === userId) {
      user.password_hash = newPasswordHash;
      user.updated_at = new Date().toISOString();
      const { password_hash: _, ...safeUser } = user;
      return safeUser;
    }
  }
  return null;
};

export const updateUserProfile = async (userId, { full_name, avatar_url }) => {
  try {
    const res = await query(
      `UPDATE users
       SET full_name = COALESCE($1, full_name),
           avatar_url = COALESCE($2, avatar_url),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $3
       RETURNING id, email, full_name, avatar_url`,
      [full_name, avatar_url, userId]
    );
    if (res && res.rows && res.rows[0]) {
      return res.rows[0];
    }
  } catch (err) {
    console.warn('[DB Fallback] Updating profile in memory store:', err.message);
  }

  for (const user of fallbackUsers.values()) {
    if (user.id === userId) {
      if (full_name) user.full_name = full_name;
      if (avatar_url) user.avatar_url = avatar_url;
      user.updated_at = new Date().toISOString();
      const { password_hash: _, ...safeUser } = user;
      return safeUser;
    }
  }
  return null;
};
