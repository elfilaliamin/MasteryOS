import { computeHabitStreak } from '../utils/habitUtils';

// Professional Mastery Tiers (Levels 1 to 20)
export const LEVELS = [
  { level: 1, title: 'Associate Practitioner', minXp: 0, maxXp: 200, icon: '🏛️', badgeColor: '#0d8a72' },
  { level: 2, title: 'Strategic Specialist', minXp: 200, maxXp: 500, icon: '⚡', badgeColor: '#0d8a72' },
  { level: 3, title: 'High-Impact Operator', minXp: 500, maxXp: 950, icon: '🎯', badgeColor: '#0284c7' },
  { level: 4, title: 'Systems Architect', minXp: 950, maxXp: 1600, icon: '📐', badgeColor: '#6366f1' },
  { level: 5, title: 'Executive Director', minXp: 1600, maxXp: 2500, icon: '🛡️', badgeColor: '#8b5cf6' },
  { level: 6, title: 'Master of Operations', minXp: 2500, maxXp: 3700, icon: '👑', badgeColor: '#f59e0b' },
  { level: 7, title: 'Principal Strategist', minXp: 3700, maxXp: 5200, icon: '🌟', badgeColor: '#ec4899' },
  { level: 8, title: 'Apex Executive', minXp: 5200, maxXp: 7000, icon: '💎', badgeColor: '#10b981' },
  { level: 9, title: 'Senior Managing Director', minXp: 7000, maxXp: 9100, icon: '🏛️', badgeColor: '#0d8a72' },
  { level: 10, title: 'Vice President of Execution', minXp: 9100, maxXp: 11500, icon: '🎖️', badgeColor: '#0284c7' },
  { level: 11, title: 'Chief of Strategy', minXp: 11500, maxXp: 14200, icon: '🧭', badgeColor: '#6366f1' },
  { level: 12, title: 'Enterprise Architect', minXp: 14200, maxXp: 17200, icon: '⚡', badgeColor: '#8b5cf6' },
  { level: 13, title: 'Global Operations Director', minXp: 17200, maxXp: 20500, icon: '🌐', badgeColor: '#f59e0b' },
  { level: 14, title: 'Chief Operating Officer', minXp: 20500, maxXp: 24100, icon: '⚔️', badgeColor: '#ec4899' },
  { level: 15, title: 'Executive Chancellor', minXp: 24100, maxXp: 28000, icon: '🔮', badgeColor: '#14b8a6' },
  { level: 16, title: 'Distinguished Fellow', minXp: 28000, maxXp: 32200, icon: '🌌', badgeColor: '#06b6d4' },
  { level: 17, title: 'Master Strategist', minXp: 32200, maxXp: 36700, icon: '🪐', badgeColor: '#3b82f6' },
  { level: 18, title: 'Sovereign Leader', minXp: 36700, maxXp: 41500, icon: '☀️', badgeColor: '#f97316' },
  { level: 19, title: 'Grand Chancellor', minXp: 41500, maxXp: 46600, icon: '🔥', badgeColor: '#ef4444' },
  { level: 20, title: 'Apex Grandmaster', minXp: 46600, maxXp: 52000, icon: '🏆', badgeColor: '#10b981' },
];

// Separated Executive Tracks for Achievements
export const TRACK_ACHIEVEMENTS = {
  tasks: [
    {
      id: 'task_initiate',
      track: 'tasks',
      title: 'Action Catalyst',
      description: 'Complete 1 operational task',
      target: 1,
      metric: 'completedTasks',
      icon: '✅',
      xpReward: 50,
      check: (tasks) => tasks.filter((t) => t.status === 'COMPLETED').length >= 1,
    },
    {
      id: 'task_momentum',
      track: 'tasks',
      title: 'Workflow Rhythm',
      description: 'Complete 5 operational tasks',
      target: 5,
      metric: 'completedTasks',
      icon: '⚡',
      xpReward: 120,
      check: (tasks) => tasks.filter((t) => t.status === 'COMPLETED').length >= 5,
    },
    {
      id: 'task_urgency',
      track: 'tasks',
      title: 'Critical Resolver',
      description: 'Complete 3 High or Urgent priority tasks',
      target: 3,
      metric: 'urgentTasks',
      icon: '🔥',
      xpReward: 180,
      check: (tasks) =>
        tasks.filter(
          (t) =>
            t.status === 'COMPLETED' &&
            (t.priority === 'URGENT' || t.priority === 'HIGH')
        ).length >= 3,
    },
    {
      id: 'task_mastery',
      track: 'tasks',
      title: 'Execution Maestro',
      description: 'Complete 10 operational tasks',
      target: 10,
      metric: 'completedTasks',
      icon: '🏆',
      xpReward: 250,
      check: (tasks) => tasks.filter((t) => t.status === 'COMPLETED').length >= 10,
    },
  ],
  goals: [
    {
      id: 'goal_architect',
      track: 'goals',
      title: 'Milestone Initiator',
      description: 'Complete all tasks for 1 strategic goal',
      target: 1,
      metric: 'completedGoals',
      icon: '🎯',
      xpReward: 100,
      check: (_, goals = [], tasks = []) => {
        return goals.some((g) => {
          const assigned = tasks.filter((t) => t.goal_id === g.id);
          return assigned.length > 0 && assigned.every((t) => t.status === 'COMPLETED');
        });
      },
    },
    {
      id: 'goal_strategist',
      track: 'goals',
      title: 'Strategic Closer',
      description: 'Complete 2 high-priority strategic goals',
      target: 2,
      metric: 'completedGoals',
      icon: '🏹',
      xpReward: 200,
      check: (_, goals = [], tasks = []) => {
        const completed = goals.filter((g) => {
          const assigned = tasks.filter((t) => t.goal_id === g.id);
          return assigned.length > 0 && assigned.every((t) => t.status === 'COMPLETED');
        });
        return completed.length >= 2;
      },
    },
    {
      id: 'goal_visionary',
      track: 'goals',
      title: 'Visionary Architect',
      description: 'Complete 3 strategic goals',
      target: 3,
      metric: 'completedGoals',
      icon: '🌟',
      xpReward: 350,
      check: (_, goals = [], tasks = []) => {
        const completed = goals.filter((g) => {
          const assigned = tasks.filter((t) => t.goal_id === g.id);
          return assigned.length > 0 && assigned.every((t) => t.status === 'COMPLETED');
        });
        return completed.length >= 3;
      },
    },
  ],
  courses: [
    {
      id: 'course_scholar',
      track: 'courses',
      title: 'Continuous Learner',
      description: 'Complete at least 5 lessons across courses',
      target: 5,
      metric: 'finishedLessons',
      icon: '📚',
      xpReward: 80,
      check: (_, __, ___, courses = []) => {
        const finished = courses.reduce((acc, c) => acc + (c.finished_lessons || 0), 0);
        return finished >= 5;
      },
    },
    {
      id: 'course_graduate',
      track: 'courses',
      title: 'Course Finisher',
      description: 'Complete 1 full course to 100% lessons',
      target: 1,
      metric: 'completedCourses',
      icon: '🎓',
      xpReward: 180,
      check: (_, __, ___, courses = []) => {
        return courses.some(
          (c) => c.total_lessons > 0 && c.finished_lessons >= c.total_lessons
        );
      },
    },
    {
      id: 'course_certified',
      track: 'courses',
      title: 'Certified Authority',
      description: 'Complete a course and record a certification',
      target: 1,
      metric: 'certifiedCourses',
      icon: '📜',
      xpReward: 250,
      check: (_, __, ___, courses = []) => {
        return courses.some(
          (c) =>
            c.total_lessons > 0 &&
            c.finished_lessons >= c.total_lessons &&
            Boolean(c.certification_url || c.certification_filename)
        );
      },
    },
  ],
};

// Prestigious Unlockable Titles (Separated by Domains)
export const TITLES = [
  {
    id: 'starter',
    name: 'Practitioner',
    domain: 'Tasks',
    description: 'Begin consistent execution',
    icon: '🌱',
    reqTasks: 1,
  },
  {
    id: 'sprint_operator',
    name: 'Sprint Operator',
    domain: 'Tasks',
    description: 'Complete 3 operational tasks',
    icon: '⚡',
    reqTasks: 3,
  },
  {
    id: 'critical_resolver',
    name: 'Critical Resolver',
    domain: 'Tasks',
    description: 'Complete 2 High or Urgent priority tasks',
    icon: '🔥',
    reqUrgent: 2,
  },
  {
    id: 'milestone_architect',
    name: 'Milestone Architect',
    domain: 'Goals',
    description: 'Complete at least 1 strategic goal',
    icon: '🎯',
    reqGoal: 1,
  },
  {
    id: 'domain_scholar',
    name: 'Domain Scholar',
    domain: 'Courses',
    description: 'Complete at least 1 full course',
    icon: '🎓',
    reqCourse: 1,
  },
  {
    id: 'systems_lead',
    name: 'Systems Lead',
    domain: 'Mastery',
    description: 'Reach Level 4 Practitioner',
    icon: '🛡️',
    reqLevel: 4,
  },
  {
    id: 'apex_director',
    name: 'Apex Director',
    domain: 'Mastery',
    description: 'Reach Level 6 Executive',
    icon: '👑',
    reqLevel: 6,
  },
  {
    id: 'grand_architect',
    name: 'Grand Architect',
    domain: 'Mastery',
    description: 'Reach Level 10 Vice President',
    icon: '🏛️',
    reqLevel: 10,
  },
  {
    id: 'apex_grandmaster',
    name: 'Apex Grandmaster',
    domain: 'Mastery',
    description: 'Reach Level 20 Apex Grandmaster',
    icon: '🏆',
    reqLevel: 20,
  },
];

// Stable Psychological Gamification Calculation
export const calculateGamification = (
  tasks = [],
  goals = [],
  courses = [],
  equippedTitleId = null,
  habits = []
) => {
  const completedTasks = tasks.filter((t) => t.status === 'COMPLETED');
  const urgentCompleted = completedTasks.filter(
    (t) => t.priority === 'URGENT' || t.priority === 'HIGH'
  );

  const completedGoals = goals.filter((g) => {
    const assigned = tasks.filter((t) => t.goal_id === g.id);
    return assigned.length > 0 && assigned.every((t) => t.status === 'COMPLETED');
  });

  const totalFinishedLessons = courses.reduce(
    (acc, c) => acc + (c.finished_lessons || 0),
    0
  );

  const completedCourses = courses.filter(
    (c) => c.total_lessons > 0 && (c.finished_lessons || 0) >= c.total_lessons
  );

  // Stable XP Progression (50 XP per completed task, +30 priority, +150 per goal, +15 per lesson, +200 per finished course)
  let totalXp = 0;

  // Foundation Starter Quests XP Bonuses (+25 XP each for setting up first entity, +50 XP bonus for completing all 4)
  if (tasks.length > 0) totalXp += 25;
  if (goals.length > 0) totalXp += 25;
  if (courses.length > 0) totalXp += 25;
  if (habits.length > 0) totalXp += 25;
  if (tasks.length > 0 && goals.length > 0 && courses.length > 0 && habits.length > 0) {
    totalXp += 50;
  }

  completedTasks.forEach((t) => {
    totalXp += 50;
    if (t.priority === 'URGENT') totalXp += 40;
    else if (t.priority === 'HIGH') totalXp += 25;
    else if (t.priority === 'MEDIUM') totalXp += 10;
  });

  completedGoals.forEach(() => {
    totalXp += 150;
  });

  totalXp += totalFinishedLessons * 15;

  completedCourses.forEach(() => {
    totalXp += 100;
  });

  // Habit Streak XP: Continuous consistency and logged completions
  habits.forEach((habit) => {
    const streak = computeHabitStreak(habit);
    const totalCompletions = Array.isArray(habit?.completed_dates)
      ? habit.completed_dates.length
      : Number(habit?.total_completions) || 0;

    // +10 XP per logged habit completion
    totalXp += totalCompletions * 10;

    // Habit Streak XP: rewarding ongoing consistency (+15 XP per continuous streak day)
    if (streak > 0) {
      totalXp += streak * 15;
      // Milestone Streak Bonuses
      if (streak >= 30) {
        totalXp += 200;
      } else if (streak >= 14) {
        totalXp += 100;
      } else if (streak >= 7) {
        totalXp += 50;
      }
    }
  });

  // Track achievements check and bonus
  const allAchievements = [
    ...TRACK_ACHIEVEMENTS.tasks.map((a) => ({
      ...a,
      isUnlocked: a.check(tasks),
      currentValue:
        a.metric === 'urgentTasks' ? urgentCompleted.length : completedTasks.length,
    })),
    ...TRACK_ACHIEVEMENTS.goals.map((a) => ({
      ...a,
      isUnlocked: a.check(null, goals, tasks),
      currentValue: completedGoals.length,
    })),
    ...TRACK_ACHIEVEMENTS.courses.map((a) => ({
      ...a,
      isUnlocked: a.check(null, null, null, courses),
      currentValue:
        a.metric === 'finishedLessons'
          ? totalFinishedLessons
          : a.metric === 'certifiedCourses'
          ? courses.filter(
              (c) =>
                c.finished_lessons >= c.total_lessons &&
                Boolean(c.certification_url || c.certification_filename)
            ).length
          : completedCourses.length,
    })),
  ];

  allAchievements.forEach((ach) => {
    if (ach.isUnlocked) {
      totalXp += ach.xpReward;
    }
  });

  // Determine current executive level
  const maxConfiguredLevel = LEVELS[LEVELS.length - 1]; // Level 20 (Apex Grandmaster)
  const POST_LEVEL_20_SPAN = 5500; // Continuous XP required per level past Level 20

  let currentLevelObj;
  let nextLevelObj;
  let nextLevelTitle;

  if (totalXp >= maxConfiguredLevel.maxXp) {
    // Dynamic Leveling beyond Level 20: changes level continuously without adding new titles
    const excessXp = totalXp - maxConfiguredLevel.maxXp;
    const additionalLevels = Math.floor(excessXp / POST_LEVEL_20_SPAN) + 1;
    const currentLevel = maxConfiguredLevel.level + additionalLevels;
    const currentMinXp = maxConfiguredLevel.maxXp + (additionalLevels - 1) * POST_LEVEL_20_SPAN;
    const currentMaxXp = currentMinXp + POST_LEVEL_20_SPAN;

    currentLevelObj = {
      level: currentLevel,
      title: maxConfiguredLevel.title, // Retains Level 20 title without adding new titles
      minXp: currentMinXp,
      maxXp: currentMaxXp,
      icon: maxConfiguredLevel.icon,
      badgeColor: maxConfiguredLevel.badgeColor,
    };

    nextLevelObj = {
      level: currentLevel + 1,
      title: maxConfiguredLevel.title,
      minXp: currentMaxXp,
      maxXp: currentMaxXp + POST_LEVEL_20_SPAN,
      icon: maxConfiguredLevel.icon,
      badgeColor: maxConfiguredLevel.badgeColor,
    };

    nextLevelTitle = `Level ${currentLevel + 1}`;
  } else {
    // Standard lookup within Level 1 to 20
    currentLevelObj = LEVELS[0];
    nextLevelObj = LEVELS[1] || LEVELS[0];

    for (let i = LEVELS.length - 1; i >= 0; i--) {
      if (totalXp >= LEVELS[i].minXp) {
        currentLevelObj = LEVELS[i];
        if (i === LEVELS.length - 1) {
          // At Level 20 heading toward Level 21
          nextLevelObj = {
            level: 21,
            title: maxConfiguredLevel.title,
            minXp: maxConfiguredLevel.maxXp,
            maxXp: maxConfiguredLevel.maxXp + POST_LEVEL_20_SPAN,
            icon: maxConfiguredLevel.icon,
            badgeColor: maxConfiguredLevel.badgeColor,
          };
          nextLevelTitle = 'Level 21';
        } else {
          nextLevelObj = LEVELS[i + 1];
          nextLevelTitle = nextLevelObj.title;
        }
        break;
      }
    }
  }

  const xpInCurrentLevel = totalXp - currentLevelObj.minXp;
  const levelSpan = Math.max(1, currentLevelObj.maxXp - currentLevelObj.minXp);
  const progressPercent = Math.min(
    100,
    Math.max(0, Math.round((xpInCurrentLevel / levelSpan) * 100))
  );

  // Unlocked titles check
  const unlockedTitles = TITLES.filter((title) => {
    if (title.reqTasks && completedTasks.length < title.reqTasks) return false;
    if (title.reqUrgent && urgentCompleted.length < title.reqUrgent) return false;
    if (title.reqGoal && completedGoals.length < title.reqGoal) return false;
    if (title.reqCourse && completedCourses.length < title.reqCourse) return false;
    if (title.reqLevel && currentLevelObj.level < title.reqLevel) return false;
    return true;
  });

  // Next Title to Unlock (Psychological Goal-Gradient Effect)
  const lockedTitles = TITLES.filter((t) => !unlockedTitles.some((u) => u.id === t.id));
  const nextTitleToUnlock = lockedTitles[0] || null;

  // Active Title
  let activeTitle = unlockedTitles.find((t) => t.id === equippedTitleId);
  if (!activeTitle) {
    activeTitle = unlockedTitles[unlockedTitles.length - 1] || TITLES[0];
  }

  // Domain progress metrics
  const taskProgress = {
    completed: completedTasks.length,
    total: tasks.length,
    percent: tasks.length > 0 ? Math.round((completedTasks.length / tasks.length) * 100) : 0,
  };

  const goalProgress = {
    completed: completedGoals.length,
    total: goals.length,
    percent: goals.length > 0 ? Math.round((completedGoals.length / goals.length) * 100) : 0,
  };

  const courseProgress = {
    completedCourses: completedCourses.length,
    totalCourses: courses.length,
    finishedLessons: totalFinishedLessons,
  };

  const habitProgress = {
    totalHabits: habits.length,
    activeStreaks: habits.filter((h) => computeHabitStreak(h) > 0).length,
    bestStreak: habits.reduce((max, h) => Math.max(max, computeHabitStreak(h)), 0),
  };

  return {
    totalXp,
    level: currentLevelObj.level,
    levelTitle: currentLevelObj.title,
    levelIcon: currentLevelObj.icon,
    badgeColor: currentLevelObj.badgeColor,
    minXp: currentLevelObj.minXp,
    maxXp: currentLevelObj.maxXp,
    xpToNextLevel: Math.max(0, currentLevelObj.maxXp - totalXp),
    nextLevelTitle: nextLevelTitle || nextLevelObj.title,
    xpInCurrentLevel,
    progressPercent,
    taskProgress,
    goalProgress,
    courseProgress,
    habitProgress,
    unlockedTitles,
    activeTitle,
    nextTitleToUnlock,
    achievements: allAchievements,
  };
};
