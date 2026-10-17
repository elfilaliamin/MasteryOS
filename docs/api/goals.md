# 🎯 Strategic Goals API

Endpoints for tracking vision-level milestones, assigning tasks, and calculating completion progress.

---

## 1. List Goals

Returns all strategic goals belonging to the user, enriched with aggregated task counts and progress calculations.

- **Method**: `GET`
- **Route**: `/api/goals`
- **Auth Required**: Yes

### Response Item Example
```json
{
  "id": "90e2da12-c5eb-42bf-bd59-001cda8a0714",
  "title": "Launch MasteryOS Production v1.0",
  "description": "Deploy secure container stack and automated backup pipeline.",
  "due_date": "2026-11-01T00:00:00Z",
  "priority": "URGENT",
  "status": "IN_PROGRESS",
  "icon": "🚀",
  "total_tasks": 12,
  "completed_tasks": 9,
  "progress_percentage": 75
}
```

---

## 2. Create Goal

- **Method**: `POST`
- **Route**: `/api/goals`
- **Auth Required**: Yes

### Request Body
```json
{
  "title": "Master Advanced Cloud Infrastructure",
  "description": "Complete Kubernetes and distributed networking tracks.",
  "due_date": "2026-12-31T23:59:59Z",
  "priority": "HIGH",
  "icon": "🌐",
  "task_ids": ["c1f8f309-8d76-4d2a-a92c-567438bf5289"]
}
```

---

## 3. Update Goal

- **Method**: `PUT`
- **Route**: `/api/goals/:id`
- **Auth Required**: Yes

---

## 4. Delete Goal

- **Method**: `DELETE`
- **Route**: `/api/goals/:id`
- **Auth Required**: Yes (Unlinks associated tasks by setting `goal_id = NULL`)
