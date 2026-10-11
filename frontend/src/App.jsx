import { useState, useEffect, useCallback } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
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
import { CoursesPage } from './pages/CoursesPage';
import { HabitsPage } from './pages/HabitsPage';
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
import './App.css';

const INITIAL_CATEGORIES = [
  { id: 'cat-1', name: 'Work', color: '#3b82f6', task_count: 0 },
  { id: 'cat-2', name: 'Personal', color: '#10b981', task_count: 0 },
  { id: 'cat-3', name: 'Urgent', color: '#ef4444', task_count: 0 },
  { id: 'cat-4', name: 'Learning', color: '#8b5cf6', task_count: 0 }
];

const getLocalTasksKey = (userId) => (userId ? `mastery_local_tasks_${userId}` : 'mastery_local_tasks');

const getStoredTasks = (userId) => {
  try {
    const raw = localStorage.getItem(getLocalTasksKey(userId));
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    // ignore
  }
  return [];
};

const saveStoredTasks = (userId, tasksList) => {
  try {
    localStorage.setItem(getLocalTasksKey(userId), JSON.stringify(tasksList));
  } catch {
    // ignore
  }
};

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

// Inner Authenticated App
const AuthenticatedApp = () => {
  const { isAuthenticated, user } = useAuth();
  const [tasks, setTasks] = useState(() => getStoredTasks(user?.id));
  const [goals, setGoals] = useState([]);
  const [courses, setCourses] = useState([]);
  const [habits, setHabits] = useState([]);
  const [categories, setCategories] = useState([]);
  const [stats, setStats] = useState({});

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

  const [reloadTrigger, setReloadTrigger] = useState(0);
  const reloadData = useCallback(() => {
    setReloadTrigger((v) => v + 1);
  }, []);

  useEffect(() => {
    let isMounted = true;

    if (!isAuthenticated) {
      return;
    }

    const fetchData = async () => {
      try {
        const [tasksRes, catsRes, statsRes, goalsRes, coursesRes, habitsRes] = await Promise.allSettled([
          api.getTasks(),
          api.getCategories(),
          api.getStats(),
          api.getGoals(),
          api.getCourses(),
          api.getHabits()
        ]);

        if (!isMounted) return;

        if (tasksRes.status === 'fulfilled' && Array.isArray(tasksRes.value?.tasks)) {
          const serverTasks = tasksRes.value.tasks;
          const localTasks = getStoredTasks(user?.id);
          // Preserve any unsynced locally created tasks
          const pendingLocalTasks = localTasks.filter((lt) =>
            String(lt.id).startsWith('local-task-') && !serverTasks.some((st) => st.title === lt.title)
          );
          const mergedTasks = [...serverTasks, ...pendingLocalTasks];
          setTasks(mergedTasks);
          saveStoredTasks(user?.id, mergedTasks);

          // Background sync for pending local tasks
          if (pendingLocalTasks.length > 0) {
            for (const pending of pendingLocalTasks) {
              api.createTask(pending).then((res) => {
                if (res?.task && isMounted) {
                  setTasks((prev) => {
                    const updated = prev.map((t) => (t.id === pending.id ? res.task : t));
                    saveStoredTasks(user?.id, updated);
                    return updated;
                  });
                }
              }).catch(() => {});
            }
          }
        } else {
          // If server call fails, preserve cached tasks from localStorage
          const cached = getStoredTasks(user?.id);
          if (cached && cached.length > 0) {
            setTasks(cached);
          }
        }

        setGoals(goalsRes.status === 'fulfilled' && goalsRes.value?.goals ? goalsRes.value.goals : []);
        setCourses(coursesRes.status === 'fulfilled' && coursesRes.value?.courses ? coursesRes.value.courses : []);
        setHabits(habitsRes.status === 'fulfilled' && habitsRes.value?.habits ? habitsRes.value.habits : []);
        setCategories(catsRes.status === 'fulfilled' && catsRes.value?.categories && catsRes.value.categories.length > 0 ? catsRes.value.categories : INITIAL_CATEGORIES);
        if (statsRes.status === 'fulfilled' && statsRes.value?.stats) {
          setStats(statsRes.value.stats);
        }
      } catch (err) {
        console.warn('Network sync notice:', err.message);
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [isAuthenticated, user?.id, reloadTrigger]);

  // Global Data Reset
  const handleResetData = async () => {
    try {
      await api.resetUserData();
    } catch (err) {
      console.warn('API reset notice:', err.message);
    }
    setTasks([]);
    setGoals([]);
    setCourses([]);
    setHabits([]);
    setCategories(INITIAL_CATEGORIES);
    setStats({});
    if (user?.id) {
      localStorage.removeItem(`mastery_local_tasks_${user.id}`);
      localStorage.removeItem(`mastery_acknowledged_level_${user.id}`);
      localStorage.removeItem(`taskmaster_equipped_title_${user.id}`);
    }
    localStorage.removeItem('mastery_local_tasks');
    localStorage.removeItem('mastery_acknowledged_level');
    localStorage.removeItem('taskmaster_equipped_title');
    localStorage.removeItem('mastery_local_habits');
    reloadData();
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
      setTasks([]);
      setGoals([]);
      setCourses([]);
      setHabits([]);
      setCategories([]);
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
            (existingHabit?.completed_dates || []).map((d) => (typeof d === 'string' ? d.substring(0, 10) : formatDateKey(d)))
          );

          for (const dItem of datesToRestore) {
            const dateStr = typeof dItem === 'string' ? dItem.substring(0, 10) : formatDateKey(dItem);
            if (!existingDates.has(dateStr)) {
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

    if (restoredTasks.length > 0) {
      if (mode === 'replace') {
        setTasks(restoredTasks);
        saveStoredTasks(user?.id, restoredTasks);
      } else {
        setTasks((prev) => {
          const next = [...restoredTasks, ...prev];
          saveStoredTasks(user?.id, next);
          return next;
        });
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

    // 7. Full App Data Refresh
    reloadData();
  };

  // Task actions
  const handleCreateOrUpdateTask = async (taskData) => {
    // Map default category aliases (e.g. 'cat-1' -> Work) to real backend category UUID if available
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

    let serverTask = null;
    try {
      if (taskData.id && !String(taskData.id).startsWith('local-task-')) {
        const res = await api.updateTask(taskData.id, payloadToSend);
        serverTask = res?.task;
      } else {
        const res = await api.createTask(payloadToSend);
        serverTask = res?.task;
      }
      api.getStats().then((sRes) => sRes?.stats && setStats(sRes.stats)).catch(() => {});
    } catch (err) {
      console.warn('Task server sync notice (stored locally):', err.message);
    }

    const assignedGoal = goals.find((g) => g.id === taskData.goal_id);
    const assignedCourse = courses.find((c) => c.id === taskData.course_id);
    const assignedCat = categories.find((c) => c.id === (resolvedCategoryId || taskData.category_id));

    if (taskData.id) {
      setTasks((prev) => {
        const next = prev.map((t) =>
          t.id === taskData.id
            ? {
                ...t,
                ...taskData,
                category_id: resolvedCategoryId || taskData.category_id,
                category_name: assignedCat?.name || t.category_name || '',
                category_color: assignedCat?.color || t.category_color || '#0d8a72',
                goal_title: assignedGoal ? assignedGoal.title : null,
                goal_icon: assignedGoal ? assignedGoal.icon : null,
                goal_color: assignedGoal ? assignedGoal.color : null,
                course_title: assignedCourse ? assignedCourse.title : null
              }
            : t
        );
        saveStoredTasks(user?.id, next);
        return next;
      });
    } else {
      const newTask = serverTask || {
        ...taskData,
        id: `local-task-${Date.now()}`,
        created_at: new Date().toISOString(),
        category_id: resolvedCategoryId || taskData.category_id,
        category_name: assignedCat?.name || '',
        category_color: assignedCat?.color || '#0d8a72',
        goal_title: assignedGoal ? assignedGoal.title : null,
        goal_icon: assignedGoal ? assignedGoal.icon : null,
        goal_color: assignedGoal ? assignedGoal.color : null,
        course_title: assignedCourse ? assignedCourse.title : null
      };
      setTasks((prev) => {
        const next = [newTask, ...prev];
        saveStoredTasks(user?.id, next);
        return next;
      });
    }
  };

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      if (!String(taskId).startsWith('local-task-')) {
        await api.updateTaskStatus(taskId, newStatus);
      }
      api.getStats().then((sRes) => sRes?.stats && setStats(sRes.stats)).catch(() => {});
    } catch {
      // Optimistic update
    }

    setTasks((prev) => {
      const next = prev.map((t) => {
        if (t.id === taskId) {
          const completedAt =
            newStatus === 'COMPLETED'
              ? (t.completed_at || new Date().toISOString())
              : null;
          return { ...t, status: newStatus, completed_at: completedAt };
        }
        return t;
      });
      saveStoredTasks(user?.id, next);
      return next;
    });
  };

  const handleDeleteTask = async (taskId) => {
    try {
      if (!String(taskId).startsWith('local-task-')) {
        await api.deleteTask(taskId);
      }
      api.getStats().then((sRes) => sRes?.stats && setStats(sRes.stats)).catch(() => {});
    } catch {
      // Local removal
    }
    setTasks((prev) => {
      const next = prev.filter((t) => t.id !== taskId);
      saveStoredTasks(user?.id, next);
      return next;
    });
  };

  // Goal actions
  const handleCreateOrUpdateGoal = async (goalData) => {
    const goalId = goalData.id || `local-goal-${Date.now()}`;

    try {
      if (goalData.id) {
        await api.updateGoal(goalData.id, goalData);
      } else {
        await api.createGoal(goalData);
      }
    } catch {
      // Local optimistic update
    }

    if (goalData.id) {
      setGoals((prev) =>
        prev.map((g) => (g.id === goalData.id ? { ...g, ...goalData } : g))
      );
    } else {
      const newGoal = {
        ...goalData,
        id: goalId,
        created_at: new Date().toISOString()
      };
      setGoals((prev) => [newGoal, ...prev]);
    }

    // Sync task assignments
    if (Array.isArray(goalData.task_ids)) {
      setTasks((prev) =>
        prev.map((task) => {
          if (goalData.task_ids.includes(task.id)) {
            return {
              ...task,
              goal_id: goalId,
              goal_title: goalData.title,
              goal_icon: goalData.icon,
              goal_color: goalData.color
            };
          } else if (task.goal_id === goalData.id) {
            return { ...task, goal_id: null, goal_title: null, goal_icon: null, goal_color: null };
          }
          return task;
        })
      );
    }
  };

  const handleDeleteGoal = async (goalId) => {
    try {
      await api.deleteGoal(goalId);
    } catch {
      // Local removal
    }
    setGoals((prev) => prev.filter((g) => g.id !== goalId));
    setTasks((prev) =>
      prev.map((t) => (t.goal_id === goalId ? { ...t, goal_id: null, goal_title: null } : t))
    );
  };

  // Course actions
  const handleCreateOrUpdateCourse = async (courseData) => {
    const courseId = courseData.id || `local-course-${Date.now()}`;

    try {
      if (courseData.id) {
        await api.updateCourse(courseData.id, courseData);
      } else {
        await api.createCourse(courseData);
      }
    } catch {
      // Local optimistic update
    }

    if (courseData.id) {
      setCourses((prev) =>
        prev.map((c) => (c.id === courseData.id ? { ...c, ...courseData } : c))
      );
    } else {
      const newCourse = {
        ...courseData,
        id: courseId,
        created_at: new Date().toISOString()
      };
      setCourses((prev) => [newCourse, ...prev]);
    }

    // Sync task assignments
    if (Array.isArray(courseData.task_ids)) {
      setTasks((prev) =>
        prev.map((task) => {
          if (courseData.task_ids.includes(task.id)) {
            return {
              ...task,
              course_id: courseId,
              course_title: courseData.title
            };
          } else if (task.course_id === courseData.id) {
            return { ...task, course_id: null, course_title: null };
          }
          return task;
        })
      );
    }
  };

  const handleIncrementLesson = async (courseId) => {
    try {
      await api.incrementCourseLesson(courseId);
    } catch {
      // Local update
    }

    setCourses((prev) =>
      prev.map((c) => {
        if (c.id === courseId) {
          const nextFinished = Math.min(c.total_lessons, (c.finished_lessons || 0) + 1);
          return {
            ...c,
            finished_lessons: nextFinished
          };
        }
        return c;
      })
    );
  };

  const handleDeleteCourse = async (courseId) => {
    try {
      await api.deleteCourse(courseId);
    } catch {
      // Local removal
    }
    setCourses((prev) => prev.filter((c) => c.id !== courseId));
    setTasks((prev) =>
      prev.map((t) => (t.course_id === courseId ? { ...t, course_id: null, course_title: null } : t))
    );
  };

  // Category actions
  const handleCreateCategory = async (catData) => {
    try {
      const res = await api.createCategory(catData);
      if (res.category) {
        setCategories((prev) => [...prev, res.category]);
        return;
      }
    } catch {
      // Local creation
    }
    setCategories((prev) => [
      ...prev,
      { id: `cat-${Date.now()}`, name: catData.name, color: catData.color, task_count: 0 }
    ]);
  };

  const handleDeleteCategory = async (catId) => {
    try {
      await api.deleteCategory(catId);
    } catch {
      // Local deletion
    }
    setCategories((prev) => prev.filter((c) => c.id !== catId));
  };

  // Habit actions
  const handleCreateOrUpdateHabit = async (habitData) => {
    const habitId = habitData.id || `local-habit-${Date.now()}`;
    try {
      if (habitData.id) {
        await api.updateHabit(habitData.id, habitData);
      } else {
        await api.createHabit(habitData);
      }
    } catch {
      // Local optimistic update
    }

    if (habitData.id) {
      setHabits((prev) =>
        prev.map((h) => (h.id === habitData.id ? { ...h, ...habitData } : h))
      );
    } else {
      const newHabit = {
        ...habitData,
        id: habitId,
        completed_dates: [],
        total_completions: 0,
        current_streak: 0,
        longest_streak: 0,
        created_at: new Date().toISOString()
      };
      setHabits((prev) => [...prev, newHabit]);
    }
  };

  const handleToggleHabit = async (habitId, targetDate = null) => {
    const dateKey = targetDate || (() => {
      const d = new Date();
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    })();

    try {
      await api.toggleHabit(habitId, dateKey);
    } catch {
      // Local optimistic update
    }

    setHabits((prev) =>
      prev.map((h) => {
        if (h.id === habitId) {
          const currentDates = new Set(h.completed_dates || []);
          if (currentDates.has(dateKey)) {
            currentDates.delete(dateKey);
          } else {
            currentDates.add(dateKey);
          }

          // Streak calculation
          const todayKey = (() => {
            const d = new Date();
            const year = d.getFullYear();
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
          })();

          let streak = 0;
          let checkD = new Date();
          if (!currentDates.has(todayKey)) {
            checkD.setDate(checkD.getDate() - 1);
          }
          while (true) {
            const y = checkD.getFullYear();
            const m = String(checkD.getMonth() + 1).padStart(2, '0');
            const day = String(checkD.getDate()).padStart(2, '0');
            const k = `${y}-${m}-${day}`;
            if (currentDates.has(k)) {
              streak++;
              checkD.setDate(checkD.getDate() - 1);
            } else {
              break;
            }
          }

          const newDatesArray = Array.from(currentDates);
          return {
            ...h,
            completed_dates: newDatesArray,
            current_streak: streak,
            longest_streak: Math.max(h.longest_streak || 0, streak)
          };
        }
        return h;
      })
    );
  };

  const handleDeleteHabit = async (habitId) => {
    try {
      await api.deleteHabit(habitId);
    } catch {
      // Local removal
    }
    setHabits((prev) => prev.filter((h) => h.id !== habitId));
  };

  return (
    <GamificationProvider tasks={tasks} goals={goals} courses={courses} habits={habits}>
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
