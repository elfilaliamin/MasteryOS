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
  const { status, priority, categoryId, goal_id, course_id, search, sortBy, sortOrder, limit, offset } = filters;

  const ALLOWED_SORT_FIELDS = {
    due_date: 't.due_date',
    priority: 't.priority',
    created_at: 't.created_at',
    title: 't.title',
    order_index: 't.order_index'
  };

  const sortColumn = ALLOWED_SORT_FIELDS[sortBy] || 't.created_at';
  const orderDirection = (sortOrder || '').toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
  const queryLimit = Math.min(Math.max(parseInt(limit, 10) || 50, 1), 100);
  const queryOffset = Math.max(parseInt(offset, 10) || 0, 0);

  try {
    let sql = `
      SELECT t.*, c.name as category_name, c.color as category_color,
             g.title as goal_title, g.color as goal_color, g.icon as goal_icon,
             cr.title as course_title
      FROM tasks t
      LEFT JOIN categories c ON c.id = t.category_id AND c.user_id = t.user_id
      LEFT JOIN goals g ON g.id = t.goal_id AND g.user_id = t.user_id
      LEFT JOIN courses cr ON cr.id = t.course_id AND cr.user_id = t.user_id
      WHERE t.user_id = $1 AND t.is_archived = false
    `;
    const params = [userId];

    if (status && status !== 'all') {
      const dbStatus = safeTaskStatus(status);
      params.push(dbStatus);
      sql += ` AND t.status = $${params.length}`;
    }
    if (priority && priority !== 'all') {
      const dbPriority = safeTaskPriority(priority);
      params.push(dbPriority);
      sql += ` AND t.priority = $${params.length}`;
    }
    if (categoryId && categoryId !== 'all') {
      const validCatId = safeUuid(categoryId);
      if (validCatId) {
        params.push(validCatId);
        sql += ` AND t.category_id = $${params.length}`;
      }
    }
    if (goal_id && goal_id !== 'all') {
      const validGoalId = safeUuid(goal_id);
      if (validGoalId) {
        params.push(validGoalId);
        sql += ` AND t.goal_id = $${params.length}`;
      }
    }
    if (course_id && course_id !== 'all') {
      const validCourseId = safeUuid(course_id);
      if (validCourseId) {
        params.push(validCourseId);
        sql += ` AND t.course_id = $${params.length}`;
      }
    }
    if (search) {
      params.push(`%${search}%`);
      sql += ` AND (t.title ILIKE $${params.length} OR t.description ILIKE $${params.length})`;
    }

    sql += ` ORDER BY ${sortColumn} ${orderDirection} NULLS LAST`;

    params.push(queryLimit);
    sql += ` LIMIT $${params.length}`;

    params.push(queryOffset);
    sql += ` OFFSET $${params.length}`;

    const res = await query(sql, params);
    if (res && res.rows) {
      return res.rows;
    }
  } catch (err) {
    console.warn('[DB Fallback] Fetching tasks from memory:', err.message);
  }

  // Fallback memory filtering
  let userTasks = fallbackTasks.get(userId) || [];
  let filtered = userTasks.filter(t => {
    if (t.is_archived) return false;
    if (status && status !== 'all' && t.status !== status) return false;
    if (priority && priority !== 'all' && t.priority !== priority) return false;
    if (categoryId && t.category_id !== categoryId) return false;
    if (goal_id && t.goal_id !== goal_id) return false;
    if (course_id && t.course_id !== course_id) return false;
    if (search) {
      const q = search.toLowerCase();
      const inTitle = (t.title || '').toLowerCase().includes(q);
      const inDesc = (t.description || '').toLowerCase().includes(q);
      if (!inTitle && !inDesc) return false;
    }
    return true;
  });

  return filtered.slice(queryOffset, queryOffset + queryLimit);
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
        `SELECT * FROM task_activities WHERE task_id = $1 AND user_id = $2 ORDER BY created_at DESC`,
        [taskId, userId]
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

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const safeUuid = (id) => (id && UUID_REGEX.test(id) ? id : null);

const safeTaskStatus = (s) => {
  if (!s) return 'TODO';
  const upper = String(s).toUpperCase();
  if (upper === 'DONE' || upper === 'COMPLETED') return 'COMPLETED';
  if (upper === 'IN_PROGRESS') return 'IN_PROGRESS';
  if (upper === 'IN_REVIEW') return 'IN_REVIEW';
  return 'TODO';
};

const safeTaskPriority = (p) => {
  if (!p) return 'MEDIUM';
  const upper = String(p).toUpperCase();
  if (['LOW', 'MEDIUM', 'HIGH', 'URGENT'].includes(upper)) return upper;
  return 'MEDIUM';
};

export const createTask = async (userId, data) => {
  const {
    title,
    description = '',
    status = 'TODO',
    priority = 'MEDIUM',
    category_id = null,
    goal_id = null,
    course_id = null,
    due_date = null,
    estimated_minutes = 0
  } = data;

  const validStatus = safeTaskStatus(status);
  const validPriority = safeTaskPriority(priority);
  const validCatId = safeUuid(category_id);
  const validGoalId = safeUuid(goal_id);
  const validCourseId = safeUuid(course_id);
  const validDueDate = due_date && String(due_date).trim() ? due_date : null;
  const validMinutes = Math.max(0, parseInt(estimated_minutes, 10) || 0);

  try {
    const res = await query(
      `INSERT INTO tasks (user_id, category_id, goal_id, course_id, title, description, status, priority, due_date, estimated_minutes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [userId, validCatId, validGoalId, validCourseId, title, description, validStatus, validPriority, validDueDate, validMinutes]
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
    category_id: validCatId,
    goal_id: validGoalId,
    course_id: validCourseId,
    title,
    description,
    status: validStatus,
    priority: validPriority,
    due_date: validDueDate,
    estimated_minutes: validMinutes,
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
  const { title, description, status, priority, category_id, goal_id, course_id, due_date, estimated_minutes } = data;

  const validStatus = status !== undefined ? safeTaskStatus(status) : undefined;
  const validPriority = priority !== undefined ? safeTaskPriority(priority) : undefined;
  const validCatId = category_id !== undefined ? safeUuid(category_id) : undefined;
  const validGoalId = goal_id !== undefined ? safeUuid(goal_id) : undefined;
  const validCourseId = course_id !== undefined ? safeUuid(course_id) : undefined;
  const validDueDate = due_date !== undefined ? (due_date && String(due_date).trim() ? due_date : null) : undefined;
  const validMinutes = estimated_minutes !== undefined ? Math.max(0, parseInt(estimated_minutes, 10) || 0) : undefined;

  try {
    const res = await query(
      `UPDATE tasks
       SET title = COALESCE($1, title),
           description = COALESCE($2, description),
           status = COALESCE($3, status),
           priority = COALESCE($4, priority),
           category_id = $5,
           goal_id = $6,
           course_id = $7,
           due_date = $8,
           estimated_minutes = COALESCE($9, estimated_minutes),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $10 AND user_id = $11
       RETURNING *`,
      [title, description, validStatus, validPriority, validCatId, validGoalId, validCourseId, validDueDate, validMinutes, taskId, userId]
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
      ...(validStatus !== undefined ? { status: validStatus } : {}),
      ...(validPriority !== undefined ? { priority: validPriority } : {}),
      ...(validCatId !== undefined ? { category_id: validCatId } : {}),
      ...(validGoalId !== undefined ? { goal_id: validGoalId } : {}),
      ...(validCourseId !== undefined ? { course_id: validCourseId } : {}),
      ...(validDueDate !== undefined ? { due_date: validDueDate } : {}),
      ...(validMinutes !== undefined ? { estimated_minutes: validMinutes } : {}),
      updated_at: new Date().toISOString()
    };
    await logActivity(taskId, userId, 'EDITED', data);
    return userTasks[idx];
  }
  return null;
};

export const updateTaskStatus = async (userId, taskId, newStatus) => {
  const validStatus = safeTaskStatus(newStatus);
  try {
    const res = await query(
      `UPDATE tasks
       SET status = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2 AND user_id = $3
       RETURNING *`,
      [validStatus, taskId, userId]
    );
    if (res && res.rows && res.rows[0]) {
      await logActivity(taskId, userId, 'STATUS_CHANGED', { newStatus: validStatus });
      return res.rows[0];
    }
  } catch (err) {
    console.warn('[DB Fallback] Updating task status in memory:', err.message);
  }

  const userTasks = fallbackTasks.get(userId) || [];
  const task = userTasks.find(t => t.id === taskId);
  if (task) {
    task.status = validStatus;
    task.updated_at = new Date().toISOString();
    await logActivity(taskId, userId, 'STATUS_CHANGED', { newStatus: validStatus });
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

export const areTasksOwnedByUser = async (userId, taskIds = []) => {
  if (!Array.isArray(taskIds) || taskIds.length === 0) return true;
  try {
    const res = await query('SELECT id FROM tasks WHERE id = ANY($1::uuid[]) AND user_id = $2', [taskIds, userId]);
    if (res && res.rows) {
      const foundSet = new Set(res.rows.map(r => r.id));
      return taskIds.every(id => foundSet.has(id));
    }
  } catch (err) {
    // Fallback to memory
  }

  const userTasks = fallbackTasks.get(userId) || [];
  const foundSet = new Set(userTasks.map(t => t.id));
  return taskIds.every(id => foundSet.has(id));
};

