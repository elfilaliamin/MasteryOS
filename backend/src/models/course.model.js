import { query } from '../config/db.js';
import crypto from 'crypto';

// In-memory fallback
const fallbackCourses = new Map();

export const seedDefaultCourses = async (userId) => {
  const defaults = [
    {
      title: 'Full Stack React & Node Mastery',
      description: 'Comprehensive guide to building modern containerized web applications with PostgreSQL.',
      cover_image: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&auto=format&fit=crop&q=60',
      finished_lessons: 18,
      total_lessons: 24,
      certification_url: 'https://example.com/certificates/react-node-mastery.pdf',
      certification_filename: 'React_Node_Mastery_Certificate.pdf'
    },
    {
      title: 'DevOps & Docker Multi-Stage Builds',
      description: 'Master containerization with Alpine Linux, Node, PostgreSQL, and Nginx reverse proxies.',
      cover_image: 'https://images.unsplash.com/photo-1605745341112-85968b19335b?w=800&auto=format&fit=crop&q=60',
      finished_lessons: 12,
      total_lessons: 12,
      certification_url: 'https://example.com/certificates/devops-docker-pro.pdf',
      certification_filename: 'Docker_DevOps_Expert.pdf'
    }
  ];

  for (const c of defaults) {
    await createCourse(userId, c);
  }
};

export const getCoursesByUser = async (userId) => {
  try {
    const res = await query(
      `SELECT c.*,
        COUNT(t.id)::int as total_tasks,
        COUNT(CASE WHEN t.status = 'COMPLETED' THEN 1 END)::int as completed_tasks
       FROM courses c
       LEFT JOIN tasks t ON t.course_id = c.id AND t.user_id = c.user_id AND t.is_archived = false
       WHERE c.user_id = $1
       GROUP BY c.id
       ORDER BY c.created_at DESC`,
      [userId]
    );

    if (res && res.rows) {
      return res.rows.map(c => ({
        ...c,
        progress_percent: (c.total_lessons != null && c.total_lessons > 0 && c.finished_lessons != null && c.finished_lessons >= 0)
          ? Math.min(100, Math.round((c.finished_lessons / c.total_lessons) * 100))
          : 0
      }));
    }
  } catch (err) {
    if (process.env.NODE_ENV === 'production') throw err;
    console.warn('[DB Fallback] Fetching courses from memory:', err.message);
  }

  // Fallback memory store
  const userCourses = fallbackCourses.get(userId) || [];
  return userCourses;
};

export const createCourse = async (userId, data) => {
  const {
    title,
    description = '',
    cover_image = null,
    finished_lessons = null,
    total_lessons = null,
    certification_url = null,
    certification_filename = null
  } = data;

  const finishedNum = (finished_lessons !== null && finished_lessons !== undefined && finished_lessons !== '')
    ? Math.max(0, parseInt(finished_lessons, 10))
    : null;
  const totalNum = (total_lessons !== null && total_lessons !== undefined && total_lessons !== '')
    ? Math.max(0, parseInt(total_lessons, 10))
    : null;

  const progressPercent = (totalNum != null && totalNum > 0 && finishedNum != null && finishedNum >= 0)
    ? Math.min(100, Math.round((finishedNum / totalNum) * 100))
    : 0;

  try {
    const res = await query(
      `INSERT INTO courses (user_id, title, description, cover_image, finished_lessons, total_lessons, certification_url, certification_filename)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [userId, title, description, cover_image, finishedNum, totalNum, certification_url, certification_filename]
    );
    if (res && res.rows) {
      return {
        ...res.rows[0],
        total_tasks: 0,
        completed_tasks: 0,
        progress_percent: progressPercent
      };
    }
  } catch (err) {
    if (process.env.NODE_ENV === 'production') throw err;
    console.warn('[DB Fallback] Creating course in memory:', err.message);
  }

  const newCourse = {
    id: crypto.randomUUID(),
    user_id: userId,
    title,
    description,
    cover_image,
    finished_lessons: finishedNum,
    total_lessons: totalNum,
    certification_url,
    certification_filename,
    total_tasks: 0,
    completed_tasks: 0,
    progress_percent: progressPercent,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  const userCourses = fallbackCourses.get(userId) || [];
  userCourses.unshift(newCourse);
  fallbackCourses.set(userId, userCourses);
  return newCourse;
};

export const updateCourse = async (userId, courseId, data) => {
  const {
    title,
    description,
    cover_image,
    finished_lessons,
    total_lessons,
    certification_url,
    certification_filename
  } = data;

  const updateFinished = 'finished_lessons' in data;
  const updateTotal = 'total_lessons' in data;
  const finishedVal = (finished_lessons !== null && finished_lessons !== undefined && finished_lessons !== '')
    ? Math.max(0, parseInt(finished_lessons, 10))
    : null;
  const totalVal = (total_lessons !== null && total_lessons !== undefined && total_lessons !== '')
    ? Math.max(0, parseInt(total_lessons, 10))
    : null;

  try {
    const res = await query(
      `UPDATE courses
       SET title = COALESCE($1, title),
           description = COALESCE($2, description),
           cover_image = COALESCE($3, cover_image),
           finished_lessons = CASE WHEN $4::boolean THEN $5::integer ELSE finished_lessons END,
           total_lessons = CASE WHEN $6::boolean THEN $7::integer ELSE total_lessons END,
           certification_url = COALESCE($8, certification_url),
           certification_filename = COALESCE($9, certification_filename),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $10 AND user_id = $11
       RETURNING *`,
      [title, description, cover_image, updateFinished, finishedVal, updateTotal, totalVal, certification_url, certification_filename, courseId, userId]
    );
    if (res && res.rows && res.rows[0]) {
      const c = res.rows[0];
      return {
        ...c,
        progress_percent: (c.total_lessons != null && c.total_lessons > 0 && c.finished_lessons != null && c.finished_lessons >= 0)
          ? Math.min(100, Math.round((c.finished_lessons / c.total_lessons) * 100))
          : 0
      };
    }
  } catch (err) {
    if (process.env.NODE_ENV === 'production') throw err;
    console.warn('[DB Fallback] Updating course in memory:', err.message);
  }

  const userCourses = fallbackCourses.get(userId) || [];
  const idx = userCourses.findIndex(c => c.id === courseId);
  if (idx !== -1) {
    const updated = {
      ...userCourses[idx],
      ...data,
      ...(updateFinished ? { finished_lessons: finishedVal } : {}),
      ...(updateTotal ? { total_lessons: totalVal } : {}),
      updated_at: new Date().toISOString()
    };
    updated.progress_percent = (updated.total_lessons != null && updated.total_lessons > 0 && updated.finished_lessons != null && updated.finished_lessons >= 0)
      ? Math.min(100, Math.round((updated.finished_lessons / updated.total_lessons) * 100))
      : 0;
    userCourses[idx] = updated;
    return updated;
  }
  return null;
};

export const incrementCourseLesson = async (userId, courseId) => {
  try {
    const res = await query(
      `UPDATE courses
       SET finished_lessons = COALESCE(LEAST(total_lessons, finished_lessons + 1), finished_lessons + 1, 1),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND user_id = $2
       RETURNING *`,
      [courseId, userId]
    );
    if (res && res.rows && res.rows[0]) {
      const c = res.rows[0];
      return {
        ...c,
        progress_percent: (c.total_lessons != null && c.total_lessons > 0 && c.finished_lessons != null && c.finished_lessons >= 0)
          ? Math.min(100, Math.round((c.finished_lessons / c.total_lessons) * 100))
          : 0
      };
    }
  } catch (err) {
    if (process.env.NODE_ENV === 'production') throw err;
    console.warn('[DB Fallback] Incrementing lesson in memory:', err.message);
  }

  const userCourses = fallbackCourses.get(userId) || [];
  const course = userCourses.find(c => c.id === courseId);
  if (course) {
    course.finished_lessons = course.total_lessons != null && course.total_lessons > 0
      ? Math.min(course.total_lessons, (course.finished_lessons || 0) + 1)
      : (course.finished_lessons || 0) + 1;
    course.progress_percent = (course.total_lessons != null && course.total_lessons > 0 && course.finished_lessons != null && course.finished_lessons >= 0)
      ? Math.min(100, Math.round((course.finished_lessons / course.total_lessons) * 100))
      : 0;
    course.updated_at = new Date().toISOString();
    return course;
  }
  return null;
};

export const deleteCourse = async (userId, courseId) => {
  try {
    await query('DELETE FROM courses WHERE id = $1 AND user_id = $2', [courseId, userId]);
    return true;
  } catch (err) {
    if (process.env.NODE_ENV === 'production') throw err;
    console.warn('[DB Fallback] Deleting course in memory:', err.message);
  }

  const userCourses = fallbackCourses.get(userId) || [];
  fallbackCourses.set(userId, userCourses.filter(c => c.id !== courseId));
  return true;
};

export const isCourseOwnedByUser = async (userId, courseId) => {
  if (!courseId) return true;
  try {
    const res = await query('SELECT id FROM courses WHERE id = $1 AND user_id = $2', [courseId, userId]);
    if (res && res.rows) {
      return res.rows.length > 0;
    }
  } catch (err) {
    if (process.env.NODE_ENV === 'production') throw err;
    // Fallback to memory
  }

  const userCourses = fallbackCourses.get(userId) || [];
  return userCourses.some(c => c.id === courseId);
};

