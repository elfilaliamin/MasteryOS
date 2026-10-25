import { useState, useMemo } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useAuth } from '../context/useAuth';
import {
  Flame,
  Plus,
  ChevronLeft,
  ChevronRight,
  Check,
  LayoutGrid,
  CheckCircle2,
  Calendar,
  List,
  TrendingUp,
  Edit2,
  Trash2,
  Pause,
  Play,
} from 'lucide-react';
import { formatDateKey, computeHabitStreak } from '../utils/habitUtils';

// Simple Streak Badge matching Dashboard and Focus Mode
export const StreakBadge = ({
  streak = 0,
  variant = 'default',
  className = '',
  onClick = null,
  showLabel = true,
}) => {
  const count = Math.max(0, Number(streak) || 0);
  const isClickable = typeof onClick === 'function';
  const Component = isClickable ? 'button' : 'div';

  const badgeStyles =
    variant === 'light'
      ? 'bg-black/25 backdrop-blur-xs border border-white/30 text-white shadow-2xs'
      : 'bg-gradient-to-r from-amber-500/15 via-orange-500/15 to-amber-500/10 border border-amber-500/35 text-amber-600 dark:text-amber-400 shadow-2xs';

  return (
    <Component
      type={isClickable ? 'button' : undefined}
      onClick={(e) => {
        if (isClickable) {
          e.stopPropagation();
          onClick(e);
        }
      }}
      className={`inline-flex items-center gap-1 shrink-0 px-2.5 py-0.5 rounded-lg font-black text-xs select-none transition-colors ${
        isClickable ? 'cursor-pointer hover:opacity-90 active:scale-95' : 'cursor-default'
      } ${badgeStyles} ${className}`}
      title={`${count} day streak`}
      aria-label={`${count} day streak`}
    >
      <Flame
        size={13}
        className={`shrink-0 ${
          variant === 'light' ? 'fill-white text-white' : 'fill-amber-500 text-amber-500'
        }`}
      />
      <span>{count}d</span>
      {showLabel && (
        <span
          className={`text-[10px] font-bold ${
            variant === 'light' ? 'text-white/80' : 'text-amber-700/80 dark:text-amber-300/80'
          }`}
        >
          streak
        </span>
      )}
    </Component>
  );
};

// Backward-compatibility alias
export const DuolingoStreakBadge = StreakBadge;

export const HabitsPage = ({
  habits = [],
  onOpenNewHabit,
  onEditHabit,
  onDeleteHabit,
  onToggleHabit,
}) => {
  const { user } = useAuth();

  // Navigation & View States
  const [period, setPeriod] = useState('WEEK'); // 'WEEK' | 'MONTH' | 'YEAR'
  const [weekOffset, setWeekOffset] = useState(0); // 0 = current week, -1 = last week, etc.
  const [monthOffset, setMonthOffset] = useState(0);
  const [viewMode, setViewMode] = useState('GRID'); // 'GRID' (matrix) | 'LIST' (cards)
  const [selectedDayKey, setSelectedDayKey] = useState(() => formatDateKey(new Date()));
  const [mobileTab, setMobileTab] = useState('ACTIONS'); // 'ACTIONS' (Today Checklist) | 'MATRIX' (Weekly Heatmap)
  const [statusFilter, setStatusFilter] = useState('ACTIVE'); // 'ACTIVE' | 'PAUSED'

  const todayKey = formatDateKey(new Date());

  // Active and Paused habits separation (data is fully preserved, paused habits are archived from daily targets)
  const activeHabits = useMemo(() => habits.filter((h) => !h.is_paused), [habits]);
  const pausedHabits = useMemo(() => habits.filter((h) => Boolean(h.is_paused)), [habits]);

  const displayHabits = useMemo(() => {
    if (statusFilter === 'PAUSED') return pausedHabits;
    return activeHabits;
  }, [statusFilter, activeHabits, pausedHabits]);

  const handleDelete = (habitId, habitTitle) => {
    if (!onDeleteHabit) return;
    if (window.confirm(`Are you sure you want to delete "${habitTitle}"? This will permanently remove its streak history.`)) {
      onDeleteHabit(habitId);
    }
  };

  // Greeting based on current time
  const { greeting, timeSub } = useMemo(() => {
    const hour = new Date().getHours();
    const greet =
      hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
    const bedtimeHour = 23;
    const diffHours = (bedtimeHour - hour + 24) % 24;
    const sub =
      diffHours > 0
        ? `${diffHours} hrs until bedtime • Build unbroken momentum`
        : 'Time for restful recovery & recharge';
    return { greeting: greet, timeSub: sub };
  }, []);

  const firstName = user?.full_name ? user.full_name.split(' ')[0] : 'Alex';

  // Completed Today stats (tracked against active habits)
  const completedTodayCount = activeHabits.filter((h) =>
    (h.completed_dates || []).includes(todayKey)
  ).length;

  // 1. Calculate Week Days for the Selected Week Offset
  const weekDays = useMemo(() => {
    const curr = new Date();
    curr.setDate(curr.getDate() + weekOffset * 7);

    // Find Monday of this week (1 = Monday, 0 = Sunday)
    const dayOfWeek = curr.getDay();
    const distanceToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(curr);
    monday.setDate(curr.getDate() + distanceToMonday);

    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const key = formatDateKey(d);
      days.push({
        date: d,
        key,
        dayShort: d.toLocaleDateString(undefined, { weekday: 'short' }), // Mon, Tue...
        dayNarrow: d.toLocaleDateString(undefined, { weekday: 'narrow' }),
        dayNum: d.getDate(),
        isToday: key === todayKey,
        isSelected: key === selectedDayKey,
      });
    }
    return days;
  }, [weekOffset, todayKey, selectedDayKey]);

  // Date range formatted label for header
  const periodRangeLabel = useMemo(() => {
    if (period === 'WEEK') {
      const start = weekDays[0].date;
      const end = weekDays[6].date;
      const startStr = start.toLocaleDateString(undefined, {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      });
      const endStr = end.toLocaleDateString(undefined, {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      });
      return `${startStr} - ${endStr}`;
    }

    if (period === 'MONTH') {
      const d = new Date();
      d.setMonth(d.getMonth() + monthOffset);
      return d.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
    }

    if (period === 'YEAR') {
      const d = new Date();
      return `${d.getFullYear()} Annual Consistency`;
    }

    return '';
  }, [period, weekDays, monthOffset]);

  // 2. Month Days for Month view
  const monthDays = useMemo(() => {
    if (period !== 'MONTH') return [];
    const d = new Date();
    d.setMonth(d.getMonth() + monthOffset, 1);
    const year = d.getFullYear();
    const month = d.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const days = [];
    for (let i = 1; i <= daysInMonth; i++) {
      const dayDate = new Date(year, month, i);
      const key = formatDateKey(dayDate);
      days.push({
        date: dayDate,
        key,
        dayNum: i,
        dayShort: dayDate.toLocaleDateString(undefined, { weekday: 'narrow' }),
        isToday: key === todayKey,
        isSelected: key === selectedDayKey,
      });
    }
    return days;
  }, [period, monthOffset, todayKey, selectedDayKey]);

  // 3. Year Months for Year view
  const yearMonths = useMemo(() => {
    if (period !== 'YEAR') return [];
    const currYear = new Date().getFullYear();
    const months = [];
    for (let m = 0; m < 12; m++) {
      const d = new Date(currYear, m, 1);
      months.push({
        monthIndex: m,
        monthShort: d.toLocaleDateString(undefined, { month: 'short' }),
        yearMonthKey: `${currYear}-${String(m + 1).padStart(2, '0')}`,
      });
    }
    return months;
  }, [period]);

  // Calculate Achievement Percentage for Current View (based on active habits)
  const periodAchievement = useMemo(() => {
    const targetHabits = activeHabits;
    if (targetHabits.length === 0) return { percent: 0, completedLogs: 0, totalOpportunities: 0 };

    if (period === 'WEEK') {
      let totalLogs = 0;
      const totalPossible = targetHabits.length * 7;
      weekDays.forEach((wd) => {
        targetHabits.forEach((h) => {
          if ((h.completed_dates || []).includes(wd.key)) totalLogs++;
        });
      });
      const percent = totalPossible > 0 ? Math.round((totalLogs / totalPossible) * 100) : 0;
      return { percent, completedLogs: totalLogs, totalOpportunities: totalPossible };
    }

    if (period === 'MONTH') {
      let totalLogs = 0;
      const totalPossible = targetHabits.length * monthDays.length;
      monthDays.forEach((md) => {
        targetHabits.forEach((h) => {
          if ((h.completed_dates || []).includes(md.key)) totalLogs++;
        });
      });
      const percent = totalPossible > 0 ? Math.round((totalLogs / totalPossible) * 100) : 0;
      return { percent, completedLogs: totalLogs, totalOpportunities: totalPossible };
    }

    let totalLogs = 0;
    const currentYearStr = String(new Date().getFullYear());
    targetHabits.forEach((h) => {
      totalLogs += (h.completed_dates || []).filter((d) =>
        (typeof d === 'string' ? d : formatDateKey(d)).startsWith(currentYearStr)
      ).length;
    });
    const totalPossible = targetHabits.length * 365;
    const percent = totalPossible > 0 ? Math.min(100, Math.round((totalLogs / totalPossible) * 100)) : 0;
    return { percent, completedLogs: totalLogs, totalOpportunities: totalPossible };
  }, [activeHabits, period, weekDays, monthDays]);

  // Selected Day Object for the Right Side Quick Action Panel
  const selectedDayInfo = useMemo(() => {
    const d = new Date(selectedDayKey + 'T00:00:00');
    return {
      key: selectedDayKey,
      date: d,
      displayTitle: d.toLocaleDateString(undefined, {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      }),
      isToday: selectedDayKey === todayKey,
    };
  }, [selectedDayKey, todayKey]);

  // Step Selected Day backward/forward
  const stepSelectedDay = (direction) => {
    const d = new Date(selectedDayKey + 'T00:00:00');
    d.setDate(d.getDate() + direction);
    setSelectedDayKey(formatDateKey(d));
  };

  // Jump to Current
  const handleJumpToCurrent = () => {
    setWeekOffset(0);
    setMonthOffset(0);
    setSelectedDayKey(todayKey);
  };

  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in pb-12 select-none text-left">
      {/* Top Greeting Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-xl sm:text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
          {greeting}, {firstName}
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
          {timeSub}
        </p>
      </div>

      {/* MOBILE SEGMENTED CONTROL: Visible on small screens (< 1024px) for native phone ergonomics */}
      <div className="flex lg:hidden items-center bg-slate-100 dark:bg-slate-800/80 p-1 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-2xs">
        <button
          type="button"
          onClick={() => setMobileTab('ACTIONS')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            mobileTab === 'ACTIONS'
              ? 'bg-white dark:bg-slate-700 text-[#0d8a72] dark:text-teal-300 shadow-xs'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <CheckCircle2 size={15} />
          <span>Daily Check-ins ({completedTodayCount}/{activeHabits.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setMobileTab('MATRIX')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            mobileTab === 'MATRIX'
              ? 'bg-white dark:bg-slate-700 text-[#0d8a72] dark:text-teal-300 shadow-xs'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <LayoutGrid size={15} />
          <span>Weekly Matrix</span>
        </button>
      </div>

      {/* Main Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-start">
        {/* ================= LEFT MAIN PANEL (8 Cols on desktop, toggled on mobile) ================= */}
        <div
          className={`lg:col-span-8 flex-col gap-4 sm:gap-5 ${
            mobileTab === 'MATRIX' ? 'flex' : 'hidden lg:flex'
          }`}
        >
          {/* Controls Bar: Period Toggle Pill + Active/Paused Status Filter + Add Habit Button */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              {/* Period Toggle Pill with horizontal scroll on mobile */}
              <div className="flex items-center bg-slate-100 dark:bg-slate-800/80 p-1 rounded-full border border-slate-200/60 dark:border-slate-700/60 shadow-2xs overflow-x-auto no-scrollbar max-w-full">
                {[
                  { id: 'WEEK', label: 'Week' },
                  { id: 'MONTH', label: 'Month' },
                  { id: 'YEAR', label: 'Year' },
                ].map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setPeriod(p.id)}
                    className={`px-3 sm:px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                      period === p.id
                        ? 'bg-white dark:bg-slate-700 text-[#0d8a72] dark:text-teal-300 shadow-sm'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>

              {/* Active / Paused Status Filter Pill (Shown when paused habits exist) */}
              {pausedHabits.length > 0 && (
                <div className="flex items-center bg-slate-100 dark:bg-slate-800/80 p-1 rounded-full border border-slate-200/60 dark:border-slate-700/60 shadow-2xs">
                  <button
                    type="button"
                    onClick={() => setStatusFilter('ACTIVE')}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                      statusFilter === 'ACTIVE'
                        ? 'bg-white dark:bg-slate-700 text-[#0d8a72] dark:text-teal-300 shadow-sm'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    Active ({activeHabits.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatusFilter('PAUSED')}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                      statusFilter === 'PAUSED'
                        ? 'bg-amber-500 text-white shadow-sm'
                        : 'text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300'
                    }`}
                  >
                    <Pause size={11} fill="currentColor" />
                    <span>Paused ({pausedHabits.length})</span>
                  </button>
                </div>
              )}
            </div>

            {/* + Add Habit Pill Button */}
            <button
              type="button"
              onClick={onOpenNewHabit}
              className="flex items-center justify-center gap-2 px-5 py-2 rounded-full text-xs font-bold border-2 border-[#0d8a72] dark:border-teal-400 text-[#0d8a72] dark:text-teal-400 hover:bg-[#0d8a72] hover:text-white dark:hover:bg-teal-500 dark:hover:text-slate-950 transition-all cursor-pointer shadow-xs active:scale-95 shrink-0 self-stretch sm:self-auto"
            >
              <Plus size={15} strokeWidth={2.5} />
              <span>Add Habit</span>
            </button>
          </div>

          {/* Date Navigation & View Mode Switch */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
            {/* Date Nav Controls */}
            <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap">
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    if (period === 'WEEK') setWeekOffset((prev) => prev - 1);
                    else if (period === 'MONTH') setMonthOffset((prev) => prev - 1);
                  }}
                  className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:border-[#0d8a72] hover:text-[#0d8a72] transition-colors cursor-pointer shadow-2xs"
                  title="Previous Period"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (period === 'WEEK') setWeekOffset((prev) => prev + 1);
                    else if (period === 'MONTH') setMonthOffset((prev) => prev + 1);
                  }}
                  className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:border-[#0d8a72] hover:text-[#0d8a72] transition-colors cursor-pointer shadow-2xs"
                  title="Next Period"
                >
                  <ChevronRight size={16} />
                </button>
              </div>

              <h2 className="text-sm sm:text-base font-bold text-slate-800 dark:text-slate-100">
                {periodRangeLabel}
              </h2>
            </div>

            {/* Jump to Current & View Toggle */}
            <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto">
              <button
                type="button"
                onClick={handleJumpToCurrent}
                className="text-xs font-bold text-[#0d8a72] dark:text-teal-400 hover:underline cursor-pointer"
              >
                Current
              </button>

              <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200/80 dark:border-slate-700/80">
                <button
                  type="button"
                  onClick={() => setViewMode('LIST')}
                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                    viewMode === 'LIST'
                      ? 'bg-white dark:bg-slate-700 text-[#0d8a72] dark:text-teal-300 shadow-2xs'
                      : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                  }`}
                  title="List View"
                >
                  <List size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('GRID')}
                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                    viewMode === 'GRID'
                      ? 'bg-white dark:bg-slate-700 text-[#0d8a72] dark:text-teal-300 shadow-2xs'
                      : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                  }`}
                  title="Matrix Grid View"
                >
                  <LayoutGrid size={16} />
                </button>
              </div>
            </div>
          </div>

          {/* Progress Bar & Trend Line */}
          <div className="space-y-2 pt-1">
            <div className="w-full h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#0d8a72] via-teal-500 to-emerald-400 rounded-full transition-all duration-500 shadow-sm"
                style={{ width: `${Math.max(periodAchievement.percent, 3)}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 text-[11px] sm:text-xs">
                <TrendingUp size={13} />
                <span>Up {Math.min(periodAchievement.percent, 24)}% vs baseline</span>
              </span>
              <span className="text-slate-800 dark:text-slate-200 font-mono text-[11px] sm:text-xs">
                {periodAchievement.percent}% achieved
              </span>
            </div>
          </div>

          {/* ================= HABIT MATRIX TABLE / GRID ================= */}
          {habits.length === 0 ? (
            <Card className="p-8 sm:p-12 text-center flex flex-col items-center justify-center">
              <div className="w-14 h-14 rounded-2xl bg-teal-50 dark:bg-teal-950/40 text-[#0d8a72] flex items-center justify-center mb-3">
                <Flame size={28} />
              </div>
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
                No Habits Created Yet
              </h3>
              <p className="text-xs text-slate-400 max-w-sm mt-1">
                Start small: pick one daily micro-routine to build unbroken momentum.
              </p>
              <Button onClick={onOpenNewHabit} variant="primary" className="mt-4">
                <Plus size={16} className="mr-1.5" />
                <span>Create First Habit</span>
              </Button>
            </Card>
          ) : displayHabits.length === 0 ? (
            statusFilter === 'PAUSED' ? (
              <Card className="p-8 sm:p-12 text-center flex flex-col items-center justify-center">
                <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-500 flex items-center justify-center mb-3">
                  <Pause size={28} />
                </div>
                <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
                  No Paused Habits
                </h3>
                <p className="text-xs text-slate-400 max-w-sm mt-1">
                  You can pause habits you are no longer interested in by clicking Edit on any habit card. Paused habits safely keep all streak and log history without cluttering daily check-ins.
                </p>
                <Button onClick={() => setStatusFilter('ACTIVE')} variant="outline" className="mt-4">
                  View Active Habits
                </Button>
              </Card>
            ) : (
              <Card className="p-8 sm:p-12 text-center flex flex-col items-center justify-center">
                <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-500 flex items-center justify-center mb-3">
                  <Pause size={28} />
                </div>
                <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
                  All Habits Are Paused
                </h3>
                <p className="text-xs text-slate-400 max-w-sm mt-1">
                  All your existing habits are currently paused. You can resume any habit at any time or create a new habit.
                </p>
                <div className="flex items-center gap-2 mt-4">
                  <Button onClick={() => setStatusFilter('PAUSED')} variant="outline">
                    View Paused Habits ({pausedHabits.length})
                  </Button>
                  <Button onClick={onOpenNewHabit} variant="primary">
                    <Plus size={16} className="mr-1.5" />
                    <span>Add New Habit</span>
                  </Button>
                </div>
              </Card>
            )
          ) : viewMode === 'GRID' ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl p-3 sm:p-5 shadow-2xs space-y-3 sm:space-y-4">
              {/* Paused view informational banner */}
              {statusFilter === 'PAUSED' && (
                <div className="flex items-center justify-between p-3 sm:p-3.5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200">
                  <div className="flex items-center gap-2 min-w-0">
                    <Pause size={15} className="shrink-0 text-amber-600 dark:text-amber-400" />
                    <span className="truncate sm:whitespace-normal">
                      These habits are paused without losing any streak or history. Click <strong>Edit</strong> to resume tracking.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setStatusFilter('ACTIVE')}
                    className="font-bold text-[#0d8a72] dark:text-teal-400 hover:underline cursor-pointer ml-3 shrink-0"
                  >
                    View Active
                  </button>
                </div>
              )}

              {/* Unified Two-Tier Habit Cards for both mobile AND desktop! */}
              <div className="space-y-3 sm:space-y-3.5">
                {displayHabits.map((habit) => {
                  const dates = (habit.completed_dates || []).map((d) =>
                    typeof d === 'string' ? d.substring(0, 10) : formatDateKey(d)
                  );
                  const habitColor = habit.color || '#0d8a72';
                  const habitStreak = computeHabitStreak(habit);

                  let completedInWeek = 0;
                  weekDays.forEach((wd) => {
                    if (dates.includes(wd.key)) completedInWeek++;
                  });

                  let completedInMonth = 0;
                  monthDays.forEach((md) => {
                    if (dates.includes(md.key)) completedInMonth++;
                  });

                  const currentYearStr = String(new Date().getFullYear());
                  const completedInYear = dates.filter((d) => d.startsWith(currentYearStr)).length;

                  const ratioLabel =
                    period === 'WEEK'
                      ? `${completedInWeek}/7`
                      : period === 'MONTH'
                      ? `${completedInMonth}/${monthDays.length}`
                      : `${completedInYear}d`;

                  return (
                    <div
                      key={`matrix-${habit.id}`}
                      className={`p-3.5 sm:p-4.5 rounded-2xl sm:rounded-3xl border transition-all space-y-3 sm:space-y-3.5 ${
                        habit.is_paused
                          ? 'bg-slate-50/50 dark:bg-slate-800/25 border-dashed border-amber-300 dark:border-amber-700/60 opacity-85'
                          : 'bg-slate-50/70 dark:bg-slate-800/40 border-slate-200/80 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 shadow-2xs'
                      }`}
                    >
                      {/* Top Tier: Dot + Icon + Full Habit Title + Paused Badge + Streak Badge + Ratio + Edit & Delete */}
                      <div className="flex items-center justify-between gap-2.5 sm:gap-3">
                        <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
                          <span
                            className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full shrink-0 shadow-2xs"
                            style={{ backgroundColor: habitColor }}
                          />
                          <span className="text-base sm:text-xl shrink-0">{habit.icon || '⚡'}</span>
                          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                            <span className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 truncate">
                              {habit.title}
                            </span>
                            {habit.is_paused && (
                              <span className="shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                                Paused
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                          <StreakBadge
                            streak={habitStreak}
                            onClick={() => onToggleHabit(habit.id, todayKey)}
                          />
                          <span className="text-xs sm:text-sm font-mono font-bold text-slate-400 dark:text-slate-500 pl-1">
                            {ratioLabel}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onEditHabit(habit);
                            }}
                            className="p-1 sm:p-1.5 text-slate-400 hover:text-[#0d8a72] dark:hover:text-teal-400 hover:bg-slate-200/50 dark:hover:bg-slate-700/50 rounded-lg transition-colors cursor-pointer"
                            title="Edit Habit (Pause/Resume, Change Icon, etc.)"
                          >
                            <Edit2 size={13} className="sm:w-3.5 sm:h-3.5" />
                          </button>
                          {onDeleteHabit && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(habit.id, habit.title);
                              }}
                              className="p-1 sm:p-1.5 text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                              title="Delete Habit"
                            >
                              <Trash2 size={13} className="sm:w-3.5 sm:h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Bottom Tier: Period-specific visualizations with zero horizontal scroll */}
                      {period === 'WEEK' && (
                        <div className="grid grid-cols-7 gap-1 sm:gap-2.5 pt-2.5 sm:pt-3 border-t border-slate-200/60 dark:border-slate-700/60 justify-items-center">
                          {weekDays.map((wd) => {
                            const isCompleted = dates.includes(wd.key);
                            return (
                              <button
                                key={wd.key}
                                type="button"
                                onClick={() => onToggleHabit(habit.id, wd.key)}
                                className="flex flex-col items-center gap-1 sm:gap-1.5 py-0.5 sm:py-1 rounded-xl transition-all active:scale-95 cursor-pointer w-full group/btn"
                              >
                                <div className="flex flex-col items-center leading-tight">
                                  <span
                                    className={`text-[10px] sm:text-xs font-bold uppercase transition-colors ${
                                      wd.isSelected
                                        ? 'text-[#0d8a72] dark:text-teal-400 font-black'
                                        : wd.isToday
                                        ? 'text-amber-500 font-black'
                                        : 'text-slate-400 group-hover/btn:text-slate-600 dark:group-hover/btn:text-slate-300'
                                    }`}
                                  >
                                    <span className="sm:hidden">{wd.dayShort.slice(0, 2)}</span>
                                    <span className="hidden sm:inline">{wd.dayShort}</span>
                                  </span>
                                  <span
                                    className={`text-[9px] sm:text-[10px] font-mono ${
                                      wd.isToday ? 'text-amber-500 font-black' : 'text-slate-400/80'
                                    }`}
                                  >
                                    {wd.dayNum}
                                  </span>
                                </div>

                                <div
                                  className={`w-8 h-8 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl flex items-center justify-center transition-all ${
                                    isCompleted
                                      ? 'shadow-xs text-white scale-100'
                                      : 'bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 text-transparent hover:border-slate-300 dark:hover:border-slate-600'
                                  }`}
                                  style={{
                                    backgroundColor: isCompleted ? habitColor : undefined,
                                    borderColor: isCompleted ? habitColor : undefined,
                                  }}
                                >
                                  {isCompleted && (
                                    <Check size={16} className="text-white drop-shadow-xs sm:scale-110" strokeWidth={3} />
                                  )}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {period === 'MONTH' && (
                        <div className="pt-2.5 sm:pt-3 border-t border-slate-200/60 dark:border-slate-700/60 space-y-1 sm:space-y-1.5">
                          {/* 7-column calendar weekday headers */}
                          <div className="grid grid-cols-7 gap-1 sm:gap-2 text-center text-[10px] sm:text-xs font-bold text-slate-400 mb-0.5 sm:mb-1">
                            {['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map((d, idx) => (
                              <span key={idx}>{d}</span>
                            ))}
                          </div>
                          <div className="grid grid-cols-7 gap-1 sm:gap-2 justify-items-center">
                            {/* Calendar leading empty padding */}
                            {monthDays.length > 0 &&
                              Array.from({
                                length: (monthDays[0].date.getDay() + 6) % 7,
                              }).map((_, padIdx) => (
                                <div key={`pad-${padIdx}`} className="w-8 h-8 sm:w-10 sm:h-10" />
                              ))}
                            {monthDays.map((md) => {
                              const isCompleted = dates.includes(md.key);
                              return (
                                <button
                                  key={md.key}
                                  type="button"
                                  onClick={() => onToggleHabit(habit.id, md.key)}
                                  className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center text-[11px] sm:text-xs font-bold transition-all active:scale-90 cursor-pointer ${
                                    isCompleted
                                      ? 'text-white shadow-xs font-black'
                                      : md.isToday
                                      ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-300 dark:border-amber-700'
                                      : 'bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                                  }`}
                                  style={{
                                    backgroundColor: isCompleted ? habitColor : undefined,
                                    borderColor: isCompleted ? habitColor : undefined,
                                  }}
                                  title={`${md.key}: ${isCompleted ? 'Completed' : 'Pending'}`}
                                >
                                  {md.dayNum}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {period === 'YEAR' && (
                        <div className="grid grid-cols-6 sm:grid-cols-12 gap-1.5 sm:gap-2 pt-2.5 sm:pt-3 border-t border-slate-200/60 dark:border-slate-700/60 justify-items-center">
                          {yearMonths.map((ym) => {
                            const countInMonth = dates.filter((d) => d.startsWith(ym.yearMonthKey)).length;
                            return (
                              <div key={ym.yearMonthKey} className="flex flex-col items-center gap-1 py-1 w-full">
                                <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase">
                                  {ym.monthShort}
                                </span>
                                <div
                                  className={`w-9 h-8 sm:w-11 sm:h-10 rounded-xl flex items-center justify-center text-[11px] sm:text-xs font-bold transition-all ${
                                    countInMonth > 0
                                      ? 'text-white shadow-2xs font-black'
                                      : 'bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 text-slate-400 dark:text-slate-500'
                                  }`}
                                  style={{
                                    backgroundColor: countInMonth > 0 ? habitColor : undefined,
                                    opacity: countInMonth > 0 ? Math.max(0.4, Math.min(1, countInMonth / 15)) : 1,
                                  }}
                                >
                                  {countInMonth > 0 ? countInMonth : '0'}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Footer banner for active view if paused habits exist */}
              {statusFilter === 'ACTIVE' && pausedHabits.length > 0 && (
                <div className="flex items-center justify-between p-3 sm:p-3.5 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-800/40 text-xs">
                  <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300">
                    <Pause size={14} className="shrink-0" />
                    <span>
                      <strong>{pausedHabits.length} habit{pausedHabits.length > 1 ? 's are' : ' is'} paused</strong> with streak history safely kept.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setStatusFilter('PAUSED')}
                    className="font-bold text-amber-700 dark:text-amber-400 hover:underline cursor-pointer"
                  >
                    View Paused
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* Detailed Cards View fallback */
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {displayHabits.map((habit) => {
                const dates = (habit.completed_dates || []).map((d) =>
                  typeof d === 'string' ? d.substring(0, 10) : formatDateKey(d)
                );
                const isDoneToday = dates.includes(todayKey);
                const streak = computeHabitStreak(habit);
                return (
                  <Card key={habit.id} className="p-4 flex flex-col justify-between gap-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <span className="text-2xl">{habit.icon || '⚡'}</span>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">{habit.title}</h4>
                            {habit.is_paused && (
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                                Paused
                              </span>
                            )}
                            <StreakBadge
                              streak={streak}
                              onClick={() => onToggleHabit(habit.id, todayKey)}
                            />
                          </div>
                          <span className="text-[10px] text-slate-400">{habit.time_of_day || 'ANYTIME'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                      <button
                        type="button"
                        onClick={() => onToggleHabit(habit.id, todayKey)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          isDoneToday
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200'
                        }`}
                      >
                        {isDoneToday ? '✓ Done Today' : 'Check Today'}
                      </button>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => onEditHabit(habit)}
                          className="text-xs text-slate-400 hover:text-[#0d8a72] dark:hover:text-teal-400 cursor-pointer"
                        >
                          Edit
                        </button>
                        {onDeleteHabit && (
                          <button
                            type="button"
                            onClick={() => handleDelete(habit.id, habit.title)}
                            className="text-xs text-rose-500 hover:text-rose-600 dark:hover:text-rose-400 cursor-pointer"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* ================= RIGHT PANEL: SELECTED DAY QUICK ACTIONS (4 Cols on desktop, toggled on mobile) ================= */}
        <div
          className={`lg:col-span-4 flex-col gap-4 ${
            mobileTab === 'ACTIONS' ? 'flex' : 'hidden lg:flex'
          }`}
        >
          <Card className="p-4 sm:p-5 flex flex-col gap-4 bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800 shadow-2xs rounded-3xl">
            {/* Header: Selected Date + Navigation Arrows */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Calendar size={16} className="text-[#0d8a72] dark:text-teal-400 shrink-0" />
                <h3 className="text-sm font-black text-slate-900 dark:text-slate-100">
                  {selectedDayInfo.displayTitle}
                </h3>
                {selectedDayInfo.isToday && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-50 dark:bg-teal-950/60 text-[#0d8a72] dark:text-teal-300 border border-teal-200 dark:border-teal-800">
                    Today
                  </span>
                )}
              </div>

              {/* Prev / Next Day Chevrons */}
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => stepSelectedDay(-1)}
                  className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-500 hover:text-[#0d8a72] hover:border-[#0d8a72] transition-colors cursor-pointer"
                  title="Previous Day"
                >
                  <ChevronLeft size={15} />
                </button>
                <button
                  type="button"
                  onClick={() => stepSelectedDay(1)}
                  className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-500 hover:text-[#0d8a72] hover:border-[#0d8a72] transition-colors cursor-pointer"
                  title="Next Day"
                >
                  <ChevronRight size={15} />
                </button>
              </div>
            </div>

            {/* Habit Items Vertical Timeline for the Selected Day (Active habits only) */}
            <div className="flex flex-col gap-3">
              {activeHabits.length === 0 ? (
                <div className="text-center py-6 text-xs text-slate-400">
                  No active habits to track.
                </div>
              ) : (
                activeHabits.map((habit) => {
                  const dates = (habit.completed_dates || []).map((d) =>
                    typeof d === 'string' ? d.substring(0, 10) : formatDateKey(d)
                  );
                  const isCompleted = dates.includes(selectedDayKey);
                  const habitColor = habit.color || '#0d8a72';
                  const habitStreak = computeHabitStreak(habit);

                  return (
                    <div key={`day-habit-${habit.id}`} className="relative pl-3 flex flex-col gap-1.5">
                      {/* Left timeline indicator line */}
                      <div
                        className="absolute left-0 top-1 bottom-1 w-1 rounded-full transition-all"
                        style={{ backgroundColor: habitColor }}
                      />

                      {/* Habit Card */}
                      {isCompleted ? (
                        /* COMPLETED STATE: Rich Filled Card styled like the reference design */
                        <div
                          className="p-3.5 rounded-2xl text-white transition-all shadow-sm flex flex-col justify-between gap-3"
                          style={{ backgroundColor: habitColor }}
                        >
                          {/* Card Header: Icon + Title + Streak Badge + Edit & Delete actions */}
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5 min-w-0 truncate">
                              <span className="text-base shrink-0">{habit.icon || '⚡'}</span>
                              <span className="text-xs font-black truncate">{habit.title}</span>
                              <StreakBadge
                                streak={habitStreak}
                                variant="light"
                                onClick={() => onToggleHabit(habit.id, selectedDayKey)}
                              />
                            </div>

                            <div className="flex items-center gap-0.5 shrink-0">
                              <button
                                type="button"
                                onClick={() => onEditHabit(habit)}
                                className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-black/15 cursor-pointer transition-colors"
                                title="Edit Habit"
                              >
                                <Edit2 size={13} />
                              </button>
                              {onDeleteHabit && (
                                <button
                                  type="button"
                                  onClick={() => handleDelete(habit.id, habit.title)}
                                  className="p-1.5 rounded-lg text-white/80 hover:text-rose-200 hover:bg-black/20 cursor-pointer transition-colors"
                                  title="Delete Habit"
                                >
                                  <Trash2 size={13} />
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Card Footer: ✓ Completed text + Undo button */}
                          <div className="flex items-center justify-between pt-1 border-t border-white/20 text-xs">
                            <div className="flex items-center gap-1 font-bold">
                              <Check size={14} strokeWidth={3} />
                              <span>Completed</span>
                            </div>

                            <button
                              type="button"
                              onClick={() => onToggleHabit(habit.id, selectedDayKey)}
                              className="font-bold underline text-white/90 hover:text-white cursor-pointer transition-opacity py-0.5 px-1"
                            >
                              Undo
                            </button>
                          </div>
                        </div>
                      ) : (
                        /* PENDING STATE: Clean Card with Mark Complete outline button */
                        <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 transition-all hover:border-slate-300 flex flex-col justify-between gap-3 text-left">
                          {/* Header: Icon + Title + Streak Badge + Edit & Delete actions */}
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5 min-w-0 truncate">
                              <span className="text-base shrink-0">{habit.icon || '⚡'}</span>
                              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                                {habit.title}
                              </span>
                              <StreakBadge
                                streak={habitStreak}
                                onClick={() => onToggleHabit(habit.id, selectedDayKey)}
                              />
                            </div>

                            <div className="flex items-center gap-0.5 shrink-0">
                              <button
                                type="button"
                                onClick={() => onEditHabit(habit)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-[#0d8a72] dark:hover:text-teal-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
                                title="Edit Habit"
                              >
                                <Edit2 size={13} />
                              </button>
                              {onDeleteHabit && (
                                <button
                                  type="button"
                                  onClick={() => handleDelete(habit.id, habit.title)}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer transition-colors"
                                  title="Delete Habit"
                                >
                                  <Trash2 size={13} />
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Action: Mark Complete outline button with mobile touch height */}
                          <button
                            type="button"
                            onClick={() => onToggleHabit(habit.id, selectedDayKey)}
                            className="w-full py-2 px-3 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-[#0d8a72] hover:text-[#0d8a72] dark:border-teal-400 dark:hover:text-teal-300 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-teal-50/40 dark:hover:bg-teal-950/20 transition-all cursor-pointer shadow-2xs active:scale-98 min-h-[38px]"
                          >
                            Mark Complete
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
