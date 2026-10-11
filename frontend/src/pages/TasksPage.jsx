import { useState, useEffect, useMemo, Fragment } from 'react';
import { createPortal } from 'react-dom';
import { TaskCard } from '../components/tasks/TaskCard';
import { Button } from '../components/ui/Button';
import {
  LayoutGrid,
  List,
  Filter,
  Plus,
  ArrowUpDown,
  Layers,
  Eye,
  EyeOff,
  X,
  Search,
} from 'lucide-react';

const PRIORITY_WEIGHTS = { URGENT: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
const STATUS_ORDER = { TODO: 1, IN_PROGRESS: 2, IN_REVIEW: 3, COMPLETED: 4 };
const STORAGE_KEY_TASKS = 'mastery_tasks_preferences';
const PAGE_SIZE = 50;

const getInitialTaskPrefs = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_TASKS);
    if (saved) return JSON.parse(saved);
  } catch {
    // fallback
  }
  return {};
};

const isCompletedToday = (dateStr) => {
  if (!dateStr) return true;
  const d = new Date(dateStr);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
};

export const TasksPage = ({
  tasks = [],
  categories = [],
  goals = [],
  courses = [],
  onOpenNewTask,
  onEditTask,
  onDeleteTask,
  onStatusChange,
  searchQuery: externalSearchQuery = '',
}) => {
  const [savedPrefs] = useState(getInitialTaskPrefs);
  const [prevExternalSearchQuery, setPrevExternalSearchQuery] = useState(externalSearchQuery);
  const [searchQuery, setSearchQuery] = useState(externalSearchQuery || '');

  if (externalSearchQuery !== prevExternalSearchQuery) {
    setPrevExternalSearchQuery(externalSearchQuery);
    setSearchQuery(externalSearchQuery || '');
  }

  const [viewMode, setViewMode] = useState(savedPrefs.viewMode || 'kanban'); // 'kanban' or 'list'
  const [statusFilter, setStatusFilter] = useState(savedPrefs.statusFilter || 'ALL');
  const [priorityFilter, setPriorityFilter] = useState(savedPrefs.priorityFilter || 'ALL');
  const [categoryFilter, setCategoryFilter] = useState(savedPrefs.categoryFilter || 'ALL');
  const [goalFilter, setGoalFilter] = useState(savedPrefs.goalFilter || 'ALL');
  const [courseFilter, setCourseFilter] = useState(savedPrefs.courseFilter || 'ALL');
  const [sortBy, setSortBy] = useState(savedPrefs.sortBy || 'default');
  const [groupBy, setGroupBy] = useState(savedPrefs.groupBy || 'none');
  const [hideCompleted, setHideCompleted] = useState(() => {
    if (savedPrefs.hideCompleted !== undefined) return savedPrefs.hideCompleted;
    return savedPrefs.viewMode === 'list' || !savedPrefs.viewMode;
  });
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [boardColLimits, setBoardColLimits] = useState({});
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [isMobileSortOpen, setIsMobileSortOpen] = useState(false);

  const handleViewModeChange = (mode) => {
    setViewMode(mode);
    if (mode === 'list' && savedPrefs.hideCompleted === undefined) {
      setHideCompleted(true);
    }
  };

  // Derive effective filter values during render to avoid cascading renders and orphaned states
  const effectiveCategoryFilter =
    categoryFilter !== 'ALL' && categories.length > 0 && !categories.some((c) => String(c.id) === String(categoryFilter))
      ? 'ALL'
      : categoryFilter;

  const effectiveGoalFilter =
    goalFilter !== 'ALL' && goals.length > 0 && !goals.some((g) => String(g.id) === String(goalFilter))
      ? 'ALL'
      : goalFilter;

  const effectiveCourseFilter =
    courseFilter !== 'ALL' && courses.length > 0 && !courses.some((cr) => String(cr.id) === String(courseFilter))
      ? 'ALL'
      : courseFilter;

  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY_TASKS,
        JSON.stringify({
          viewMode,
          statusFilter,
          priorityFilter,
          categoryFilter: effectiveCategoryFilter,
          goalFilter: effectiveGoalFilter,
          courseFilter: effectiveCourseFilter,
          sortBy,
          groupBy,
          hideCompleted,
        })
      );
    } catch {
      // ignore
    }
  }, [viewMode, statusFilter, priorityFilter, effectiveCategoryFilter, effectiveGoalFilter, effectiveCourseFilter, sortBy, groupBy, hideCompleted]);

  const hasActiveFilters =
    statusFilter !== 'ALL' ||
    priorityFilter !== 'ALL' ||
    effectiveCategoryFilter !== 'ALL' ||
    effectiveGoalFilter !== 'ALL' ||
    effectiveCourseFilter !== 'ALL';

  const isAnyFilterActive = hasActiveFilters || Boolean(searchQuery) || (viewMode === 'list' && hideCompleted);

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (statusFilter !== 'ALL') count++;
    if (priorityFilter !== 'ALL') count++;
    if (effectiveCategoryFilter !== 'ALL') count++;
    if (effectiveGoalFilter !== 'ALL') count++;
    if (effectiveCourseFilter !== 'ALL') count++;
    if (viewMode === 'list' && hideCompleted) count++;
    return count;
  }, [statusFilter, priorityFilter, effectiveCategoryFilter, effectiveGoalFilter, effectiveCourseFilter, viewMode, hideCompleted]);

  const handleClearFilters = () => {
    setStatusFilter('ALL');
    setPriorityFilter('ALL');
    setCategoryFilter('ALL');
    setGoalFilter('ALL');
    setCourseFilter('ALL');
    setSearchQuery('');
    if (viewMode === 'list') {
      setHideCompleted(false);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsMobileFilterOpen(false);
        setIsMobileSortOpen(false);
      }
    };
    if (isMobileFilterOpen || isMobileSortOpen) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isMobileFilterOpen, isMobileSortOpen]);

  useEffect(() => {
    if (isMobileFilterOpen || isMobileSortOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isMobileFilterOpen, isMobileSortOpen]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsMobileFilterOpen(false);
        setIsMobileSortOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Reset pagination when any filter changes
  const [prevFilterKey, setPrevFilterKey] = useState('');
  const currentFilterKey = `${statusFilter}_${priorityFilter}_${effectiveCategoryFilter}_${effectiveGoalFilter}_${effectiveCourseFilter}_${searchQuery || ''}_${hideCompleted}`;
  if (currentFilterKey !== prevFilterKey) {
    setPrevFilterKey(currentFilterKey);
    setVisibleCount(PAGE_SIZE);
  }

  // Hiding completed tasks applies in List view only (unless explicitly chosen in the status filter)
  const isHidingCompleted = viewMode === 'list' && hideCompleted && statusFilter !== 'COMPLETED';

  // Filter tasks
  const filteredTasks = tasks.filter((t) => {
    if (isHidingCompleted && t.status === 'COMPLETED') return false;
    if (statusFilter !== 'ALL' && t.status !== statusFilter) return false;
    if (priorityFilter !== 'ALL' && t.priority !== priorityFilter) return false;
    if (effectiveCategoryFilter !== 'ALL' && String(t.category_id) !== String(effectiveCategoryFilter)) return false;
    if (effectiveGoalFilter !== 'ALL' && String(t.goal_id) !== String(effectiveGoalFilter)) return false;
    if (effectiveCourseFilter !== 'ALL' && String(t.course_id) !== String(effectiveCourseFilter)) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const inTitle = (t.title || '').toLowerCase().includes(q);
      const inDesc = (t.description || '').toLowerCase().includes(q);
      if (!inTitle && !inDesc) return false;
    }
    return true;
  });

  // Sort and group tasks for List view with pagination support
  const groupedData = useMemo(() => {
    const sorted = [...filteredTasks].sort((a, b) => {
      if (sortBy === 'due_date') {
        if (!a.due_date && !b.due_date) return 0;
        if (!a.due_date) return 1;
        if (!b.due_date) return -1;
        return new Date(a.due_date) - new Date(b.due_date);
      }
      if (sortBy === 'priority') {
        return (PRIORITY_WEIGHTS[b.priority] || 0) - (PRIORITY_WEIGHTS[a.priority] || 0);
      }
      if (sortBy === 'title') {
        return (a.title || '').localeCompare(b.title || '');
      }
      if (sortBy === 'status') {
        return (STATUS_ORDER[a.status] || 0) - (STATUS_ORDER[b.status] || 0);
      }
      return 0;
    });

    const paginated = sorted.slice(0, visibleCount);

    if (groupBy === 'none') {
      return [{ key: 'all', title: null, tasks: paginated }];
    }

    const map = {};
    paginated.forEach((task) => {
      let key = 'other';
      let title = 'Other';

      if (groupBy === 'status') {
        key = task.status;
        title = task.status.replace('_', ' ');
      } else if (groupBy === 'priority') {
        key = task.priority;
        title = `${task.priority} Priority`;
      } else if (groupBy === 'category') {
        key = task.category_id || 'none';
        title = task.category_name || 'No Category';
      } else if (groupBy === 'goal') {
        key = task.goal_id || 'none';
        const g = goals.find((item) => item.id === task.goal_id);
        title = g ? `${g.icon || '🎯'} ${g.title}` : 'No Goal';
      } else if (groupBy === 'course') {
        key = task.course_id || 'none';
        const c = courses.find((item) => item.id === task.course_id);
        title = c ? `📚 ${c.title}` : 'No Course';
      }

      if (!map[key]) {
        map[key] = { key, title, tasks: [] };
      }
      map[key].tasks.push(task);
    });

    return Object.values(map);
  }, [filteredTasks, visibleCount, sortBy, groupBy, goals, courses]);

  const [draggedTaskId, setDraggedTaskId] = useState(null);
  const [dragOverColumn, setDragOverColumn] = useState(null);

  const handleDragOver = (e, columnId) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverColumn !== columnId) {
      setDragOverColumn(columnId);
    }
  };

  const handleDragLeave = (e, columnId) => {
    if (e.currentTarget.contains(e.relatedTarget)) return;
    if (dragOverColumn === columnId) {
      setDragOverColumn(null);
    }
  };

  const handleDrop = (e, columnId) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain') || draggedTaskId;
    setDragOverColumn(null);
    setDraggedTaskId(null);

    if (taskId && onStatusChange) {
      const task = tasks.find((t) => t.id === taskId);
      if (task && task.status !== columnId) {
        onStatusChange(taskId, columnId);
      }
    }
  };

  const columns = [
    { id: 'TODO', label: 'To Do', color: 'border-slate-300 dark:border-slate-700' },
    { id: 'IN_PROGRESS', label: 'In Progress', color: 'border-amber-400 dark:border-amber-500/40' },
    { id: 'IN_REVIEW', label: 'In Review', color: 'border-sky-400 dark:border-sky-500/40' },
    { id: 'COMPLETED', label: 'Completed', color: 'border-[#0d8a72] dark:border-emerald-500/40' },
  ];

  return (
    <div className="flex flex-col gap-6 text-left">
      {/* Top Controls Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">Tasks Tracker</h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Organize, prioritize, and level up as you complete tasks.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* View Toggle */}
          <div className="flex items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-1 shadow-2xs">
            <button
              onClick={() => handleViewModeChange('kanban')}
              className={`p-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'kanban'
                  ? 'bg-[#0d8a72] text-white shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
              title="Kanban Board View"
            >
              <LayoutGrid size={15} />
              <span className="hidden sm:inline">Board</span>
            </button>
            <button
              onClick={() => handleViewModeChange('list')}
              className={`p-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'list'
                  ? 'bg-[#0d8a72] text-white shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
              title="List View"
            >
              <List size={15} />
              <span className="hidden sm:inline">List</span>
            </button>
          </div>

          <Button variant="primary" onClick={onOpenNewTask} className="gap-1.5">
            <Plus size={16} />
            <span>Create Task</span>
          </Button>
        </div>
      </div>

      {/* Search Bar - Separated Row */}
      <div className="relative w-full rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xs p-2 sm:p-2.5 flex items-center">
        <Search size={15} className="text-slate-400 dark:text-slate-500 ml-2.5 shrink-0" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search tasks by title or description..."
          className="w-full bg-transparent border-0 pl-2.5 pr-8 py-1 text-xs text-slate-700 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className="absolute right-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer p-1"
            title="Clear search"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Desktop View: Primary Filters Card */}
      <div className="hidden md:flex flex-wrap items-center justify-between gap-3 p-3 sm:p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xs">
        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 flex-1 min-w-0">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-400 shrink-0 mr-0.5">
            <Filter size={15} className="text-[#0d8a72]" />
            <span>Filters:</span>
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className={`text-xs rounded-xl px-2.5 py-1.5 font-semibold transition-all cursor-pointer border flex-1 sm:flex-initial min-w-[115px] max-w-[155px] truncate ${
              statusFilter !== 'ALL'
                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-400 dark:border-emerald-700 font-bold shadow-2xs'
                : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 focus:outline-none focus:border-[#0d8a72]'
            }`}
          >
            <option value="ALL">All Statuses</option>
            <option value="TODO">To Do</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="IN_REVIEW">In Review</option>
            <option value="COMPLETED">Completed</option>
          </select>

          {/* Priority Filter */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className={`text-xs rounded-xl px-2.5 py-1.5 font-semibold transition-all cursor-pointer border flex-1 sm:flex-initial min-w-[115px] max-w-[155px] truncate ${
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

          {/* Category Filter */}
          <select
            value={effectiveCategoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className={`text-xs rounded-xl px-2.5 py-1.5 font-semibold transition-all cursor-pointer border flex-1 sm:flex-initial min-w-[120px] max-w-[165px] truncate ${
              effectiveCategoryFilter !== 'ALL'
                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-400 dark:border-emerald-700 font-bold shadow-2xs'
                : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 focus:outline-none focus:border-[#0d8a72]'
            }`}
          >
            <option value="ALL">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Goal Filter */}
          {goals.length > 0 && (
            <select
              value={effectiveGoalFilter}
              onChange={(e) => setGoalFilter(e.target.value)}
              className={`text-xs rounded-xl px-2.5 py-1.5 font-semibold transition-all cursor-pointer border flex-1 sm:flex-initial min-w-[120px] max-w-[165px] truncate ${
                effectiveGoalFilter !== 'ALL'
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-400 dark:border-emerald-700 font-bold shadow-2xs'
                  : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 focus:outline-none focus:border-[#0d8a72]'
              }`}
            >
              <option value="ALL">All Goals</option>
              {goals.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.icon || '🎯'} {g.title}
                </option>
              ))}
            </select>
          )}

          {/* Course Filter */}
          {courses.length > 0 && (
            <select
              value={effectiveCourseFilter}
              onChange={(e) => setCourseFilter(e.target.value)}
              className={`text-xs rounded-xl px-2.5 py-1.5 font-semibold transition-all cursor-pointer border flex-1 sm:flex-initial min-w-[120px] max-w-[165px] truncate ${
                effectiveCourseFilter !== 'ALL'
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-400 dark:border-emerald-700 font-bold shadow-2xs'
                  : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 focus:outline-none focus:border-[#0d8a72]'
              }`}
            >
              <option value="ALL">All Courses</option>
              {courses.map((cr) => (
                <option key={cr.id} value={cr.id}>
                  📚 {cr.title}
                </option>
              ))}
            </select>
          )}

          {/* Completed Hidden / Hide Completed Button in Filters */}
          {viewMode === 'list' && (
            <button
              type="button"
              onClick={() => setHideCompleted((prev) => !prev)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border shrink-0 ${
                isHidingCompleted
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-400 dark:border-emerald-700 shadow-2xs'
                  : 'bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:text-slate-900 dark:hover:text-slate-200 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
              title={isHidingCompleted ? 'Completed tasks are currently hidden. Click to show.' : 'Click to hide completed tasks'}
            >
              {isHidingCompleted ? (
                <EyeOff size={14} className="text-emerald-600 dark:text-emerald-400" />
              ) : (
                <Eye size={14} />
              )}
              <span>{isHidingCompleted ? 'Completed Hidden' : 'Hide Completed'}</span>
            </button>
          )}

          {/* Clear Filters Button */}
          {isAnyFilterActive && (
            <button
              type="button"
              onClick={handleClearFilters}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 hover:bg-rose-100 dark:hover:bg-rose-900/50 transition-all cursor-pointer shrink-0"
              title="Reset all filters"
            >
              <X size={13} />
              <span>Clear filters</span>
            </button>
          )}
        </div>

        {/* Drag and Drop Quick Hint for Board */}
        {viewMode === 'kanban' && (
          <div className="hidden xl:flex items-center gap-1.5 ml-auto text-[11px] font-semibold text-slate-400 dark:text-slate-500 shrink-0">
            <span className="text-[#0d8a72] dark:text-teal-400">💡</span>
            <span>Drag & drop cards across columns to change status</span>
          </div>
        )}

        {/* List View Count info */}
        {viewMode === 'list' && (
          <div className="hidden xl:flex items-center text-xs font-semibold text-slate-500 dark:text-slate-400 ml-auto shrink-0">
            Showing {filteredTasks.length} {filteredTasks.length === 1 ? 'task' : 'tasks'}
          </div>
        )}
      </div>

      {/* Desktop View: Dedicated Sorting and Grouping Row (List View only) */}
      {viewMode === 'list' && (
        <div className="hidden md:flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center gap-3.5 flex-wrap">
            {/* Sort by */}
            <div className="flex items-center gap-1.5 text-xs">
              <ArrowUpDown size={14} className="text-[#0d8a72] dark:text-teal-400 shrink-0" />
              <span className="font-bold text-slate-600 dark:text-slate-400 shrink-0">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className={`border rounded-xl px-2.5 py-1.5 text-xs font-semibold focus:outline-none transition-all cursor-pointer ${
                  sortBy !== 'default'
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-400 dark:border-emerald-700 font-bold shadow-2xs'
                    : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 focus:border-[#0d8a72]'
                }`}
              >
                <option value="default">Default</option>
                <option value="due_date">Due Date</option>
                <option value="priority">Priority</option>
                <option value="title">Title (A-Z)</option>
                <option value="status">Status</option>
              </select>
            </div>

            {/* Group by */}
            <div className="flex items-center gap-1.5 text-xs">
              <Layers size={14} className="text-[#0d8a72] dark:text-teal-400 shrink-0" />
              <span className="font-bold text-slate-600 dark:text-slate-400 shrink-0">Group:</span>
              <select
                value={groupBy}
                onChange={(e) => setGroupBy(e.target.value)}
                className={`border rounded-xl px-2.5 py-1.5 text-xs font-semibold focus:outline-none transition-all cursor-pointer ${
                  groupBy !== 'none'
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-400 dark:border-emerald-700 font-bold shadow-2xs'
                    : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 focus:border-[#0d8a72]'
                }`}
              >
                <option value="none">None</option>
                <option value="status">By Status</option>
                <option value="priority">By Priority</option>
                <option value="category">By Category</option>
                <option value="goal">By Goal</option>
                <option value="course">By Course</option>
              </select>
            </div>

            {(sortBy !== 'default' || groupBy !== 'none') && (
              <button
                type="button"
                onClick={() => {
                  setSortBy('default');
                  setGroupBy('none');
                }}
                className="text-xs font-semibold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors cursor-pointer"
              >
                Reset sorting
              </button>
            )}
          </div>

          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 shrink-0">
            {isHidingCompleted && (
              <span className="text-emerald-600 dark:text-emerald-400 mr-2 font-medium">
                • Completed hidden
              </span>
            )}
            <span>Showing {Math.min(visibleCount, filteredTasks.length)} of {filteredTasks.length} tasks</span>
          </div>
        </div>
      )}

      {/* Mobile View: Compact Filters & Sorting Icon Bar */}
      <div className="flex md:hidden items-center justify-between gap-2 p-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xs">
        <div className="flex items-center gap-2">
          {/* Filter Icon Button */}
          <button
            type="button"
            onClick={() => setIsMobileFilterOpen(true)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
              isAnyFilterActive
                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-400 dark:border-emerald-700 shadow-2xs'
                : 'bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
            aria-label="Open filter popup"
          >
            <Filter size={15} className={isAnyFilterActive ? 'text-[#0d8a72] dark:text-emerald-400' : 'text-slate-500'} />
            <span>Filters</span>
            {activeFiltersCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-[#0d8a72] text-white text-[10px] font-bold">
                {activeFiltersCount}
              </span>
            )}
          </button>

          {/* Sorting Icon Button (List View only) */}
          {viewMode === 'list' && (
            <button
              type="button"
              onClick={() => setIsMobileSortOpen(true)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                sortBy !== 'default' || groupBy !== 'none'
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-400 dark:border-emerald-700 shadow-2xs'
                  : 'bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
              aria-label="Open sorting popup"
            >
              <ArrowUpDown size={15} className={sortBy !== 'default' || groupBy !== 'none' ? 'text-[#0d8a72] dark:text-emerald-400' : 'text-slate-500'} />
              <span>Sort</span>
              {(sortBy !== 'default' || groupBy !== 'none') && (
                <span className="w-1.5 h-1.5 rounded-full bg-[#0d8a72]" />
              )}
            </button>
          )}

          {/* Reset All Filters if Active */}
          {isAnyFilterActive && (
            <button
              type="button"
              onClick={handleClearFilters}
              className="p-1.5 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-transparent hover:border-rose-200 dark:hover:border-rose-900 transition-all cursor-pointer"
              title="Clear all filters"
            >
              <X size={15} />
            </button>
          )}
        </div>

        <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 pr-1">
          {filteredTasks.length} {filteredTasks.length === 1 ? 'task' : 'tasks'}
        </div>
      </div>

      {/* Mobile Modal: Filter Popup */}
      {isMobileFilterOpen &&
        createPortal(
          <div
            className="fixed inset-0 z-[100] bg-slate-950/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in"
            onClick={() => setIsMobileFilterOpen(false)}
          >
            <div
              className="bg-white dark:bg-slate-900 w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col max-h-[85vh] overflow-hidden relative z-10"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-[#0d8a72] dark:text-emerald-400">
                    <Filter size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Task Filters</h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">Filter by status, priority, category & more</p>
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
                    className="w-full text-xs rounded-xl p-2.5 font-semibold bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#0d8a72] cursor-pointer"
                  >
                    <option value="ALL">All Statuses</option>
                    <option value="TODO">To Do</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="IN_REVIEW">In Review</option>
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
                    className="w-full text-xs rounded-xl p-2.5 font-semibold bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#0d8a72] cursor-pointer"
                  >
                    <option value="ALL">All Priorities</option>
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>

                {/* Category */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Category
                  </label>
                  <select
                    value={effectiveCategoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="w-full text-xs rounded-xl p-2.5 font-semibold bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#0d8a72] cursor-pointer"
                  >
                    <option value="ALL">All Categories</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Goal */}
                {goals.length > 0 && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      Goal
                    </label>
                    <select
                      value={effectiveGoalFilter}
                      onChange={(e) => setGoalFilter(e.target.value)}
                      className="w-full text-xs rounded-xl p-2.5 font-semibold bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#0d8a72] cursor-pointer"
                    >
                      <option value="ALL">All Goals</option>
                      {goals.map((g) => (
                        <option key={g.id} value={g.id}>
                          {g.icon || '🎯'} {g.title}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Course */}
                {courses.length > 0 && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      Course
                    </label>
                    <select
                      value={effectiveCourseFilter}
                      onChange={(e) => setCourseFilter(e.target.value)}
                      className="w-full text-xs rounded-xl p-2.5 font-semibold bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#0d8a72] cursor-pointer"
                    >
                      <option value="ALL">All Courses</option>
                      {courses.map((cr) => (
                        <option key={cr.id} value={cr.id}>
                          📚 {cr.title}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Hide Completed Toggle (List View) */}
                {viewMode === 'list' && (
                  <div className="pt-2 border-t border-slate-200/80 dark:border-slate-800">
                    <label className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 cursor-pointer">
                      <div className="flex items-center gap-2.5">
                        {isHidingCompleted ? (
                          <EyeOff size={16} className="text-emerald-600 dark:text-emerald-400" />
                        ) : (
                          <Eye size={16} className="text-slate-500" />
                        )}
                        <div>
                          <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                            Hide Completed Tasks
                          </div>
                          <div className="text-[11px] text-slate-400">
                            Exclude completed tasks from the list
                          </div>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={hideCompleted}
                        onChange={(e) => setHideCompleted(e.target.checked)}
                        className="w-4 h-4 text-[#0d8a72] rounded focus:ring-[#0d8a72] cursor-pointer"
                      />
                    </label>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between px-5 py-3.5 bg-slate-50/80 dark:bg-slate-950/80 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={handleClearFilters}
                  disabled={!isAnyFilterActive}
                  className="text-xs font-bold text-rose-600 dark:text-rose-400 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  Reset All
                </button>
                <button
                  type="button"
                  onClick={() => setIsMobileFilterOpen(false)}
                  className="px-4 py-2 rounded-xl bg-[#0d8a72] hover:bg-[#0b735f] text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                >
                  Done ({filteredTasks.length} tasks)
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* Mobile Modal: Sorting & Grouping Popup */}
      {isMobileSortOpen &&
        createPortal(
          <div
            className="fixed inset-0 z-[100] bg-slate-950/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in"
            onClick={() => setIsMobileSortOpen(false)}
          >
            <div
              className="bg-white dark:bg-slate-900 w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col max-h-[85vh] overflow-hidden relative z-10"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-[#0d8a72] dark:text-emerald-400">
                    <ArrowUpDown size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Sort & Group</h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">Organize tasks in list view</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsMobileSortOpen(false)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Form Fields */}
              <div className="p-5 space-y-4 overflow-y-auto">
                {/* Sort by */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Sort Tasks By
                  </label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full text-xs rounded-xl p-2.5 font-semibold bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#0d8a72] cursor-pointer"
                  >
                    <option value="default">Default</option>
                    <option value="due_date">Due Date</option>
                    <option value="priority">Priority</option>
                    <option value="title">Title (A-Z)</option>
                    <option value="status">Status</option>
                  </select>
                </div>

                {/* Group by */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Group Tasks By
                  </label>
                  <select
                    value={groupBy}
                    onChange={(e) => setGroupBy(e.target.value)}
                    className="w-full text-xs rounded-xl p-2.5 font-semibold bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#0d8a72] cursor-pointer"
                  >
                    <option value="none">None</option>
                    <option value="status">By Status</option>
                    <option value="priority">By Priority</option>
                    <option value="category">By Category</option>
                    <option value="goal">By Goal</option>
                    <option value="course">By Course</option>
                  </select>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between px-5 py-3.5 bg-slate-50/80 dark:bg-slate-950/80 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setSortBy('default');
                    setGroupBy('none');
                  }}
                  disabled={sortBy === 'default' && groupBy === 'none'}
                  className="text-xs font-bold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  Reset to Default
                </button>
                <button
                  type="button"
                  onClick={() => setIsMobileSortOpen(false)}
                  className="px-4 py-2 rounded-xl bg-[#0d8a72] hover:bg-[#0b735f] text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                >
                  Done
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* Kanban Board View */}
      {viewMode === 'kanban' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
          {columns.map((column) => {
            const colTasks = filteredTasks.filter((t) => {
              if (t.status !== column.id) return false;
              if (column.id === 'COMPLETED') {
                return isCompletedToday(t.completed_at);
              }
              return true;
            });

            const colLimit = boardColLimits[column.id] || 50;
            const displayedColTasks = colTasks.slice(0, colLimit);
            const isColumnHovered = dragOverColumn === column.id;
            const isDraggingCurrentCol =
              draggedTaskId && tasks.find((t) => t.id === draggedTaskId)?.status === column.id;

            return (
              <div
                key={column.id}
                onDragOver={(e) => handleDragOver(e, column.id)}
                onDragLeave={(e) => handleDragLeave(e, column.id)}
                onDrop={(e) => handleDrop(e, column.id)}
                className={`rounded-3xl p-4 flex flex-col gap-3.5 min-h-[160px] md:min-h-[500px] transition-all duration-200 ${
                  isColumnHovered
                    ? 'border-2 border-dashed border-[#0d8a72] dark:border-teal-400 bg-teal-500/10 dark:bg-teal-950/30 scale-[1.01] shadow-md shadow-teal-700/10'
                    : 'bg-slate-100/70 dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800'
                }`}
              >
                {/* Column Header */}
                <div className={`flex items-center justify-between pb-2.5 border-b-2 ${column.color}`}>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                      {column.label}
                    </span>
                    {column.id === 'COMPLETED' && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                        Today
                      </span>
                    )}
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 shadow-2xs">
                      {colTasks.length}
                    </span>
                  </div>
                </div>

                {/* Drop Zone Placeholder Indicator */}
                {isColumnHovered && !isDraggingCurrentCol && (
                  <div className="flex items-center justify-center gap-2 p-3 rounded-2xl border-2 border-dashed border-[#0d8a72] dark:border-teal-400 bg-[#0d8a72]/15 text-[#0d8a72] dark:text-teal-300 text-xs font-bold animate-pulse">
                    <span>Drop here to set as {column.label}</span>
                  </div>
                )}

                {/* Column Cards */}
                <div className="flex flex-col gap-3 flex-1 overflow-y-auto">
                  {colTasks.length === 0 && (!isColumnHovered || isDraggingCurrentCol) ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-4 border border-dashed border-slate-300 dark:border-slate-800 rounded-2xl">
                      <p className="text-xs text-slate-400">No tasks in {column.label}</p>
                    </div>
                  ) : (
                    <>
                      {displayedColTasks.map((task) => (
                        <TaskCard
                          key={task.id}
                          task={task}
                          goal={goals.find((g) => g.id === task.goal_id)}
                          course={courses.find((c) => c.id === task.course_id)}
                          onEdit={onEditTask}
                          onDelete={onDeleteTask}
                          onStatusChange={onStatusChange}
                          onDragStart={() => setDraggedTaskId(task.id)}
                          onDragEnd={() => {
                            setDraggedTaskId(null);
                            setDragOverColumn(null);
                          }}
                        />
                      ))}

                      {colTasks.length > colLimit && (
                        <button
                          type="button"
                          onClick={() =>
                            setBoardColLimits((prev) => ({
                              ...prev,
                              [column.id]: (prev[column.id] || 50) + 50,
                            }))
                          }
                          className="w-full py-2.5 px-3 text-xs font-bold text-[#0d8a72] dark:text-teal-400 hover:bg-[#0d8a72]/10 bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl transition-all cursor-pointer shadow-2xs mt-1"
                        >
                          Load more in {column.label} (+50)
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* List Table View with Sorting and Grouping */
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[620px] text-left text-sm text-slate-700 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-slate-950/60 text-xs uppercase text-slate-500 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-5 py-4">Task</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4">Priority</th>
                  <th className="px-5 py-4">Category</th>
                  <th className="px-5 py-4">Due Date</th>
                  <th className="px-5 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {filteredTasks.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center py-12 text-slate-400 text-xs">
                      No tasks match the filter criteria.
                    </td>
                  </tr>
                ) : (
                  groupedData.map((group) => (
                    <Fragment key={group.key}>
                      {group.title && (
                        <tr className="bg-slate-100/80 dark:bg-slate-800/60 border-y border-slate-200 dark:border-slate-800">
                          <td colSpan="6" className="px-5 py-2.5">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-xs uppercase tracking-wider text-slate-800 dark:text-slate-200">
                                {group.title}
                              </span>
                              <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 shadow-2xs">
                                {group.tasks.length}
                              </span>
                            </div>
                          </td>
                        </tr>
                      )}
                      {group.tasks.map((task) => {
                        const assignedGoal = goals.find((g) => g.id === task.goal_id) || (task.goal_title ? { title: task.goal_title, icon: task.goal_icon || '🎯', color: task.goal_color } : null);
                        const assignedCourse = courses.find((c) => c.id === task.course_id) || (task.course_title ? { title: task.course_title } : null);

                        return (
                          <tr key={task.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                            <td className="px-5 py-4">
                              <div className="font-bold text-slate-900 dark:text-slate-100">{task.title}</div>
                              {task.description && (
                                <div className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-xs">{task.description}</div>
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
                            </td>
                          <td className="px-5 py-4">
                            <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-teal-50 dark:bg-teal-950/40 text-[#0d8a72] dark:text-teal-300 border border-teal-200 dark:border-teal-800/60">
                              {task.status.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                              {task.priority}
                            </span>
                          </td>
                          <td className="px-5 py-4">
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
                          <td className="px-5 py-4 text-xs text-slate-500 dark:text-slate-400 font-medium">
                            {task.due_date ? new Date(task.due_date).toLocaleDateString() : '—'}
                          </td>
                          <td className="px-5 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => onEditTask(task)}
                                className="text-xs text-[#0d8a72] dark:text-teal-400 font-bold hover:underline cursor-pointer"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => onDeleteTask(task.id)}
                                className="text-xs text-rose-500 hover:underline font-bold cursor-pointer"
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </Fragment>
                ))
                )}
              </tbody>
            </table>
          </div>

          {/* Load More Button for List View when tasks > 50 */}
          {filteredTasks.length > visibleCount && (
            <div className="p-4 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/40">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Showing <span className="font-bold text-slate-900 dark:text-slate-100">{Math.min(visibleCount, filteredTasks.length)}</span> of{' '}
                <span className="font-bold text-slate-900 dark:text-slate-100">{filteredTasks.length}</span> tasks
              </p>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setVisibleCount((prev) => prev + PAGE_SIZE)}
                className="gap-2 text-xs font-bold shadow-xs hover:border-[#0d8a72] cursor-pointer"
              >
                <span>Load More Tasks (+50)</span>
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
