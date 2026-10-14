import { useState, useMemo } from 'react';
import {
  Zap,
  Check,
  Flame,
  Plus,
  CheckCircle2,
  Clock,
  Calendar,
  AlertTriangle,
  Sun,
  Sunset,
  Moon,
  Sparkles,
  Trophy,
  Filter,
  ArrowRight
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { formatDateKey, calculateHabitStats } from '../utils/habitUtils';

const TIME_ICONS = {
  morning: Sun,
  afternoon: Sunset,
  evening: Moon,
  anytime: Zap,
};

const TIME_LABELS = {
  morning: 'Morning',
  afternoon: 'Afternoon',
  evening: 'Evening',
  anytime: 'Anytime',
};

const PRIORITY_BADGES = {
  URGENT: { label: 'Urgent', bg: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20' },
  HIGH: { label: 'High', bg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' },
  MEDIUM: { label: 'Medium', bg: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20' },
  LOW: { label: 'Low', bg: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20' },
};

export const FocusPage = ({
  tasks = [],
  habits = [],
  categories = [],
  goals = [],
  courses = [],
  onStatusChange,
  onToggleHabit,
  onOpenNewTask,
  onOpenNewHabit,
  isLoading = false,
}) => {
  const [filter, setFilter] = useState('ALL'); // 'ALL' | 'HABITS' | 'TASKS' | 'PENDING' | 'DONE'

  const todayKey = formatDateKey(new Date());

  // Formatted date string for header
  const todayFormatted = useMemo(() => {
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
    }).format(new Date());
  }, []);

  // Process today's habits
  const enrichedHabits = useMemo(() => {
    return habits.map((h) => {
      const stats = calculateHabitStats(h.completed_dates || h.history || []);
      return {
        ...h,
        isCompletedToday: stats.isCompletedToday,
        currentStreak: stats.currentStreak,
        totalCompletions: stats.totalCompletions,
      };
    });
  }, [habits]);

  // Determine tasks for today's focus:
  // Includes overdue tasks, tasks explicitly due today, in-progress tasks, or high/urgent tasks
  const enrichedTasks = useMemo(() => {
    return tasks.map((t) => {
      const isCompleted = t.status === 'COMPLETED';
      let isDueToday = false;
      let isOverdue = false;

      if (t.due_date) {
        const dueDateKey = formatDateKey(t.due_date);
        if (dueDateKey === todayKey) {
          isDueToday = true;
        } else if (dueDateKey < todayKey && !isCompleted) {
          isOverdue = true;
        }
      }

      const assignedGoal = goals.find((g) => g.id === t.goal_id);
      const assignedCourse = courses.find((c) => c.id === t.course_id);
      const assignedCategory = categories.find((c) => c.id === t.category_id);

      return {
        ...t,
        isCompleted,
        isDueToday,
        isOverdue,
        assignedGoal,
        assignedCourse,
        assignedCategory,
      };
    });
  }, [tasks, todayKey, goals, courses, categories]);

  // High priority / relevant tasks for today's focus mode
  const focusTasks = useMemo(() => {
    return enrichedTasks.filter((t) => {
      // If completed today or not completed
      if (t.isCompleted) {
        // Show recently completed tasks for satisfying check-off
        return true;
      }
      // If active, show due today, overdue, in-progress, or urgent/high priority
      return t.isDueToday || t.isOverdue || t.status === 'IN_PROGRESS' || t.priority === 'URGENT' || t.priority === 'HIGH' || !t.due_date;
    });
  }, [enrichedTasks]);

  // Overall completion metrics for Today
  const totalHabitsCount = enrichedHabits.length;
  const completedHabitsCount = enrichedHabits.filter((h) => h.isCompletedToday).length;

  const totalTasksCount = focusTasks.length;
  const completedTasksCount = focusTasks.filter((t) => t.isCompleted).length;

  const totalItemsCount = totalHabitsCount + totalTasksCount;
  const totalCompletedCount = completedHabitsCount + completedTasksCount;
  const progressPercent = totalItemsCount > 0 ? Math.round((totalCompletedCount / totalItemsCount) * 100) : 0;

  // Filtered views
  const displayHabits = useMemo(() => {
    if (filter === 'TASKS') return [];
    if (filter === 'PENDING') return enrichedHabits.filter((h) => !h.isCompletedToday);
    if (filter === 'DONE') return enrichedHabits.filter((h) => h.isCompletedToday);
    return enrichedHabits;
  }, [enrichedHabits, filter]);

  const displayTasks = useMemo(() => {
    if (filter === 'HABITS') return [];
    if (filter === 'PENDING') return focusTasks.filter((t) => !t.isCompleted);
    if (filter === 'DONE') return focusTasks.filter((t) => t.isCompleted);
    return focusTasks;
  }, [focusTasks, filter]);

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-6 animate-pulse">
        <div className="h-28 rounded-3xl bg-white/70 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800 p-5" />
        <div className="h-10 rounded-2xl bg-slate-200/80 dark:bg-slate-800/80 w-full" />
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-16 rounded-2xl bg-white/70 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-3 sm:px-4 py-3 sm:py-6 space-y-5 sm:space-y-6 pb-20 select-none">
      {/* Top Header Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-white via-white to-teal-50/50 dark:from-slate-900 dark:via-slate-900 dark:to-teal-950/20 border border-slate-200/90 dark:border-slate-800 p-5 sm:p-6 shadow-sm transition-all">
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-teal-500/10 text-teal-700 dark:text-teal-400 border border-teal-500/20 uppercase tracking-wider">
              <Zap size={13} className="text-teal-600 dark:text-teal-400" />
              Focus Mode
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              {todayFormatted}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {onOpenNewTask && (
              <Button
                size="sm"
                variant="outline"
                onClick={onOpenNewTask}
                className="h-8 px-2.5 text-xs rounded-xl gap-1"
                title="Add Task"
              >
                <Plus size={14} />
                <span className="hidden sm:inline">Task</span>
              </Button>
            )}
            {onOpenNewHabit && (
              <Button
                size="sm"
                variant="primary"
                onClick={onOpenNewHabit}
                className="h-8 px-2.5 text-xs rounded-xl gap-1"
                title="Add Habit"
              >
                <Plus size={14} />
                <span className="hidden sm:inline">Habit</span>
              </Button>
            )}
          </div>
        </div>

        {/* Momentum & Daily Progress */}
        <div className="space-y-2 mt-4">
          <div className="flex items-baseline justify-between">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100">
                {totalCompletedCount}
                <span className="text-base sm:text-lg font-bold text-slate-400 dark:text-slate-500">
                  /{totalItemsCount}
                </span>
              </span>
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                Actions Completed
              </span>
            </div>
            <span className="text-sm font-extrabold text-[#0d8a72] dark:text-teal-400">
              {progressPercent}%
            </span>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-200/50 dark:border-slate-700/50">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#0d8a72] via-emerald-500 to-teal-400 transition-all duration-500 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <p className="text-[11px] text-slate-500 dark:text-slate-400 pt-1 font-medium">
            {progressPercent === 100 && totalItemsCount > 0 ? (
              <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                <Sparkles size={13} /> All daily objectives crushed! Outstanding discipline today.
              </span>
            ) : progressPercent >= 50 ? (
              'Over halfway through today’s checklist! Maintain the momentum.'
            ) : totalItemsCount === 0 ? (
              'No items scheduled yet. Add your first task or habit to focus on today.'
            ) : (
              'Tap items below to check them off as you complete them.'
            )}
          </p>
        </div>
      </div>

      {/* Segmented Filter Pills (Mobile First Horizontal Scrolling) */}
      <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 overflow-x-auto no-scrollbar">
        {[
          { id: 'ALL', label: 'All', count: totalItemsCount },
          { id: 'HABITS', label: 'Habits', count: totalHabitsCount },
          { id: 'TASKS', label: 'Tasks', count: totalTasksCount },
          { id: 'PENDING', label: 'Pending', count: totalItemsCount - totalCompletedCount },
          { id: 'DONE', label: 'Done', count: totalCompletedCount },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id)}
            className={`flex-1 min-w-[70px] py-2 px-3 rounded-xl text-xs font-bold transition-all text-center flex items-center justify-center gap-1.5 cursor-pointer ${
              filter === tab.id
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs border border-slate-200/80 dark:border-slate-700'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <span>{tab.label}</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                filter === tab.id
                  ? 'bg-teal-500/10 text-teal-700 dark:text-teal-400 font-extrabold'
                  : 'bg-slate-200/60 dark:bg-slate-700/60 text-slate-600 dark:text-slate-400'
              }`}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Habits Section */}
      {displayHabits.length > 0 && (
        <div className="space-y-2.5">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Flame size={14} className="text-amber-500" />
              Daily Habits ({completedHabitsCount}/{totalHabitsCount})
            </h2>
            {onOpenNewHabit && (
              <button
                onClick={onOpenNewHabit}
                className="text-[11px] font-bold text-[#0d8a72] dark:text-teal-400 hover:underline cursor-pointer"
              >
                + Add Habit
              </button>
            )}
          </div>

          <div className="space-y-2">
            {displayHabits.map((habit) => {
              const isDone = habit.isCompletedToday;
              const TimeIcon = TIME_ICONS[habit.time_of_day] || Zap;

              return (
                <div
                  key={habit.id}
                  onClick={() => onToggleHabit?.(habit.id)}
                  className={`group relative flex items-center gap-3 p-3.5 sm:p-4 rounded-2xl border transition-all duration-200 cursor-pointer ${
                    isDone
                      ? 'bg-teal-50/40 dark:bg-teal-950/10 border-teal-200/60 dark:border-teal-900/40 text-slate-500 dark:text-slate-400'
                      : 'bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800 hover:border-teal-500/50 shadow-xs'
                  }`}
                >
                  {/* Large tactile checkbox */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleHabit?.(habit.id);
                    }}
                    className={`w-7 h-7 rounded-xl flex items-center justify-center transition-all cursor-pointer shrink-0 border ${
                      isDone
                        ? 'bg-[#0d8a72] border-[#0d8a72] text-white shadow-xs'
                        : 'border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800/80 group-hover:border-[#0d8a72]'
                    }`}
                    aria-label={`Toggle ${habit.title}`}
                  >
                    {isDone && <Check size={16} strokeWidth={3} className="animate-scale-in" />}
                  </button>

                  {/* Habit Icon Badge */}
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-lg shrink-0 shadow-xs"
                    style={{
                      backgroundColor: `${habit.color || '#0d8a72'}18`,
                      border: `1px solid ${habit.color || '#0d8a72'}30`,
                    }}
                  >
                    {habit.icon || '🔥'}
                  </div>

                  {/* Habit Details */}
                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-sm font-bold truncate transition-colors ${
                        isDone
                          ? 'line-through text-slate-400 dark:text-slate-500 font-medium'
                          : 'text-slate-900 dark:text-slate-100'
                      }`}
                    >
                      {habit.title}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="inline-flex items-center gap-1 text-[11px] text-slate-400 dark:text-slate-500 font-medium">
                        <TimeIcon size={11} />
                        {TIME_LABELS[habit.time_of_day] || 'Anytime'}
                      </span>
                      {habit.description && (
                        <span className="text-[11px] text-slate-400 truncate max-w-[150px] hidden sm:inline">
                          • {habit.description}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Streak pill */}
                  <div className="shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/40 text-amber-700 dark:text-amber-400 font-bold text-xs">
                    <Flame size={13} className="fill-amber-500 text-amber-500" />
                    <span>{habit.currentStreak || 0}d</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tasks Section */}
      {displayTasks.length > 0 && (
        <div className="space-y-2.5 pt-2">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <CheckCircle2 size={14} className="text-[#0d8a72] dark:text-teal-400" />
              Today’s Action Tasks ({completedTasksCount}/{totalTasksCount})
            </h2>
            {onOpenNewTask && (
              <button
                onClick={onOpenNewTask}
                className="text-[11px] font-bold text-[#0d8a72] dark:text-teal-400 hover:underline cursor-pointer"
              >
                + Add Task
              </button>
            )}
          </div>

          <div className="space-y-2">
            {displayTasks.map((task) => {
              const isDone = task.isCompleted;
              const priorityInfo = PRIORITY_BADGES[task.priority] || PRIORITY_BADGES.MEDIUM;

              return (
                <div
                  key={task.id}
                  onClick={() => onStatusChange?.(task.id, isDone ? 'TODO' : 'COMPLETED')}
                  className={`group relative flex items-start gap-3 p-3.5 sm:p-4 rounded-2xl border transition-all duration-200 cursor-pointer ${
                    isDone
                      ? 'bg-slate-50/60 dark:bg-slate-900/40 border-slate-200/60 dark:border-slate-800/50 text-slate-400 dark:text-slate-500'
                      : 'bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800 hover:border-teal-500/50 shadow-xs'
                  }`}
                >
                  {/* Large tactile checkbox */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onStatusChange?.(task.id, isDone ? 'TODO' : 'COMPLETED');
                    }}
                    className={`mt-0.5 w-6 h-6 rounded-lg flex items-center justify-center transition-all cursor-pointer shrink-0 border ${
                      isDone
                        ? 'bg-emerald-600 border-emerald-600 text-white shadow-xs'
                        : 'border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800/80 group-hover:border-[#0d8a72]'
                    }`}
                    aria-label={`Toggle ${task.title}`}
                  >
                    {isDone && <Check size={14} strokeWidth={3} className="animate-scale-in" />}
                  </button>

                  {/* Task Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p
                        className={`text-sm font-bold transition-colors ${
                          isDone
                            ? 'line-through text-slate-400 dark:text-slate-500 font-medium'
                            : 'text-slate-900 dark:text-slate-100'
                        }`}
                      >
                        {task.title}
                      </p>

                      {/* Priority Tag */}
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md border uppercase tracking-wider shrink-0 ${priorityInfo.bg}`}
                      >
                        {priorityInfo.label}
                      </span>
                    </div>

                    {/* Metadata chips (category, goal, course, due date) */}
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      {task.isOverdue && !isDone && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30 px-1.5 py-0.5 rounded-md">
                          <AlertTriangle size={10} /> Overdue
                        </span>
                      )}

                      {task.isDueToday && !isDone && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-teal-700 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/30 px-1.5 py-0.5 rounded-md">
                          <Calendar size={10} /> Due Today
                        </span>
                      )}

                      {task.assignedCategory && (
                        <span className="inline-flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400">
                          <span
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ backgroundColor: task.assignedCategory.color || '#0d8a72' }}
                          />
                          {task.assignedCategory.name}
                        </span>
                      )}

                      {task.assignedGoal && (
                        <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium truncate max-w-[140px]">
                          🎯 {task.assignedGoal.title}
                        </span>
                      )}

                      {task.assignedCourse && (
                        <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-medium truncate max-w-[140px]">
                          🎓 {task.assignedCourse.title}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty State when zero items match */}
      {displayHabits.length === 0 && displayTasks.length === 0 && (
        <div className="p-8 sm:p-10 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 flex items-center justify-center mx-auto shadow-xs">
            <Trophy size={26} />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              {filter === 'DONE'
                ? 'No completed items yet today'
                : filter === 'PENDING'
                ? 'All pending items cleared!'
                : 'Your Focus list is completely empty'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              Focus Mode keeps your daily execution razor-sharp by isolating only what needs to get done today.
            </p>
          </div>

          <div className="flex items-center justify-center gap-2 pt-2">
            {onOpenNewTask && (
              <Button size="sm" variant="outline" onClick={onOpenNewTask} className="rounded-xl text-xs gap-1.5">
                <Plus size={14} /> Add Task
              </Button>
            )}
            {onOpenNewHabit && (
              <Button size="sm" variant="primary" onClick={onOpenNewHabit} className="rounded-xl text-xs gap-1.5">
                <Plus size={14} /> Add Habit
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
