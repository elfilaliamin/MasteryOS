# 📚 Courses & Lessons API

Endpoints for tracking skill-building courses, incrementing lesson progression, and attaching certificates.

---

## 1. List Courses

- **Method**: `GET`
- **Route**: `/api/courses`
- **Auth Required**: Yes

### Response Item Example
```json
{
  "id": "7b819f04-884c-4e8c-85d1-13c59a35d97f",
  "title": "Full-Stack System Design Mastery",
  "platform": "Frontend Masters",
  "total_lessons": 40,
  "finished_lessons": 28,
  "cover_image_url": "/api/upload/file/course_cover_1.webp",
  "certificate_url": null,
  "is_completed": false,
  "progress_percentage": 70
}
```

---

## 2. Increment Lesson Counter

One-tap shortcut for incrementing finished lessons without submitting a full update payload.

- **Method**: `POST`
- **Route**: `/api/courses/:id/increment`
- **Auth Required**: Yes

### Response (`200 OK`)
```json
{
  "success": true,
  "finished_lessons": 29,
  "is_completed": false
}
```

---

## 3. Create Course

- **Method**: `POST`
- **Route**: `/api/courses`
- **Auth Required**: Yes

### Request Body
```json
{
  "title": "Advanced Distributed Systems",
  "platform": "MIT OpenCourseWare",
  "total_lessons": 24,
  "finished_lessons": 0,
  "cover_image_url": "/api/upload/file/system_design.jpg"
}
```

---

## 4. Delete Course

- **Method**: `DELETE`
- **Route**: `/api/courses/:id`
- **Auth Required**: Yes
