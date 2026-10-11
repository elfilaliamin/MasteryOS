import { query } from '../config/db.js';
import crypto from 'crypto';

// In-memory fallback
const fallbackGoals = new Map();

const calcDaysUntilDue = (dueDate) => {
  if (!dueDate) return null;
  const target = new Date(dueDate);
  const now = new Date();
  const diffTime = target - now;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

export const seedDefaultGoals = async (userId) => {
  const defaults = [
    {
      title: 'Full Stack App Deployment',
      description: 'Deploy Master Tasks Tracker across Docker containers with nginx, node, and postgres.',
      due_date: new Date(Date.now() + 86400000 * 7).toISOString(),
      priority: 'HIGH',
      color: '#0d8a72',
      icon: '🚀'
    },
    {
      title: 'Healthy Habits & Running Habit',
      description: 'Morning cardio routine, hydration, and nutritional discipline.',
      due_date: new Date(Date.now() + 86400000 * 14).toISOString(),
      priority: 'MEDIUM',
      color: '#10b981',
      icon: '🏃‍♂️'
    },
    {
      title: 'Design System & Micro-Interactions',
      description: 'Implement modern Khademni teal and amber palette with dark/light themes.',
      due_date: new Date(Date.now() + 86400000 * 21).toISOString(),
      priority: 'URGENT',
      color: '#f59e0b',
      icon: '💻'
    }
  ];

  for (const g of defaults) {
    await createGoal(userId, g);
  }
};

export const getGoalsByUser = async (userId) => {
  try {
    const res = await query(
      `SELECT g.*,
        COUNT(t.id)::int as total_tasks,
        COUNT(CASE WHEN t.status = 'COMPLETED' THEN 1 END)::int as completed_tasks
       FROM goals g
       LEFT JOIN tasks t ON t.goal_id = g.id AND t.user_id = g.user_id AND t.is_archived = false
       WHERE g.user_id = $1
       GROUP BY g.id
       ORDER BY g.created_at DESC`,
      [userId]
    );
    if (res && res.rows) {
      return res.rows.map(g => ({
        ...g,
        due_date: g.due_date || g.target_date,
        days_until_due: calcDaysUntilDue(g.due_date || g.target_date),
        priority: g.priority || 'MEDIUM',
        progress_percent: g.total_tasks > 0 ? Math.round((g.completed_tasks / g.total_tasks) * 100) : 0
      }));
    }
  } catch (err) {
    console.warn('[DB Fallback] Fetching goals from memory:', err.message);
  }

  // Fallback memory store
  const userGoals = fallbackGoals.get(userId) || [];
  return userGoals;
};

export const createGoal = async (userId, data) => {
  const {
    title,
    description = '',
    due_date = null,
    target_date = null,
    priority = 'MEDIUM',
    color = '#0d8a72',
    icon = '🎯'
  } = data;
  const effectiveDueDate = due_date || target_date;

  try {
    const res = await query(
      `INSERT INTO goals (user_id, title, description, due_date, priority, color, icon)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [userId, title, description, effectiveDueDate, priority, color, icon]
    );
    if (res && res.rows) {
      return {
        ...res.rows[0],
        due_date: effectiveDueDate,
        days_until_due: calcDaysUntilDue(effectiveDueDate),
        priority,
        total_tasks: 0,
        completed_tasks: 0,
        progress_percent: 0
      };
    }
  } catch (err) {
    console.warn('[DB Fallback] Creating goal in memory:', err.message);
  }

  const newGoal = {
    id: crypto.randomUUID(),
    user_id: userId,
    title,
    description,
    due_date: effectiveDueDate,
    days_until_due: calcDaysUntilDue(effectiveDueDate),
    priority,
    color,
    icon,
    total_tasks: 0,
    completed_tasks: 0,
    progress_percent: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  const userGoals = fallbackGoals.get(userId) || [];
  userGoals.unshift(newGoal);
  fallbackGoals.set(userId, userGoals);
  return newGoal;
};

export const updateGoal = async (userId, goalId, data) => {
  const { title, description, due_date, target_date, priority, color, icon } = data;
  const effectiveDueDate = due_date !== undefined ? due_date : target_date;

  try {
    const res = await query(
      `UPDATE goals
       SET title = COALESCE($1, title),
           description = COALESCE($2, description),
           due_date = COALESCE($3, due_date),
           priority = COALESCE($4, priority),
           color = COALESCE($5, color),
           icon = COALESCE($6, icon),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $7 AND user_id = $8
       RETURNING *`,
      [title, description, effectiveDueDate, priority, color, icon, goalId, userId]
    );
    if (res && res.rows && res.rows[0]) {
      const g = res.rows[0];
      return {
        ...g,
        due_date: g.due_date || g.target_date,
        days_until_due: calcDaysUntilDue(g.due_date || g.target_date)
      };
    }
  } catch (err) {
    console.warn('[DB Fallback] Updating goal in memory:', err.message);
  }

  const userGoals = fallbackGoals.get(userId) || [];
  const idx = userGoals.findIndex(g => g.id === goalId);
  if (idx !== -1) {
    userGoals[idx] = {
      ...userGoals[idx],
      ...data,
      due_date: effectiveDueDate !== undefined ? effectiveDueDate : userGoals[idx].due_date,
      days_until_due: calcDaysUntilDue(effectiveDueDate !== undefined ? effectiveDueDate : userGoals[idx].due_date),
      updated_at: new Date().toISOString()
    };
    return userGoals[idx];
  }
  return null;
};

export const deleteGoal = async (userId, goalId) => {
  try {
    await query('DELETE FROM goals WHERE id = $1 AND user_id = $2', [goalId, userId]);
    return true;
  } catch (err) {
    console.warn('[DB Fallback] Deleting goal in memory:', err.message);
  }

  const userGoals = fallbackGoals.get(userId) || [];
  fallbackGoals.set(userId, userGoals.filter(g => g.id !== goalId));
  return true;
};

export const isGoalOwnedByUser = async (userId, goalId) => {
  if (!goalId) return true;
  try {
    const res = await query('SELECT id FROM goals WHERE id = $1 AND user_id = $2', [goalId, userId]);
    if (res && res.rows) {
      return res.rows.length > 0;
    }
  } catch (err) {
    // Fallback to memory
  }

  const userGoals = fallbackGoals.get(userId) || [];
  return userGoals.some(g => g.id === goalId);
};

