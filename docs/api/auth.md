# 🔐 Authentication & Session Endpoints

User registration, authentication, session renewal, and password lifecycle management.

---

## 1. Register User

Creates a new account and immediately establishes an authenticated session cookie.

- **Method**: `POST`
- **Route**: `/api/auth/register`
- **Rate Limit**: 10 requests / 15 minutes per IP

### Request Body
```json
{
  "full_name": "Jane Doe",
  "email": "jane@example.com",
  "password": "SecurePassword123!"
}
```

### Response (`201 Created`)
```json
{
  "success": true,
  "message": "User registered successfully",
  "user": {
    "id": "e6a4fd60-70f9-4ea0-98df-823e53f1f3e7",
    "email": "jane@example.com",
    "full_name": "Jane Doe",
    "avatar_url": null,
    "equipped_title": "Novice Explorer"
  }
}
```

---

## 2. Login User

Validates email and password, returning user data and setting `master_tasks_jwt` in an httpOnly cookie.

- **Method**: `POST`
- **Route**: `/api/auth/login`
- **Rate Limit**: 10 requests / 15 minutes per IP

### Request Body
```json
{
  "email": "jane@example.com",
  "password": "SecurePassword123!"
}
```

### Response (`200 OK`)
```json
{
  "success": true,
  "message": "Login successful",
  "user": {
    "id": "e6a4fd60-70f9-4ea0-98df-823e53f1f3e7",
    "email": "jane@example.com",
    "full_name": "Jane Doe",
    "avatar_url": null,
    "equipped_title": "Novice Explorer"
  }
}
```

---

## 3. Verify Active Session (`/me`)

Validates the incoming session cookie and returns current profile data.

- **Method**: `GET`
- **Route**: `/api/auth/me`
- **Auth Required**: Yes

### Response (`200 OK`)
```json
{
  "success": true,
  "user": {
    "id": "e6a4fd60-70f9-4ea0-98df-823e53f1f3e7",
    "email": "jane@example.com",
    "full_name": "Jane Doe",
    "avatar_url": null,
    "equipped_title": "Productivity Architect",
    "settings": {
      "theme": "dark",
      "dashboardOrder": ["stats", "urgent", "deadlines", "courses", "goals", "habits"]
    }
  }
}
```

---

## 4. Logout User

Revokes and clears the `master_tasks_jwt` session cookie.

- **Method**: `POST`
- **Route**: `/api/auth/logout`
- **Auth Required**: Yes

---

## 5. Change Password

Requires verification of the current password before updating to the new password and incrementing `token_version`.

- **Method**: `POST`
- **Route**: `/api/auth/change-password`
- **Auth Required**: Yes

### Request Body
```json
{
  "currentPassword": "OldPassword123!",
  "newPassword": "NewSuperPassword456!"
}
```
