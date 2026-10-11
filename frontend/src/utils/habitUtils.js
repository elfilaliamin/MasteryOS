// Format date as YYYY-MM-DD
export const formatDateKey = (d) => {
  const date = new Date(d);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Real-time Consecutive Streak Calculator with robust normalization & recent run fallback
export const computeHabitStreak = (habit) => {
  const rawDates = habit?.completed_dates || [];
  if (!rawDates.length) return Number(habit?.current_streak) || 0;

  const dateSet = new Set(
    rawDates.map((d) => (typeof d === 'string' ? d.substring(0, 10) : formatDateKey(d))).filter(Boolean)
  );
  if (!dateSet.size) return Number(habit?.current_streak) || 0;

  const todayKey = formatDateKey(new Date());

  // 1. Check current continuous streak up to today or yesterday
  let streak = 0;
  let checkDate = new Date();

  // If today is not checked yet, start evaluation from yesterday
  if (!dateSet.has(todayKey)) {
    checkDate.setDate(checkDate.getDate() - 1);
  }

  while (true) {
    const key = formatDateKey(checkDate);
    if (dateSet.has(key)) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  // 2. Fallback for recent active completions within the current week/grace period:
  if (streak === 0 && dateSet.size > 0) {
    if (dateSet.has(todayKey)) {
      streak = 1;
    } else {
      const sortedDates = Array.from(dateSet).sort().reverse();
      const latestDateStr = sortedDates[0];
      const latestDate = new Date(latestDateStr + 'T00:00:00');
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      const diffDays = Math.round((now - latestDate) / (1000 * 60 * 60 * 24));

      if (diffDays <= 7) {
        let runCount = 0;
        let dCursor = new Date(latestDate);
        while (true) {
          const k = formatDateKey(dCursor);
          if (dateSet.has(k)) {
            runCount++;
            dCursor.setDate(dCursor.getDate() - 1);
          } else {
            break;
          }
        }
        streak = Math.max(1, runCount);
      }
    }
  }

  return Math.max(streak, Number(habit?.current_streak) || 0);
};
