export const DEFAULT_DASHBOARD_CONFIG = {
  showStats: true,
  showHabits: true,
  showUrgentTasks: true,
  showDeadlines: true,
  showActiveCourses: true,
  showGoalsOverview: true,
  order: ['stats', 'habits', 'urgent', 'deadlines', 'courses', 'goals'],
};

export const normalizeDashboardConfig = (raw) => {
  if (!raw) return DEFAULT_DASHBOARD_CONFIG;
  try {
    const config = typeof raw === 'string' ? JSON.parse(raw) : raw;
    let order = Array.isArray(config.order) ? [...config.order] : [...DEFAULT_DASHBOARD_CONFIG.order];
    if (!order.includes('stats')) {
      order.unshift('stats');
    }
    if (!order.includes('habits')) {
      const statsIdx = order.indexOf('stats');
      order.splice(statsIdx + 1, 0, 'habits');
    }
    // Ensure stats comes before habits by default
    const statsIdx = order.indexOf('stats');
    const habitsIdx = order.indexOf('habits');
    if (habitsIdx !== -1 && statsIdx !== -1 && habitsIdx < statsIdx && statsIdx <= 1) {
      order.splice(habitsIdx, 1);
      const newStatsIdx = order.indexOf('stats');
      order.splice(newStatsIdx + 1, 0, 'habits');
    }

    DEFAULT_DASHBOARD_CONFIG.order.forEach((key) => {
      if (!order.includes(key)) {
        order.push(key);
      }
    });
    order = order.filter((k) => DEFAULT_DASHBOARD_CONFIG.order.includes(k));

    return {
      ...DEFAULT_DASHBOARD_CONFIG,
      ...config,
      showStats: config.showStats !== false,
      showHabits: config.showHabits !== false,
      order,
    };
  } catch {
    return DEFAULT_DASHBOARD_CONFIG;
  }
};
