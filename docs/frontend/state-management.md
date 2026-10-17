# ⚡ State Management (React Query)

MasteryOS utilizes **TanStack React Query** (`@tanstack/react-query`) for asynchronous server state synchronization, query caching, and optimistic mutations.

---

## Global QueryClient Configuration

In `src/main.jsx`:

```javascript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2,       // 2 minutes before marking data stale
      gcTime: 1000 * 60 * 10,         // 10 minutes cache garbage collection
      refetchOnWindowFocus: true,     // Auto-sync when returning to tab
      retry: 1                        // Fast error response
    }
  }
});
```

---

## Custom Hooks Architecture

State access is strictly encapsulated into domain-specific hooks:

- **`useTasks(filters)`**: Fetches and filters task records for Kanban and List views.
- **`useTaskMutations()`**: Provides `createTask`, `updateTask`, `deleteTask`, and `updateStatus` with optimistic rollback guards.
- **`useGoals()` & `useGoalMutations()`**: Handles strategic milestones and assigned tasks.
- **`useCourses()` & `useCourseMutations()`**: Handles courses and one-tap `incrementLesson`.
- **`useHabits()` & `useHabitMutations()`**: Handles habits and instant optimistic date toggling.
- **`useCategories()` & `useCategoryMutations()`**: Manages tag taxonomy.
- **`useTaskStats()`**: Supplies authoritative dashboard metrics directly from the server.
- **`useUserProfile()`**: Manages theme, settings, and profile info without fragmented localStorage dependencies.
