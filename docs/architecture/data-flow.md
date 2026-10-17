# 🔄 Data Flow & State Management

MasteryOS implements a unidirectional, reactive client-server synchronization architecture powered by **TanStack React Query** and **PostgreSQL**.

---

## State Architecture

```
  ┌───────────────────────────────────────────────────────────────┐
  │                        User Action                            │
  │     (e.g., Drag task to "COMPLETED" or toggle habit streak)    │
  └───────────────────────────────┬───────────────────────────────┘
                                  │
                                  ▼
  ┌───────────────────────────────────────────────────────────────┐
  │                 Optimistic UI Update (React Query)            │
  │     • Immediately renders target state to user                │
  │     • Snapshot previous state for rollback on error           │
  └───────────────────────────────┬───────────────────────────────┘
                                  │
                                  ▼
  ┌───────────────────────────────────────────────────────────────┐
  │                   Axios API Client (api.js)                   │
  │     • Attaches XSRF-TOKEN CSRF header                         │
  │     • Sends secure httpOnly Cookie automatically              │
  │     • Invokes PATCH /api/tasks/:id/status or POST toggle      │
  └───────────────────────────────┬───────────────────────────────┘
                                  │
                                  ▼
  ┌───────────────────────────────────────────────────────────────┐
  │                 Express Multi-Tenant Route Guard              │
  │     • verifyJWT extracts and verifies user_id from token      │
  │     • Zod schema validates parameters & payload               │
  │     • Verifies resource ownership (WHERE id = $1 AND user_id) │
  └───────────────────────────────┬───────────────────────────────┘
                                  │
                                  ▼
  ┌───────────────────────────────────────────────────────────────┐
  │                 PostgreSQL Database Query                     │
  │     • Executes parameterized SQL update                       │
  │     • Computes activity audit trail log                       │
  │     • Returns updated record payload                          │
  └───────────────────────────────┬───────────────────────────────┘
                                  │
                                  ▼
  ┌───────────────────────────────────────────────────────────────┐
  │               Client Cache Invalidation & Sync                │
  │     • queryClient.invalidateQueries(['tasks'])                │
  │     • queryClient.invalidateQueries(['taskStats'])            │
  │     • User level progress & XP refreshed automatically        │
  └───────────────────────────────────────────────────────────────┘
```

---

## Query Keys & Invalidation Matrix

React Query caches server state under deterministic query keys:

- `['tasks']`: Cached task lists and Kanban board data.
- `['taskStats']`: Aggregate KPI metrics (total, pending, completed, overdue).
- `['categories']`: User-defined category badges.
- `['goals']`: Strategic goals and linked task progress.
- `['courses']`: In-progress and completed courses.
- `['habits']`: Active daily habits with 7-day completion matrices.
- `['userProfile']`: Authenticated user profile, settings, and gamification level.
