import { isCategoryOwnedByUser } from '../models/category.model.js';
import { isGoalOwnedByUser } from '../models/goal.model.js';
import { isCourseOwnedByUser } from '../models/course.model.js';
import { areTasksOwnedByUser } from '../models/task.model.js';
import { isHabitOwnedByUser } from '../models/habit.model.js';

/**
 * Validates that foreign entity IDs referenced in a task belong to the authenticated user.
 */
export const validateTaskForeignReferences = async (userId, { category_id, goal_id, course_id }) => {
  if (category_id) {
    const isOwner = await isCategoryOwnedByUser(userId, category_id);
    if (!isOwner) {
      return {
        valid: false,
        message: 'Invalid category: referenced category does not exist or does not belong to you.'
      };
    }
  }

  if (goal_id) {
    const isOwner = await isGoalOwnedByUser(userId, goal_id);
    if (!isOwner) {
      return {
        valid: false,
        message: 'Invalid goal: referenced goal does not exist or does not belong to you.'
      };
    }
  }

  if (course_id) {
    const isOwner = await isCourseOwnedByUser(userId, course_id);
    if (!isOwner) {
      return {
        valid: false,
        message: 'Invalid course: referenced course does not exist or does not belong to you.'
      };
    }
  }

  return { valid: true };
};

/**
 * Validates that an array of task IDs all exist and belong to the authenticated user.
 */
export const validateTaskBatchOwnership = async (userId, taskIds) => {
  if (Array.isArray(taskIds) && taskIds.length > 0) {
    const areOwners = await areTasksOwnedByUser(userId, taskIds);
    if (!areOwners) {
      return {
        valid: false,
        message: 'Unauthorized task association: one or more tasks do not exist or do not belong to you.'
      };
    }
  }
  return { valid: true };
};

/**
 * Validates that a habit belongs to the authenticated user.
 */
export const validateHabitOwnership = async (userId, habitId) => {
  if (!habitId) {
    return { valid: false, message: 'Habit ID is required.' };
  }
  const isOwner = await isHabitOwnedByUser(userId, habitId);
  if (!isOwner) {
    return {
      valid: false,
      message: 'Habit not found or does not belong to you.'
    };
  }
  return { valid: true };
};
