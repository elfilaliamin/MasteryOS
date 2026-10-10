import * as HabitModel from '../models/habit.model.js';

export const getHabits = async (req, res, next) => {
  try {
    const habits = await HabitModel.getHabitsByUser(req.user.id);
    res.status(200).json({ habits });
  } catch (err) {
    next(err);
  }
};

export const createHabit = async (req, res, next) => {
  try {
    const { title, description, icon, color, time_of_day, frequency } = req.body;
    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Habit title is required' });
    }

    const habit = await HabitModel.createHabit(req.user.id, {
      title: title.trim(),
      description,
      icon,
      color,
      time_of_day,
      frequency
    });

    res.status(201).json({ habit });
  } catch (err) {
    next(err);
  }
};

export const updateHabit = async (req, res, next) => {
  try {
    const habit = await HabitModel.updateHabit(req.user.id, req.params.id, req.body);
    if (!habit) {
      return res.status(404).json({ error: 'Habit not found' });
    }
    res.status(200).json({ habit });
  } catch (err) {
    next(err);
  }
};

export const toggleHabit = async (req, res, next) => {
  try {
    const { date } = req.body;
    const result = await HabitModel.toggleHabitLog(req.user.id, req.params.id, date);
    res.status(200).json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};

export const deleteHabit = async (req, res, next) => {
  try {
    await HabitModel.deleteHabit(req.user.id, req.params.id);
    res.status(200).json({ success: true, message: 'Habit removed successfully' });
  } catch (err) {
    next(err);
  }
};
