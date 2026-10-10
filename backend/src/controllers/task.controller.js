import {
  getTasksByUser,
  getTaskById,
  createTask,
  updateTask,
  updateTaskStatus,
  deleteTask,
  getAnalytics
} from '../models/task.model.js';

export const getTasks = async (req, res) => {
  try {
    const { status, priority, categoryId, search } = req.query;
    const tasks = await getTasksByUser(req.user.id, { status, priority, categoryId, search });
    res.status(200).json({ tasks });
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve tasks.' });
  }
};

export const getTask = async (req, res) => {
  try {
    const task = await getTaskById(req.user.id, req.params.id);
    if (!task) {
      return res.status(404).json({ error: 'Task not found.' });
    }
    res.status(200).json({ task });
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve task.' });
  }
};

export const createNewTask = async (req, res) => {
  try {
    const { title, description, status, priority, category_id, goal_id, due_date, estimated_minutes } = req.body;
    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Task title is required.' });
    }

    const task = await createTask(req.user.id, {
      title: title.trim(),
      description,
      status,
      priority,
      category_id,
      goal_id,
      due_date,
      estimated_minutes
    });

    res.status(201).json({ task });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create task.' });
  }
};

export const updateTaskDetails = async (req, res) => {
  try {
    const updated = await updateTask(req.user.id, req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ error: 'Task not found.' });
    }
    res.status(200).json({ task: updated });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update task.' });
  }
};

export const updateStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'COMPLETED'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
    }

    const updated = await updateTaskStatus(req.user.id, req.params.id, status);
    if (!updated) {
      return res.status(404).json({ error: 'Task not found.' });
    }
    res.status(200).json({ task: updated });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update task status.' });
  }
};

export const removeTask = async (req, res) => {
  try {
    await deleteTask(req.user.id, req.params.id);
    res.status(200).json({ message: 'Task deleted successfully.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete task.' });
  }
};

export const getStats = async (req, res) => {
  try {
    const stats = await getAnalytics(req.user.id);
    res.status(200).json({ stats });
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve stats.' });
  }
};
