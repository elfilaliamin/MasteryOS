import { Card } from '../components/ui/Card';
import {
  BarChart3,
  Flame,
  ShieldAlert,
  Award,
  Target,
  GraduationCap,
  BookOpen,
  FileCheck,
  CheckCircle2,
} from 'lucide-react';
import { useGamification } from '../context/useGamification';

export const AnalyticsPage = ({ tasks = [], goals = [], courses = [], stats = {} }) => {
  const { playerStats } = useGamification();

  // Task metrics - computed dynamically from live tasks array
  const total = tasks.length > 0 ? tasks.length : (stats.total || 0);
  const completed = tasks.length > 0
    ? tasks.filter((t) => t.status === 'COMPLETED').length
    : (stats.completed_count || 0);
  const inProgress = tasks.length > 0
    ? tasks.filter((t) => t.status === 'IN_PROGRESS').length
    : (stats.in_progress_count || 0);
  const inReview = tasks.length > 0
    ? tasks.filter((t) => t.status === 'IN_REVIEW').length
    : (stats.in_review_count || 0);
  const todo = tasks.length > 0
    ? tasks.filter((t) => t.status === 'TODO').length
    : (stats.todo_count || 0);
  const urgent = tasks.length > 0
    ? tasks.filter((t) => t.priority === 'URGENT' && t.status !== 'COMPLETED').length
    : (stats.urgent_count || 0);
  const overdue = tasks.length > 0
    ? tasks.filter((t) => t.due_date && new Date(t.due_date) < new Date() && t.status !== 'COMPLETED').length
    : (stats.overdue_count || 0);

  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

  // Workload by Priority - ONLY UNFINISHED TASKS
  const activeUnfinishedTasks = tasks.filter((t) => t.status !== 'COMPLETED');
  const activeWorkloadTotal = activeUnfinishedTasks.length;

  const priorities = [
    {
      label: 'Urgent',
      count: activeUnfinishedTasks.filter((t) => t.priority === 'URGENT').length,
      color: 'bg-rose-500',
    },
    {
      label: 'High',
      count: activeUnfinishedTasks.filter((t) => t.priority === 'HIGH').length,
      color: 'bg-orange-500',
    },
    {
      label: 'Medium',
      count: activeUnfinishedTasks.filter((t) => t.priority === 'MEDIUM').length,
      color: 'bg-amber-500',
    },
    {
      label: 'Low',
      count: activeUnfinishedTasks.filter((t) => t.priority === 'LOW').length,
      color: 'bg-sky-500',
    },
  ];

  // Goals Analytics
  const enrichedGoals = goals.map((goal) => {
    const assignedTasks = tasks.filter((t) => t.goal_id === goal.id);
    const completedTasks = assignedTasks.filter((t) => t.status === 'COMPLETED');
    const totalCount = assignedTasks.length;
    const completedCount = completedTasks.length;
    const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
    const isCompleted = totalCount > 0 && completedCount === totalCount;
    return {
      ...goal,
      totalCount,
      completedCount,
      progressPercent,
      isCompleted,
    };
  });

  const totalGoals = enrichedGoals.length;
  const completedGoals = enrichedGoals.filter((g) => g.isCompleted).length;
  const inProgressGoals = enrichedGoals.filter((g) => !g.isCompleted && g.completedCount > 0).length;
  const averageGoalProgress =
    totalGoals > 0
      ? Math.round(enrichedGoals.reduce((acc, g) => acc + g.progressPercent, 0) / totalGoals)
      : 0;

  // Courses Analytics
  const totalCourses = courses.length;
  const totalLessons = courses.reduce((acc, c) => acc + (c.total_lessons || 0), 0);
  const finishedLessons = courses.reduce((acc, c) => acc + (c.finished_lessons || 0), 0);
  const completedCourses = courses.filter((c) => (c.finished_lessons || 0) >= (c.total_lessons || 1)).length;
  const inProgressCourses = courses.filter(
    (c) => (c.finished_lessons || 0) > 0 && (c.finished_lessons || 0) < (c.total_lessons || 1)
  ).length;
  const certifiedCourses = courses.filter((c) => Boolean(c.certification_url)).length;
  const courseLearningRate = totalLessons > 0 ? Math.round((finishedLessons / totalLessons) * 100) : 0;

  return (
    <div className="flex flex-col gap-6 text-left">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
          Productivity & Executive Analytics
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
          Detailed metrics across Tasks, Strategic Goals, and Courses with psychology-based progress tracking.
        </p>
      </div>

      {/* Top Velocity Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-[#0d8a72] via-teal-700 to-emerald-600 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-6 shadow-md shadow-teal-900/10">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white shadow-inner">
            <Award size={28} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-400 text-amber-950">
                Lv.{playerStats.level} Tier
              </span>
              <span className="text-xs font-semibold text-teal-100">
                {playerStats.levelTitle}
              </span>
            </div>
            <h3 className="text-lg font-extrabold tracking-tight mt-1">
              {completionRate >= 70
                ? 'High Operational Output! Your workflow is performing consistently.'
                : 'Maintain execution cadence to unlock the next prestige tier.'}
            </h3>
            <p className="text-xs text-teal-100/80">
              Total XP Accumulated: <strong className="text-amber-300 font-bold">{playerStats.totalXp} XP</strong>
            </p>
          </div>
        </div>

        <div className="flex items-baseline gap-2 bg-white/10 backdrop-blur-md px-5 py-3 rounded-2xl">
          <span className="text-4xl font-black text-amber-300">{completionRate}%</span>
          <span className="text-xs text-teal-100">task completion</span>
        </div>
      </div>

      {/* Row 1: Tasks Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Task Status Distribution */}
        <Card className="flex flex-col gap-5 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-3xl">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <BarChart3 size={18} className="text-[#0d8a72]" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Task Status Distribution
              </h3>
            </div>
            <span className="text-xs font-bold text-slate-400">{total} Total</span>
          </div>

          <div className="flex flex-col gap-4">
            <div>
              <div className="flex justify-between text-xs mb-1.5 font-bold">
                <span className="text-slate-700 dark:text-slate-300">To Do</span>
                <span className="text-slate-500">{todo} ({total > 0 ? Math.round((todo / total) * 100) : 0}%)</span>
              </div>
              <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div className="h-full bg-slate-400 rounded-full" style={{ width: `${total > 0 ? (todo / total) * 100 : 0}%` }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1.5 font-bold">
                <span className="text-amber-600 dark:text-amber-400">In Progress</span>
                <span className="text-slate-500">{inProgress} ({total > 0 ? Math.round((inProgress / total) * 100) : 0}%)</span>
              </div>
              <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div className="h-full bg-amber-500 rounded-full" style={{ width: `${total > 0 ? (inProgress / total) * 100 : 0}%` }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1.5 font-bold">
                <span className="text-sky-600 dark:text-sky-400">In Review</span>
                <span className="text-slate-500">{inReview} ({total > 0 ? Math.round((inReview / total) * 100) : 0}%)</span>
              </div>
              <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div className="h-full bg-sky-500 rounded-full" style={{ width: `${total > 0 ? (inReview / total) * 100 : 0}%` }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1.5 font-bold">
                <span className="text-emerald-600 dark:text-emerald-400">Completed</span>
                <span className="text-slate-500">{completed} ({total > 0 ? Math.round((completed / total) * 100) : 0}%)</span>
              </div>
              <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${total > 0 ? (completed / total) * 100 : 0}%` }} />
              </div>
            </div>
          </div>
        </Card>

        {/* Priority Breakdown - Unfinished Tasks Only */}
        <Card className="flex flex-col gap-5 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-3xl">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Flame size={18} className="text-rose-500" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Workload by Priority
              </h3>
            </div>
            <span className="text-[11px] font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 px-2 py-0.5 rounded-md">
              Active Unfinished ({activeWorkloadTotal})
            </span>
          </div>

          <div className="flex flex-col gap-4">
            {priorities.map((p) => {
              const pct = activeWorkloadTotal > 0 ? Math.round((p.count / activeWorkloadTotal) * 100) : 0;
              return (
                <div key={p.label}>
                  <div className="flex justify-between text-xs mb-1.5 font-bold">
                    <span className="text-slate-700 dark:text-slate-300">{p.label} Priority</span>
                    <span className="text-slate-500">
                      {p.count} active task{p.count === 1 ? '' : 's'} ({pct}%)
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      className={`h-full ${p.color} rounded-full transition-all duration-300`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-auto pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
            <span className="flex items-center gap-1.5 text-rose-500 font-bold">
              <ShieldAlert size={15} />
              <span>Overdue Tasks: {overdue}</span>
            </span>
            <span>
              Urgent Pending: <strong className="text-rose-600 dark:text-rose-400">{urgent}</strong>
            </span>
          </div>
        </Card>
      </div>

      {/* Row 2: Goals & Courses Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Goals Progress Analytics */}
        <Card className="flex flex-col gap-5 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-3xl">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Target size={18} className="text-[#0d8a72] dark:text-teal-400" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Strategic Goals Metrics
              </h3>
            </div>
            <span className="text-xs font-bold text-slate-400">
              Avg {averageGoalProgress}% Progress
            </span>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800 text-center">
              <span className="text-[11px] font-semibold text-slate-500 uppercase">Total Goals</span>
              <div className="text-xl font-black text-slate-900 dark:text-slate-100 mt-0.5">{totalGoals}</div>
            </div>
            <div className="p-3 rounded-2xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200/50 dark:border-teal-800/40 text-center">
              <span className="text-[11px] font-semibold text-teal-700 dark:text-teal-300 uppercase">In Progress</span>
              <div className="text-xl font-black text-[#0d8a72] dark:text-teal-400 mt-0.5">{inProgressGoals}</div>
            </div>
            <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/50 dark:border-emerald-800/40 text-center">
              <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 uppercase">Achieved</span>
              <div className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5">{completedGoals}</div>
            </div>
          </div>

          {/* Goals Individual Breakdown */}
          <div className="flex flex-col gap-3">
            <h4 className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
              Goal Completion Status
            </h4>
            {enrichedGoals.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-4">No goals configured yet.</p>
            ) : (
              <div className="flex flex-col gap-2.5 max-h-48 overflow-y-auto pr-1">
                {enrichedGoals.map((g) => (
                  <div
                    key={g.id}
                    className="p-2.5 rounded-xl border border-slate-200/80 dark:border-slate-800 flex flex-col gap-1.5 bg-slate-50/50 dark:bg-slate-950/30"
                  >
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="flex items-center gap-1.5 truncate max-w-[240px] text-slate-800 dark:text-slate-200">
                        <span>{g.icon || '🎯'}</span>
                        <span className="truncate">{g.title}</span>
                      </span>
                      <span
                        className={
                          g.isCompleted ? 'text-emerald-500' : 'text-[#0d8a72] dark:text-teal-400'
                        }
                      >
                        {g.progressPercent}%
                      </span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{
                          width: `${g.progressPercent}%`,
                          backgroundColor: g.isCompleted ? '#10b981' : '#0d8a72',
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>

        {/* Courses & Learning Analytics */}
        <Card className="flex flex-col gap-5 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-3xl">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <GraduationCap size={18} className="text-[#0d8a72] dark:text-teal-400" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Courses & Learning Analytics
              </h3>
            </div>
            <span className="text-xs font-bold text-slate-400">
              {courseLearningRate}% Finished
            </span>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800 text-center">
              <span className="text-[11px] font-semibold text-slate-500 uppercase">Courses</span>
              <div className="text-xl font-black text-slate-900 dark:text-slate-100 mt-0.5">{totalCourses}</div>
            </div>
            <div className="p-3 rounded-2xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200/50 dark:border-purple-800/40 text-center">
              <span className="text-[11px] font-semibold text-purple-700 dark:text-purple-300 uppercase">Lessons</span>
              <div className="text-xl font-black text-purple-600 dark:text-purple-400 mt-0.5">
                {finishedLessons}/{totalLessons}
              </div>
            </div>
            <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/50 dark:border-amber-800/40 text-center">
              <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-300 uppercase">Certificates</span>
              <div className="text-xl font-black text-amber-600 dark:text-amber-400 mt-0.5">{certifiedCourses}</div>
            </div>
          </div>

          {/* Course Status Summary */}
          <div className="flex flex-col gap-3">
            <h4 className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
              Curriculum Overview
            </h4>
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/30 border border-slate-100 dark:border-slate-800 font-medium">
                <span className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                  <CheckCircle2 size={14} className="text-emerald-500" />
                  <span>Fully Completed Courses</span>
                </span>
                <span className="font-bold text-slate-900 dark:text-slate-100">{completedCourses}</span>
              </div>

              <div className="flex items-center justify-between text-xs p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/30 border border-slate-100 dark:border-slate-800 font-medium">
                <span className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                  <BookOpen size={14} className="text-[#0d8a72] dark:text-teal-400" />
                  <span>In-Progress Courses</span>
                </span>
                <span className="font-bold text-slate-900 dark:text-slate-100">{inProgressCourses}</span>
              </div>

              <div className="flex items-center justify-between text-xs p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/30 border border-slate-100 dark:border-slate-800 font-medium">
                <span className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                  <FileCheck size={14} className="text-amber-500" />
                  <span>Certificates Earned / Linked</span>
                </span>
                <span className="font-bold text-slate-900 dark:text-slate-100">{certifiedCourses}</span>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
