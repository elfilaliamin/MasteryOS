# 📋 Tasks & Categories API

Endpoints for querying, creating, modifying, filtering, and organizing task items and taxonomy categories.

---

## 1. List Tasks

Fetches paginated, multi-filter task lists scoped to the authenticated user.

- **Method**: `GET`
- **Route**: `/api/tasks`
- **Auth Required**: Yes
- **Query Parameters**:
  - `status`: `TODO` | `IN_PROGRESS` | `IN_REVIEW` | `COMPLETED`
  - `priority`: `LOW` | `MEDIUM` | `HIGH` | `URGENT`
  - `category_id`: UUID
  - `goal_id`: UUID
  - `course_id`: UUID
  - `search`: String (matches title and description)
  - `limit`: Integer (Default: 50, Max: 100)
  - `offset`: Integer (Default: 0)

---

## 2. Create Task

Creates a task and validates cross-entity ownership if `category_id`, `goal_id`, or `course_id` are provided.

- **Method**: `POST`
- **Route**: `/api/tasks`
- **Auth Required**: Yes

### Request Body
```json
{
  "title": "Complete Security Audit for API Gateway",
  "description": "Inspect CORS headers, CSP policies, and brute-force rate limiters.",
  "status": "TODO",
  "priority": "HIGH",
  "category_id": "c1f8f309-8d76-4d2a-a92c-567438bf5289",
  "goal_id": "90e2da12-c5eb-42bf-bd59-001cda8a0714",
  "due_date": "2026-10-25T18:00:00Z",
  "estimated_minutes": 120
}
```

---

## 3. Quick Update Task Status

Lightweight PATCH route optimized for Kanban board drag-and-drop operations. Automatically timestamps `completed_at` when transitioned to `COMPLETED`.

- **Method**: `PATCH`
- **Route**: `/api/tasks/:id/status`
- **Auth Required**: Yes

### Request Body
```json
{
  "status": "COMPLETED"
}
```

---

## 4. Delete Task

Permanently deletes a task and associated activity logs.

- **Method**: `DELETE`
- **Route**: `/api/tasks/:id`
- **Auth Required**: Yes

---

## 5. Category Endpoints

### List Categories
- **Method**: `GET`
- **Route**: `/api/categories`

### Create Category
- **Method**: `POST`
- **Route**: `/api/categories`
- **Body**: `{ "name": "Deep Work", "color": "#0d8a72" }`

### Delete Category
- **Method**: `DELETE`
- **Route**: `/api/categories/:id`
