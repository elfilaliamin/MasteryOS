import { useState, useMemo } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import {
  Flame,
  Plus,
  Trophy,
  CheckCircle2,
  Circle,
  Calendar,
  Clock,
  Search,
  Filter,
  BarChart3,
  TrendingUp,
  Sparkles,
  Edit2,
  Trash2,
  RotateCcw,
  AlertCircle
} from 'lucide-react';

const PERIODS = [
  { id: 'WEEK', label: 'Week (7 Days)' },
  { id: 'MONTH', label: 'Month (30 Days)' },
  { id: 'YEAR', label: 'Year (12 Months)' },
];

const TIME_FILTERS = [
  { id: 'ALL', label: 'All Times' },
  { id: 'MORNING', label: 'Morning 🌅' },
  { id: 'AFTERNOON', label: 'Afternoon 🌤️' },
  { id: 'EVENING', label: 'Evening 🌙' },
  { id: 'ANYTIME', label: 'Anytime ☀️' },
];

// Helper to format Date to YYYY-MM-DD
const formatDateKey = (d) => {
  const date = new Date(d);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const HabitsPage = ({
  habits = [],
  onOpenNewHabit,
  onEditHabit,
  onDeleteHabit,
  onToggleHabit,
}) => {
  const [period, setPeriod] = useState('WEEK');
  const [timeFilter, setTimeFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'PENDING' | 'COMPLETED'
  const [searchQuery, setSearchQuery] = useState('');

  const todayStr = formatDateKey(new Date());

  // Past 7 days array for mini matrix
  const past7Days = useMemo(() => {
    const list = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      list.push({
        date: d,
        dateKey: formatDateKey(d),
        dayName: d.toLocaleDateString(undefined, { weekday: 'narrow' }), // M, T, W...
        dayShort: d.toLocaleDateString(undefined, { weekday: 'short' }),
        dayNum: d.getDate(),
        isToday: i === 0,
      });
    }
    return list;
  }, []);

  // Compute Overall Stats
  const activeHabitsCount = habits.length;
  const completedTodayCount = habits.filter((h) =>
    (h.completed_dates || []).includes(todayStr)
  ).length;
  const todayRate =
    activeHabitsCount > 0 ? Math.round((completedTodayCount / activeHabitsCount) * 100) : 0;

  const bestStreak = habits.reduce(
    (max, h) => Math.max(max, h.longest_streak || h.current_streak || 0),
    0
  );

  const totalCompletionsAllTime = habits.reduce(
    (sum, h) => sum + (h.completed_dates?.length || 0),
    0
  );

  // Filtered habits
  const filteredHabits = useMemo(() => {
    return habits.filter((h) => {
      // Time of day
      if (timeFilter !== 'ALL' && h.time_of_day !== timeFilter) return false;

      // Status
      const isDoneToday = (h.completed_dates || []).includes(todayStr);
      if (statusFilter === 'COMPLETED' && !isDoneToday) return false;
      if (statusFilter === 'PENDING' && isDoneToday) return false;

      // Search
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchTitle = h.title?.toLowerCase().includes(query);
        const matchDesc = h.description?.toLowerCase().includes(query);
        if (!matchTitle && !matchDesc) return false;
      }

      return true;
    });
  }, [habits, timeFilter, statusFilter, searchQuery, todayStr]);

  // Chart Analytics Data by Period (Week, Month, Year)
  const chartData = useMemo(() => {
    if (habits.length === 0) return { bars: [], rate: 0, totalLogs: 0, perfectDays: 0 };

    if (period === 'WEEK') {
      // 7 Days
      const bars = past7Days.map((d) => {
        let count = 0;
        habits.forEach((h) => {
          if ((h.completed_dates || []).includes(d.dateKey)) count++;
        });
        const percent = habits.length > 0 ? Math.round((count / habits.length) * 100) : 0;
        return {
          label: d.isToday ? 'Today' : d.dayShort,
          subLabel: `${d.dayNum}`,
          count,
          total: habits.length,
          percent,
          isToday: d.isToday,
        };
      });

      const totalLogs = bars.reduce((acc, b) => acc + b.count, 0);
      const avgRate = Math.round(bars.reduce((acc, b) => acc + b.percent, 0) / bars.length);
      const perfectDays = bars.filter((b) => b.percent === 100).length;

      return { bars, rate: avgRate, totalLogs, perfectDays };
    }

    if (period === 'MONTH') {
      // Last 30 Days grouped into 4 weeks or 10-day chunks
      const days = [];
      for (let i = 29; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        days.push(formatDateKey(d));
      }

      // Group into 6 5-day intervals for clean bar rendering
      const intervals = [
        { label: 'Day 1-5', dates: days.slice(0, 5) },
        { label: 'Day 6-10', dates: days.slice(5, 10) },
        { label: 'Day 11-15', dates: days.slice(10, 15) },
        { label: 'Day 16-20', dates: days.slice(15, 20) },
        { label: 'Day 21-25', dates: days.slice(20, 25) },
        { label: 'Day 26-30', dates: days.slice(25, 30) },
      ];

      let totalLogs = 0;
      let totalOpportunities = 0;
      let perfectCount = 0;

      days.forEach((dk) => {
        let dayLogs = 0;
        habits.forEach((h) => {
          if ((h.completed_dates || []).includes(dk)) dayLogs++;
        });
        if (dayLogs === habits.length) perfectCount++;
      });

      const bars = intervals.map((inv) => {
        let invLogs = 0;
        const totalPossible = inv.dates.length * habits.length;
        inv.dates.forEach((dk) => {
          habits.forEach((h) => {
            if ((h.completed_dates || []).includes(dk)) {
              invLogs++;
              totalLogs++;
            }
          });
          totalOpportunities += habits.length;
        });

        const percent = totalPossible > 0 ? Math.round((invLogs / totalPossible) * 100) : 0;
        return {
          label: inv.label,
          subLabel: `${invLogs} checks`,
          count: invLogs,
          total: totalPossible,
          percent,
          isToday: inv.label === 'Day 26-30',
        };
      });

      const overallRate = totalOpportunities > 0 ? Math.round((totalLogs / totalOpportunities) * 100) : 0;
      return { bars, rate: overallRate, totalLogs, perfectDays: perfectCount };
    }

    // YEAR Period: 12 months
    const now = new Date();
    const months = [];
    for (let m = 11; m >= 0; m--) {
      const d = new Date(now.getFullYear(), now.getMonth() - m, 1);
      months.push({
        year: d.getFullYear(),
        month: d.getMonth(),
        label: d.toLocaleDateString(undefined, { month: 'short' }),
        yearMonthStr: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
      });
    }

    let yearTotalLogs = 0;
    const bars = months.map((m) => {
      let monthLogs = 0;
      habits.forEach((h) => {
        (h.completed_dates || []).forEach((dStr) => {
          if (dStr.startsWith(m.yearMonthStr)) {
            monthLogs++;
            yearTotalLogs++;
          }
        });
      });

      // Rough normalization for visualization (assuming 30 days/month)
      const maxEstimated = habits.length * 30;
      const percent = maxEstimated > 0 ? Math.min(100, Math.round((monthLogs / maxEstimated) * 100)) : 0;

      return {
        label: m.label,
        subLabel: `${monthLogs}`,
        count: monthLogs,
        total: maxEstimated,
        percent,
        isToday: m.yearMonthStr === `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`,
      };
    });

    const avgRate = Math.round(bars.reduce((acc, b) => acc + b.percent, 0) / 12);

    return { bars, rate: avgRate, totalLogs: yearTotalLogs, perfectDays: '12M' };
  }, [habits, period, past7Days]);

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
              Habits Tracker
            </h1>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-50 dark:bg-teal-950/60 text-[#0d8a72] dark:text-teal-300 border border-teal-200 dark:border-teal-800">
              Streak Engine
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Build compounding consistency through daily routines • Independent of XP gamification
          </p>
        </div>

        <Button
          onClick={onOpenNewHabit}
          variant="primary"
          className="flex items-center gap-2 shadow-sm"
        >
          <Plus size={16} />
          <span>New Habit</span>
        </Button>
      </div>

      {/* KPI Overview Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Active Habits
            </p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-1">
              {activeHabitsCount}
            </h3>
            <span className="text-[11px] text-slate-400">Tracked daily</span>
          </div>
          <div className="p-3 rounded-2xl bg-teal-50 dark:bg-teal-950/40 text-[#0d8a72] dark:text-teal-400">
            <Calendar size={22} />
          </div>
        </Card>

        <Card className="p-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Today's Completed
            </p>
            <h3 className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
              {completedTodayCount} / {activeHabitsCount}
            </h3>
            <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
              {todayRate}% achieved today
            </span>
          </div>
          <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 size={22} />
          </div>
        </Card>

        <Card className="p-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Longest Best Streak
            </p>
            <div className="flex items-baseline gap-1 mt-1">
              <h3 className="text-2xl font-black text-amber-500">
                {bestStreak}
              </h3>
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Days</span>
            </div>
            <span className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold">
              Peak record
            </span>
          </div>
          <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-500">
            <Flame size={22} />
          </div>
        </Card>

        <Card className="p-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Total Check-Ins
            </p>
            <h3 className="text-2xl font-black text-purple-600 dark:text-purple-400 mt-1">
              {totalCompletionsAllTime}
            </h3>
            <span className="text-[11px] text-purple-600 dark:text-purple-400 font-medium">
              Recorded sessions
            </span>
          </div>
          <div className="p-3 rounded-2xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400">
            <Trophy size={22} />
          </div>
        </Card>
      </div>

      {/* Period Analytics & Visual Chart (Week, Month, Year) */}
      <Card className="p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-teal-500/10 text-[#0d8a72] dark:text-teal-400">
              <BarChart3 size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Habit Consistency Analytics
              </h3>
              <p className="text-xs text-slate-400">
                Visualizing adherence and routines across selected timeline
              </p>
            </div>
          </div>

          {/* Period selector */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            {PERIODS.map((p) => (
              <button
                key={p.id}
                onClick={() => setPeriod(p.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  period === p.id
                    ? 'bg-white dark:bg-slate-700 text-[#0d8a72] dark:text-teal-300 shadow-xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Period Highlights Bar */}
        <div className="grid grid-cols-3 gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 text-center">
          <div>
            <span className="text-[11px] text-slate-400 uppercase font-semibold">Average Adherence</span>
            <p className="text-lg font-black text-[#0d8a72] dark:text-teal-400">{chartData.rate}%</p>
          </div>
          <div>
            <span className="text-[11px] text-slate-400 uppercase font-semibold">Period Check-ins</span>
            <p className="text-lg font-black text-slate-800 dark:text-slate-100">{chartData.totalLogs}</p>
          </div>
          <div>
            <span className="text-[11px] text-slate-400 uppercase font-semibold">
              {period === 'YEAR' ? 'Period' : '100% Days'}
            </span>
            <p className="text-lg font-black text-amber-500">
              {chartData.perfectDays} {period === 'YEAR' ? '' : 'Days'}
            </p>
          </div>
        </div>

        {/* Dynamic Consistency Chart */}
        <div className="pt-2">
          <div className="flex items-end justify-between gap-2 sm:gap-4 h-40 pt-4 px-2 border-b border-slate-100 dark:border-slate-800">
            {chartData.bars.map((bar, idx) => (
              <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group">
                <span className="text-[10px] font-bold text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
                  {bar.percent}%
                </span>
                <div className="w-full max-w-[42px] bg-slate-100 dark:bg-slate-800 rounded-t-lg h-full flex items-end overflow-hidden">
                  <div
                    className={`w-full rounded-t-lg transition-all duration-500 ${
                      bar.isToday
                        ? 'bg-gradient-to-t from-[#0d8a72] to-emerald-400 shadow-xs'
                        : 'bg-gradient-to-t from-teal-600/70 to-teal-400/80 group-hover:from-teal-600 group-hover:to-teal-400'
                    }`}
                    style={{ height: `${Math.max(bar.percent, 4)}%` }}
                  />
                </div>
                <div className="text-center mt-1">
                  <p
                    className={`text-[11px] font-bold truncate ${
                      bar.isToday
                        ? 'text-[#0d8a72] dark:text-teal-400'
                        : 'text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {bar.label}
                  </p>
                  <p className="text-[9px] text-slate-400">{bar.subLabel}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Filters and Controls */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search habits by name or purpose..."
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0d8a72] transition-colors"
          />
        </div>

        {/* Time of Day & Status Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Time filter */}
          <div className="flex items-center gap-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-1 rounded-xl">
            {TIME_FILTERS.map((tf) => (
              <button
                key={tf.id}
                onClick={() => setTimeFilter(tf.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  timeFilter === tf.id
                    ? 'bg-[#0d8a72] text-white shadow-xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                {tf.label}
              </button>
            ))}
          </div>

          {/* Status filter */}
          <div className="flex items-center gap-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-1 rounded-xl">
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                statusFilter === 'ALL'
                  ? 'bg-slate-800 text-white dark:bg-slate-700'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              All Status
            </button>
            <button
              onClick={() => setStatusFilter('PENDING')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                statusFilter === 'PENDING'
                  ? 'bg-amber-500 text-white'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              Pending Today
            </button>
            <button
              onClick={() => setStatusFilter('COMPLETED')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                statusFilter === 'COMPLETED'
                  ? 'bg-emerald-600 text-white'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              Done Today
            </button>
          </div>
        </div>
      </div>

      {/* Habit Cards Grid */}
      {filteredHabits.length === 0 ? (
        <Card className="p-12 text-center flex flex-col items-center justify-center">
          <div className="w-14 h-14 rounded-2xl bg-teal-50 dark:bg-teal-950/40 text-[#0d8a72] flex items-center justify-center mb-3">
            <Flame size={28} />
          </div>
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
            {habits.length === 0 ? 'No Habits Created Yet' : 'No Habits Match Filters'}
          </h3>
          <p className="text-xs text-slate-400 max-w-sm mt-1">
            {habits.length === 0
              ? 'Start small: pick one daily micro-routine to build unbroken momentum.'
              : 'Try clearing your search query or switching your time of day filter.'}
          </p>
          {habits.length === 0 && (
            <Button onClick={onOpenNewHabit} variant="primary" className="mt-4">
              <Plus size={16} className="mr-1.5" />
              <span>Create First Habit</span>
            </Button>
          )}
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredHabits.map((habit) => {
            const isDoneToday = (habit.completed_dates || []).includes(todayStr);
            const currentStreak = habit.current_streak || 0;
            const longestStreak = habit.longest_streak || 0;

            return (
              <Card
                key={habit.id}
                className="p-4.5 flex flex-col justify-between gap-4 border hover:border-teal-500/40 transition-all group"
              >
                {/* Header: Icon, Title, Actions */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <div
                      className="w-11 h-11 rounded-2xl flex items-center justify-center text-xl shrink-0 shadow-sm"
                      style={{
                        backgroundColor: `${habit.color || '#0d8a72'}15`,
                        border: `1px solid ${habit.color || '#0d8a72'}30`,
                      }}
                    >
                      {habit.icon || '⚡'}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 truncate">
                          {habit.title}
                        </h3>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                          {habit.time_of_day || 'ANYTIME'}
                        </span>
                      </div>
                      {habit.description && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                          {habit.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      onClick={() => onEditHabit(habit)}
                      className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
                      title="Edit Habit"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm(`Delete habit "${habit.title}"?`)) {
                          onDeleteHabit(habit.id);
                        }
                      }}
                      className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 cursor-pointer transition-colors"
                      title="Delete Habit"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Streaks & Today's Check Toggle */}
                <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800/80 gap-3">
                  {/* Streak Info */}
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5">
                      <div className={`p-1.5 rounded-xl ${currentStreak > 0 ? 'bg-amber-500/15 text-amber-500 animate-pulse' : 'bg-slate-200 dark:bg-slate-700 text-slate-400'}`}>
                        <Flame size={18} />
                      </div>
                      <div>
                        <div className="flex items-baseline gap-1">
                          <span className="text-base font-black text-slate-900 dark:text-slate-100">
                            {currentStreak}
                          </span>
                          <span className="text-[11px] font-bold text-slate-500">Days</span>
                        </div>
                        <span className="text-[9px] uppercase font-bold text-amber-600 dark:text-amber-400 block -mt-1">
                          Current Streak
                        </span>
                      </div>
                    </div>

                    <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 hidden sm:block" />

                    <div className="hidden sm:block">
                      <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                        🏆 Best: {longestStreak}d
                      </span>
                      <span className="text-[9px] text-slate-400 block">
                        {(habit.completed_dates || []).length} total
                      </span>
                    </div>
                  </div>

                  {/* Primary Toggle Checkbox Button */}
                  <button
                    type="button"
                    onClick={() => onToggleHabit(habit.id)}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs ${
                      isDoneToday
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white ring-2 ring-emerald-500/20'
                        : 'bg-white dark:bg-slate-800 hover:bg-slate-50 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    {isDoneToday ? (
                      <>
                        <CheckCircle2 size={16} className="text-white" />
                        <span>Done Today</span>
                      </>
                    ) : (
                      <>
                        <Circle size={16} className="text-slate-400" />
                        <span>Check Today</span>
                      </>
                    )}
                  </button>
                </div>

                {/* 7-Day Mini History Matrix */}
                <div className="pt-1">
                  <div className="flex items-center justify-between mb-1.5 px-0.5">
                    <span className="text-[10px] uppercase font-bold text-slate-400">
                      Last 7 Days Consistency
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Click any day to log
                    </span>
                  </div>

                  <div className="grid grid-cols-7 gap-1.5">
                    {past7Days.map((d) => {
                      const completed = (habit.completed_dates || []).includes(d.dateKey);
                      return (
                        <button
                          key={d.dateKey}
                          type="button"
                          onClick={() => onToggleHabit(habit.id, d.dateKey)}
                          title={`${d.dayShort}, ${d.dateKey}: ${completed ? 'Completed' : 'Missed'}`}
                          className={`flex flex-col items-center justify-center p-1.5 rounded-xl border text-center transition-all cursor-pointer ${
                            completed
                              ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300'
                              : d.isToday
                              ? 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-300 dark:border-amber-800/80 text-amber-700 dark:text-amber-400'
                              : 'bg-slate-50 dark:bg-slate-800/30 border-slate-100 dark:border-slate-800 text-slate-400'
                          }`}
                        >
                          <span className="text-[9px] font-bold uppercase">{d.dayName}</span>
                          <div className="my-1">
                            {completed ? (
                              <CheckCircle2 size={13} className="text-emerald-600 dark:text-emerald-400" />
                            ) : (
                              <Circle size={13} className="text-slate-300 dark:text-slate-600" />
                            )}
                          </div>
                          <span className="text-[9px] font-semibold">{d.dayNum}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};
