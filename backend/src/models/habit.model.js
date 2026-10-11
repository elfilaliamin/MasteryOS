import { query } from '../config/db.js';
import crypto from 'crypto';

// In-memory fallback
const fallbackHabits = new Map();
const fallbackHabitLogs = new Map(); // key: userId, value: array of { id, habit_id, user_id, completed_date }

// Helper to format date as YYYY-MM-DD
export const formatDateKey = (date = new Date()) => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Calculate streak statistics from an array of 'YYYY-MM-DD' strings
export const calculateStreaks = (completionDateSet) => {
  if (!completionDateSet || completionDateSet.size === 0) {
    return { currentStreak: 0, longestStreak: 0, isCompletedToday: false };
  }

  const todayStr = formatDateKey(new Date());
  const isCompletedToday = completionDateSet.has(todayStr);

  // Check current streak
  let currentStreak = 0;
  let checkDate = new Date();
  
  // If not completed today, start checking from yesterday
  if (!isCompletedToday) {
    checkDate.setDate(checkDate.getDate() - 1);
  }

  while (true) {
    const key = formatDateKey(checkDate);
    if (completionDateSet.has(key)) {
      currentStreak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  // Calculate longest streak across all recorded dates
  const sortedDates = Array.from(completionDateSet).sort();
  let longestStreak = 0;
  let tempStreak = 0;
  let prevDate = null;

  for (const dateStr of sortedDates) {
    const currentDate = new Date(dateStr);
    if (prevDate) {
      const diffTime = currentDate - prevDate;
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays === 1) {
        tempStreak++;
      } else if (diffDays > 1) {
        tempStreak = 1;
      }
    } else {
      tempStreak = 1;
    }
    if (tempStreak > longestStreak) {
      longestStreak = tempStreak;
    }
    prevDate = currentDate;
  }

  if (currentStreak > longestStreak) {
    longestStreak = currentStreak;
  }

  return { currentStreak, longestStreak, isCompletedToday };
};

// Seed realistic habits for demonstration
export const seedDefaultHabits = async (userId) => {
  const today = new Date();
  const dMinus1 = new Date(today); dMinus1.setDate(today.getDate() - 1);
  const dMinus2 = new Date(today); dMinus2.setDate(today.getDate() - 2);
  const dMinus3 = new Date(today); dMinus3.setDate(today.getDate() - 3);
  const dMinus4 = new Date(today); dMinus4.setDate(today.getDate() - 4);
  const dMinus5 = new Date(today); dMinus5.setDate(today.getDate() - 5);

  const defaults = [
    {
      title: 'Drink 2L Water',
      description: 'Stay properly hydrated throughout the workday to boost focus.',
      icon: '💧',
      color: '#0284c7',
      time_of_day: 'MORNING',
      frequency: 'DAILY',
      history: [formatDateKey(today), formatDateKey(dMinus1), formatDateKey(dMinus2), formatDateKey(dMinus3), formatDateKey(dMinus4)]
    },
    {
      title: 'Morning Cardio or 5K Run',
      description: 'Elevate heart rate and build morning momentum.',
      icon: '🏃',
      color: '#10b981',
      time_of_day: 'MORNING',
      frequency: 'DAILY',
      history: [formatDateKey(today), formatDateKey(dMinus1), formatDateKey(dMinus2)]
    },
    {
      title: 'Deep Work & Coding Sprint',
      description: '60 minutes of uninterrupted focused engineering work.',
      icon: '💻',
      color: '#0d8a72',
      time_of_day: 'AFTERNOON',
      frequency: 'DAILY',
      history: [formatDateKey(dMinus1), formatDateKey(dMinus2), formatDateKey(dMinus3), formatDateKey(dMinus4), formatDateKey(dMinus5)]
    },
    {
      title: 'Read 15 Pages',
      description: 'Read high-impact non-fiction, technical literature, or philosophy.',
      icon: '📚',
      color: '#8b5cf6',
      time_of_day: 'EVENING',
      frequency: 'DAILY',
      history: [formatDateKey(today), formatDateKey(dMinus1), formatDateKey(dMinus2), formatDateKey(dMinus3)]
    },
    {
      title: 'Mindful Meditation (15m)',
      description: 'Calm the nervous system and practice stillness.',
      icon: '🧘',
      color: '#f59e0b',
      time_of_day: 'MORNING',
      frequency: 'DAILY',
      history: [formatDateKey(today), formatDateKey(dMinus2), formatDateKey(dMinus4)]
    },
    {
      title: 'Evening Journal & Review',
      description: 'Reflect on wins, insights, and prepare priorities for tomorrow.',
      icon: '✏️',
      color: '#ec4899',
      time_of_day: 'EVENING',
      frequency: 'DAILY',
      history: [formatDateKey(today), formatDateKey(dMinus1), formatDateKey(dMinus2), formatDateKey(dMinus3), formatDateKey(dMinus4), formatDateKey(dMinus5)]
    }
  ];

  for (const def of defaults) {
    const habit = await createHabit(userId, {
      title: def.title,
      description: def.description,
      icon: def.icon,
      color: def.color,
      time_of_day: def.time_of_day,
      frequency: def.frequency
    });

    for (const dateStr of def.history) {
      await toggleHabitLog(userId, habit.id, dateStr);
    }
  }
};

export const getHabitsByUser = async (userId) => {
  try {
    const habitsRes = await query(
      `SELECT h.*, 
        COALESCE(
          json_agg(hl.completed_date ORDER BY hl.completed_date DESC) 
          FILTER (WHERE hl.completed_date IS NOT NULL), '[]'
        ) as completed_dates
       FROM habits h
       LEFT JOIN habit_logs hl ON hl.habit_id = h.id AND hl.user_id = $1
       WHERE h.user_id = $1 AND h.is_archived = false
       GROUP BY h.id
       ORDER BY h.created_at ASC`,
      [userId]
    );

    if (habitsRes && habitsRes.rows) {
      return habitsRes.rows.map((h) => {
        const datesArray = (h.completed_dates || []).map(d => typeof d === 'string' ? d.substring(0, 10) : formatDateKey(d));
        const dateSet = new Set(datesArray);
        const streaks = calculateStreaks(dateSet);
        return {
          ...h,
          completed_dates: Array.from(dateSet),
          total_completions: dateSet.size,
          current_streak: streaks.currentStreak,
          longest_streak: streaks.longestStreak,
          is_completed_today: streaks.isCompletedToday
        };
      });
    }
  } catch (err) {
    console.warn('[DB Fallback] Fetching habits from memory:', err.message);
  }

  // Fallback in-memory
  const userHabits = fallbackHabits.get(userId) || [];

  const userLogs = fallbackHabitLogs.get(userId) || [];
  return userHabits.map((h) => {
    const dates = userLogs
      .filter((l) => l.habit_id === h.id)
      .map((l) => l.completed_date);
    const dateSet = new Set(dates);
    const streaks = calculateStreaks(dateSet);

    return {
      ...h,
      completed_dates: Array.from(dateSet),
      total_completions: dateSet.size,
      current_streak: streaks.currentStreak,
      longest_streak: streaks.longestStreak,
      is_completed_today: streaks.isCompletedToday
    };
  });
};

export const createHabit = async (userId, data) => {
  const {
    title,
    description = '',
    icon = '⚡',
    color = '#0d8a72',
    time_of_day = 'ANYTIME',
    frequency = 'DAILY'
  } = data;

  try {
    const res = await query(
      `INSERT INTO habits (user_id, title, description, icon, color, time_of_day, frequency)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [userId, title, description, icon, color, time_of_day, frequency]
    );

    if (res && res.rows && res.rows[0]) {
      return {
        ...res.rows[0],
        completed_dates: [],
        total_completions: 0,
        current_streak: 0,
        longest_streak: 0,
        is_completed_today: false
      };
    }
  } catch (err) {
    console.warn('[DB Fallback] Creating habit in memory:', err.message);
  }

  const newHabit = {
    id: crypto.randomUUID(),
    user_id: userId,
    title,
    description,
    icon,
    color,
    time_of_day,
    frequency,
    is_archived: false,
    created_at: new Date().toISOString(),
    completed_dates: [],
    total_completions: 0,
    current_streak: 0,
    longest_streak: 0,
    is_completed_today: false
  };

  const userHabits = fallbackHabits.get(userId) || [];
  userHabits.push(newHabit);
  fallbackHabits.set(userId, userHabits);
  return newHabit;
};

export const updateHabit = async (userId, habitId, data) => {
  const { title, description, icon, color, time_of_day, frequency } = data;

  try {
    const res = await query(
      `UPDATE habits
       SET title = COALESCE($1, title),
           description = COALESCE($2, description),
           icon = COALESCE($3, icon),
           color = COALESCE($4, color),
           time_of_day = COALESCE($5, time_of_day),
           frequency = COALESCE($6, frequency),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $7 AND user_id = $8
       RETURNING *`,
      [title, description, icon, color, time_of_day, frequency, habitId, userId]
    );

    if (res && res.rows && res.rows[0]) {
      return res.rows[0];
    }
  } catch (err) {
    console.warn('[DB Fallback] Updating habit in memory:', err.message);
  }

  const userHabits = fallbackHabits.get(userId) || [];
  const idx = userHabits.findIndex((h) => h.id === habitId);
  if (idx !== -1) {
    userHabits[idx] = {
      ...userHabits[idx],
      ...data,
      updated_at: new Date().toISOString()
    };
    return userHabits[idx];
  }
  return null;
};

export const getHabitById = async (userId, habitId) => {
  try {
    const res = await query('SELECT * FROM habits WHERE id = $1 AND user_id = $2', [habitId, userId]);
    if (res && res.rows && res.rows[0]) {
      return res.rows[0];
    }
  } catch (err) {
    // Fallback to memory
  }

  const userHabits = fallbackHabits.get(userId) || [];
  return userHabits.find((h) => h.id === habitId) || null;
};

export const isHabitOwnedByUser = async (userId, habitId) => {
  const habit = await getHabitById(userId, habitId);
  return !!habit;
};

export const toggleHabitLog = async (userId, habitId, targetDate = null) => {
  const dateKey = targetDate || formatDateKey(new Date());

  // Strictly verify habit exists and belongs to user
  const habit = await getHabitById(userId, habitId);
  if (!habit) {
    return null;
  }

  try {
    // Check if already completed on that date
    const checkRes = await query(
      `SELECT id FROM habit_logs 
       WHERE habit_id = $1 AND user_id = $2 AND completed_date = $3`,
      [habitId, userId, dateKey]
    );

    if (checkRes && checkRes.rows && checkRes.rows.length > 0) {
      // Remove completion log
      await query(
        `DELETE FROM habit_logs 
         WHERE habit_id = $1 AND user_id = $2 AND completed_date = $3`,
        [habitId, userId, dateKey]
      );
      return { completed: false, date: dateKey };
    } else {
      // Add completion log
      await query(
        `INSERT INTO habit_logs (habit_id, user_id, completed_date)
         VALUES ($1, $2, $3)`,
        [habitId, userId, dateKey]
      );
      return { completed: true, date: dateKey };
    }
  } catch (err) {
    console.warn('[DB Fallback] Toggling habit log in memory:', err.message);
  }

  const logs = fallbackHabitLogs.get(userId) || [];
  const existingIdx = logs.findIndex((l) => l.habit_id === habitId && l.completed_date === dateKey);

  if (existingIdx !== -1) {
    logs.splice(existingIdx, 1);
    fallbackHabitLogs.set(userId, logs);
    return { completed: false, date: dateKey };
  } else {
    logs.push({
      id: crypto.randomUUID(),
      habit_id: habitId,
      user_id: userId,
      completed_date: dateKey
    });
    fallbackHabitLogs.set(userId, logs);
    return { completed: true, date: dateKey };
  }
};

export const deleteHabit = async (userId, habitId) => {
  try {
    await query('DELETE FROM habits WHERE id = $1 AND user_id = $2', [habitId, userId]);
    return true;
  } catch (err) {
    console.warn('[DB Fallback] Deleting habit in memory:', err.message);
  }

  const userHabits = fallbackHabits.get(userId) || [];
  fallbackHabits.set(userId, userHabits.filter((h) => h.id !== habitId));
  const logs = fallbackHabitLogs.get(userId) || [];
  fallbackHabitLogs.set(userId, logs.filter((l) => l.habit_id !== habitId));
  return true;
};
