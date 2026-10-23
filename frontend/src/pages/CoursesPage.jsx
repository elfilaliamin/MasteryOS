import { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import {
  GraduationCap,
  Plus,
  BookOpen,
  CheckCircle2,
  Edit2,
  Trash2,
  Award,
  Search,
  Filter,
  FileCheck,
  ExternalLink,
  PlusCircle,
  Sparkles,
  ArrowUpDown,
  X,
} from 'lucide-react';

const STORAGE_KEY_COURSES = 'mastery_courses_filters';
const COURSE_STATUS_ORDER = { IN_PROGRESS: 1, NOT_STARTED: 2, COMPLETED: 3 };

const getInitialCourseFilters = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_COURSES);
    if (saved) return JSON.parse(saved);
  } catch {
    // fallback
  }
  return {};
};

export const CoursesPage = ({
  courses = [],
  tasks = [],
  onOpenNewCourse,
  onEditCourse,
  onDeleteCourse,
  onIncrementLesson,
}) => {
  const [savedFilters] = useState(getInitialCourseFilters);
  const [searchFilter, setSearchFilter] = useState(savedFilters.searchFilter || '');
  const [statusFilter, setStatusFilter] = useState(savedFilters.statusFilter || 'ALL');
  const [sortBy, setSortBy] = useState(savedFilters.sortBy || 'default');
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [isMobileSortOpen, setIsMobileSortOpen] = useState(false);

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

  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY_COURSES,
        JSON.stringify({ searchFilter, statusFilter, sortBy })
      );
    } catch {
      // ignore
    }
  }, [searchFilter, statusFilter, sortBy]);

  // Enrich courses with dynamic task metrics, progress, and 3-tier status
  const enrichedCourses = courses.map((course) => {
    const assignedTasks = tasks.filter((t) => t.course_id === course.id);
    const completedTasks = assignedTasks.filter((t) => t.status === 'COMPLETED');

    const hasTotal = course.total_lessons != null && course.total_lessons > 0;
    const hasFinished = course.finished_lessons != null && course.finished_lessons >= 0;

    // If either value is empty or missing, treat the course progress as 0%
    const progressPercent = (hasTotal && hasFinished)
      ? Math.min(100, Math.round(((course.finished_lessons || 0) / course.total_lessons) * 100))
      : 0;

    const isCompleted = hasTotal && hasFinished && (course.finished_lessons || 0) >= course.total_lessons;
    const isNotStarted = !hasFinished || (course.finished_lessons || 0) === 0;

    const status = isCompleted ? 'COMPLETED' : (!isNotStarted ? 'IN_PROGRESS' : 'NOT_STARTED');

    return {
      ...course,
      total_lessons: course.total_lessons ?? null,
      finished_lessons: course.finished_lessons ?? null,
      progressPercent,
      isCompleted,
      isNotStarted,
      status,
      assignedTasks,
      totalTasks: assignedTasks.length,
      completedTasks: completedTasks.length,
    };
  });

  // KPI Metrics
  const totalCourses = enrichedCourses.length;
  const notStartedCourses = enrichedCourses.filter((c) => c.status === 'NOT_STARTED').length;
  const inProgressCourses = enrichedCourses.filter((c) => c.status === 'IN_PROGRESS').length;
  const completedCourses = enrichedCourses.filter((c) => c.status === 'COMPLETED').length;
  const totalFinishedLessons = enrichedCourses.reduce(
    (acc, c) => acc + (c.finished_lessons || 0),
    0
  );

  const hasActiveFilters = statusFilter !== 'ALL';
  const activeFilterCount = statusFilter !== 'ALL' ? 1 : 0;

  const handleClearFilters = () => {
    setStatusFilter('ALL');
  };

  // Filtered courses
  const filteredCourses = enrichedCourses.filter((c) => {
    if (statusFilter !== 'ALL' && c.status !== statusFilter) return false;
    if (searchFilter.trim()) {
      const q = searchFilter.toLowerCase().trim();
      const inTitle = (c.title || '').toLowerCase().includes(q);
      const inDesc = (c.description || '').toLowerCase().includes(q);
      if (!inTitle && !inDesc) return false;
    }
    return true;
  });

  // Sorted courses
  const sortedCourses = useMemo(() => {
    return [...filteredCourses].sort((a, b) => {
      if (sortBy === 'progress') {
        return (b.progressPercent || 0) - (a.progressPercent || 0);
      }
      if (sortBy === 'title') {
        return (a.title || '').localeCompare(b.title || '');
      }
      if (sortBy === 'finished_lessons') {
        return (b.finished_lessons || 0) - (a.finished_lessons || 0);
      }
      if (sortBy === 'total_lessons') {
        return (b.total_lessons || 0) - (a.total_lessons || 0);
      }
      if (sortBy === 'status') {
        return (COURSE_STATUS_ORDER[a.status] || 99) - (COURSE_STATUS_ORDER[b.status] || 99);
      }
      return 0;
    });
  }, [filteredCourses, sortBy]);

  return (
    <div className="flex flex-col gap-6 text-left">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-teal-50 dark:bg-teal-950/40 text-[#0d8a72] dark:text-teal-400 border border-teal-200 dark:border-teal-800">
              <GraduationCap size={20} />
            </span>
            <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
              Courses & Learning
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Track courses you take or teach, log finished lessons, manage certificates, and assign study tasks.
          </p>
        </div>

        <Button variant="primary" onClick={onOpenNewCourse} className="gap-1.5 shadow-md self-start sm:self-auto">
          <Plus size={16} />
          <span>New Course</span>
        </Button>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Total Courses
            </p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-1">
              {totalCourses}
            </h3>
          </div>
          <div className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
            <BookOpen size={22} />
          </div>
        </Card>

        <Card className="p-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Completed
            </p>
            <h3 className="text-2xl font-black text-[#0d8a72] dark:text-teal-400 mt-1">
              {completedCourses}
            </h3>
          </div>
          <div className="p-3 rounded-2xl bg-teal-50 dark:bg-teal-950/50 text-[#0d8a72] dark:text-teal-300">
            <CheckCircle2 size={22} />
          </div>
        </Card>

        <Card className="p-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              In Progress
            </p>
            <h3 className="text-2xl font-black text-amber-500 mt-1">
              {inProgressCourses}
            </h3>
          </div>
          <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/50 text-amber-500">
            <Sparkles size={22} />
          </div>
        </Card>

        <Card className="p-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Lessons Finished
            </p>
            <h3 className="text-2xl font-black text-purple-600 dark:text-purple-400 mt-1">
              {totalFinishedLessons}
            </h3>
          </div>
          <div className="p-3 rounded-2xl bg-purple-50 dark:bg-purple-950/50 text-purple-500">
            <Award size={22} />
          </div>
        </Card>
      </div>

      {/* Search Bar */}
      <div className="relative flex items-center bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-1.5 shadow-2xs">
        <Search size={16} className="text-slate-400 ml-2.5 shrink-0" />
        <input
          type="text"
          value={searchFilter}
          onChange={(e) => setSearchFilter(e.target.value)}
          placeholder="Search courses by title or description..."
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

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className={`text-xs rounded-xl px-2.5 py-1.5 font-semibold transition-all cursor-pointer border min-w-[120px] max-w-[160px] truncate ${
              statusFilter !== 'ALL'
                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-400 dark:border-emerald-700 font-bold shadow-2xs'
                : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 focus:outline-none focus:border-[#0d8a72]'
            }`}
          >
            <option value="ALL">All Statuses ({totalCourses})</option>
            <option value="NOT_STARTED">Not Started ({notStartedCourses})</option>
            <option value="IN_PROGRESS">In Progress ({inProgressCourses})</option>
            <option value="COMPLETED">Completed ({completedCourses})</option>
          </select>

          {/* Clear Filters Button */}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleClearFilters}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 hover:bg-rose-100 dark:hover:bg-rose-900/50 transition-all cursor-pointer shrink-0"
              title="Reset filters"
            >
              <X size={13} />
              <span>Clear filters</span>
            </button>
          )}
        </div>

        <div className="text-xs text-slate-500 dark:text-slate-400 font-semibold shrink-0">
          Showing {filteredCourses.length} of {totalCourses} courses
        </div>
      </div>

      {/* Desktop View: Dedicated Sorting Row */}
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
              <option value="progress">Progress</option>
              <option value="title">Title (A-Z)</option>
              <option value="finished_lessons">Lessons Finished</option>
              <option value="total_lessons">Total Lessons</option>
              <option value="status">Status</option>
            </select>
          </div>

          {sortBy !== 'default' && (
            <button
              type="button"
              onClick={() => setSortBy('default')}
              className="text-xs font-semibold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors cursor-pointer"
            >
              Reset sorting
            </button>
          )}
        </div>

        <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 shrink-0">
          Showing {sortedCourses.length} of {totalCourses} courses
        </div>
      </div>

      {/* Mobile View: Compact Filters Bar */}
      <div className="flex md:hidden items-center justify-between gap-2 p-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xs">
        <div className="flex items-center gap-2">
          {/* Filters Button */}
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
            {activeFilterCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-[#0d8a72] text-white text-[10px] font-bold">
                {activeFilterCount}
              </span>
            )}
          </button>

          {/* Sort Button */}
          <button
            type="button"
            onClick={() => setIsMobileSortOpen(true)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
              sortBy !== 'default'
                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-400 dark:border-emerald-700 shadow-2xs'
                : 'bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
            aria-label="Open sorting popup"
          >
            <ArrowUpDown size={15} className={sortBy !== 'default' ? 'text-[#0d8a72] dark:text-emerald-400' : 'text-slate-500'} />
            <span>Sort</span>
            {sortBy !== 'default' && (
              <span className="w-1.5 h-1.5 rounded-full bg-[#0d8a72]" />
            )}
          </button>

          {hasActiveFilters && (
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
          {sortedCourses.length} {sortedCourses.length === 1 ? 'course' : 'courses'}
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
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Filter Courses</h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">Refine by course status</p>
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
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Status
                  </label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full text-xs rounded-xl p-2.5 font-semibold bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#0d8a72] cursor-pointer"
                  >
                    <option value="ALL">All Statuses ({totalCourses})</option>
                    <option value="NOT_STARTED">Not Started ({notStartedCourses})</option>
                    <option value="IN_PROGRESS">In Progress ({inProgressCourses})</option>
                    <option value="COMPLETED">Completed ({completedCourses})</option>
                  </select>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between px-5 py-3.5 bg-slate-50/80 dark:bg-slate-950/80 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={handleClearFilters}
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
                  Done ({filteredCourses.length} courses)
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* Mobile Modal: Sorting Popup */}
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
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Sort Courses</h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">Organize courses order</p>
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
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Sort Courses By
                  </label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full text-xs rounded-xl p-2.5 font-semibold bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#0d8a72] cursor-pointer"
                  >
                    <option value="default">Default</option>
                    <option value="progress">Progress</option>
                    <option value="title">Title (A-Z)</option>
                    <option value="finished_lessons">Lessons Finished</option>
                    <option value="total_lessons">Total Lessons</option>
                    <option value="status">Status</option>
                  </select>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between px-5 py-3.5 bg-slate-50/80 dark:bg-slate-950/80 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setSortBy('default')}
                  disabled={sortBy === 'default'}
                  className="text-xs font-bold text-rose-600 dark:text-rose-400 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  Reset
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

      {/* Courses Grid with constrained card width */}
      {sortedCourses.length === 0 ? (
        <Card className="p-12 text-center flex flex-col items-center justify-center">
          <div className="p-4 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 mb-3">
            <GraduationCap size={36} />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
            {courses.length === 0 ? 'No courses added yet' : 'No courses match the filter criteria'}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mt-1">
            {courses.length === 0
              ? 'Add courses you are studying or creating, track lesson completion, upload certificates, and link your tasks.'
              : 'Try clearing your search or status filter to see all courses.'}
          </p>
          {courses.length > 0 && (hasActiveFilters || searchFilter) && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                handleClearFilters();
                setSearchFilter('');
              }}
              className="mt-4 gap-1.5 text-xs"
            >
              <X size={14} />
              <span>Clear All Filters</span>
            </Button>
          )}
          {courses.length === 0 && (
            <Button variant="primary" onClick={onOpenNewCourse} className="mt-4 gap-1.5">
              <Plus size={16} />
              <span>Track First Course</span>
            </Button>
          )}
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {sortedCourses.map((course) => {
            return (
              <div
                key={course.id}
                className="max-w-md w-full mx-auto sm:mx-0 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 hover:border-[#0d8a72]/50 dark:hover:border-teal-500/50 rounded-3xl overflow-hidden shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between group text-left"
              >
                <div>
                  {/* Card Cover Banner - Clickable to open Edit Course Details */}
                  <div
                    onClick={() => onEditCourse(course)}
                    className="relative h-44 w-full bg-slate-800 overflow-hidden cursor-pointer group/cover"
                    title="Click cover image to edit course details"
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

                      {/* Action buttons on cover */}
                      <div className="flex items-center gap-1.5 bg-black/50 backdrop-blur-md rounded-xl p-1 pointer-events-auto">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onEditCourse(course);
                          }}
                          className="p-1.5 text-white/80 hover:text-white hover:bg-white/20 rounded-lg transition-colors cursor-pointer"
                          title="Edit Course Details"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteCourse(course.id);
                          }}
                          className="p-1.5 text-rose-300 hover:text-rose-100 hover:bg-rose-500/40 rounded-lg transition-colors cursor-pointer"
                          title="Delete Course"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>

                    {/* Hover Hint Overlay */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/cover:opacity-100 transition-opacity bg-black/20 pointer-events-none">
                      <span className="text-[11px] font-bold text-white bg-black/60 px-3 py-1 rounded-full backdrop-blur-xs flex items-center gap-1.5">
                        <Edit2 size={12} />
                        <span>Click cover to edit details</span>
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
                            {course.total_lessons != null && course.finished_lessons != null
                              ? `${course.finished_lessons} of ${course.total_lessons} lessons completed`
                              : course.total_lessons != null
                              ? `0 of ${course.total_lessons} lessons completed`
                              : course.finished_lessons != null
                              ? `${course.finished_lessons} lessons completed`
                              : '0 lessons completed'}
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
                          {course.progressPercent}%
                        </span>
                      </div>

                      {/* Progress Bar */}
                      <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${course.progressPercent}%`,
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
                      {/* +1 Lesson Button */}
                      <button
                        onClick={() => onIncrementLesson(course.id)}
                        disabled={course.isCompleted}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer ${
                          course.isCompleted
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 opacity-80 cursor-default'
                            : 'bg-[#0d8a72] hover:bg-[#0b7561] text-white active:scale-95'
                        }`}
                        title={
                          course.isCompleted
                            ? 'All lessons completed!'
                            : 'Mark +1 lesson finished and earn XP'
                        }
                      >
                        <PlusCircle size={14} />
                        <span>{course.isCompleted ? 'Finished' : '+1 Lesson'}</span>
                      </button>

                      {/* Certification Pill / Link */}
                      {course.certification_url ? (
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
                      ) : (
                        <button
                          onClick={() => onEditCourse(course)}
                          className="text-[11px] font-semibold text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer"
                        >
                          + Certificate
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
