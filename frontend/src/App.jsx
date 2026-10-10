import { useState, useEffect } from 'react';
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
  const [tasks, setTasks] = useState([]);
  const [goals, setGoals] = useState([]);
  const [courses, setCourses] = useState([]);
  const [habits, setHabits] = useState([]);
  const [categories, setCategories] = useState([]);
  const [stats, setStats] = useState({});
  const [searchQuery, setSearchQuery] = useState('');

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

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      if (!isAuthenticated) {
        if (isMounted) {
          setTasks([]);
          setGoals([]);
          setCourses([]);
          setHabits([]);
          setCategories([]);
          setStats({});
        }
        return;
      }

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

        if (tasksRes.status === 'fulfilled' && tasksRes.value?.tasks) {
          setTasks(tasksRes.value.tasks);
        } else {
          setTasks([]);
        }

        if (goalsRes.status === 'fulfilled' && goalsRes.value?.goals) {
          setGoals(goalsRes.value.goals);
        } else {
          setGoals([]);
        }

        if (coursesRes.status === 'fulfilled' && coursesRes.value?.courses) {
          setCourses(coursesRes.value.courses);
        } else {
          setCourses([]);
        }

        if (habitsRes.status === 'fulfilled' && habitsRes.value?.habits) {
          setHabits(habitsRes.value.habits);
        } else {
          setHabits([]);
        }

        if (catsRes.status === 'fulfilled' && catsRes.value?.categories && catsRes.value.categories.length > 0) {
          setCategories(catsRes.value.categories);
        } else {
          setCategories(INITIAL_CATEGORIES);
        }

        if (statsRes.status === 'fulfilled' && statsRes.value?.stats) {
          setStats(statsRes.value.stats);
        }
      } catch (err) {
        console.warn('Network sync notice:', err.message);
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, [isAuthenticated, user?.id]);

  // Task actions
  const handleCreateOrUpdateTask = async (taskData) => {
    try {
      if (taskData.id) {
        await api.updateTask(taskData.id, taskData);
      } else {
        await api.createTask(taskData);
      }
    } catch {
      // Local optimistic update
    }

    const assignedGoal = goals.find((g) => g.id === taskData.goal_id);
    const assignedCourse = courses.find((c) => c.id === taskData.course_id);

    if (taskData.id) {
      setTasks((prev) =>
        prev.map((t) =>
          t.id === taskData.id
            ? {
                ...t,
                ...taskData,
                goal_title: assignedGoal ? assignedGoal.title : null,
                goal_icon: assignedGoal ? assignedGoal.icon : null,
                goal_color: assignedGoal ? assignedGoal.color : null,
                course_title: assignedCourse ? assignedCourse.title : null
              }
            : t
        )
      );
    } else {
      const newTask = {
        ...taskData,
        id: `local-task-${Date.now()}`,
        created_at: new Date().toISOString(),
        category_name: categories.find((c) => c.id === taskData.category_id)?.name || '',
        category_color: categories.find((c) => c.id === taskData.category_id)?.color || '#0d8a72',
        goal_title: assignedGoal ? assignedGoal.title : null,
        goal_icon: assignedGoal ? assignedGoal.icon : null,
        goal_color: assignedGoal ? assignedGoal.color : null,
        course_title: assignedCourse ? assignedCourse.title : null
      };
      setTasks((prev) => [newTask, ...prev]);
    }
  };

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      await api.updateTaskStatus(taskId, newStatus);
    } catch {
      // Optimistic update
    }

    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          const completedAt =
            newStatus === 'COMPLETED'
              ? (t.completed_at || new Date().toISOString())
              : null;
          return { ...t, status: newStatus, completed_at: completedAt };
        }
        return t;
      })
    );
  };

  const handleDeleteTask = async (taskId) => {
    try {
      await api.deleteTask(taskId);
    } catch {
      // Local removal
    }
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
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
    <GamificationProvider tasks={tasks} goals={goals} courses={courses}>
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
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
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
                  searchQuery={searchQuery}
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
              element={<SettingsPage />}
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
