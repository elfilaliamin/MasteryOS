import { query } from '../config/db.js';
import crypto from 'crypto';

// In-memory fallback
const fallbackCategories = new Map();

// Helper to seed defaults for a user
export const seedDefaultCategories = async (userId) => {
  const defaults = [
    { name: 'Work', color: '#3b82f6' },
    { name: 'Personal', color: '#10b981' },
    { name: 'Urgent', color: '#ef4444' },
    { name: 'Learning', color: '#8b5cf6' }
  ];

  for (const cat of defaults) {
    await createCategory(userId, cat.name, cat.color);
  }
};

export const getCategoriesByUser = async (userId) => {
  try {
    const res = await query(
      `SELECT c.*, COUNT(t.id)::int as task_count
       FROM categories c
       LEFT JOIN tasks t ON t.category_id = c.id AND t.is_archived = false
       WHERE c.user_id = $1
       GROUP BY c.id
       ORDER BY c.created_at ASC`,
      [userId]
    );
    if (res && res.rows) {
      if (res.rows.length === 0) {
        await seedDefaultCategories(userId);
        const retryRes = await query(
          `SELECT c.*, COUNT(t.id)::int as task_count
           FROM categories c
           LEFT JOIN tasks t ON t.category_id = c.id AND t.is_archived = false
           WHERE c.user_id = $1
           GROUP BY c.id
           ORDER BY c.created_at ASC`,
          [userId]
        );
        return retryRes.rows;
      }
      return res.rows;
    }
  } catch (err) {
    console.warn('[DB Fallback] Getting categories from memory:', err.message);
  }

  // Fallback memory store
  let userCats = fallbackCategories.get(userId);
  if (!userCats || userCats.length === 0) {
    userCats = [
      { id: crypto.randomUUID(), user_id: userId, name: 'Work', color: '#3b82f6', task_count: 0 },
      { id: crypto.randomUUID(), user_id: userId, name: 'Personal', color: '#10b981', task_count: 0 },
      { id: crypto.randomUUID(), user_id: userId, name: 'Urgent', color: '#ef4444', task_count: 0 },
      { id: crypto.randomUUID(), user_id: userId, name: 'Learning', color: '#8b5cf6', task_count: 0 }
    ];
    fallbackCategories.set(userId, userCats);
  }
  return userCats;
};

export const createCategory = async (userId, name, color = '#6366f1') => {
  try {
    const res = await query(
      `INSERT INTO categories (user_id, name, color)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id, name) DO UPDATE SET color = EXCLUDED.color
       RETURNING *`,
      [userId, name, color]
    );
    if (res && res.rows) {
      return res.rows[0];
    }
  } catch (err) {
    console.warn('[DB Fallback] Storing category in memory:', err.message);
  }

  const userCats = fallbackCategories.get(userId) || [];
  const existing = userCats.find(c => c.name.toLowerCase() === name.toLowerCase());
  if (existing) {
    existing.color = color;
    return existing;
  }

  const newCat = {
    id: crypto.randomUUID(),
    user_id: userId,
    name,
    color,
    task_count: 0,
    created_at: new Date().toISOString()
  };
  userCats.push(newCat);
  fallbackCategories.set(userId, userCats);
  return newCat;
};

export const deleteCategory = async (userId, categoryId) => {
  try {
    await query('DELETE FROM categories WHERE id = $1 AND user_id = $2', [categoryId, userId]);
    return true;
  } catch (err) {
    console.warn('[DB Fallback] Deleting category in memory:', err.message);
  }

  const userCats = fallbackCategories.get(userId) || [];
  const filtered = userCats.filter(c => c.id !== categoryId);
  fallbackCategories.set(userId, filtered);
  return true;
};
