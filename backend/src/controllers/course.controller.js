import {
  getCoursesByUser,
  createCourse,
  updateCourse,
  incrementCourseLesson,
  deleteCourse
} from '../models/course.model.js';
import { query } from '../config/db.js';

export const getCourses = async (req, res) => {
  try {
    const courses = await getCoursesByUser(req.user.id);
    res.status(200).json({ courses });
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve courses.' });
  }
};

export const addCourse = async (req, res) => {
  try {
    const {
      title,
      description,
      cover_image,
      finished_lessons,
      total_lessons,
      certification_url,
      certification_filename,
      task_ids = []
    } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Course title is required.' });
    }

    const course = await createCourse(req.user.id, {
      title: title.trim(),
      description,
      cover_image,
      finished_lessons,
      total_lessons,
      certification_url,
      certification_filename
    });

    // Assign tasks to this course if provided
    if (Array.isArray(task_ids) && task_ids.length > 0) {
      try {
        await query(
          `UPDATE tasks SET course_id = $1 WHERE id = ANY($2::uuid[]) AND user_id = $3`,
          [course.id, task_ids, req.user.id]
        );
      } catch (err) {
        console.warn('Assign tasks to course warning:', err.message);
      }
    }

    res.status(201).json({ course });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create course.' });
  }
};

export const editCourse = async (req, res) => {
  try {
    const {
      title,
      description,
      cover_image,
      finished_lessons,
      total_lessons,
      certification_url,
      certification_filename,
      task_ids
    } = req.body;

    const updated = await updateCourse(req.user.id, req.params.id, {
      title,
      description,
      cover_image,
      finished_lessons,
      total_lessons,
      certification_url,
      certification_filename
    });

    if (!updated) {
      return res.status(404).json({ error: 'Course not found.' });
    }

    // Sync assigned tasks if task_ids array was provided
    if (Array.isArray(task_ids)) {
      try {
        // Clear old assignments and set new ones
        await query(
          `UPDATE tasks SET course_id = NULL WHERE course_id = $1 AND user_id = $2`,
          [req.params.id, req.user.id]
        );
        if (task_ids.length > 0) {
          await query(
            `UPDATE tasks SET course_id = $1 WHERE id = ANY($2::uuid[]) AND user_id = $3`,
            [req.params.id, task_ids, req.user.id]
          );
        }
      } catch (err) {
        console.warn('Sync course tasks warning:', err.message);
      }
    }

    res.status(200).json({ course: updated });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update course.' });
  }
};

export const incrementLesson = async (req, res) => {
  try {
    const updated = await incrementCourseLesson(req.user.id, req.params.id);
    if (!updated) {
      return res.status(404).json({ error: 'Course not found.' });
    }
    res.status(200).json({ course: updated });
  } catch (err) {
    res.status(500).json({ error: 'Failed to increment course lesson.' });
  }
};

export const removeCourse = async (req, res) => {
  try {
    await deleteCourse(req.user.id, req.params.id);
    res.status(200).json({ message: 'Course removed successfully.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete course.' });
  }
};
