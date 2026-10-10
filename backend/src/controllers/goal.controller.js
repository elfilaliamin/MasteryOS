import { getGoalsByUser, createGoal, updateGoal, deleteGoal } from '../models/goal.model.js';
import { query } from '../config/db.js';

export const getGoals = async (req, res) => {
  try {
    const goals = await getGoalsByUser(req.user.id);
    res.status(200).json({ goals });
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve goals.' });
  }
};

export const addGoal = async (req, res) => {
  try {
    const { title, description, due_date, target_date, priority, color, icon, task_ids = [] } = req.body;
    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Goal title is required.' });
    }

    const goal = await createGoal(req.user.id, {
      title: title.trim(),
      description,
      due_date: due_date || target_date,
      priority: priority || 'MEDIUM',
      color,
      icon
    });

    // Assign tasks to this goal if provided
    if (Array.isArray(task_ids) && task_ids.length > 0) {
      try {
        await query(
          `UPDATE tasks SET goal_id = $1 WHERE id = ANY($2::uuid[]) AND user_id = $3`,
          [goal.id, task_ids, req.user.id]
        );
      } catch (err) {
        console.warn('Assign tasks to goal warning:', err.message);
      }
    }

    res.status(201).json({ goal });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create goal.' });
  }
};

export const editGoal = async (req, res) => {
  try {
    const { title, description, due_date, target_date, priority, color, icon } = req.body;
    const updated = await updateGoal(req.user.id, req.params.id, {
      title,
      description,
      due_date: due_date !== undefined ? due_date : target_date,
      priority,
      color,
      icon
    });
    if (!updated) {
      return res.status(404).json({ error: 'Goal not found.' });
    }
    res.status(200).json({ goal: updated });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update goal.' });
  }
};

export const removeGoal = async (req, res) => {
  try {
    await deleteGoal(req.user.id, req.params.id);
    res.status(200).json({ message: 'Goal removed successfully.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete goal.' });
  }
};
