import { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './context/useAuth';
import { ThemeProvider } from './context/ThemeContext';
import { GamificationProvider } from './context/GamificationContext';
import { useGamification } from './context/useGamification';
import { ProtectedRoute, PublicOnlyRoute } from './components/auth/ProtectedRoute';
import { AppLayout } from './components/layout/AppLayout';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { DashboardPage } from './pages/DashboardPage';
import { TasksPage } from './pages/TasksPage';
import { GoalsPage } from './pages/GoalsPage';
import { FocusPage } from './pages/FocusPage';
import { CoursesPage } from './pages/CoursesPage';
import { HabitsPage } from './pages/HabitsPage';
import { formatDateKey } from './utils/habitUtils';
import { CategoriesPage } from './pages/CategoriesPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { SettingsPage } from './pages/SettingsPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { TaskModal } from './components/tasks/TaskModal';
import { GoalModal } from './components/goals/GoalModal';
import { CourseModal } from './components/courses/CourseModal';
import { HabitModal } from './components/habits/HabitModal';
import { LevelUpModal } from './components/gamification/LevelUpModal';
import { api } from './services/api';
import {
  useTasks,
  useTaskStats,
  useCreateTask,
  useUpdateTask,
  useUpdateTaskStatus,
  useDeleteTask,
} from './hooks/useTasks';
import {
  useGoals,
  useCreateGoal,
  useUpdateGoal,
  useDeleteGoal,
} from './hooks/useGoals';
import {
  useCourses,
  useCreateCourse,
  useUpdateCourse,
  useIncrementCourseLesson,
  useDeleteCourse,
} from './hooks/useCourses';
import {
  useHabits,
  useCreateHabit,
  useUpdateHabit,
  useToggleHabit,
  useDeleteHabit,
} from './hooks/useHabits';
import {
  useCategories,
  useCreateCategory,
  useDeleteCategory,
} from './hooks/useCategories';
import './App.css';

// Inner Level Up Pop-up Listener Component
const LevelUpListener = () => {
  const { levelUpData, closeLevelUpModal } = useGamification();
  return (
    <LevelUpModal
      isOpen={!!levelUpData}
      onClose={closeLevelUpModal}
      levelData={levelUpData}
    />
  );
};

// Inner Authenticated App powered by React Query cache
const AuthenticatedApp = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const isAuth = !!user?.id;

  // Declarative server state queries - only run when user is authenticated
  const { data: tasks = [], isLoading: isTasksLoading, isFetching: isTasksFetching } = useTasks({}, { enabled: isAuth });
  const { data: goals = [], isLoading: isGoalsLoading, isFetching: isGoalsFetching } = useGoals({ enabled: isAuth });
  const { data: courses = [], isLoading: isCoursesLoading, isFetching: isCoursesFetching } = useCourses({ enabled: isAuth });
  const { data: habits = [], isLoading: isHabitsLoading, isFetching: isHabitsFetching } = useHabits({ enabled: isAuth });
  const { data: categories = [] } = useCategories({ enabled: isAuth });
  const { data: stats = {} } = useTaskStats({ enabled: isAuth });

  const hasEmptyData = tasks.length === 0 && goals.length === 0 && courses.length === 0 && habits.length === 0;
  const isAnyFetching = isTasksFetching || isGoalsFetching || isCoursesFetching || isHabitsFetching;
  const isInitialLoading = !isAuth || isTasksLoading || isGoalsLoading || isCoursesLoading || isHabitsLoading || (hasEmptyData && isAnyFetching);

  // Entity mutations
  const createTaskMutation = useCreateTask();
  const updateTaskMutation = useUpdateTask();
  const updateTaskStatusMutation = useUpdateTaskStatus();
  const deleteTaskMutation = useDeleteTask();

  const createGoalMutation = useCreateGoal();
  const updateGoalMutation = useUpdateGoal();
  const deleteGoalMutation = useDeleteGoal();

  const createCourseMutation = useCreateCourse();
  const updateCourseMutation = useUpdateCourse();
  const incrementLessonMutation = useIncrementCourseLesson();
  const deleteCourseMutation = useDeleteCourse();

  const createHabitMutation = useCreateHabit();
  const updateHabitMutation = useUpdateHabit();
  const toggleHabitMutation = useToggleHabit();
  const deleteHabitMutation = useDeleteHabit();

  const createCategoryMutation = useCreateCategory();
  const deleteCategoryMutation = useDeleteCategory();

  // Task Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);

  // Goal Modal state
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);

  // Course Modal state
  const [isCourseModalOpen, setIsCourseModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);

  // Habit Modal state
  const [isHabitModalOpen, setIsHabitModalOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState(null);

  // Global Data Reset
  const handleResetData = async () => {
    try {
      await api.resetUserData();
    } catch (err) {
      console.warn('API reset notice:', err.message);
    }
    if (user?.id) {
      localStorage.removeItem(`mastery_local_tasks_${user.id}`);
      localStorage.removeItem(`mastery_acknowledged_level_${user.id}`);
      localStorage.removeItem(`taskmaster_equipped_title_${user.id}`);
    }
    localStorage.removeItem('mastery_local_tasks');
    localStorage.removeItem('mastery_acknowledged_level');
    localStorage.removeItem('taskmaster_equipped_title');
    localStorage.removeItem('mastery_local_habits');
    queryClient.invalidateQueries();
  };

  // Global Data Import
  const handleImportData = async (importPayload, mode = 'merge') => {
    if (!importPayload || typeof importPayload !== 'object') return;

    if (mode === 'replace') {
      try {
        await api.resetUserData();
      } catch (err) {
        console.warn('API reset before import notice:', err.message);
      }
      if (user?.id) {
        localStorage.removeItem(`mastery_local_tasks_${user.id}`);
      }
      localStorage.removeItem('mastery_local_tasks');
    }

    const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    // 1. Fetch current categories
    let currentCats = mode === 'replace' ? [] : (categories || []);
    try {
      const catsRes = await api.getCategories();
      if (catsRes?.categories && Array.isArray(catsRes.categories)) {
        currentCats = catsRes.categories;
      }
    } catch {
      // Use categories from state
    }

    const categoryMap = new Map();
    currentCats.forEach((c) => {
      if (c.id && UUID_REGEX.test(c.id)) {
        categoryMap.set(c.id, c.id);
      }
      if (c.name) {
        categoryMap.set(c.name.trim().toLowerCase(), c.id);
      }
    });

    const defaultNameMap = {
      'cat-1': 'work',
      'cat-2': 'personal',
      'cat-3': 'urgent',
      'cat-4': 'learning',
    };
    Object.entries(defaultNameMap).forEach(([catKey, catName]) => {
      const match = currentCats.find((c) => c.name?.toLowerCase() === catName);
      if (match?.id) {
        categoryMap.set(catKey, match.id);
      }
    });

    // Collect all categories to import (including any categories referenced on tasks)
    const rawCategories = [...(importPayload.categories || [])];
    if (Array.isArray(importPayload.tasks)) {
      for (const t of importPayload.tasks) {
        if (t.category_name && !rawCategories.some((c) => c.name?.toLowerCase().trim() === t.category_name.toLowerCase().trim())) {
          rawCategories.push({
            id: t.category_id || `cat-${Date.now()}-${Math.random()}`,
            name: t.category_name,
            color: t.category_color || '#0d8a72',
          });
        }
      }
    }

    // Import / Restore Categories (ensures exact colors are created/updated)
    for (const cat of rawCategories) {
      if (!cat?.name || !cat.name.trim()) continue;
      const catName = cat.name.trim();
      const catNameLower = catName.toLowerCase();
      const catColor = cat.color || '#0d8a72';

      try {
        const res = await api.createCategory({ name: catName, color: catColor });
        const savedCat = res?.category;
        if (savedCat?.id) {
          if (cat.id) categoryMap.set(cat.id, savedCat.id);
          categoryMap.set(catNameLower, savedCat.id);
          const existingIdx = currentCats.findIndex((c) => c.id === savedCat.id);
          if (existingIdx !== -1) {
            currentCats[existingIdx] = savedCat;
          } else {
            currentCats.push(savedCat);
          }
        }
      } catch (err) {
        console.warn('Category import notice:', err.message);
      }
    }

    // 2. Import / Restore Goals (preserves colors, icons, priorities, dates)
    let currentGoals = mode === 'replace' ? [] : (goals || []);
    try {
      const goalsRes = await api.getGoals();
      if (goalsRes?.goals && Array.isArray(goalsRes.goals)) {
        currentGoals = goalsRes.goals;
      }
    } catch {
      // Use goals from state
    }

    const goalMap = new Map();
    currentGoals.forEach((g) => {
      if (g.id) goalMap.set(g.id, g.id);
      if (g.title) goalMap.set(g.title.trim().toLowerCase(), g.id);
    });

    if (Array.isArray(importPayload.goals)) {
      for (const g of importPayload.goals) {
        if (!g?.title || !g.title.trim()) continue;
        const goalTitle = g.title.trim();
        const goalTitleLower = goalTitle.toLowerCase();
        const effectiveDueDate = (g.due_date && String(g.due_date).trim()) || (g.target_date && String(g.target_date).trim()) || null;
        const goalPriority = g.priority ? String(g.priority).toUpperCase() : 'MEDIUM';
        const goalColor = g.color || '#0d8a72';
        const goalIcon = g.icon || '🎯';

        const existingGoal = currentGoals.find((ex) => ex.title?.trim().toLowerCase() === goalTitleLower);

        if (existingGoal?.id && mode !== 'replace') {
          try {
            await api.updateGoal(existingGoal.id, {
              title: goalTitle,
              description: g.description || '',
              due_date: effectiveDueDate,
              priority: goalPriority,
              color: goalColor,
              icon: goalIcon,
            });
          } catch {
            // ignore
          }
          if (g.id) goalMap.set(g.id, existingGoal.id);
          goalMap.set(goalTitleLower, existingGoal.id);
          continue;
        }

        try {
          const res = await api.createGoal({
            title: goalTitle,
            description: g.description || '',
            due_date: effectiveDueDate,
            target_date: effectiveDueDate,
            priority: goalPriority,
            color: goalColor,
            icon: goalIcon,
          });
          if (res?.goal?.id) {
            if (g.id) goalMap.set(g.id, res.goal.id);
            goalMap.set(goalTitleLower, res.goal.id);
            currentGoals.push(res.goal);
          }
        } catch (err) {
          console.warn('Import goal notice:', err.message);
        }
      }
    }

    // 3. Import / Restore Courses (preserves cover_images, progress, certificates)
    let currentCourses = mode === 'replace' ? [] : (courses || []);
    try {
      const coursesRes = await api.getCourses();
      if (coursesRes?.courses && Array.isArray(coursesRes.courses)) {
        currentCourses = coursesRes.courses;
      }
    } catch {
      // Use courses from state
    }

    const courseMap = new Map();
    currentCourses.forEach((c) => {
      if (c.id) courseMap.set(c.id, c.id);
      if (c.title) courseMap.set(c.title.trim().toLowerCase(), c.id);
    });

    if (Array.isArray(importPayload.courses)) {
      for (const c of importPayload.courses) {
        if (!c?.title || !c.title.trim()) continue;
        const courseTitle = c.title.trim();
        const courseTitleLower = courseTitle.toLowerCase();
        const existingCourse = currentCourses.find((ex) => ex.title?.trim().toLowerCase() === courseTitleLower);

        if (existingCourse?.id && mode !== 'replace') {
          try {
            await api.updateCourse(existingCourse.id, {
              title: courseTitle,
              description: c.description || '',
              cover_image: c.cover_image || null,
              total_lessons: c.total_lessons != null ? c.total_lessons : null,
              finished_lessons: c.finished_lessons != null ? c.finished_lessons : null,
              certification_url: c.certification_url || null,
              certification_filename: c.certification_filename || null,
            });
          } catch {
            // ignore
          }
          if (c.id) courseMap.set(c.id, existingCourse.id);
          courseMap.set(courseTitleLower, existingCourse.id);
          continue;
        }

        try {
          const res = await api.createCourse({
            title: courseTitle,
            description: c.description || '',
            cover_image: c.cover_image || null,
            total_lessons: c.total_lessons != null ? c.total_lessons : null,
            finished_lessons: c.finished_lessons != null ? c.finished_lessons : null,
            certification_url: c.certification_url || null,
            certification_filename: c.certification_filename || null,
          });
          if (res?.course?.id) {
            if (c.id) courseMap.set(c.id, res.course.id);
            courseMap.set(courseTitleLower, res.course.id);
            currentCourses.push(res.course);
          }
        } catch (err) {
          console.warn('Import course notice:', err.message);
        }
      }
    }

    // 4. Import / Restore Habits (preserves icons, colors, time_of_day, and completed_dates / streaks)
    let currentHabits = mode === 'replace' ? [] : (habits || []);
    try {
      const habitsRes = await api.getHabits();
      if (habitsRes?.habits && Array.isArray(habitsRes.habits)) {
        currentHabits = habitsRes.habits;
      }
    } catch {
      // Use habits from state
    }

    if (Array.isArray(importPayload.habits)) {
      for (const h of importPayload.habits) {
        if (!h?.title || !h.title.trim()) continue;
        const habitTitle = h.title.trim();
        const habitTitleLower = habitTitle.toLowerCase();
        const habitIcon = h.icon || '⚡';
        const habitColor = h.color || '#0d8a72';
        const habitTimeOfDay = h.time_of_day || 'ANYTIME';
        const habitFrequency = h.frequency || 'DAILY';

        let targetHabitId = null;
        const existingHabit = currentHabits.find((ex) => ex.title?.trim().toLowerCase() === habitTitleLower);

        if (existingHabit?.id && mode !== 'replace') {
          targetHabitId = existingHabit.id;
          try {
            await api.updateHabit(existingHabit.id, {
              title: habitTitle,
              description: h.description || '',
              icon: habitIcon,
              color: habitColor,
              time_of_day: habitTimeOfDay,
              frequency: habitFrequency,
            });
          } catch {
            // ignore
          }
        } else {
          try {
            const res = await api.createHabit({
              title: habitTitle,
              description: h.description || '',
              icon: habitIcon,
              color: habitColor,
              time_of_day: habitTimeOfDay,
              frequency: habitFrequency,
            });
            if (res?.habit?.id) {
              targetHabitId = res.habit.id;
              currentHabits.push(res.habit);
            }
          } catch (err) {
            console.warn('Import habit notice:', err.message);
          }
        }

        // Restore Habit Check-ins / Streaks / Completed Dates History
        const datesToRestore = Array.isArray(h.completed_dates)
          ? h.completed_dates
          : Array.isArray(h.history)
          ? h.history
          : [];

        if (targetHabitId && datesToRestore.length > 0) {
          const existingDates = new Set(
            (existingHabit?.completed_dates || [])
              .map((d) => (typeof d === 'string' ? d.substring(0, 10) : formatDateKey(d)))
              .filter(Boolean)
          );

          for (const dItem of datesToRestore) {
            const dateStr = typeof dItem === 'string' ? dItem.substring(0, 10) : formatDateKey(dItem);
            if (dateStr && !existingDates.has(dateStr)) {
              try {
                await api.toggleHabit(targetHabitId, dateStr);
                existingDates.add(dateStr);
              } catch {
                // ignore
              }
            }
          }
        }
      }
    }

    // 5. Import / Restore Tasks (preserves category, goal, course relationships, colors, and statuses)
    const restoredTasks = [];
    if (Array.isArray(importPayload.tasks)) {
      for (const t of importPayload.tasks) {
        // Robust Category Resolution: Map by ID, by Name, or by Alias
        let mappedCatId = categoryMap.get(t.category_id);
        if (!mappedCatId && t.category_name) {
          mappedCatId = categoryMap.get(t.category_name.trim().toLowerCase());
        }
        if (!mappedCatId && t.category_id && defaultNameMap[t.category_id]) {
          mappedCatId = categoryMap.get(defaultNameMap[t.category_id]);
        }
        if (!mappedCatId) {
          mappedCatId = currentCats.find((c) => c.id === t.category_id)?.id || null;
        }

        // Robust Goal Resolution: Map by ID or by Title
        let mappedGoalId = goalMap.get(t.goal_id);
        if (!mappedGoalId && t.goal_title) {
          mappedGoalId = goalMap.get(t.goal_title.trim().toLowerCase());
        }
        if (!mappedGoalId) {
          mappedGoalId = currentGoals.find((g) => g.id === t.goal_id)?.id || null;
        }

        // Robust Course Resolution: Map by ID or by Title
        let mappedCourseId = courseMap.get(t.course_id);
        if (!mappedCourseId && t.course_title) {
          mappedCourseId = courseMap.get(t.course_title.trim().toLowerCase());
        }
        if (!mappedCourseId) {
          mappedCourseId = currentCourses.find((c) => c.id === t.course_id)?.id || null;
        }

        const cleanDueDate = t.due_date && String(t.due_date).trim() ? t.due_date : null;

        let normalizedStatus = 'TODO';
        if (t.status) {
          const s = String(t.status).toUpperCase();
          if (s === 'COMPLETED' || s === 'DONE') normalizedStatus = 'COMPLETED';
          else if (s === 'IN_PROGRESS') normalizedStatus = 'IN_PROGRESS';
          else if (s === 'IN_REVIEW') normalizedStatus = 'IN_REVIEW';
        }

        let normalizedPriority = 'MEDIUM';
        if (t.priority) {
          const p = String(t.priority).toUpperCase();
          if (['LOW', 'MEDIUM', 'HIGH', 'URGENT'].includes(p)) {
            normalizedPriority = p;
          }
        }

        const taskPayload = {
          title: t.title?.trim() || 'Untitled Task',
          description: t.description || '',
          status: normalizedStatus,
          priority: normalizedPriority,
          category_id: mappedCatId,
          goal_id: mappedGoalId,
          course_id: mappedCourseId,
          due_date: cleanDueDate,
          estimated_minutes: t.estimated_minutes != null ? Math.max(0, parseInt(t.estimated_minutes, 10) || 0) : 0,
        };

        try {
          const res = await api.createTask(taskPayload);
          if (res?.task) {
            restoredTasks.push(res.task);
          } else {
            restoredTasks.push({
              ...taskPayload,
              id: t.id || `local-task-${Date.now()}-${Math.random()}`,
              created_at: t.created_at || new Date().toISOString(),
            });
          }
        } catch (err) {
          console.warn('Import task notice:', err.message);
          restoredTasks.push({
            ...taskPayload,
            id: t.id || `local-task-${Date.now()}-${Math.random()}`,
            created_at: t.created_at || new Date().toISOString(),
          });
        }
      }
    }

    // 6. Restore Dashboard Configuration if present
    if (importPayload.dashboard_config && typeof importPayload.dashboard_config === 'object') {
      try {
        localStorage.setItem('mastery_dashboard_config', JSON.stringify(importPayload.dashboard_config));
      } catch {
        // ignore
      }
    }

    // 7. Full App Data Refresh via React Query invalidation
    await queryClient.invalidateQueries();
  };

  // Task actions
  const handleCreateOrUpdateTask = async (taskData) => {
    let resolvedCategoryId = taskData.category_id;
    if (resolvedCategoryId) {
      const aliasMap = { 'cat-1': 'work', 'cat-2': 'personal', 'cat-3': 'urgent', 'cat-4': 'learning' };
      const targetName = aliasMap[resolvedCategoryId];
      const matchedCat = categories.find(
        (c) => c.id === resolvedCategoryId || (targetName && c.name?.toLowerCase().trim() === targetName)
      );
      if (matchedCat && matchedCat.id && !matchedCat.id.startsWith('cat-')) {
        resolvedCategoryId = matchedCat.id;
      }
    }

    const payloadToSend = {
      ...taskData,
      category_id: resolvedCategoryId,
    };

    if (taskData.id && !String(taskData.id).startsWith('local-task-')) {
      await updateTaskMutation.mutateAsync({ id: taskData.id, ...payloadToSend });
    } else {
      await createTaskMutation.mutateAsync(payloadToSend);
    }
  };

  const handleStatusChange = async (taskId, newStatus) => {
    await updateTaskStatusMutation.mutateAsync({ id: taskId, status: newStatus });
  };

  const handleDeleteTask = async (taskId) => {
    await deleteTaskMutation.mutateAsync(taskId);
  };

  // Goal actions
  const handleCreateOrUpdateGoal = async (goalData) => {
    if (goalData.id && !String(goalData.id).startsWith('local-goal-')) {
      await updateGoalMutation.mutateAsync({ id: goalData.id, ...goalData });
    } else {
      await createGoalMutation.mutateAsync(goalData);
    }
  };

  const handleDeleteGoal = async (goalId) => {
    await deleteGoalMutation.mutateAsync(goalId);
  };

  // Course actions
  const handleCreateOrUpdateCourse = async (courseData) => {
    if (courseData.id && !String(courseData.id).startsWith('local-course-')) {
      await updateCourseMutation.mutateAsync({ id: courseData.id, ...courseData });
    } else {
      await createCourseMutation.mutateAsync(courseData);
    }
  };

  const handleIncrementLesson = async (courseId) => {
    await incrementLessonMutation.mutateAsync(courseId);
  };

  const handleDeleteCourse = async (courseId) => {
    await deleteCourseMutation.mutateAsync(courseId);
  };

  // Category actions
  const handleCreateCategory = async (catData) => {
    await createCategoryMutation.mutateAsync(catData);
  };

  const handleDeleteCategory = async (catId) => {
    await deleteCategoryMutation.mutateAsync(catId);
  };

  // Habit actions
  const handleCreateOrUpdateHabit = async (habitData) => {
    if (habitData.id && !String(habitData.id).startsWith('local-habit-')) {
      await updateHabitMutation.mutateAsync({ id: habitData.id, ...habitData });
    } else {
      await createHabitMutation.mutateAsync(habitData);
    }
  };

  const handleToggleHabit = async (habitId, targetDate = null) => {
    const dateKey = targetDate ? formatDateKey(targetDate) : formatDateKey(new Date());
    await toggleHabitMutation.mutateAsync({ id: habitId, dateStr: dateKey });
  };

  const handleDeleteHabit = async (habitId) => {
    await deleteHabitMutation.mutateAsync(habitId);
  };

  return (
    <GamificationProvider tasks={tasks} goals={goals} courses={courses} habits={habits} isLoading={isInitialLoading}>
      <Routes>
        {/* Public only routes */}
        <Route element={<PublicOnlyRoute />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Route>

        {/* Protected workspace routes */}
        <Route element={<ProtectedRoute />}>
          <Route
            element={
              <AppLayout
                onQuickAddTask={() => {
                  setEditingTask(null);
                  setIsModalOpen(true);
                }}
              />
            }
          >
            <Route
              path="/"
              element={
                <DashboardPage
                  tasks={tasks}
                  goals={goals}
                  courses={courses}
                  habits={habits}
                  stats={stats}
                  isLoading={isInitialLoading}
                  onOpenNewTask={() => {
                    setEditingTask(null);
                    setIsModalOpen(true);
                  }}
                  onOpenNewGoal={() => {
                    setEditingGoal(null);
                    setIsGoalModalOpen(true);
                  }}
                  onOpenNewCourse={() => {
                    setEditingCourse(null);
                    setIsCourseModalOpen(true);
                  }}
                  onOpenNewHabit={() => {
                    setEditingHabit(null);
                    setIsHabitModalOpen(true);
                  }}
                  onStatusChange={handleStatusChange}
                  onIncrementLesson={handleIncrementLesson}
                  onToggleHabit={handleToggleHabit}
                />
              }
            />
            <Route
              path="/focus"
              element={
                <FocusPage
                  tasks={tasks}
                  habits={habits}
                  categories={categories}
                  goals={goals}
                  courses={courses}
                  onStatusChange={handleStatusChange}
                  onEditTask={(task) => {
                    setEditingTask(task);
                    setIsModalOpen(true);
                  }}
                  onToggleHabit={handleToggleHabit}
                  onOpenNewTask={() => {
                    setEditingTask(null);
                    setIsModalOpen(true);
                  }}
                  onOpenNewHabit={() => {
                    setEditingHabit(null);
                    setIsHabitModalOpen(true);
                  }}
                  isLoading={isInitialLoading}
                />
              }
            />
            <Route
              path="/habits"
              element={
                <HabitsPage
                  habits={habits}
                  onOpenNewHabit={() => {
                    setEditingHabit(null);
                    setIsHabitModalOpen(true);
                  }}
                  onEditHabit={(h) => {
                    setEditingHabit(h);
                    setIsHabitModalOpen(true);
                  }}
                  onDeleteHabit={handleDeleteHabit}
                  onToggleHabit={handleToggleHabit}
                />
              }
            />
            <Route
              path="/goals"
              element={
                <GoalsPage
                  goals={goals}
                  tasks={tasks}
                  onOpenNewGoal={() => {
                    setEditingGoal(null);
                    setIsGoalModalOpen(true);
                  }}
                  onEditGoal={(goal) => {
                    setEditingGoal(goal);
                    setIsGoalModalOpen(true);
                  }}
                  onDeleteGoal={handleDeleteGoal}
                  onStatusChange={handleStatusChange}
                />
              }
            />
            <Route
              path="/courses"
              element={
                <CoursesPage
                  courses={courses}
                  tasks={tasks}
                  onOpenNewCourse={() => {
                    setEditingCourse(null);
                    setIsCourseModalOpen(true);
                  }}
                  onEditCourse={(course) => {
                    setEditingCourse(course);
                    setIsCourseModalOpen(true);
                  }}
                  onDeleteCourse={handleDeleteCourse}
                  onIncrementLesson={handleIncrementLesson}
                  onStatusChange={handleStatusChange}
                />
              }
            />
            <Route
              path="/tasks"
              element={
                <TasksPage
                  tasks={tasks}
                  categories={categories}
                  goals={goals}
                  courses={courses}
                  onOpenNewTask={() => {
                    setEditingTask(null);
                    setIsModalOpen(true);
                  }}
                  onEditTask={(task) => {
                    setEditingTask(task);
                    setIsModalOpen(true);
                  }}
                  onDeleteTask={handleDeleteTask}
                  onStatusChange={handleStatusChange}
                />
              }
            />
            <Route
              path="/categories"
              element={
                <CategoriesPage
                  categories={categories}
                  onCreateCategory={handleCreateCategory}
                  onDeleteCategory={handleDeleteCategory}
                />
              }
            />
            <Route
              path="/analytics"
              element={<AnalyticsPage tasks={tasks} goals={goals} courses={courses} stats={stats} />}
            />
            <Route
              path="/settings"
              element={
                <SettingsPage
                  tasks={tasks}
                  goals={goals}
                  courses={courses}
                  habits={habits}
                  categories={categories}
                  onResetData={handleResetData}
                  onImportData={handleImportData}
                />
              }
            />
          </Route>
        </Route>

        {/* 404 Route */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>

      {/* Global Task Creation/Editing Modal */}
      <TaskModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateOrUpdateTask}
        task={editingTask}
        categories={categories}
        goals={goals}
        courses={courses}
      />

      {/* Global Goal Creation/Editing Modal */}
      <GoalModal
        isOpen={isGoalModalOpen}
        onClose={() => setIsGoalModalOpen(false)}
        onSubmit={handleCreateOrUpdateGoal}
        goal={editingGoal}
        tasks={tasks}
      />

      {/* Global Course Creation/Editing Modal */}
      <CourseModal
        isOpen={isCourseModalOpen}
        onClose={() => setIsCourseModalOpen(false)}
        onSubmit={handleCreateOrUpdateCourse}
        course={editingCourse}
        tasks={tasks}
      />

      {/* Global Habit Creation/Editing Modal */}
      <HabitModal
        isOpen={isHabitModalOpen}
        onClose={() => setIsHabitModalOpen(false)}
        onSubmit={handleCreateOrUpdateHabit}
        onDelete={handleDeleteHabit}
        habit={editingHabit}
      />

      {/* Celebratory Level Up Modal */}
      <LevelUpListener />
    </GamificationProvider>
  );
};

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <AuthenticatedApp />
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
