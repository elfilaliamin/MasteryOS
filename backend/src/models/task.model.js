import { query } from '../config/db.js';
import crypto from 'crypto';

// In-memory fallback
const fallbackTasks = new Map();
const fallbackActivities = new Map();

export const logActivity = async (taskId, userId, actionType, details = {}) => {
  try {
    await query(
      `INSERT INTO task_activities (task_id, user_id, action_type, details)
       VALUES ($1, $2, $3, $4)`,
      [taskId, userId, actionType, JSON.stringify(details)]
    );
  } catch (err) {
    const list = fallbackActivities.get(taskId) || [];
    list.unshift({
      id: crypto.randomUUID(),
      task_id: taskId,
      user_id: userId,
      action_type: actionType,
      details,
      created_at: new Date().toISOString()
    });
    fallbackActivities.set(taskId, list);
  }
};

export const getTasksByUser = async (userId, filters = {}) => {
  const { status, priority, categoryId, search } = filters;

  try {
    let sql = `
      SELECT t.*, c.name as category_name, c.color as category_color,
             g.title as goal_title, g.color as goal_color, g.icon as goal_icon
      FROM tasks t
      LEFT JOIN categories c ON c.id = t.category_id
      LEFT JOIN goals g ON g.id = t.goal_id
      WHERE t.user_id = $1 AND t.is_archived = false
    `;
    const params = [userId];

    if (status) {
      params.push(status);
      sql += ` AND t.status = $${params.length}`;
    }
    if (priority) {
      params.push(priority);
      sql += ` AND t.priority = $${params.length}`;
    }
    if (categoryId) {
      params.push(categoryId);
      sql += ` AND t.category_id = $${params.length}`;
    }
    if (search) {
      params.push(`%${search}%`);
      sql += ` AND (t.title ILIKE $${params.length} OR t.description ILIKE $${params.length})`;
    }

    sql += ` ORDER BY t.created_at DESC`;

    const res = await query(sql, params);
    if (res && res.rows) {
      return res.rows;
    }
  } catch (err) {
    console.warn('[DB Fallback] Fetching tasks from memory:', err.message);
  }

  // Fallback memory filtering
  let userTasks = fallbackTasks.get(userId) || [];
  return userTasks.filter(t => {
    if (t.is_archived) return false;
    if (status && t.status !== status) return false;
    if (priority && t.priority !== priority) return false;
    if (categoryId && t.category_id !== categoryId) return false;
    if (search) {
      const q = search.toLowerCase();
      const inTitle = (t.title || '').toLowerCase().includes(q);
      const inDesc = (t.description || '').toLowerCase().includes(q);
      if (!inTitle && !inDesc) return false;
    }
    return true;
  });
};

export const getTaskById = async (userId, taskId) => {
  try {
    const res = await query(
      `SELECT t.*, c.name as category_name, c.color as category_color
       FROM tasks t
       LEFT JOIN categories c ON c.id = t.category_id
       WHERE t.id = $1 AND t.user_id = $2`,
      [taskId, userId]
    );
    if (res && res.rows && res.rows[0]) {
      const actRes = await query(
        `SELECT * FROM task_activities WHERE task_id = $1 ORDER BY created_at DESC`,
        [taskId]
      );
      return {
        ...res.rows[0],
        activities: actRes.rows || []
      };
    }
  } catch (err) {
    console.warn('[DB Fallback] Finding task in memory:', err.message);
  }

  const userTasks = fallbackTasks.get(userId) || [];
  const found = userTasks.find(t => t.id === taskId);
  if (found) {
    return {
      ...found,
      activities: fallbackActivities.get(taskId) || []
    };
  }
  return null;
};

export const createTask = async (userId, data) => {
  const {
    title,
    description = '',
    status = 'TODO',
    priority = 'MEDIUM',
    category_id = null,
    goal_id = null,
    due_date = null,
    estimated_minutes = 0
  } = data;

  try {
    const res = await query(
      `INSERT INTO tasks (user_id, category_id, goal_id, title, description, status, priority, due_date, estimated_minutes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [userId, category_id, goal_id, title, description, status, priority, due_date, estimated_minutes]
    );
    if (res && res.rows) {
      const newTask = res.rows[0];
      await logActivity(newTask.id, userId, 'CREATED', { title });
      return newTask;
    }
  } catch (err) {
    console.warn('[DB Fallback] Storing task in memory:', err.message);
  }

  const id = crypto.randomUUID();
  const newTask = {
    id,
    user_id: userId,
    category_id,
    goal_id,
    title,
    description,
    status,
    priority,
    due_date,
    estimated_minutes,
    is_archived: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  const userTasks = fallbackTasks.get(userId) || [];
  userTasks.unshift(newTask);
  fallbackTasks.set(userId, userTasks);
  await logActivity(id, userId, 'CREATED', { title });
  return newTask;
};

export const updateTask = async (userId, taskId, data) => {
  const { title, description, status, priority, category_id, goal_id, due_date, estimated_minutes } = data;

  try {
    const res = await query(
      `UPDATE tasks
       SET title = COALESCE($1, title),
           description = COALESCE($2, description),
           status = COALESCE($3, status),
           priority = COALESCE($4, priority),
           category_id = $5,
           goal_id = $6,
           due_date = $7,
           estimated_minutes = COALESCE($8, estimated_minutes),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $9 AND user_id = $10
       RETURNING *`,
      [title, description, status, priority, category_id, goal_id, due_date, estimated_minutes, taskId, userId]
    );
    if (res && res.rows && res.rows[0]) {
      await logActivity(taskId, userId, 'EDITED', data);
      return res.rows[0];
    }
  } catch (err) {
    console.warn('[DB Fallback] Updating task in memory:', err.message);
  }

  const userTasks = fallbackTasks.get(userId) || [];
  const idx = userTasks.findIndex(t => t.id === taskId);
  if (idx !== -1) {
    userTasks[idx] = {
      ...userTasks[idx],
      ...data,
      updated_at: new Date().toISOString()
    };
    await logActivity(taskId, userId, 'EDITED', data);
    return userTasks[idx];
  }
  return null;
};

export const updateTaskStatus = async (userId, taskId, newStatus) => {
  try {
    const res = await query(
      `UPDATE tasks
       SET status = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2 AND user_id = $3
       RETURNING *`,
      [newStatus, taskId, userId]
    );
    if (res && res.rows && res.rows[0]) {
      await logActivity(taskId, userId, 'STATUS_CHANGED', { newStatus });
      return res.rows[0];
    }
  } catch (err) {
    console.warn('[DB Fallback] Updating task status in memory:', err.message);
  }

  const userTasks = fallbackTasks.get(userId) || [];
  const task = userTasks.find(t => t.id === taskId);
  if (task) {
    task.status = newStatus;
    task.updated_at = new Date().toISOString();
    await logActivity(taskId, userId, 'STATUS_CHANGED', { newStatus });
    return task;
  }
  return null;
};

export const deleteTask = async (userId, taskId) => {
  try {
    await query('DELETE FROM tasks WHERE id = $1 AND user_id = $2', [taskId, userId]);
    return true;
  } catch (err) {
    console.warn('[DB Fallback] Deleting task in memory:', err.message);
  }

  const userTasks = fallbackTasks.get(userId) || [];
  fallbackTasks.set(userId, userTasks.filter(t => t.id !== taskId));
  return true;
};

export const getAnalytics = async (userId) => {
  try {
    const countRes = await query(
      `SELECT
        COUNT(*)::int as total,
        COUNT(CASE WHEN status = 'TODO' THEN 1 END)::int as todo_count,
        COUNT(CASE WHEN status = 'IN_PROGRESS' THEN 1 END)::int as in_progress_count,
        COUNT(CASE WHEN status = 'IN_REVIEW' THEN 1 END)::int as in_review_count,
        COUNT(CASE WHEN status = 'COMPLETED' THEN 1 END)::int as completed_count,
        COUNT(CASE WHEN priority = 'URGENT' AND status != 'COMPLETED' THEN 1 END)::int as urgent_count,
        COUNT(CASE WHEN due_date < CURRENT_TIMESTAMP AND status != 'COMPLETED' THEN 1 END)::int as overdue_count
       FROM tasks
       WHERE user_id = $1 AND is_archived = false`,
      [userId]
    );
    if (countRes && countRes.rows) {
      return countRes.rows[0];
    }
  } catch (err) {
    console.warn('[DB Fallback] Analytics in memory:', err.message);
  }

  const userTasks = (fallbackTasks.get(userId) || []).filter(t => !t.is_archived);
  const now = new Date();
  return {
    total: userTasks.length,
    todo_count: userTasks.filter(t => t.status === 'TODO').length,
    in_progress_count: userTasks.filter(t => t.status === 'IN_PROGRESS').length,
    in_review_count: userTasks.filter(t => t.status === 'IN_REVIEW').length,
    completed_count: userTasks.filter(t => t.status === 'COMPLETED').length,
    urgent_count: userTasks.filter(t => t.priority === 'URGENT' && t.status !== 'COMPLETED').length,
    overdue_count: userTasks.filter(t => t.due_date && new Date(t.due_date) < now && t.status !== 'COMPLETED').length
  };
};
