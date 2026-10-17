# 📡 API Conventions & Headers

The MasteryOS backend exposes a strict, JSON-based RESTful API designed with predictable response bodies, HTTP status codes, and standard security headers.

---

## Base URL

In production behind Nginx reverse proxy:
```
https://mydomain.com/api
```

Locally during development:
```
http://localhost/api
```

---

## Authentication & Headers

- **Authentication Transport**: Sessions are maintained through an `httpOnly`, `Secure`, `SameSite=Lax` cookie (`master_tasks_jwt`).
- **CSRF Token**: State-mutating requests (`POST`, `PUT`, `PATCH`, `DELETE`) require the `X-XSRF-TOKEN` or `X-CSRF-Token` header containing the value stored in the readable `XSRF-TOKEN` cookie.
- **Content-Type**: Requests with JSON bodies must specify `Content-Type: application/json`.
- **Response Caching**: All authenticated API responses include:
  ```http
  Cache-Control: private, no-cache, no-store, must-revalidate
  Pragma: no-cache
  Expires: 0
  ```

---

## Standard Error Response Format

All error responses from the API conform to the unified JSON error envelope:

```json
{
  "success": false,
  "message": "Validation error: 'title' must be at least 3 characters",
  "errors": [
    {
      "field": "title",
      "message": "String must contain at least 3 character(s)"
    }
  ]
}
```

---

## HTTP Status Codes

| Code | Meaning | Typical Usage |
|---|---|---|
| `200 OK` | Success | Successful data retrieval or entity mutation. |
| `201 Created` | Created | Successfully created a new task, goal, course, or category. |
| `400 Bad Request` | Bad Request | Zod payload validation failure or missing required fields. |
| `401 Unauthorized` | Unauthorized | Missing, expired, or invalid session token. |
| `403 Forbidden` | Forbidden | Cross-tenant attempt to access another user's resources. |
| `404 Not Found` | Not Found | Requested entity ID does not exist. |
| `429 Too Many Requests` | Rate Limited | Exceeded per-route request throttle threshold. |
| `500 Internal Server Error` | Server Error | Unhandled server exception (stack trace redacted in production). |
