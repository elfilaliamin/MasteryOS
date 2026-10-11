import { useState, useEffect, useMemo } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import {
  Target,
  Plus,
  Calendar,
  CheckCircle2,
  Circle,
  Edit2,
  Trash2,
  ChevronDown,
  ChevronUp,
  Clock,
  Filter,
  Search,
  AlertCircle,
  X,
} from 'lucide-react';

const STORAGE_KEY_GOALS = 'mastery_goals_filters';

const getInitialGoalFilters = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_GOALS);
    if (saved) return JSON.parse(saved);
  } catch {
    // fallback
  }
  return {};
};

export const GoalsPage = ({
  goals = [],
  tasks = [],
  onOpenNewGoal,
  onEditGoal,
  onDeleteGoal,
  onStatusChange,
}) => {
  const [savedFilters] = useState(getInitialGoalFilters);
  const [expandedGoalId, setExpandedGoalId] = useState(null);
  const [statusFilter, setStatusFilter] = useState(savedFilters.statusFilter || 'ALL');
  const [priorityFilter, setPriorityFilter] = useState(savedFilters.priorityFilter || 'ALL');
  const [searchFilter, setSearchFilter] = useState(savedFilters.searchFilter || '');
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (statusFilter !== 'ALL') count++;
    if (priorityFilter !== 'ALL') count++;
    return count;
  }, [statusFilter, priorityFilter]);

  const hasActiveFilters = statusFilter !== 'ALL' || priorityFilter !== 'ALL';

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsMobileFilterOpen(false);
      }
    };
    if (isMobileFilterOpen) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isMobileFilterOpen]);

  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY_GOALS,
        JSON.stringify({ statusFilter, priorityFilter, searchFilter })
      );
    } catch {
      // ignore
    }
  }, [statusFilter, priorityFilter, searchFilter]);

  // Helper to calculate days until due
  const getDaysUntilDue = (dueDate, isCompleted) => {
    if (isCompleted) {
      return { text: 'Completed', color: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800' };
    }
    if (!dueDate) {
      return { text: 'No Due Date', color: 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700' };
    }

    const target = new Date(dueDate);
    const now = new Date();
    const targetDate = new Date(target.getFullYear(), target.getMonth(), target.getDate());
    const nowDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const diffTime = targetDate - nowDate;
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return {
        text: `${Math.abs(diffDays)}d overdue`,
        color: 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800 font-bold',
      };
    } else if (diffDays === 0) {
      return {
        text: 'Due today',
        color: 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-300 border-amber-200 dark:border-amber-800 font-bold',
      };
    } else if (diffDays === 1) {
      return {
        text: '1 day left',
        color: 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-300 border-amber-200 dark:border-amber-800',
      };
    } else {
      return {
        text: `${diffDays} days left`,
        color: 'bg-teal-50 dark:bg-teal-950/40 text-[#0d8a72] dark:text-teal-300 border-teal-200 dark:border-teal-800',
      };
    }
  };

  // Compute live progress metrics and status for each goal
  const enrichedGoals = goals.map((goal) => {
    const assignedTasks = tasks.filter((t) => t.goal_id === goal.id);
    const completedTasks = assignedTasks.filter((t) => t.status === 'COMPLETED');
    const totalCount = assignedTasks.length;
    const completedCount = completedTasks.length;
    const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

    // Determine goal status including "NOT_STARTED"
    let status = 'NOT_STARTED';
    if (totalCount > 0 && completedCount === totalCount) {
      status = 'COMPLETED';
    } else if (completedCount > 0) {
      status = 'IN_PROGRESS';
    }

    const isCompleted = status === 'COMPLETED';
    const effectiveDueDate = goal.due_date || goal.target_date;
    const dueInfo = getDaysUntilDue(effectiveDueDate, isCompleted);

    return {
      ...goal,
      status,
      due_date: effectiveDueDate,
      priority: goal.priority || 'MEDIUM',
      assignedTasks,
      totalCount,
      completedCount,
      progressPercent,
      isCompleted,
      dueInfo,
    };
  });

  // KPI Metrics
  const totalGoals = enrichedGoals.length;
  const notStartedGoals = enrichedGoals.filter((g) => g.status === 'NOT_STARTED').length;
  const inProgressGoals = enrichedGoals.filter((g) => g.status === 'IN_PROGRESS').length;
  const completedGoals = enrichedGoals.filter((g) => g.status === 'COMPLETED').length;

  // Filter enriched goals
  const filteredGoals = enrichedGoals.filter((g) => {
    if (statusFilter !== 'ALL' && g.status !== statusFilter) return false;
    if (priorityFilter !== 'ALL' && g.priority !== priorityFilter) return false;
    if (searchFilter.trim()) {
      const q = searchFilter.toLowerCase().trim();
      const inTitle = (g.title || '').toLowerCase().includes(q);
      const inDesc = (g.description || '').toLowerCase().includes(q);
      if (!inTitle && !inDesc) return false;
    }
    return true;
  });

  const toggleExpand = (goalId) => {
    setExpandedGoalId((prev) => (prev === goalId ? null : goalId));
  };

  return (
    <div className="flex flex-col gap-6 text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-teal-50 dark:bg-teal-950/40 text-[#0d8a72] dark:text-teal-400 border border-teal-200 dark:border-teal-800">
              <Target size={20} />
            </span>
            <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
              Strategic Goals & Milestones
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Track goals from Not Started through completion with live task tracking.
          </p>
        </div>

        <Button variant="primary" onClick={onOpenNewGoal} className="gap-1.5 shadow-md self-start sm:self-auto">
          <Plus size={16} />
          <span>New Goal</span>
        </Button>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Total Goals
            </p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-1">
              {totalGoals}
            </h3>
          </div>
          <div className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
            <Target size={22} />
          </div>
        </Card>

        <Card className="p-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Not Started
            </p>
            <h3 className="text-2xl font-black text-slate-600 dark:text-slate-300 mt-1">
              {notStartedGoals}
            </h3>
          </div>
          <div className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400">
            <Circle size={22} />
          </div>
        </Card>

        <Card className="p-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              In Progress
            </p>
            <h3 className="text-2xl font-black text-amber-500 mt-1">
              {inProgressGoals}
            </h3>
          </div>
          <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/50 text-amber-500">
            <Clock size={22} />
          </div>
        </Card>

        <Card className="p-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Completed
            </p>
            <h3 className="text-2xl font-black text-[#0d8a72] dark:text-teal-400 mt-1">
              {completedGoals}
            </h3>
          </div>
          <div className="p-3 rounded-2xl bg-teal-50 dark:bg-teal-950/50 text-[#0d8a72] dark:text-teal-300">
            <CheckCircle2 size={22} />
          </div>
        </Card>
      </div>

      {/* Search Bar - Separated Row */}
      <div className="relative w-full rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xs p-2 sm:p-2.5 flex items-center">
        <Search size={15} className="text-slate-400 dark:text-slate-500 ml-2.5 shrink-0" />
        <input
          type="text"
          value={searchFilter}
          onChange={(e) => setSearchFilter(e.target.value)}
          placeholder="Search goals by title or description..."
          className="w-full bg-transparent border-0 pl-2.5 pr-8 py-1 text-xs text-slate-700 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none"
        />
        {searchFilter && (
          <button
            type="button"
            onClick={() => setSearchFilter('')}
            className="absolute right-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer p-1"
            title="Clear search"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Desktop View: Primary Filters Card */}
      <div className="hidden md:flex items-center justify-between gap-3 p-3 sm:p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xs">
        <div className="flex items-center gap-2.5 flex-wrap flex-1 min-w-0">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-400 shrink-0 mr-0.5">
            <Filter size={15} className="text-[#0d8a72]" />
            <span>Filters:</span>
          </div>

          {/* Status Filter including "Not Started" */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className={`text-xs rounded-xl px-2.5 py-1.5 font-semibold transition-all cursor-pointer border min-w-[120px] max-w-[160px] truncate ${
              statusFilter !== 'ALL'
                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-400 dark:border-emerald-700 font-bold shadow-2xs'
                : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 focus:outline-none focus:border-[#0d8a72]'
            }`}
          >
            <option value="ALL">All Statuses</option>
            <option value="NOT_STARTED">Not Started</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="COMPLETED">Completed</option>
          </select>

          {/* Priority Filter */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className={`text-xs rounded-xl px-2.5 py-1.5 font-semibold transition-all cursor-pointer border min-w-[120px] max-w-[160px] truncate ${
              priorityFilter !== 'ALL'
                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-400 dark:border-emerald-700 font-bold shadow-2xs'
                : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 focus:outline-none focus:border-[#0d8a72]'
            }`}
          >
            <option value="ALL">All Priorities</option>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="URGENT">Urgent</option>
          </select>

          {/* Clear Filters Button */}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={() => {
                setStatusFilter('ALL');
                setPriorityFilter('ALL');
              }}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 hover:bg-rose-100 dark:hover:bg-rose-900/50 transition-all cursor-pointer shrink-0"
              title="Reset filters"
            >
              <X size={13} />
              <span>Clear filters</span>
            </button>
          )}
        </div>

        <div className="text-xs text-slate-500 dark:text-slate-400 font-semibold shrink-0">
          Showing {filteredGoals.length} of {totalGoals} goals
        </div>
      </div>

      {/* Mobile View: Compact Filters Bar */}
      <div className="flex md:hidden items-center justify-between gap-2 p-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xs">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsMobileFilterOpen(true)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
              hasActiveFilters
                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-400 dark:border-emerald-700 shadow-2xs'
                : 'bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
            aria-label="Open filter popup"
          >
            <Filter size={15} className={hasActiveFilters ? 'text-[#0d8a72] dark:text-emerald-400' : 'text-slate-500'} />
            <span>Filters</span>
            {activeFiltersCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-[#0d8a72] text-white text-[10px] font-bold">
                {activeFiltersCount}
              </span>
            )}
          </button>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={() => {
                setStatusFilter('ALL');
                setPriorityFilter('ALL');
              }}
              className="p-1.5 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-transparent hover:border-rose-200 dark:hover:border-rose-900 transition-all cursor-pointer"
              title="Clear all filters"
            >
              <X size={15} />
            </button>
          )}
        </div>

        <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 pr-1">
          {filteredGoals.length} {filteredGoals.length === 1 ? 'goal' : 'goals'}
        </div>
      </div>

      {/* Mobile Modal: Filter Popup */}
      {isMobileFilterOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-150"
          onClick={() => setIsMobileFilterOpen(false)}
        >
          <div
            className="bg-white dark:bg-slate-900 w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col max-h-[85vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-[#0d8a72] dark:text-emerald-400">
                  <Filter size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Filter Goals</h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">Refine by status and priority</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsMobileFilterOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Form Fields */}
            <div className="p-5 space-y-4 overflow-y-auto">
              {/* Status */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Status
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full text-xs rounded-xl p-2.5 font-semibold bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#0d8a72]"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="NOT_STARTED">Not Started</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="COMPLETED">Completed</option>
                </select>
              </div>

              {/* Priority */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Priority
                </label>
                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  className="w-full text-xs rounded-xl p-2.5 font-semibold bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#0d8a72]"
                >
                  <option value="ALL">All Priorities</option>
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="URGENT">Urgent</option>
                </select>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-5 py-3.5 bg-slate-50/80 dark:bg-slate-950/80 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setStatusFilter('ALL');
                  setPriorityFilter('ALL');
                }}
                disabled={!hasActiveFilters}
                className="text-xs font-bold text-rose-600 dark:text-rose-400 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                Reset All
              </button>
              <button
                type="button"
                onClick={() => setIsMobileFilterOpen(false)}
                className="px-4 py-2 rounded-xl bg-[#0d8a72] hover:bg-[#0b735f] text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                Done ({filteredGoals.length} goals)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Single-Line Goals List View */}
      {filteredGoals.length === 0 ? (
        <Card className="p-12 text-center flex flex-col items-center justify-center">
          <div className="p-4 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 mb-3">
            <Target size={36} />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
            {goals.length === 0 ? 'No goals defined yet' : 'No goals match the filter criteria'}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mt-1">
            {goals.length === 0
              ? 'Create a strategic goal, choose an icon, set due dates & priority, and link tasks.'
              : 'Try clearing your filters or search term to see all goals.'}
          </p>
          {goals.length === 0 && (
            <Button variant="primary" onClick={onOpenNewGoal} className="mt-4 gap-1.5">
              <Plus size={16} />
              <span>Create First Goal</span>
            </Button>
          )}
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {filteredGoals.map((goal) => {
            const isExpanded = expandedGoalId === goal.id;

            return (
              <div
                key={goal.id}
                className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 hover:border-[#0d8a72]/40 dark:hover:border-teal-500/40 rounded-2xl shadow-xs transition-all duration-200 overflow-hidden"
              >
                {/* Single Line Header Row */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between p-4 gap-4">
                  {/* Left: Icon, Title, Status & Priority */}
                  <div className="flex items-center gap-3.5 min-w-[260px] flex-1">
                    <div
                      className="w-11 h-11 rounded-2xl flex items-center justify-center text-xl shrink-0 shadow-xs border"
                      style={{
                        backgroundColor: `${goal.color || '#0d8a72'}15`,
                        borderColor: `${goal.color || '#0d8a72'}30`,
                      }}
                    >
                      {goal.icon || '🎯'}
                    </div>

                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                          {goal.title}
                        </h4>

                        {/* Status Badge */}
                        <span
                          className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${
                            goal.status === 'COMPLETED'
                              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
                              : goal.status === 'IN_PROGRESS'
                              ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                          }`}
                        >
                          {goal.status === 'COMPLETED'
                            ? 'Completed'
                            : goal.status === 'IN_PROGRESS'
                            ? 'In Progress'
                            : 'Not Started'}
                        </span>

                        <Badge variant={goal.priority} size="xs">
                          {goal.priority}
                        </Badge>
                      </div>
                      {goal.description && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-md mt-0.5">
                          {goal.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Middle: Due Date & Days Until Due */}
                  <div className="flex items-center gap-3 shrink-0">
                    {goal.due_date ? (
                      <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300 font-medium">
                        <Calendar size={13} className="text-slate-400" />
                        <span>
                          {new Date(goal.due_date).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <Calendar size={13} />
                        <span>No due date</span>
                      </span>
                    )}

                    <span
                      className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${goal.dueInfo.color}`}
                    >
                      {goal.dueInfo.text}
                    </span>
                  </div>

                  {/* Right: Progress Bar & Task Count */}
                  <div className="flex items-center gap-3 shrink-0 min-w-[200px] lg:max-w-xs flex-1">
                    <div className="flex-1">
                      <div className="flex items-center justify-between text-[11px] font-bold mb-1">
                        <span className="text-slate-500 dark:text-slate-400">
                          {goal.completedCount}/{goal.totalCount} tasks
                        </span>
                        <span
                          className="font-black"
                          style={{ color: goal.color || '#0d8a72' }}
                        >
                          {goal.progressPercent}%
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${goal.progressPercent}%`,
                            backgroundColor: goal.color || '#0d8a72',
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Far Right: Actions */}
                  <div className="flex items-center justify-end gap-1.5 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100 dark:border-slate-800">
                    <button
                      onClick={() => toggleExpand(goal.id)}
                      className={`px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                        isExpanded
                          ? 'bg-teal-50 dark:bg-teal-950/40 text-[#0d8a72] dark:text-teal-300'
                          : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                      title={isExpanded ? 'Hide tasks' : 'Show assigned tasks'}
                    >
                      <span>Tasks ({goal.totalCount})</span>
                      {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>

                    <button
                      onClick={() => onEditGoal(goal)}
                      className="p-1.5 text-slate-400 hover:text-[#0d8a72] dark:hover:text-teal-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                      title="Edit Goal"
                    >
                      <Edit2 size={14} />
                    </button>

                    <button
                      onClick={() => onDeleteGoal(goal.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                      title="Delete Goal"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Expandable Assigned Tasks Drawer - Displayed in Separate Lines */}
                {isExpanded && (
                  <div className="border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/60 dark:bg-slate-950/40 p-4 transition-all">
                    <div className="flex items-center justify-between mb-3">
                      <h5 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                        Assigned Tasks ({goal.totalCount})
                      </h5>
                      <span className="text-xs text-slate-400">
                        Toggle checkbox to update status and advance goal completion
                      </span>
                    </div>

                    {goal.assignedTasks.length === 0 ? (
                      <div className="text-center py-6 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                        <AlertCircle size={20} className="mx-auto text-slate-400 mb-1" />
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          No tasks have been assigned to this goal yet.
                        </p>
                        <button
                          onClick={() => onEditGoal(goal)}
                          className="mt-2 text-xs font-bold text-[#0d8a72] dark:text-teal-400 hover:underline cursor-pointer"
                        >
                          + Assign tasks now
                        </button>
                      </div>
                    ) : (
                      /* Display tasks in separate full-width lines */
                      <div className="flex flex-col gap-2">
                        {goal.assignedTasks.map((task) => {
                          const isDone = task.status === 'COMPLETED';

                          return (
                            <div
                              key={task.id}
                              className={`flex items-center justify-between p-3 rounded-xl border text-xs transition-colors bg-white dark:bg-slate-900 w-full ${
                                isDone
                                  ? 'border-emerald-200 dark:border-emerald-900/40 bg-emerald-50/20'
                                  : 'border-slate-200/80 dark:border-slate-800 hover:border-slate-300'
                              }`}
                            >
                              <div className="flex items-center gap-3 truncate flex-1 min-w-0">
                                <button
                                  type="button"
                                  onClick={() =>
                                    onStatusChange(
                                      task.id,
                                      isDone ? 'TODO' : 'COMPLETED'
                                    )
                                  }
                                  className="text-slate-400 hover:text-[#0d8a72] dark:hover:text-teal-400 cursor-pointer shrink-0"
                                >
                                  {isDone ? (
                                    <CheckCircle2 size={17} className="text-emerald-500" />
                                  ) : (
                                    <Circle size={17} />
                                  )}
                                </button>

                                <span
                                  className={`truncate font-semibold text-xs ${
                                    isDone
                                      ? 'line-through text-slate-400 dark:text-slate-500'
                                      : 'text-slate-800 dark:text-slate-200'
                                  }`}
                                >
                                  {task.title}
                                </span>
                              </div>

                              <div className="flex items-center gap-3 shrink-0">
                                <Badge variant={task.priority} size="xs">
                                  {task.priority}
                                </Badge>
                                {task.due_date && (
                                  <span className="text-[11px] text-slate-400 font-medium">
                                    Due {new Date(task.due_date).toLocaleDateString(undefined, {
                                      month: 'short',
                                      day: 'numeric',
                                    })}
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
