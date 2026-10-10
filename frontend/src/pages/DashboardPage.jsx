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
  Circle,
  Flame,
  CheckCircle2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useGamification } from '../context/useGamification';

const DASHBOARD_LIMITS = {
  HABITS: 6,            // Max 6 habits in today's shortcut widget
  URGENT_TASKS: 4,      // Max 4 High/Urgent priority tasks (2x2 grid)
  DEADLINES: 6,         // Max 6 nearest due date tasks (2x3 grid)
  ACTIVE_COURSES: 4,    // Max 4 in-progress courses (2x2 grid)
  GOALS: 3,             // Max 3 active strategic goals (1x3 grid)
};

const DEFAULT_DASHBOARD_CONFIG = {
  showHabits: true,
  showStats: true,
  showUrgentTasks: true,
  showDeadlines: true,
  showActiveCourses: true,
  showGoalsOverview: true,
  order: ['habits', 'stats', 'urgent', 'deadlines', 'courses', 'goals'],
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
      return saved ? { ...DEFAULT_DASHBOARD_CONFIG, ...JSON.parse(saved) } : DEFAULT_DASHBOARD_CONFIG;
    } catch {
      return DEFAULT_DASHBOARD_CONFIG;
    }
  });

  // Re-read config when page mounts or window focus
  useEffect(() => {
    const handleStorage = () => {
      try {
        const saved = localStorage.getItem('mastery_dashboard_config');
        if (saved) setDashboardConfig({ ...DEFAULT_DASHBOARD_CONFIG, ...JSON.parse(saved) });
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
    .map((t) => ({
      id: t.id,
      title: t.title,
      priority: t.priority,
      due_date: t.due_date,
    }))
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

  // 4. Strategic Goals
  const displayedGoals = goals.slice(0, DASHBOARD_LIMITS.GOALS);

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
      case 'habits':
        if (!dashboardConfig.showHabits || habits.length === 0) return null;
        return (
          <div key="habits" className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-500">
                  <Flame size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <span>Today's Habits Shortcut</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                      {completedHabitsCount} of {habits.length} Done ({habitsRate}%)
                    </span>
                  </h3>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => navigate('/habits')}
                  className="text-xs font-bold text-[#0d8a72] dark:text-teal-400 hover:underline cursor-pointer flex items-center gap-1"
                >
                  <span>
                    {habits.length > DASHBOARD_LIMITS.HABITS
                      ? `View all ${habits.length} Habits`
                      : 'View all Habits'}
                  </span>
                  <ChevronRight size={13} />
                </button>
              </div>
            </div>

            {/* Habit Items Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {displayedHabits.map((habit) => {
                const isCompleted = (habit.completed_dates || []).includes(todayStr);
                const streak = habit.current_streak || 0;

                return (
                  <div
                    key={`dash-habit-${habit.id}`}
                    onClick={() => onToggleHabit && onToggleHabit(habit.id)}
                    className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 cursor-pointer select-none ${
                      isCompleted
                        ? 'bg-emerald-50/50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/80 shadow-xs'
                        : 'bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800 hover:border-amber-400'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className="w-8 h-8 rounded-xl flex items-center justify-center text-sm shrink-0"
                        style={{
                          backgroundColor: `${habit.color || '#0d8a72'}18`,
                          border: `1px solid ${habit.color || '#0d8a72'}30`,
                        }}
                      >
                        {habit.icon || '⚡'}
                      </div>
                      <div className="min-w-0">
                        <p
                          className={`text-xs font-bold truncate ${
                            isCompleted
                              ? 'line-through text-slate-400 dark:text-slate-500'
                              : 'text-slate-900 dark:text-slate-100'
                          }`}
                        >
                          {habit.title}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[11px] font-black text-amber-600 dark:text-amber-400 bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 rounded-lg flex items-center gap-1 shadow-2xs">
                            <Flame size={13} className="fill-amber-500 text-amber-500 shrink-0 drop-shadow-[0_1px_4px_rgba(245,158,11,0.4)] animate-pulse" />
                            <span>{streak}d streak</span>
                          </span>
                          <span className="text-[10px] text-slate-400 uppercase font-semibold">
                            • {habit.time_of_day || 'ANYTIME'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      aria-label="Toggle habit"
                      className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all shrink-0 cursor-pointer ${
                        isCompleted
                          ? 'bg-emerald-600 text-white'
                          : 'border border-slate-300 dark:border-slate-700 text-transparent hover:border-[#0d8a72]'
                      }`}
                    >
                      <CheckCircle2 size={15} className={isCompleted ? 'text-white' : 'opacity-0'} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        );

      case 'deadlines':
        if (!dashboardConfig.showDeadlines || nearestDeadlines.length === 0) return null;
        return (
          <div key="deadlines" className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400">
                  <Calendar size={16} />
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Upcoming & Nearest Deadlines
                </h3>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="text-xs text-slate-400 font-medium hidden sm:inline">
                  Sorted by earliest due
                </span>
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

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {nearestDeadlines.map((item) => {
                const diff = getDeadlineDiff(item.due_date);
                return (
                  <div
                    key={`deadline-task-${item.id}`}
                    className={`p-3.5 rounded-2xl border transition-all flex flex-col justify-between gap-3 text-left bg-white dark:bg-slate-900 ${
                      diff.isOverdue
                        ? 'border-rose-300 dark:border-rose-900/60 bg-rose-50/10'
                        : diff.isToday
                        ? 'border-amber-300 dark:border-amber-900/60 bg-amber-50/10'
                        : 'border-slate-200/90 dark:border-slate-800 hover:border-[#0d8a72]/40'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <button
                          type="button"
                          onClick={() => onStatusChange && onStatusChange(item.id, 'COMPLETED')}
                          className="text-slate-400 hover:text-[#0d8a72] dark:hover:text-teal-400 shrink-0 cursor-pointer"
                          title="Complete task"
                        >
                          <Circle size={16} />
                        </button>
                        <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                          {item.title}
                        </h4>
                      </div>

                      <span
                        className={`text-[10px] font-black px-2 py-0.5 rounded-full shrink-0 border ${
                          diff.isOverdue
                            ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800'
                            : diff.isToday
                            ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                            : 'bg-teal-50 dark:bg-teal-950/40 text-[#0d8a72] dark:text-teal-300 border-teal-200 dark:border-teal-800'
                        }`}
                      >
                        {diff.text}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800/80">
                      <span className="capitalize text-[10px] font-bold text-slate-400">
                        {item.priority} Priority
                      </span>
                      <span className="font-medium">
                        {new Date(item.due_date).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      case 'stats':
        if (!dashboardConfig.showStats) return null;
        return (
          <div key="stats" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Total Tasks
                </p>
                <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-1">{total}</h3>
              </div>
              <div className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                <ListTodo size={22} />
              </div>
            </Card>

            <Card className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  In Progress
                </p>
                <h3 className="text-2xl font-black text-amber-500 mt-1">{inProgress}</h3>
              </div>
              <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/50 text-amber-500">
                <Clock size={22} />
              </div>
            </Card>

            <Card className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Urgent Priority
                </p>
                <h3 className="text-2xl font-black text-rose-500 mt-1">{urgent}</h3>
              </div>
              <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/50 text-rose-500">
                <AlertTriangle size={22} />
              </div>
            </Card>

            <Card className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Completion Rate
                </p>
                <h3 className="text-2xl font-black text-[#0d8a72] dark:text-teal-400 mt-1">
                  {completionRate}%
                </h3>
              </div>
              <div className="p-3 rounded-2xl bg-teal-50 dark:bg-teal-950/50 text-[#0d8a72] dark:text-teal-300">
                <TrendingUp size={22} />
              </div>
            </Card>
          </div>
        );

      case 'courses':
        if (!dashboardConfig.showActiveCourses || activeCourses.length === 0) return null;
        return (
          <div key="courses" className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-teal-500/10 text-[#0d8a72] dark:text-teal-400">
                  <GraduationCap size={16} />
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  In-Progress Courses
                </h3>
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeCourses.map((course) => {
                const finished = course.finished_lessons || 0;
                const totalL = course.total_lessons || 1;
                const pct = Math.min(100, Math.round((finished / totalL) * 100));

                return (
                  <Card key={course.id} className="p-4 flex flex-col justify-between gap-3 text-left">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        {course.cover_image && (
                          <img
                            src={course.cover_image}
                            alt=""
                            className="w-12 h-12 rounded-xl object-cover shrink-0 border border-slate-200 dark:border-slate-800"
                          />
                        )}
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                            {course.title}
                          </h4>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                            {finished} of {totalL} lessons completed
                          </p>
                        </div>
                      </div>

                      <span className="text-xs font-black text-[#0d8a72] dark:text-teal-400">
                        {pct}%
                      </span>
                    </div>

                    <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div
                        className="h-full bg-[#0d8a72] rounded-full transition-all duration-300"
                        style={{ width: `${pct}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-md border border-amber-200 dark:border-amber-800">
                        In Progress
                      </span>

                      {onIncrementLesson && (
                        <button
                          onClick={() => onIncrementLesson(course.id)}
                          className="flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-[#0d8a72] hover:bg-[#0b7561] text-white shadow-xs cursor-pointer transition-colors active:scale-95"
                          title="Complete 1 lesson"
                        >
                          <PlusCircle size={13} />
                          <span>+1 Lesson</span>
                        </button>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        );

      case 'urgent':
        if (!dashboardConfig.showUrgentTasks || urgentTasks.length === 0) return null;
        return (
          <div key="urgent" className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400">
                  <AlertTriangle size={16} />
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  High & Urgent Priority Tasks
                </h3>
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {urgentTasks.map((task) => (
                <div
                  key={task.id}
                  className="p-3.5 rounded-2xl border border-rose-200/80 dark:border-rose-950/60 bg-white dark:bg-slate-900 flex items-center justify-between gap-3 text-left hover:border-rose-400 transition-colors"
                >
                  <div className="flex items-center gap-2.5 truncate min-w-0">
                    <button
                      onClick={() => onStatusChange && onStatusChange(task.id, 'COMPLETED')}
                      className="text-slate-400 hover:text-emerald-500 cursor-pointer shrink-0"
                    >
                      <Circle size={16} />
                    </button>
                    <div className="truncate">
                      <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                        {task.title}
                      </p>
                      {task.due_date && (
                        <p className="text-[10px] text-slate-400 font-medium">
                          Due {new Date(task.due_date).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                  <Badge variant={task.priority} size="xs">
                    {task.priority}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        );

      case 'goals':
        if (!dashboardConfig.showGoalsOverview || goals.length === 0) return null;
        return (
          <div key="goals" className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-teal-500/10 text-[#0d8a72] dark:text-teal-400">
                  <Target size={16} />
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Strategic Goals Progress
                </h3>
              </div>
              <button
                onClick={() => navigate('/goals')}
                className="text-xs font-bold text-[#0d8a72] dark:text-teal-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>
                  {goals.length > DASHBOARD_LIMITS.GOALS
                    ? `View all ${goals.length} goals`
                    : 'View all goals'}
                </span>
                <ChevronRight size={13} />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {displayedGoals.map((goal) => {
                const assigned = tasks.filter((t) => t.goal_id === goal.id);
                const completedCount = assigned.filter((t) => t.status === 'COMPLETED').length;
                const pct = assigned.length > 0 ? Math.round((completedCount / assigned.length) * 100) : 0;

                return (
                  <Card key={goal.id} className="p-3.5 flex flex-col justify-between gap-2.5 text-left">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 truncate">
                        <span className="text-base shrink-0">{goal.icon || '🎯'}</span>
                        <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                          {goal.title}
                        </h4>
                      </div>
                      <Badge variant={goal.priority || 'HIGH'} size="xs">
                        {goal.priority || 'MEDIUM'}
                      </Badge>
                    </div>

                    <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${pct}%`, backgroundColor: goal.color || '#0d8a72' }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-slate-400 font-semibold">
                      <span>
                        {completedCount}/{assigned.length} tasks completed
                      </span>
                      <span style={{ color: goal.color || '#0d8a72' }}>{pct}%</span>
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
      <div className="p-6 rounded-3xl bg-gradient-to-r from-teal-700 via-[#0d8a72] to-emerald-600 text-white shadow-md shadow-teal-900/10 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-44 h-44 bg-white/10 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-center gap-4 relative z-10">
          <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-3xl shadow-inner">
            {playerStats.levelIcon || '🏆'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-400 text-amber-950">
                Level {playerStats.level} • {playerStats.levelTitle}
              </span>
              <span className="text-xs font-semibold text-teal-100 flex items-center gap-1">
                <Trophy size={13} />
                <span>Title: {playerStats.activeTitle?.name}</span>
              </span>
            </div>
            <h3 className="text-xl sm:text-2xl font-black tracking-tight mt-1">
              Mastery Execution Dashboard
            </h3>
            <p className="text-xs text-teal-100/90 mt-0.5">
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

      {/* Dynamically Ordered Dashboard Sections according to user Notion-style preferences */}
      {dashboardConfig.order.map((sectionKey) => renderSection(sectionKey))}
    </div>
  );
};
