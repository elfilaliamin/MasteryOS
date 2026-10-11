// Format date as YYYY-MM-DD
// Edge case protection: handles 'YYYY-MM-DD', ISO strings, Date objects, nulls, and negative timezone shifts
export const formatDateKey = (d = new Date()) => {
  if (!d) return '';
  if (typeof d === 'string') {
    const match = d.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (match) {
      return `${match[1]}-${match[2]}-${match[3]}`;
    }
  }
  const date = d instanceof Date ? d : new Date(d);
  if (isNaN(date.getTime())) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Calendar day difference between two YYYY-MM-DD strings (DST and timezone safe via UTC)
export const daysBetween = (dateStr1, dateStr2) => {
  if (!dateStr1 || !dateStr2) return 0;
  const [y1, m1, d1] = dateStr1.split('-').map(Number);
  const [y2, m2, d2] = dateStr2.split('-').map(Number);
  const utc1 = Date.UTC(y1, m1 - 1, d1);
  const utc2 = Date.UTC(y2, m2 - 1, d2);
  return Math.round((utc2 - utc1) / (1000 * 60 * 60 * 24));
};

// Comprehensive Habit Streak & Completion Statistics
export const calculateHabitStats = (rawDates = []) => {
  const datesArray = (Array.isArray(rawDates) ? rawDates : [])
    .map((d) => formatDateKey(d))
    .filter(Boolean);

  if (!datesArray.length) {
    return {
      currentStreak: 0,
      longestStreak: 0,
      isCompletedToday: false,
      totalCompletions: 0,
      completedDates: []
    };
  }

  const todayKey = formatDateKey(new Date());

  // Deduplicate and filter out future dates (> todayKey)
  const dateSet = new Set(datesArray.filter((d) => d <= todayKey));
  const isCompletedToday = dateSet.has(todayKey);

  // 1. Current continuous streak calculation
  let currentStreak = 0;
  const checkDate = new Date();
  checkDate.setHours(12, 0, 0, 0); // Noon protects against daylight saving 23h/25h hour drift

  // If today is not completed yet, streak is active if yesterday was completed
  if (!isCompletedToday) {
    checkDate.setDate(checkDate.getDate() - 1);
  }

  let safetyLimit = 3650; // 10 years safety bound
  while (safetyLimit-- > 0) {
    const key = formatDateKey(checkDate);
    if (dateSet.has(key)) {
      currentStreak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  // 2. Longest streak calculation across all historical dates
  const sortedDates = Array.from(dateSet).sort();
  let longestStreak = 0;
  let runningStreak = 0;
  let prevDate = null;

  for (const dateStr of sortedDates) {
    if (prevDate) {
      const diff = daysBetween(prevDate, dateStr);
      if (diff === 1) {
        runningStreak++;
      } else if (diff > 1) {
        runningStreak = 1;
      }
    } else {
      runningStreak = 1;
    }

    if (runningStreak > longestStreak) {
      longestStreak = runningStreak;
    }
    prevDate = dateStr;
  }

  if (currentStreak > longestStreak) {
    longestStreak = currentStreak;
  }

  return {
    currentStreak,
    longestStreak,
    isCompletedToday,
    totalCompletions: dateSet.size,
    completedDates: sortedDates
  };
};

// Real-time Streak Calculator for Habit components
export const computeHabitStreak = (habit) => {
  const rawDates = habit?.completed_dates;
  if (Array.isArray(rawDates) && rawDates.length > 0) {
    const stats = calculateHabitStats(rawDates);
    return stats.currentStreak;
  }
  return Number(habit?.current_streak) || 0;
};
