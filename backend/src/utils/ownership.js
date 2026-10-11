import { isCategoryOwnedByUser, getCategoriesByUser } from '../models/category.model.js';
import { isGoalOwnedByUser } from '../models/goal.model.js';
import { isCourseOwnedByUser } from '../models/course.model.js';
import { areTasksOwnedByUser } from '../models/task.model.js';
import { isHabitOwnedByUser } from '../models/habit.model.js';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DEFAULT_CATEGORY_ALIAS_MAP = {
  'cat-1': 'work',
  'cat-2': 'personal',
  'cat-3': 'urgent',
  'cat-4': 'learning',
};

/**
 * Validates that foreign entity IDs referenced in a task belong to the authenticated user.
 */
export const validateTaskForeignReferences = async (userId, { category_id, goal_id, course_id }) => {
  let resolvedCategoryId = category_id || null;

  if (category_id) {
    if (UUID_REGEX.test(category_id)) {
      const isOwner = await isCategoryOwnedByUser(userId, category_id);
      if (!isOwner) {
        return {
          valid: false,
          message: 'Invalid category: referenced category does not exist or does not belong to you.'
        };
      }
    } else {
      // Resolve alias (cat-1..cat-4) or category name for this user
      const targetName = (DEFAULT_CATEGORY_ALIAS_MAP[category_id] || category_id).toLowerCase().trim();
      const userCategories = await getCategoriesByUser(userId);
      const matched = (userCategories || []).find(
        (c) => c.name && c.name.toLowerCase().trim() === targetName
      );
      if (matched) {
        resolvedCategoryId = matched.id;
      } else {
        resolvedCategoryId = null;
      }
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

  return { valid: true, resolvedCategoryId };
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
