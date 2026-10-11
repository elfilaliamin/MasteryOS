import { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import {
  Clock,
  AlertTriangle,
  ListTodo,
  TrendingUp,
  Plus,
  Trophy,
  Calendar,
  GraduationCap,
  Target,
  PlusCircle,
  ChevronRight,
  Flame,
  Check,
  BookOpen,
  FileCheck,
  ExternalLink
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useGamification } from '../context/useGamification';
import { DEFAULT_DASHBOARD_CONFIG, normalizeDashboardConfig } from '../utils/dashboardConfig';

const DASHBOARD_LIMITS = {
  HABITS: 6,            // Max 6 habits in today's shortcut widget
  URGENT_TASKS: 4,      // Max 4 High/Urgent priority tasks (2x2 grid)
  DEADLINES: 6,         // Max 6 nearest due date tasks (2x3 grid)
  ACTIVE_COURSES: 4,    // Max 4 in-progress courses (2x2 grid)
  GOALS: 3,             // Max 3 active strategic goals (1x3 grid)
};

export const DashboardPage = ({
  tasks = [],
  goals = [],
  courses = [],
  habits = [],
  stats = {},
  onOpenNewTask,
  onStatusChange,
  onIncrementLesson,
  onToggleHabit
}) => {
  const navigate = useNavigate();
  const { playerStats } = useGamification();

  const [dashboardConfig, setDashboardConfig] = useState(() => {
    try {
      const saved = localStorage.getItem('mastery_dashboard_config');
      const normalized = normalizeDashboardConfig(saved);
      if (saved) {
        // Auto-heal stored config if habits was omitted in earlier session
        const parsed = JSON.parse(saved);
        if (!parsed.order?.includes('habits') || parsed.showHabits === undefined) {
          localStorage.setItem('mastery_dashboard_config', JSON.stringify(normalized));
        }
      }
      return normalized;
    } catch {
      return DEFAULT_DASHBOARD_CONFIG;
    }
  });

  // Re-read config when page mounts or window focus
  useEffect(() => {
    const handleStorage = () => {
      try {
        const saved = localStorage.getItem('mastery_dashboard_config');
        if (saved) setDashboardConfig(normalizeDashboardConfig(saved));
      } catch (err) {
        void err;
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const total = stats.total ?? tasks.length;
  const completed = stats.completed_count ?? tasks.filter((t) => t.status === 'COMPLETED').length;
  const inProgress = stats.in_progress_count ?? tasks.filter((t) => t.status === 'IN_PROGRESS').length;
  const urgent = stats.urgent_count ?? tasks.filter((t) => t.priority === 'URGENT' && t.status !== 'COMPLETED').length;
  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

  // 1. Nearest Due Dates Component (Tasks ONLY sorted by earliest deadline)
  const allDeadlines = tasks
    .filter((t) => t.status !== 'COMPLETED' && t.due_date)
    .sort((a, b) => new Date(a.due_date) - new Date(b.due_date));

  const nearestDeadlines = allDeadlines.slice(0, DASHBOARD_LIMITS.DEADLINES);

  const getDeadlineDiff = (dateStr) => {
    const target = new Date(dateStr);
    const now = new Date();
    const targetDate = new Date(target.getFullYear(), target.getMonth(), target.getDate());
    const nowDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const diffDays = Math.round((targetDate - nowDate) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { text: `${Math.abs(diffDays)}d overdue`, isOverdue: true };
    }
    if (diffDays === 0) {
      return { text: 'Due today', isToday: true };
    }
    if (diffDays === 1) {
      return { text: 'Due tomorrow', isSoon: true };
    }
    return { text: `${diffDays} days left`, isSoon: false };
  };

  // 2. Active Courses In-Progress (lessons > 0 and lessons < total)
  const allActiveCourses = courses.filter((c) => {
    const finished = c.finished_lessons || 0;
    const totalLessons = c.total_lessons || 1;
    return finished > 0 && finished < totalLessons;
  });

  const activeCourses = allActiveCourses.slice(0, DASHBOARD_LIMITS.ACTIVE_COURSES);

  // 3. High & Urgent Priority Tasks
  const allUrgentTasks = tasks.filter(
    (t) => t.status !== 'COMPLETED' && (t.priority === 'URGENT' || t.priority === 'HIGH')
  );

  const urgentTasks = allUrgentTasks.slice(0, DASHBOARD_LIMITS.URGENT_TASKS);

  // 4. Goals Progress (Exclude completed goals)
  const activeGoals = goals.filter((g) => {
    if (g.status === 'COMPLETED') return false;
    const assigned = tasks.filter((t) => t.goal_id === g.id);
    if (assigned.length > 0 && assigned.every((t) => t.status === 'COMPLETED')) {
      return false;
    }
    return true;
  });

  const displayedGoals = activeGoals.slice(0, DASHBOARD_LIMITS.GOALS);

  // 5. Today's Habits Shortcut
  const todayStr = (() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  })();

  const displayedHabits = habits.slice(0, DASHBOARD_LIMITS.HABITS);
  const completedHabitsCount = habits.filter((h) =>
    (h.completed_dates || []).includes(todayStr)
  ).length;
  const habitsRate = habits.length > 0 ? Math.round((completedHabitsCount / habits.length) * 100) : 0;

  // Widget rendering dictionary
  const renderSection = (sectionKey) => {
    switch (sectionKey) {
      case 'stats':
        if (!dashboardConfig.showStats) return null;
        return (
          <div key="stats" className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
            <Card className="p-3.5 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-0 border-slate-200/90 dark:border-slate-800 shadow-2xs hover:shadow-xs transition-shadow">
              <div className="min-w-0">
                <p className="text-[10px] sm:text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider truncate">
                  Total Tasks
                </p>
                <h3 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100 mt-0.5 sm:mt-1 tracking-tight">{total}</h3>
                <p className="text-[10px] sm:text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 truncate">Active items</p>
              </div>
              <div className="p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 self-end sm:self-auto shrink-0">
                <ListTodo size={20} className="sm:w-6 sm:h-6" />
              </div>
            </Card>

            <Card className="p-3.5 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-0 border-slate-200/90 dark:border-slate-800 shadow-2xs hover:shadow-xs transition-shadow">
              <div className="min-w-0">
                <p className="text-[10px] sm:text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider truncate">
                  In Progress
                </p>
                <h3 className="text-2xl sm:text-3xl font-black text-amber-500 mt-0.5 sm:mt-1 tracking-tight">{inProgress}</h3>
                <p className="text-[10px] sm:text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 truncate">Active execution</p>
              </div>
              <div className="p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl bg-amber-50 dark:bg-amber-950/50 text-amber-500 self-end sm:self-auto shrink-0">
                <Clock size={20} className="sm:w-6 sm:h-6" />
              </div>
            </Card>

            <Card className="p-3.5 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-0 border-slate-200/90 dark:border-slate-800 shadow-2xs hover:shadow-xs transition-shadow">
              <div className="min-w-0">
                <p className="text-[10px] sm:text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider truncate">
                  Urgent Priority
                </p>
                <h3 className="text-2xl sm:text-3xl font-black text-rose-500 mt-0.5 sm:mt-1 tracking-tight">{urgent}</h3>
                <p className="text-[10px] sm:text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 truncate">Bottlenecks</p>
              </div>
              <div className="p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl bg-rose-50 dark:bg-rose-950/50 text-rose-500 self-end sm:self-auto shrink-0">
                <AlertTriangle size={20} className="sm:w-6 sm:h-6" />
              </div>
            </Card>

            <Card className="p-3.5 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-0 border-slate-200/90 dark:border-slate-800 shadow-2xs hover:shadow-xs transition-shadow">
              <div className="min-w-0">
                <p className="text-[10px] sm:text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider truncate">
                  Completion Rate
                </p>
                <h3 className="text-2xl sm:text-3xl font-black text-[#0d8a72] dark:text-teal-400 mt-0.5 sm:mt-1 tracking-tight">
                  {completionRate}%
                </h3>
                <p className="text-[10px] sm:text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 truncate">{completed}/{total} finished</p>
              </div>
              <div className="p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl bg-teal-50 dark:bg-teal-950/50 text-[#0d8a72] dark:text-teal-300 self-end sm:self-auto shrink-0">
                <TrendingUp size={20} className="sm:w-6 sm:h-6" />
              </div>
            </Card>
          </div>
        );

      case 'habits':
        if (!dashboardConfig.showHabits) return null;
        if (habits.length === 0) {
          return (
            <div key="habits" className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
                    <Flame size={18} className="fill-amber-500 text-amber-500" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-slate-100 tracking-tight">
                      Today's Habits & Streaks
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                      Daily routines to protect your streaks and build lasting momentum
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => navigate('/habits')}
                  className="text-xs font-bold text-[#0d8a72] dark:text-teal-400 hover:underline cursor-pointer flex items-center gap-1"
                >
                  <span>Go to Habits</span>
                  <ChevronRight size={13} />
                </button>
              </div>

              <div className="p-6 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60 flex flex-col items-center justify-center text-center gap-2">
                <div className="w-11 h-11 rounded-2xl bg-amber-500/15 flex items-center justify-center text-amber-500">
                  <Flame size={24} className="fill-amber-500 text-amber-500" />
                </div>
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  No habits tracked yet
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm">
                  Build unbreakable daily momentum. Add habits to track your daily progress and watch your streaks grow!
                </p>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => navigate('/habits')}
                  className="mt-1"
                >
                  <Plus size={14} />
                  <span>Set Up Habits</span>
                </Button>
              </div>
            </div>
          );
        }

        return (
          <div key="habits" className="flex flex-col gap-3.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 text-amber-500 border border-amber-500/30">
                  <Flame size={20} className="fill-amber-500 text-amber-500 drop-shadow-[0_1px_4px_rgba(245,158,11,0.5)]" />
                </div>
                <div>
                  <div className="flex items-center gap-2.5">
                    <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-slate-100 tracking-tight">
                      Today's Habits & Streaks
                    </h3>
                    <span className="text-[11px] font-black px-2.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/70 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/80 shadow-2xs">
                      {completedHabitsCount} of {habits.length} Done ({habitsRate}%)
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                    Check off your daily habits to protect and extend your streak
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 self-end sm:self-auto">
                <button
                  type="button"
                  onClick={() => navigate('/habits')}
                  className="text-xs font-bold text-[#0d8a72] dark:text-teal-400 hover:underline cursor-pointer flex items-center gap-1 bg-teal-50/60 dark:bg-teal-950/40 px-2.5 py-1.5 rounded-xl border border-teal-200/70 dark:border-teal-800/70"
                >
                  <span>
                    {habits.length > DASHBOARD_LIMITS.HABITS
                      ? `View all ${habits.length} Habits`
                      : 'Habit Tracker Matrix'}
                  </span>
                  <ChevronRight size={13} />
                </button>
              </div>
            </div>

            {/* Habit Items Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-3.5">
              {displayedHabits.map((habit) => {
                const isCompleted = (habit.completed_dates || []).includes(todayStr);
                const streak = habit.current_streak || 0;

                return (
                  <div
                    key={`dash-habit-${habit.id}`}
                    onClick={() => onToggleHabit && onToggleHabit(habit.id)}
                    className={`p-4 rounded-2xl border transition-all flex items-center justify-between gap-3 cursor-pointer select-none group shadow-2xs ${
                      isCompleted
                        ? 'bg-emerald-50/60 dark:bg-emerald-950/25 border-emerald-300/80 dark:border-emerald-800/80 ring-1 ring-emerald-400/20'
                        : 'bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800 hover:border-amber-400 dark:hover:border-amber-500 hover:shadow-xs'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0 transition-transform group-hover:scale-105"
                        style={{
                          backgroundColor: `${habit.color || '#0d8a72'}18`,
                          border: `1px solid ${habit.color || '#0d8a72'}35`,
                        }}
                      >
                        {habit.icon || '⚡'}
                      </div>
                      <div className="min-w-0">
                        <p
                          className={`text-sm font-bold truncate transition-colors ${
                            isCompleted
                              ? 'line-through text-slate-400 dark:text-slate-500'
                              : 'text-slate-900 dark:text-slate-100 group-hover:text-[#0d8a72] dark:group-hover:text-teal-300'
                          }`}
                        >
                          {habit.title}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          {/* Prominent Streak Badge with Filled Flame */}
                          <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-gradient-to-r from-amber-500/15 via-orange-500/15 to-amber-500/10 border border-amber-500/35 text-amber-600 dark:text-amber-400 font-black text-xs shadow-2xs">
                            <Flame
                              size={14}
                              className="fill-amber-500 text-amber-500 shrink-0 drop-shadow-[0_1px_4px_rgba(245,158,11,0.5)] animate-pulse"
                            />
                            <span>{streak}d</span>
                            <span className="text-[10px] font-bold text-amber-700/80 dark:text-amber-300/80">streak</span>
                          </div>
                          <span className="text-[10px] text-slate-400 uppercase font-semibold">
                            • {habit.time_of_day || 'ANYTIME'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Quick check toggle */}
                    <button
                      type="button"
                      aria-label="Toggle habit completion"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onToggleHabit) onToggleHabit(habit.id);
                      }}
                      className={`w-7 h-7 rounded-xl flex items-center justify-center transition-all shrink-0 cursor-pointer ${
                        isCompleted
                          ? 'bg-emerald-600 text-white shadow-xs ring-2 ring-emerald-500/30 scale-100'
                          : 'border-2 border-slate-300 dark:border-slate-700 hover:border-amber-500 text-transparent bg-slate-50/50 dark:bg-slate-800/50 hover:bg-amber-50 dark:hover:bg-amber-950/20'
                      }`}
                    >
                      <Check
                        size={15}
                        strokeWidth={3}
                        className={`transition-opacity ${isCompleted ? 'opacity-100 text-white' : 'opacity-0'}`}
                      />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        );

      case 'urgent':
        if (!dashboardConfig.showUrgentTasks || urgentTasks.length === 0) return null;
        return (
          <div key="urgent" className="flex flex-col gap-3.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30">
                  <AlertTriangle size={20} />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-slate-100 tracking-tight">
                    High & Urgent Priority Tasks
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                    Critical items requiring your immediate executive focus
                  </p>
                </div>
              </div>
              <button
                onClick={() => navigate('/tasks')}
                className="text-xs font-bold text-[#0d8a72] dark:text-teal-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>
                  {allUrgentTasks.length > DASHBOARD_LIMITS.URGENT_TASKS
                    ? `Go to board (${allUrgentTasks.length})`
                    : 'Go to board'}
                </span>
                <ChevronRight size={13} />
              </button>
            </div>

            {/* List Table View styled like TasksPage */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl overflow-hidden shadow-xs text-left">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-700 dark:text-slate-300">
                  <thead className="bg-slate-50 dark:bg-slate-950/60 text-xs uppercase text-slate-500 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="px-5 py-3.5">Task</th>
                      <th className="px-5 py-3.5">Status</th>
                      <th className="px-5 py-3.5">Priority</th>
                      <th className="px-5 py-3.5">Category</th>
                      <th className="px-5 py-3.5">Due Date</th>
                      <th className="px-5 py-3.5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                    {urgentTasks.map((task) => {
                      const assignedGoal = goals.find((g) => g.id === task.goal_id) || (task.goal_title ? { title: task.goal_title, icon: task.goal_icon || '🎯', color: task.goal_color } : null);
                      const assignedCourse = courses.find((c) => c.id === task.course_id) || (task.course_title ? { title: task.course_title } : null);

                      return (
                        <tr key={task.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                          <td className="px-5 py-3.5">
                            <div className="flex items-start gap-3">
                              {onStatusChange && (
                                <button
                                  type="button"
                                  onClick={() => onStatusChange(task.id, 'COMPLETED')}
                                  className="mt-0.5 w-5 h-5 rounded-md border-2 border-slate-300 dark:border-slate-600 hover:border-emerald-500 hover:bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0 cursor-pointer transition-all group/check shadow-2xs"
                                  title="Mark as completed"
                                >
                                  <Check size={12} strokeWidth={3} className="opacity-0 group-hover/check:opacity-100 transition-opacity" />
                                </button>
                              )}
                              <div className="min-w-0">
                                <div className="font-bold text-slate-900 dark:text-slate-100 hover:text-[#0d8a72] dark:hover:text-teal-400 transition-colors">
                                  {task.title}
                                </div>
                                {task.description && (
                                  <div className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-xs sm:max-w-md mt-0.5">
                                    {task.description}
                                  </div>
                                )}
                                {(assignedCourse || assignedGoal) && (
                                  <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                                    {assignedCourse && (
                                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 flex items-center gap-1">
                                        <span>🎓</span>
                                        <span className="truncate max-w-[120px]">{assignedCourse.title}</span>
                                      </span>
                                    )}
                                    {assignedGoal && (
                                      <span
                                        className="text-[10px] font-bold px-2 py-0.5 rounded-md border flex items-center gap-1"
                                        style={{
                                          backgroundColor: `${assignedGoal.color || '#d97706'}15`,
                                          borderColor: `${assignedGoal.color || '#d97706'}35`,
                                          color: assignedGoal.color || '#d97706',
                                        }}
                                      >
                                        <span>{assignedGoal.icon || '🎯'}</span>
                                        <span className="truncate max-w-[120px]">{assignedGoal.title}</span>
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-3.5 whitespace-nowrap">
                            <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-teal-50 dark:bg-teal-950/40 text-[#0d8a72] dark:text-teal-300 border border-teal-200 dark:border-teal-800/60">
                              {task.status.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 whitespace-nowrap">
                            <Badge variant={task.priority} size="xs">
                              {task.priority}
                            </Badge>
                          </td>
                          <td className="px-5 py-3.5 whitespace-nowrap">
                            {task.category_name ? (
                              <span
                                className="text-xs font-bold px-2.5 py-0.5 rounded-md border"
                                style={{
                                  backgroundColor: `${task.category_color || '#0d8a72'}15`,
                                  borderColor: `${task.category_color || '#0d8a72'}40`,
                                  color: task.category_color || '#0d8a72',
                                }}
                              >
                                {task.category_name}
                              </span>
                            ) : (
                              <span className="text-xs text-slate-400">—</span>
                            )}
                          </td>
                          <td className="px-5 py-3.5 text-xs text-slate-500 dark:text-slate-400 font-medium whitespace-nowrap">
                            {task.due_date ? new Date(task.due_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                          </td>
                          <td className="px-5 py-3.5 text-right whitespace-nowrap">
                            <button
                              onClick={() => navigate('/tasks')}
                              className="text-xs text-[#0d8a72] dark:text-teal-400 font-bold hover:underline cursor-pointer"
                            >
                              View
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );

      case 'deadlines':
        if (!dashboardConfig.showDeadlines || nearestDeadlines.length === 0) return null;
        return (
          <div key="deadlines" className="flex flex-col gap-3.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30">
                  <Calendar size={20} />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-slate-100 tracking-tight">
                    Upcoming & Nearest Deadlines
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                    Tasks sorted chronologically by earliest due date
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => navigate('/tasks')}
                  className="text-xs font-bold text-[#0d8a72] dark:text-teal-400 hover:underline cursor-pointer flex items-center gap-1"
                >
                  <span>
                    {allDeadlines.length > DASHBOARD_LIMITS.DEADLINES
                      ? `View all ${allDeadlines.length} Tasks`
                      : 'View all Tasks'}
                  </span>
                  <ChevronRight size={13} />
                </button>
              </div>
            </div>

            {/* List Table View styled like TasksPage */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl overflow-hidden shadow-xs text-left">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-700 dark:text-slate-300">
                  <thead className="bg-slate-50 dark:bg-slate-950/60 text-xs uppercase text-slate-500 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="px-5 py-3.5">Task</th>
                      <th className="px-5 py-3.5">Status</th>
                      <th className="px-5 py-3.5">Priority</th>
                      <th className="px-5 py-3.5">Category</th>
                      <th className="px-5 py-3.5">Due Date</th>
                      <th className="px-5 py-3.5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                    {nearestDeadlines.map((item) => {
                      const diff = getDeadlineDiff(item.due_date);
                      const assignedGoal = goals.find((g) => g.id === item.goal_id) || (item.goal_title ? { title: item.goal_title, icon: item.goal_icon || '🎯', color: item.goal_color } : null);
                      const assignedCourse = courses.find((c) => c.id === item.course_id) || (item.course_title ? { title: item.course_title } : null);

                      return (
                        <tr key={`deadline-task-${item.id}`} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                          <td className="px-5 py-3.5">
                            <div className="flex items-start gap-3">
                              {onStatusChange && (
                                <button
                                  type="button"
                                  onClick={() => onStatusChange(item.id, 'COMPLETED')}
                                  className="mt-0.5 w-5 h-5 rounded-md border-2 border-slate-300 dark:border-slate-600 hover:border-emerald-500 hover:bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0 cursor-pointer transition-all group/check shadow-2xs"
                                  title="Mark as completed"
                                >
                                  <Check size={12} strokeWidth={3} className="opacity-0 group-hover/check:opacity-100 transition-opacity" />
                                </button>
                              )}
                              <div className="min-w-0">
                                <div className="font-bold text-slate-900 dark:text-slate-100 hover:text-[#0d8a72] dark:hover:text-teal-400 transition-colors">
                                  {item.title}
                                </div>
                                {item.description && (
                                  <div className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-xs sm:max-w-md mt-0.5">
                                    {item.description}
                                  </div>
                                )}
                                {(assignedCourse || assignedGoal) && (
                                  <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                                    {assignedCourse && (
                                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 flex items-center gap-1">
                                        <span>🎓</span>
                                        <span className="truncate max-w-[120px]">{assignedCourse.title}</span>
                                      </span>
                                    )}
                                    {assignedGoal && (
                                      <span
                                        className="text-[10px] font-bold px-2 py-0.5 rounded-md border flex items-center gap-1"
                                        style={{
                                          backgroundColor: `${assignedGoal.color || '#d97706'}15`,
                                          borderColor: `${assignedGoal.color || '#d97706'}35`,
                                          color: assignedGoal.color || '#d97706',
                                        }}
                                      >
                                        <span>{assignedGoal.icon || '🎯'}</span>
                                        <span className="truncate max-w-[120px]">{assignedGoal.title}</span>
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-3.5 whitespace-nowrap">
                            <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-teal-50 dark:bg-teal-950/40 text-[#0d8a72] dark:text-teal-300 border border-teal-200 dark:border-teal-800/60">
                              {item.status.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 whitespace-nowrap">
                            <Badge variant={item.priority} size="xs">
                              {item.priority}
                            </Badge>
                          </td>
                          <td className="px-5 py-3.5 whitespace-nowrap">
                            {item.category_name ? (
                              <span
                                className="text-xs font-bold px-2.5 py-0.5 rounded-md border"
                                style={{
                                  backgroundColor: `${item.category_color || '#0d8a72'}15`,
                                  borderColor: `${item.category_color || '#0d8a72'}40`,
                                  color: item.category_color || '#0d8a72',
                                }}
                              >
                                {item.category_name}
                              </span>
                            ) : (
                              <span className="text-xs text-slate-400">—</span>
                            )}
                          </td>
                          <td className="px-5 py-3.5 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                                {new Date(item.due_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                              </span>
                              <span
                                className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${
                                  diff.isOverdue
                                    ? 'bg-rose-100 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-800'
                                    : diff.isToday
                                    ? 'bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800'
                                    : 'bg-teal-50 dark:bg-teal-950/50 text-[#0d8a72] dark:text-teal-300 border-teal-200 dark:border-teal-800'
                                }`}
                              >
                                {diff.text}
                              </span>
                            </div>
                          </td>
                          <td className="px-5 py-3.5 text-right whitespace-nowrap">
                            <button
                              onClick={() => navigate('/tasks')}
                              className="text-xs text-[#0d8a72] dark:text-teal-400 font-bold hover:underline cursor-pointer"
                            >
                              View
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );

      case 'courses':
        if (!dashboardConfig.showActiveCourses || activeCourses.length === 0) return null;
        return (
          <div key="courses" className="flex flex-col gap-3.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-teal-500/15 text-[#0d8a72] dark:text-teal-400 border border-teal-500/30">
                  <GraduationCap size={20} />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-slate-100 tracking-tight">
                    In-Progress Courses
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                    Active learning modules with direct +1 lesson quick advance
                  </p>
                </div>
              </div>
              <button
                onClick={() => navigate('/courses')}
                className="text-xs font-bold text-[#0d8a72] dark:text-teal-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>
                  {allActiveCourses.length > DASHBOARD_LIMITS.ACTIVE_COURSES
                    ? `View all ${allActiveCourses.length} courses`
                    : 'View all courses'}
                </span>
                <ChevronRight size={13} />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {activeCourses.map((course) => {
                const finished = course.finished_lessons || 0;
                const totalL = course.total_lessons || 1;
                const pct = Math.min(100, Math.round((finished / totalL) * 100));

                return (
                  <div
                    key={course.id}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 hover:border-[#0d8a72]/50 dark:hover:border-teal-500/50 rounded-3xl overflow-hidden shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between group text-left"
                  >
                    <div>
                      {/* Card Cover Banner */}
                      <div
                        onClick={() => navigate('/courses')}
                        className="relative h-44 w-full bg-slate-800 overflow-hidden cursor-pointer group/cover"
                        title="Click cover to view in Courses"
                      >
                        {course.cover_image ? (
                          <img
                            src={course.cover_image}
                            alt={course.title}
                            className="w-full h-full object-cover group-hover/cover:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-tr from-slate-800 to-[#0d8a72] flex items-center justify-center text-white/50 group-hover/cover:scale-105 transition-transform">
                            <GraduationCap size={48} />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-black/10 group-hover/cover:via-black/20 transition-colors" />

                        {/* Top Badges on Cover */}
                        <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
                          <span
                            className={`text-[11px] font-black px-2.5 py-1 rounded-xl shadow-md ${
                              course.status === 'COMPLETED'
                                ? 'bg-emerald-500 text-white'
                                : course.status === 'NOT_STARTED'
                                ? 'bg-slate-700 text-slate-200'
                                : 'bg-[#0d8a72] text-white'
                            }`}
                          >
                            {course.status === 'COMPLETED'
                              ? 'Completed'
                              : course.status === 'NOT_STARTED'
                              ? 'Not Started'
                              : 'In Progress'}
                          </span>
                        </div>

                        {/* Bottom Title on Cover */}
                        <div className="absolute bottom-3 left-3 right-3 text-white pointer-events-none">
                          <h4 className="text-sm font-black tracking-tight line-clamp-1 drop-shadow-sm">
                            {course.title}
                          </h4>
                        </div>
                      </div>

                      {/* Body Details */}
                      <div className="p-4 flex flex-col gap-3">
                        {course.description && (
                          <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed min-h-[32px]">
                            {course.description}
                          </p>
                        )}

                        {/* Progress Bar & Lessons Count */}
                        <div className="flex flex-col gap-2 py-0.5">
                          <div className="flex items-center justify-between text-xs font-bold">
                            <span className="text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                              <BookOpen size={13} className="text-[#0d8a72] dark:text-teal-400" />
                              <span>
                                {finished} of {totalL} lessons completed
                              </span>
                            </span>
                            <span
                              className={`font-black ${
                                course.status === 'COMPLETED'
                                  ? 'text-emerald-500'
                                  : course.status === 'NOT_STARTED'
                                  ? 'text-slate-400'
                                  : 'text-[#0d8a72] dark:text-teal-400'
                              }`}
                            >
                              {pct}%
                            </span>
                          </div>

                          {/* Progress Bar */}
                          <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-500"
                              style={{
                                width: `${pct}%`,
                                backgroundColor:
                                  course.status === 'COMPLETED'
                                    ? '#10b981'
                                    : course.status === 'NOT_STARTED'
                                    ? '#94a3b8'
                                    : '#0d8a72',
                              }}
                            />
                          </div>
                        </div>

                        {/* Interactive Action Bar: +1 Lesson & Certification */}
                        <div className="flex items-center justify-between gap-2 pt-1">
                          {onIncrementLesson && (
                            <button
                              onClick={() => onIncrementLesson(course.id)}
                              disabled={course.isCompleted || pct >= 100}
                              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer ${
                                course.isCompleted || pct >= 100
                                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 opacity-80 cursor-default'
                                  : 'bg-[#0d8a72] hover:bg-[#0b7561] text-white active:scale-95'
                              }`}
                              title={
                                course.isCompleted || pct >= 100
                                  ? 'All lessons completed!'
                                  : 'Mark +1 lesson finished and earn XP'
                              }
                            >
                              <PlusCircle size={14} />
                              <span>{course.isCompleted || pct >= 100 ? 'Finished' : '+1 Lesson'}</span>
                            </button>
                          )}

                          {course.certification_url && (
                            <a
                              href={course.certification_url}
                              target="_blank"
                              rel="noreferrer"
                              download={course.certification_filename || 'Course_Certificate.pdf'}
                              className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50 hover:bg-amber-100 dark:hover:bg-amber-900/60 border border-amber-200 dark:border-amber-800 transition-colors"
                            >
                              <FileCheck size={13} className="text-amber-500" />
                              <span>Certificate</span>
                              <ExternalLink size={11} className="opacity-70" />
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );

      case 'goals':
        if (!dashboardConfig.showGoalsOverview) return null;
        if (displayedGoals.length === 0) {
          return (
            <div key="goals" className="flex flex-col gap-3.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-2xl bg-teal-500/15 text-[#0d8a72] dark:text-teal-400 border border-teal-500/30">
                    <Target size={20} />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-slate-100 tracking-tight">
                      Goals Progress
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                      Active milestone targets and task completion tracking
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => navigate('/goals')}
                  className="text-xs font-bold text-[#0d8a72] dark:text-teal-400 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span>Go to Goals</span>
                  <ChevronRight size={13} />
                </button>
              </div>

              <div className="p-6 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60 flex flex-col items-center justify-center text-center gap-2">
                <div className="w-10 h-10 rounded-2xl bg-teal-500/10 flex items-center justify-center text-[#0d8a72]">
                  <Target size={22} />
                </div>
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  {goals.length > 0 ? 'All active goals are completed! 🎉' : 'No goals created yet'}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm">
                  {goals.length > 0
                    ? 'Outstanding execution! Set new strategic milestones to continue compounding your momentum.'
                    : 'Establish clear milestones to anchor your day-to-day execution and monitor high-level completion.'}
                </p>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => navigate('/goals')}
                  className="mt-1"
                >
                  <Plus size={14} />
                  <span>{goals.length > 0 ? 'Set New Goal' : 'Create First Goal'}</span>
                </Button>
              </div>
            </div>
          );
        }

        return (
          <div key="goals" className="flex flex-col gap-3.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-teal-500/15 text-[#0d8a72] dark:text-teal-400 border border-teal-500/30">
                  <Target size={20} />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-slate-100 tracking-tight">
                    Goals Progress
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                    Active milestone targets and task completion tracking
                  </p>
                </div>
              </div>
              <button
                onClick={() => navigate('/goals')}
                className="text-xs font-bold text-[#0d8a72] dark:text-teal-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>
                  {activeGoals.length > DASHBOARD_LIMITS.GOALS
                    ? `View all ${activeGoals.length} active goals`
                    : 'View all goals'}
                </span>
                <ChevronRight size={13} />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {displayedGoals.map((goal) => {
                const assigned = tasks.filter((t) => t.goal_id === goal.id);
                const completedCount = assigned.filter((t) => t.status === 'COMPLETED').length;
                const pct = assigned.length > 0 ? Math.round((completedCount / assigned.length) * 100) : 0;

                return (
                  <Card key={goal.id} className="p-4 flex flex-col justify-between gap-3 text-left border-slate-200/90 dark:border-slate-800 shadow-2xs hover:shadow-xs transition-shadow">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5 truncate">
                        <span className="text-lg shrink-0">{goal.icon || '🎯'}</span>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                          {goal.title}
                        </h4>
                      </div>
                      <Badge variant={goal.priority || 'HIGH'} size="xs" className="shrink-0">
                        {goal.priority || 'MEDIUM'}
                      </Badge>
                    </div>

                    <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{ width: `${pct}%`, backgroundColor: goal.color || '#0d8a72' }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-xs font-semibold text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800/80">
                      <span>
                        {completedCount}/{assigned.length} tasks completed
                      </span>
                      <span className="font-bold" style={{ color: goal.color || '#0d8a72' }}>{pct}%</span>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col gap-6 text-left">
      {/* Gamification Welcome Banner */}
      <div className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-gradient-to-r from-teal-700 via-[#0d8a72] to-emerald-600 text-white shadow-md shadow-teal-900/10 flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-6 relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-44 h-44 bg-white/10 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-center gap-3 sm:gap-4 relative z-10">
          <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-2xl sm:text-3xl shadow-inner shrink-0">
            {playerStats.levelIcon || '🏆'}
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider px-2 sm:px-2.5 py-0.5 rounded-full bg-amber-400 text-amber-950">
                Level {playerStats.level} • {playerStats.levelTitle}
              </span>
              <span className="text-[11px] sm:text-xs font-semibold text-teal-100 flex items-center gap-1">
                <Trophy size={12} className="sm:w-3.5 sm:h-3.5" />
                <span className="truncate">Title: {playerStats.activeTitle?.name}</span>
              </span>
            </div>
            <h3 className="text-lg sm:text-2xl font-black tracking-tight mt-1 truncate">
              Mastery Execution Dashboard
            </h3>
            <p className="text-xs text-teal-100/90 mt-0.5 line-clamp-2 sm:line-clamp-none">
              Execute tasks, advance goals, and finish course lessons to build lasting momentum.
            </p>
          </div>
        </div>

        <div className="relative z-10 flex flex-col sm:items-end gap-2 bg-white/10 backdrop-blur-md p-4 rounded-2xl min-w-[220px]">
          <div className="flex justify-between w-full text-xs font-bold text-teal-50">
            <span>Next: {playerStats.nextLevelTitle}</span>
            <span className="text-amber-300">{playerStats.progressPercent}%</span>
          </div>
          <div className="w-full h-2.5 bg-black/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-amber-400 rounded-full transition-all duration-300"
              style={{ width: `${playerStats.progressPercent}%` }}
            />
          </div>
          <p className="text-[10px] text-teal-100 font-medium">
            {playerStats.xpToNextLevel} XP needed for next rank
          </p>
        </div>
      </div>

      {/* Top Bar with Quick Task Creation & Settings Link */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            Dashboard Workspace
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Your unified view across deadlines, active courses, and priority execution.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => navigate('/settings')}
            className="text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-[#0d8a72] dark:hover:text-teal-400 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 rounded-xl transition-colors cursor-pointer shadow-2xs"
            title="Configure Dashboard View"
          >
            Customize View
          </button>
          <Button variant="primary" onClick={onOpenNewTask} className="w-fit">
            <Plus size={16} />
            <span>New Task</span>
          </Button>
        </div>
      </div>

      {/* Dynamically Ordered Dashboard Sections with clear separation between sections */}
      <div className="flex flex-col gap-10 sm:gap-12 pt-2">
        {dashboardConfig.order.map((sectionKey) => {
          const content = renderSection(sectionKey);
          if (!content) return null;
          return (
            <section key={sectionKey} className="flex flex-col">
              {content}
            </section>
          );
        })}
      </div>
    </div>
  );
};
