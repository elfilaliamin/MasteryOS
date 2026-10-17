# 📊 Upload & Analytics Endpoints

Endpoints for secure multipart asset uploads and real-time dashboard analytics aggregation.

---

## 1. Multipart File Upload

Uploads avatar images, course covers, or certificate documents with strict magic-byte validation.

- **Method**: `POST`
- **Route**: `/api/upload`
- **Auth Required**: Yes
- **Content-Type**: `multipart/form-data`
- **Max File Size**: 5 MB
- **Allowed MIME Types**: `image/png`, `image/jpeg`, `image/webp`, `application/pdf` (SVG disallowed)

### Form Data Fields
- `file`: Binary file blob

### Response (`200 OK`)
```json
{
  "success": true,
  "fileUrl": "/api/upload/file/82b3d11b-31d2-430c-b26a-9cf5d0b1a03e.webp",
  "filename": "82b3d11b-31d2-430c-b26a-9cf5d0b1a03e.webp",
  "mimetype": "image/webp",
  "size": 184512
}
```

---

## 2. Static File Delivery

Serves uploaded files with immutable caching headers.

- **Method**: `GET`
- **Route**: `/api/upload/file/:filename`
- **Auth Required**: No (UUID obfuscated)
- **Response Headers**:
  ```http
  Cache-Control: public, max-age=31536000, immutable
  X-Content-Type-Options: nosniff
  ```

---

## 3. Dashboard KPI Statistics

Aggregates operational metrics across all user resources.

- **Method**: `GET`
- **Route**: `/api/analytics/stats`
- **Auth Required**: Yes

### Response Example
```json
{
  "totalTasks": 48,
  "pendingTasks": 12,
  "inProgressTasks": 8,
  "completedTasks": 28,
  "overdueTasks": 2,
  "urgentTasks": 3,
  "completionRate": 58.3,
  "activeGoals": 4,
  "activeCourses": 3,
  "activeHabits": 5
}
```
