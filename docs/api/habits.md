# 🔥 Habits & Streaks Matrix API

Endpoints for managing daily disciplines, toggling daily completions, and calculating historical streaks.

---

## 1. List Habits

Returns user habits with computed current streak, longest streak, and history map for the last 30 days.

- **Method**: `GET`
- **Route**: `/api/habits`
- **Auth Required**: Yes

---

## 2. Toggle Habit for Date

Toggles the completion status for a specific date (defaults to today `YYYY-MM-DD`). Automatically updates current and longest streaks.

- **Method**: `POST`
- **Route**: `/api/habits/:id/toggle`
- **Auth Required**: Yes

### Request Body
```json
{
  "date": "2026-10-17"
}
```

### Response (`200 OK`)
```json
{
  "success": true,
  "completed": true,
  "streak_count": 14,
  "longest_streak": 21
}
```

---

## 3. Create Habit

- **Method**: `POST`
- **Route**: `/api/habits`
- **Auth Required**: Yes

### Request Body
```json
{
  "title": "90 Minutes Deep Work",
  "description": "Zero notifications, code review & architecture execution.",
  "time_of_day": "MORNING",
  "icon": "⚡",
  "color": "#0d8a72"
}
```

---

## 4. Delete Habit

- **Method**: `DELETE`
- **Route**: `/api/habits/:id`
- **Auth Required**: Yes
