# 📋 Master Tasks Tracker - Architecture Plan & Development Roadmap

> **Project Name:** Master Tasks Tracker  
> **Status:** Completed & Ready for Deployment  
> **Created:** 2026-10-10  
> **Author:** Antigravity AI Assistant & Engineering Lead  
> **Stack:** React 19 + Tailwind CSS v4 (Vite) | Node.js (node:26-slim) + Express | PostgreSQL (postgres:16-alpine) | Nginx (nginx:alpine) | Docker Compose

---

## 📑 Table of Contents
1. [Executive Summary & Architecture Overview](#1-executive-summary--architecture-overview)
2. [Docker Containerization Architecture](#2-docker-containerization-architecture)
3. [Database Schema & Persistent Volumes](#3-database-schema--persistent-volumes)
4. [Backend API Architecture](#4-backend-api-architecture)
5. [Frontend Pages & Components Plan](#5-frontend-pages--components-plan)
6. [Security, Best Practices & Standards](#6-security-best-practices--standards)
7. [Step-by-Step Development Roadmap & Tasks](#7-step-by-step-development-roadmap--tasks)

---

## 1. Executive Summary & Architecture Overview

The **Master Tasks Tracker** is a production-grade, full-stack task and productivity management application designed to handle personal and team workflows with modern responsiveness, real-time feedback, and high visual aesthetics.

### High-Level System Architecture
```
                         +-----------------------------+
                         |        Web Browser          |
                         +-----------------------------+
                                        |
                                  Port 80 / 443
                                        v
+---------------------------------------------------------------------------------+
|                                 Docker Network                                  |
|                                                                                 |
|   +--------------------------+                +-----------------------------+   |
|   |   Frontend Container     |                |      Backend Container      |   |
|   |     (nginx:alpine)       | -- /api/* ---> |       (node:26-slim)        |   |
|   |                          |                |    Express REST API Server  |   |
|   | Serves Vite React 19 SPA |                +-----------------------------+   |
|   +--------------------------+                               |                  |
|                                                     Port 5432|                  |
|                                                              v                  |
|                                               +-----------------------------+   |
|                                               |      Database Container     |   |
|                                               |     (postgres:16-alpine)    |   |
|                                               |   PostgreSQL Relational DB  |   |
|                                               +-----------------------------+   |
|                                                              |                  |
|                                                              v                  |
|                                                     [ postgres_data Volume ]    |
+---------------------------------------------------------------------------------+
```

---

## 2. Docker Containerization Architecture

The project uses three explicit container images as requested:
1. **`nginx:alpine`**: Lightweight reverse proxy and static asset web server.
   - Serves the built React single-page application.
   - Handles client-side routing fallback (`try_files $uri $uri/ /index.html;`).
   - Proxies `/api/` requests seamlessly to the backend container to avoid CORS issues in production.
2. **`node:26-slim`**: Minimal Debian-based Node.js container for running the Express API backend.
   - Runs with non-root security principles where possible.
   - Uses native ESM and optimized dependencies.
3. **`postgres:16-alpine`**: High-performance, lightweight PostgreSQL container.
   - Houses all relational data with automated health checks.
   - Stores data in a persistent Docker volume (`postgres_data`).

### Directory & Docker Structure
```
React Projects/
├── docker-compose.yml         # Multi-container orchestration
├── .env.example               # Environment template for Docker & local dev
├── MasteryOS-Plan-Tracker.md    # This living master roadmap document
├── frontend/
│   ├── Dockerfile             # Multi-stage build (build -> nginx:alpine)
│   ├── nginx.conf             # Production Nginx reverse proxy configuration
│   ├── .dockerignore          # Docker build exclusion rules
│   ├── package.json
│   ├── vite.config.js
│   └── src/
└── backend/
    ├── Dockerfile             # node:26-slim server build
    ├── .dockerignore          # Docker build exclusion rules
    ├── package.json
    ├── .env
    └── src/
```

---

## 3. Database Schema & Persistent Volumes

### Persistent Volume Configuration
A named volume `postgres_data` is mounted to `/var/lib/postgresql/data` within the `db` container. This ensures all users, categories, and tasks persist across container restarts, teardowns, and upgrades.

### PostgreSQL Relational Schema

```sql
-- 1. Users Table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Categories / Tags Table
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(50) NOT NULL,
    color VARCHAR(7) DEFAULT '#6366f1', -- Hex color
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_user_category UNIQUE (user_id, name)
);

-- 3. Tasks Table
CREATE TYPE task_status AS ENUM ('TODO', 'IN_PROGRESS', 'IN_REVIEW', 'COMPLETED');
CREATE TYPE task_priority AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status task_status DEFAULT 'TODO',
    priority task_priority DEFAULT 'MEDIUM',
    due_date TIMESTAMP WITH TIME ZONE,
    estimated_minutes INTEGER DEFAULT 0,
    is_archived BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Task Activity / History Table
CREATE TABLE task_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    action_type VARCHAR(50) NOT NULL, -- 'CREATED', 'STATUS_CHANGED', 'EDITED', etc.
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for maximum query performance
CREATE INDEX idx_tasks_user_id ON tasks(user_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);
CREATE INDEX idx_categories_user_id ON categories(user_id);
```

---

## 4. Backend API Architecture

Built with **Node.js (`node:26-slim`) + Express (ES Modules)**, incorporating strict parameter validation, JWT authentication, and structured error handling.

### Directory Structure
```
backend/
├── src/
│   ├── config/          # Database connection pool & environment configs
│   ├── controllers/     # Request handlers (auth, tasks, categories, analytics)
│   ├── middleware/      # Auth guard (verifyJWT), rateLimiter, errorHandler, validator
│   ├── models/          # Database query abstractions
│   ├── routes/          # Express route definitions
│   │   ├── auth.routes.js
│   │   ├── tasks.routes.js
│   │   ├── categories.routes.js
│   │   └── analytics.routes.js
│   ├── utils/           # JWT generator, bcrypt helper, logger
│   └── app.js           # Express app setup & middleware pipeline
├── server.js            # Entry point listening on port 5000
└── package.json
```

### Endpoints Specification

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/auth/register` | Register new user account with validation | No |
| `POST` | `/api/auth/login` | Authenticate user & return JWT token + user profile | No |
| `GET` | `/api/auth/me` | Fetch authenticated user profile | Yes |
| `GET` | `/api/tasks` | Get paginated tasks with filters (status, priority, search, category) | Yes |
| `POST` | `/api/tasks` | Create a new task | Yes |
| `GET` | `/api/tasks/:id` | Get single task with its activity history | Yes |
| `PUT` | `/api/tasks/:id` | Update task details | Yes |
| `PATCH` | `/api/tasks/:id/status` | Quick update status (for Kanban drag & drop) | Yes |
| `DELETE` | `/api/tasks/:id` | Delete task | Yes |
| `GET` | `/api/categories` | List user's custom categories | Yes |
| `POST` | `/api/categories` | Create custom category | Yes |
| `DELETE` | `/api/categories/:id`| Remove custom category | Yes |
| `GET` | `/api/analytics/stats` | Dashboard statistics (counts by status, priority, upcoming deadlines) | Yes |
| `GET` | `/api/health` | Container health check endpoint | No |

---

## 5. Frontend Pages & Components Plan

The frontend is built using **React 19**, **Vite**, **Tailwind CSS v4**, and **Lucide Icons** for a responsive, modern interface.

### Pages & What Each Stands For

1. **`LoginPage.jsx` (`/login`)**:
   - **Purpose:** Secure entry portal for registered users.
   - **Features:** Clean glassmorphism card, email & password fields, show/hide password toggle, inline validation, and link to register.
2. **`RegisterPage.jsx` (`/register`)**:
   - **Purpose:** Seamless onboarding flow for new users.
   - **Features:** Full name, email, password with live strength indicator, confirm password check, terms acknowledgment, and instant transition to the dashboard.
3. **`DashboardPage.jsx` (`/`)**:
   - **Purpose:** High-level command center giving users immediate situational awareness.
   - **Features:** Metric cards (Total Tasks, Pending, In Progress, Completed), urgent deadline alerts, priority breakdown charts, and a "Quick Add Task" widget.
4. **`TasksPage.jsx` (`/tasks`)**:
   - **Purpose:** The core interactive task management workspace.
   - **Features:** Toggle between **Kanban Board View** (columns: To Do, In Progress, In Review, Completed) and **List View** with sorting, search query filtering, category filters, and bulk status updates.
5. **`CategoriesPage.jsx` (`/categories`)**:
   - **Purpose:** Taxonomy management for organizing tasks by project, department, or life domain.
   - **Features:** Color picker, badge preview, task count per category, create/edit/delete category modals.
6. **`AnalyticsPage.jsx` (`/analytics`)**:
   - **Purpose:** Deep-dive productivity insights and task completion velocity.
   - **Features:** Completion trends, workload distribution by priority, overdue tasks ratio.
7. **`NotFoundPage.jsx` (`*`)**:
   - **Purpose:** User-friendly fallback for non-existent routes with quick return navigation.

---

### Component Breakdown & Roles

#### A. Layout & Navigation
- **`AppLayout`**: Wraps authenticated pages with the unified sidebar, top navigation bar, and responsive main content area.
- **`Sidebar`**: Collapsible navigation rail featuring brand logo, active route indicators, quick category shortcuts, and theme toggle.
- **`Navbar`**: Top bar with search input, notifications indicator, and user profile avatar dropdown (logout, profile).
- **`AuthLayout`**: Centered, distraction-free container with background accents for Login and Register pages.

#### B. Task Feature Components
- **`TaskCard`**: Draggable/clickable card displaying title, truncated description, priority badge, category pill, due date badge (highlighted if overdue), and quick-action menu (Edit, Delete, Move).
- **`TaskColumn`**: Kanban column container representing a specific status (`TODO`, `IN_PROGRESS`, `IN_REVIEW`, `COMPLETED`), showing count and drop zone.
- **`TaskListView`**: Table/list alternative to Kanban with column sort headers.
- **`TaskModal`**: Dynamic modal used for both creating new tasks and editing existing tasks, with full validation.
- **`TaskDetailDrawer`**: Slide-over panel showing full details, time spent, activity history, and status change buttons.
- **`TaskFilters`**: Filter bar with search bar, priority dropdown, category chips, and view toggle (Board vs List).

#### C. Common & Design System UI Components
- **`Button`**: Polished button supporting variants (`primary`, `secondary`, `outline`, `ghost`, `danger`) and loading spinner state.
- **`Input`**: Standardized input with floating labels/icons, clear error messages, and dark mode support.
- **`Badge`**: Small semantic pill for status (`TODO`, `IN_PROGRESS`, etc.) and priority (`LOW`, `HIGH`, `URGENT`).
- **`Modal`**: Accessible dialog backdrop with smooth scale-in animation and escape key handling.
- **`Card`**: Elevated surface with subtle borders, hover elevation, and dark mode styling.
- **`EmptyState`**: Friendly visual illustration when no tasks or categories match the filter.
- **`Toast`**: Non-blocking toast notifications for successes (e.g., "Task created!"), errors, and warnings.

#### D. Auth & Routing Guards
- **`ProtectedRoute`**: Inspects user authentication state; redirects unauthenticated visitors to `/login`.
- **`PublicOnlyRoute`**: Prevents logged-in users from seeing `/login` or `/register`, redirecting them to `/`.
- **`AuthContext`**: Global state provider managing user session, login, logout, and token persistence in local storage or cookies.

#### E. Audio & Positive Reinforcement Engine
- **`soundService.js`**: Zero-dependency Web Audio API synthesis engine delivering low-latency, offline positive micro-sounds.
- **`SoundContext`**: Global audio state provider managing master mute toggle, volume preferences, and sound effect triggers.

---

## 6. Security, Best Practices & Standards

1. **Authentication & Passwords**: Passwords hashed using `bcrypt` (12 salt rounds). Cryptographically signed JWT tokens with expiration.
2. **Input Sanitization & Validation**: Validation of all incoming payloads before hitting database queries.
3. **Database Security**: Parameterized SQL queries preventing SQL Injection. Foreign key cascade constraints to preserve referential integrity.
4. **Environment Variables**: Sensitive credentials (database passwords, JWT secret) isolated in `.env` files and never committed to source control.
5. **Clean Code & Modularity**: Separation of concerns across controllers, routes, models, and UI components.
6. **Responsive & Accessible Design**: Mobile-friendly layout with semantic HTML, focus rings, and high-contrast color palettes.

---

## 7. Step-by-Step Development Roadmap & Tasks

### 📍 Phase 1: Planning & Docker Infrastructure Setup
- [x] **Task 1.1**: Formulate complete Master Architecture Plan markdown document.
- [x] **Task 1.2**: Create workspace `docker-compose.yml` linking `db`, `backend`, and `frontend`.
- [x] **Task 1.3**: Configure root `.env.example` and environment configurations.
- [x] **Task 1.4**: Create `frontend/Dockerfile` (multi-stage: node build -> `nginx:alpine`).
- [x] **Task 1.5**: Create `frontend/nginx.conf` with SPA routing and `/api` reverse proxying.
- [x] **Task 1.6**: Create `backend/Dockerfile` with `node:26-slim`.

### 📍 Phase 2: PostgreSQL Database & Backend Server Baseline
- [x] **Task 2.1**: Initialize backend `package.json` with Express, pg, dotenv, cors, bcryptjs, jsonwebtoken.
- [x] **Task 2.2**: Setup database pool connection (`backend/src/config/db.js`).
- [x] **Task 2.3**: Create SQL initialization migration script for schema & seed categories.
- [x] **Task 2.4**: Build core Express application (`backend/src/app.js` & `backend/server.js`) with health check.

### 📍 Phase 3: Backend Authentication & Authorization
- [x] **Task 3.1**: Create User model and password hashing utilities.
- [x] **Task 3.2**: Implement `/api/auth/register` endpoint with validation.
- [x] **Task 3.3**: Implement `/api/auth/login` endpoint with JWT issuance.
- [x] **Task 3.4**: Create JWT verification middleware (`verifyJWT`).
- [x] **Task 3.5**: Implement `/api/auth/me` endpoint to verify active sessions.

### 📍 Phase 4: Backend Task CRUD, Categories & Analytics APIs
- [x] **Task 4.1**: Implement Categories CRUD endpoints (`/api/categories`).
- [x] **Task 4.2**: Implement Task CRUD endpoints (`GET /api/tasks`, `POST /api/tasks`, `PUT /api/tasks/:id`, `DELETE /api/tasks/:id`).
- [x] **Task 4.3**: Implement Task quick status update (`PATCH /api/tasks/:id/status`) and activity logging.
- [x] **Task 4.4**: Implement Dashboard Analytics endpoint (`GET /api/analytics/stats`).

### 📍 Phase 5: Frontend Design System & Foundations
- [x] **Task 5.1**: Install icon library (`lucide-react`) and configure Tailwind CSS v4 in `frontend/src/index.css`.
- [x] **Task 5.2**: Create shared UI components (`Button`, `Input`, `Badge`, `Card`, `Modal`).
- [x] **Task 5.3**: Build `AuthContext` and API client service (`src/services/api.js`).
- [x] **Task 5.4**: Configure React Router v7 with `AppLayout`, `ProtectedRoute`, and route definitions.

### 📍 Phase 6: Frontend Auth Pages (Login & Register)
- [x] **Task 6.1**: Build `LoginPage` with validation, glassmorphic card, and clean responsive layout.
- [x] **Task 6.2**: Build `RegisterPage` with live password strength meter and onboarding flow.
- [x] **Task 6.3**: Connect Auth pages to backend API and handle token persistence & redirects.

### 📍 Phase 7: Frontend Task Tracker & Kanban Board
- [x] **Task 7.1**: Build `Sidebar` and `Navbar` navigation components.
- [x] **Task 7.2**: Build `DashboardPage` with statistics overview cards and quick actions.
- [x] **Task 7.3**: Build `TasksPage` with Kanban board columns (`TODO`, `IN_PROGRESS`, `IN_REVIEW`, `COMPLETED`) and interactive Drag-and-Drop status transitions.
- [x] **Task 7.4**: Build `TaskModal` for creating and editing tasks with priority, category, and due date.
- [x] **Task 7.5**: Implement filtering, search bar, and List/Board view toggling.

### 📍 Phase 8: Categories, Analytics & Polishing
- [x] **Task 8.1**: Build `CategoriesPage` for managing tags/categories with custom colors.
- [x] **Task 8.2**: Build `AnalyticsPage` with completion metrics and priority distribution.
- [x] **Task 8.3**: Add responsive mobile drawer and dark/light mode enhancements.

### 📍 Phase 9: Verification, Testing & Handover
- [x] **Task 9.1**: Verify frontend build (`npm run build`).
- [x] **Task 9.2**: Verify backend endpoints functionality.
- [x] **Task 9.3**: Review Docker configuration files and provide clear instructions for execution.

### 📍 Phase 10: Gamification, Khademni Palette & Account Settings
- [x] **Task 10.1**: Apply clean Khademni-inspired color palette (Deep Teal `#0d8a72`, Amber Gold `#f59e0b`, Mint tags `#e6f7f4`, and crisp light cards).
- [x] **Task 10.2**: Implement complete Dark Mode & Light Mode system with persistent ThemeProvider and Sun/Moon toggle button.
- [x] **Task 10.3**: Build Gamification Engine with XP calculation, 8 Level tiers, XP progress bar, and celebratory `LevelUpModal`.
- [x] **Task 10.4**: Implement Unlockable Titles system based on completed tasks, urgent tasks, and player rank.
- [x] **Task 10.5**: Build `SettingsPage` with Profile details editing, custom image URL & preset avatar selector, title equipping, and theme toggling.

### 📍 Phase 11: Goals Management & Advanced Account Settings
- [x] **Task 11.1**: Add Goals database schema & backend API endpoints (`/api/goals`, `/api/auth/change-password`).
- [x] **Task 11.2**: Build `GoalModal` for creating and editing goals with target dates and task selection.
- [x] **Task 11.3**: Build dedicated `GoalsPage` with real-time task progress tracking and assigned tasks views.
- [x] **Task 11.4**: Update `TaskModal` & `TaskCard` to assign and display associated Goal tags.
- [x] **Task 11.5**: Implement Change Password feature in `SettingsPage` with validation.
- [x] **Task 11.6**: Implement Profile Picture file upload with instant preview and persistence in `SettingsPage`.

### 📍 Phase 12: Goals Refinements & Dedicated Courses Tracker
- [x] **Task 12.1**: Replace Target Completion Date with Due Date, calculate Days Until Due badge, and add Priority field (LOW, MEDIUM, HIGH, URGENT).
- [x] **Task 12.2**: Categorize Goal Icons with presets for Health (🏃‍♂️, 🍎, 💊, ❤️, 🧘, 💧), Development (💻, 🚀, ⚡, 🛠️, 🌐, 🤖), and Training (🏋️‍♂️, 📚, 🥋, 🎯, 🥊, 🚴).
- [x] **Task 12.3**: Add status, priority, and search filters to `GoalsPage`.
- [x] **Task 12.4**: Transform Goals page to display each goal on a single horizontal row with inline progress and expandable assigned tasks.
- [x] **Task 12.5**: Implement Courses database table and backend API endpoints (`GET /api/courses`, `POST /api/courses`, `PUT /api/courses/:id`, `POST /api/courses/:id/increment`, `DELETE /api/courses/:id`).
### 📍 Phase 13: MasteryOS Rebranding, Psychology Gamification & Deep UI Refinements
- [x] **Task 13.1**: Rebrand to **MasteryOS** & update browser tab favicon to match brand logo.
- [x] **Task 13.2**: Balance gamification with psychological tracks for Tasks, Goals, and Courses with stable progress bars and next-unlock previews (prevent false level notifications on mount; only trigger on genuine level advancement).
- [x] **Task 13.3**: Update Dashboard with Nearest Due Date widget and active In-Progress Courses widget.
- [x] **Task 13.4**: Build Notion-inspired Dashboard View Preferences in `SettingsPage` to toggle and reorder widgets.
- [x] **Task 13.5**: Refine GoalsPage with flat icon picker (Health, Training, Dev), separate line task list, and "Not Started" status.
- [x] **Task 13.6**: Refine CoursesPage with card width constraint, upload/direct link only cover inputs, click cover to edit, and tasks managed in modal.
- [x] **Task 13.7**: Add "Sort by" and "Group by" to TasksPage List view, and stack Category, Goal, and Course in `TaskModal`.
- [x] **Task 13.8**: Overhaul CategoriesPage layout with full-width top creator block and list-style categories.
### 📍 Phase 14: Dashboard Reorder, Task Board Completion Dates, Filter Memory & UX Enhancements
- [x] **Task 14.1**: Set Dashboard default ordering: 1) KPI Metrics (`stats`), 2) High & Urgent Priority Tasks (`urgent`), 3) Upcoming & Nearest Deadlines (`deadlines`), 4) In-Progress Courses (`courses`), 5) Strategic Goals Progress (`goals`).
- [x] **Task 14.2**: Remove "Recent Tasks Activity" (`recent`) completely from Dashboard and Settings customizer.
- [x] **Task 14.3**: Confine Upcoming & Nearest Deadlines to Tasks only (excluding goals) and add quick "View all Tasks" navigation button.
- [x] **Task 14.4**: In `CourseModal`, swap inputs so Finished Lessons precedes Total Lessons. Add live search to "Assign Tasks to this Course".
- [x] **Task 14.5**: In `GoalModal`, add live search to "Assign Tasks to this Goal".
- [x] **Task 14.6**: In `TaskModal`, default Estimated Time (Minutes) to empty instead of 30.
- [x] **Task 14.7**: Track task completion timestamp (`completed_at`). In Kanban Board view, Completed column only displays tasks completed today (`isCompletedToday`).
- [x] **Task 14.8**: Persist filters and sorting across navigation in `TasksPage` (`mastery_tasks_preferences`), `CoursesPage` (`mastery_courses_filters`), and `GoalsPage` (`mastery_goals_filters`).
- [x] **Task 14.9**: Default categories updated to **Personal**, **Work**, and **School** across state and demo seed data.
- [x] **Task 14.10**: Set strict display limits for dashboard components to prevent page overload: High/Urgent tasks (max 4), Nearest deadlines (max 6), In-progress courses (max 4), Strategic goals (max 3), with dynamic total count indicators in navigation headers.
- [x] **Task 14.11**: Add "Hide Completed" toggle button exclusive to List View in `TasksPage` (defaulting to enabled in List View and removed from Board View). Add "Load More Tasks (+50)" pagination button for large task lists (+50 items) in List view and per column in Board view.
- [x] **Task 14.12**: Update brand subtitle under the website title from "Tasks • Goals • Courses" to "Pro Version" in Sidebar, Login, and Registration views.

### 📍 Phase 15: Dedicated Habit Tracker (HabitsPage) & Dashboard Shortcut
- [x] **Task 15.1**: Backend Database Schema & REST Endpoints (`/api/habits`, `POST /api/habits/:id/toggle`, `habit.model.js` with PostgreSQL & in-memory fallbacks).
- [x] **Task 15.2**: Frontend API client integration for habits in `api.js`.
- [x] **Task 15.3**: Build `HabitModal` component (habit title, icon picker, color accent, time of day, description).
- [x] **Task 15.4**: Build `HabitsPage` with streaks (current & longest), 7-day mini matrix, period analytics (Week, Month, Year charts & completion rates), time-of-day filters, keeping habits strictly separate from gamification XP.
- [x] **Task 15.5**: Add "Today's Habits" shortcut widget to `DashboardPage` with quick checkbox toggling, today progress bar, and direct navigation.
- [x] **Task 15.6**: Update `SettingsPage` dashboard view customization to include the Today's Habits widget.
- [x] **Task 15.7**: Add "Habits Tracker" link to `Sidebar.jsx` and wire `/habits` route and global habit state in `App.jsx`.

### 📍 Phase 16: Production Security Hardening & Authorization Architecture
- [x] **Task 16.1**: **Strict Multi-Tenant Authorization & Cross-Entity Ownership Validation**
  - Enforce `user_id` filtering on every database query across `tasks`, `categories`, `goals`, `courses`, `habits`, and `activities`.
  - Validate ownership of referenced foreign objects: when creating or updating an entity referencing another object (e.g. assigning a task to a `category_id`, `goal_id`, `course_id`), verify that the referenced object belongs to the authenticated user.
  - Implement automated multi-tenant integration tests with two distinct users to ensure User A cannot view, mutate, or associate resources belonging to User B.
- [x] **Task 16.2**: **Session & JWT Hardening with Secure httpOnly Cookie Migration**
  - Migrate JWT storage from browser `localStorage` to an `httpOnly`, `Secure`, `SameSite=Lax` cookie.
  - Implement CSRF protection (Double Submit Cookie or Anti-CSRF token verification) for state-changing endpoints.
  - Enforce HS256 algorithm pinning and validate that `JWT_SECRET` meets a strict entropy requirement (32+ characters).
  - Shorten access token expiry and implement an explicit `/api/auth/logout` endpoint that clears the auth cookie.
  - Add `token_version` to the user schema/model to immediately invalidate stale tokens on password reset or account revocation.
  - Require the user's current password on `POST /api/auth/change-password` before applying changes.
  - Normalize authentication failure responses to return the same generic error message ("Invalid email or password") for both non-existent emails and incorrect passwords to prevent user enumeration.
- [x] **Task 16.3**: **Proxy IP Attribution & Comprehensive Multi-Tiered Rate Limiting**
  - Configure Express `trust proxy` to parse client IP from `CF-Connecting-IP` behind Nginx / Cloudflare IP ranges.
  - Integrate `express-rate-limit` with sliding window across sensitive routes:
    - Login & registration endpoints (`/api/auth/login`, `/api/auth/register`).
    - Per-email failed attempt lockouts to block targeted brute-force password guessing.
    - Password updates (`/api/auth/change-password`).
    - File upload endpoints (`/api/upload`).
  - Create integration test verifying repeated failed authentication attempts reliably trigger HTTP `429 Too Many Requests`.
- [x] **Task 16.4**: **Strict Request Schema Validation (Zod) & DOM Sanitization**
  - Implement Zod validation schemas for all request bodies, query strings, and URL route parameters (including strict UUID format checks on all resource IDs).
  - Whitelist allowable sort, order, and filter fields for List and Board views to eliminate injection risks.
  - Enforce strict Express body parser limits (`limit: '100kb'`) and cap pagination queries to a maximum of 100 items per request.
  - Restrict URL input fields (avatar image, course cover, certificate link) to strictly accept valid `http://` or `https://` protocols.
  - Audit frontend codebase to eliminate any usage of `dangerouslySetInnerHTML` or raw `innerHTML`.
- [x] **Task 16.5**: **Secure File Upload Pipeline & Magic Byte Inspection**
  - Set hard upload file size limits on backend upload middleware.
  - Inspect file magic bytes (file signature) to verify authentic MIME types—strictly allow only `image/png`, `image/jpeg`, `image/webp`, and `application/pdf` (strictly disallow SVG files to eliminate stored XSS vectors).
  - Generate cryptographically randomized filenames (UUID/hash) prior to disk persistence.
  - Store uploaded assets in a dedicated, isolated storage volume outside web execution roots.
  - Serve static uploads with `X-Content-Type-Options: nosniff` header, and force PDF attachments via `Content-Disposition: attachment`.
  - Add test suite validating rejection of oversized uploads and renamed fake extension files (e.g., `.exe` renamed to `.png`).
- [x] **Task 16.6**: **Security Headers (Helmet & Nginx), CORS Lockdown & Error Redaction**
  - Add `helmet` middleware and configure production Nginx security headers:
    - Content Security Policy (CSP).
    - `X-Frame-Options: DENY` (clickjacking defense).
    - `Referrer-Policy: strict-origin-when-cross-origin`.
    - Disable Nginx version emissions (`server_tokens off`).
    - Exclude local HSTS configuration since Cloudflare handles edge HSTS.
  - Restrict CORS origins strictly to the designated frontend production domain.
  - Sanitize all error responses in production (`NODE_ENV === 'production'`) to suppress stack traces and database internal details.
  - Configure server logger sanitization to permanently redact passwords, JWT tokens, and sensitive request bodies from application logs.

### 📍 Phase 17: Gamified Onboarding Experience & First-Run Guided Flow
- [x] **Task 17.1**: **Onboarding State Architecture & First-Run Detection**
  - Implement intelligent detection of new accounts based on entity emptiness (`tasks.length === 0 && goals.length === 0 && courses.length === 0 && habits.length === 0`) and user-scoped dismissal/progress state (`mastery_onboarding_dismissed_${userId}`).
  - Define the 4 Foundation Quests:
    1. 🎯 **First Goal Quest** ("Chart Your Vision"): Create your first strategic goal (+50 XP).
    2. 📚 **First Course Quest** ("Expand Your Knowledge"): Track your first skill course (+50 XP).
    3. ✅ **First Task Quest** ("Take Immediate Action"): Create your first actionable task (+50 XP).
    4. 🔥 **First Habit Quest** ("Build Daily Discipline"): Set up your first recurring daily habit (+50 XP).
  - Dynamically track quest completion status based on real application state (`goals.length > 0`, `courses.length > 0`, `tasks.length > 0`, `habits.length > 0`).
- [x] **Task 17.2**: **MasteryOS Core Philosophy & App Introduction UI**
  - Design a welcoming, modern hero section for the dashboard that clearly explains what MasteryOS is:
    - How the 4 pillars connect: **Strategic Goals** 🎯 define destination -> **Skill Courses** 📚 provide knowledge -> **Actionable Tasks** ✅ drive daily execution -> **Habits & Streaks** 🔥 build consistency.
    - How the **Gamification Engine** 🏆 rewards continuous progress with XP, ranks, achievements, and unlockable executive titles.
  - Add interactive "How MasteryOS Works" value-prop visual guide optimized for mobile and desktop.
- [x] **Task 17.3**: **Interactive Gamified Quest Hub Component (`OnboardingGuide.jsx`)**
  - Build responsive quest progress tracker with percentage completion (0% -> 25% -> 50% -> 75% -> 100%) and starter XP rewards counter.
  - Render 4 quest cards with:
    - Distinct icon, title, description, and XP bounty badge (+50 XP).
    - Status indicators: In-progress pulse vs. Completed badge with emerald checkmark.
    - One-click trigger buttons to immediately launch the creation modal for that specific entity (`onOpenNewGoal`, `onOpenNewCourse`, `onOpenNewTask`, `onOpenNewHabit`) without leaving the dashboard.
    - Direct route navigation fallback (`/goals`, `/courses`, `/tasks`, `/habits`).
  - Add celebratory completion state when all 4 quests are achieved:
    - Celebration banner with unlocked badge ("Mastery Pathfinder") and XP bonus.
    - Button to "Unlock Full Dashboard Workspace" or keep guide minimized.
- [x] **Task 17.4**: **Mobile-First UX & Responsive Optimization**
  - Ensure all cards stack seamlessly on mobile viewports (< 768px):
    - Generous touch targets (>= 44px) for all modal openers and navigation buttons.
    - Responsive flex/grid layouts (1 column on mobile, 2 or 4 columns on tablet/desktop).
    - Fluid typography with no horizontal scrolling or cramped text.
    - Dark mode and light mode glassmorphic styling tailored to the MasteryOS design system.
- [x] **Task 17.5**: **DashboardPage & Global App Modal Integration**
  - Update `App.jsx` to pass `onOpenNewGoal`, `onOpenNewCourse`, and `onOpenNewHabit` to `DashboardPage`.
  - In `DashboardPage.jsx`, if the user has 0 items across all entities, replace the empty, confusing zero-data tables and empty cards with the dedicated `OnboardingGuide`.
  - When the user starts creating items (1 to 3 items created), show a compact, progress-aware version of the Onboarding Quests at the top of the dashboard until all 4 are completed.
  - Provide an option to toggle between the Onboarding Quest view and the Standard Dashboard view so the user has full control.
- [x] **Task 17.6**: **Testing, Linting & Production Verification**
  - Run frontend ESLint and Vite production build to guarantee zero errors or warnings.
  - Verify mobile responsiveness and interaction states in both light and dark modes.
  - Commit and push changes to GitHub.

### 📍 Phase 18: Security & LocalStorage Cleansing (Immediate Data-Flow Fixes)
- [x] **Task 18.1**: **Purge Plaintext Passwords in Offline Fallback (`mastery_registered_users`)**
  - Remove plaintext password storage from `AuthContext.jsx` (`mastery_registered_users`).
  - Purge any legacy `mastery_registered_users` keys from client `localStorage` on startup.
- [x] **Task 18.2**: **Eliminate Redundant JWT in `localStorage` (`master_tasks_token`)**
  - Stop storing JWT in `localStorage` in `AuthContext.jsx` and `api.js`.
  - Rely on `httpOnly` secure cookie with `XSRF-TOKEN` CSRF header for all authenticated requests.
  - Align `verifyJWT` middleware and client request interceptors.
- [x] **Task 18.3**: **Eliminate Custom Task `localStorage` Sync Layer (`mastery_local_tasks_${userId}`)**
  - Remove manual `mastery_local_tasks_${userId}` saving and synthetic `local-task-` IDs from `App.jsx`.
  - Let React Query handle client caching and background synchronization.
- [x] **Task 18.4**: **Resolve Mock Category IDs (`cat-1` to `cat-4`)**
  - Remove hardcoded `INITIAL_CATEGORIES` mock IDs and fragile mapping translation functions (`categoryMap`, `defaultNameMap`) from `App.jsx`.
  - Ensure all category operations utilize valid UUIDs seeded and managed by PostgreSQL.

### 📍 Phase 19: Backend Cache-Control Headers & Upload Delivery Optimization
- [x] **Task 19.1**: **Global API `Cache-Control` Directives on Node.js Backend**
  - Implement a dedicated caching middleware in `backend/src/app.js` to set `Cache-Control: private, no-cache, no-store, must-revalidate` on all `/api/*` routes (excluding static assets).
  - Add `Pragma: no-cache` and `Expires: 0` for complete HTTP/1.0 and reverse-proxy compliance.
- [x] **Task 19.2**: **Long-Term Immutable Caching for Static Uploads (`/api/upload/file/:filename`)**
  - In `backend/src/routes/upload.routes.js`, set `Cache-Control: public, max-age=31536000, immutable` for uploaded assets with UUID filenames.
  - Implement conditional validation with `ETag` and `Last-Modified` checks.
- [x] **Task 19.3**: **Nginx SPA `index.html` Cache Busting**
  - In `frontend/nginx.conf`, configure the `location /` SPA fallback to explicitly serve `index.html` with `Cache-Control: no-cache, must-revalidate`.
  - Preserve long-term immutable caching (`max-age=15552000, immutable`) for hashed bundle assets in `dist/assets/`.
- [x] **Task 19.4**: **Migrate Client Base64 Uploads to Multipart `/api/upload` Endpoint**
  - Refactor `CourseModal.jsx` (cover images and certificate PDFs) to upload binary files directly to `/api/upload` instead of Base64 strings.
  - Refactor `SettingsPage.jsx` avatar upload to call `/api/upload` and save the resulting static URL.

### 📍 Phase 20: React Query Integration & Server State Management (Frontend)
- [x] **Task 20.1**: **Install & Configure `@tanstack/react-query`**
  - Add `@tanstack/react-query` to `frontend/package.json`.
  - Configure global `QueryClient` in `main.jsx` with standard `staleTime: 2m`, `gcTime: 10m`, and `refetchOnWindowFocus: true`.
- [x] **Task 20.2**: **Create Granular React Query Hooks**
  - Build `useTasks` and `useTaskMutations` (create, update, delete, change status with optimistic updates).
  - Build `useGoals` and `useGoalMutations`.
  - Build `useCourses` and `useCourseMutations` (including lesson increment).
  - Build `useHabits` and `useHabitMutations` (including optimistic toggle).
  - Build `useCategories` and `useCategoryMutations`.
  - Build `useTaskStats` for aggregated KPI metrics.
  - Build `useUserProfile` for user profile and settings.
- [x] **Task 20.3**: **Refactor `App.jsx` and Pages to Use Query Hooks**
  - Eliminate top-level monolithic `useState` arrays, `reloadTrigger` counter, and `Promise.allSettled` fetching from `App.jsx`.
  - Let individual pages (`TasksPage`, `GoalsPage`, `CoursesPage`, `HabitsPage`, `CategoriesPage`, `DashboardPage`, `AnalyticsPage`) consume their own dedicated hooks.
- [x] **Task 20.4**: **Consolidate `users.settings` and Analytics Single Source of Truth**
  - Consolidate fragmented `localStorage` keys into React Query's cached user profile.
  - Update `AnalyticsPage` to consume `useTaskStats` directly as the authoritative source of truth.

### 📍 Phase 21: Verification, Testing & Production Builds
- [x] **Task 21.1**: **Run Backend Integration Tests**
  - Run backend test suite (`npm test`) to ensure all auth, multi-tenant, and CRUD tests pass.
- [x] **Task 21.2**: **Verify Frontend Build & Linting**
  - Run `npm run build` and `npm run lint` in `frontend/` to ensure zero compilation or lint errors.
- [x] **Task 21.3**: **Verify Caching Headers & Performance**
  - Confirm API responses return `Cache-Control: private, no-cache, no-store`.
  - Confirm `/api/upload/file/:filename` returns `Cache-Control: public, max-age=31536000, immutable`.

### 📍 Phase 22: VitePress Documentation Platform (Isolated at /Docs)
- [x] **Task 22.1**: **VitePress Project Scaffolding & Setup (`docs/`)**
  - Initialize isolated `docs/` workspace with `package.json` and VitePress dependency (`vitepress`).
  - Configure scripts (`docs:dev`, `docs:build`, `docs:preview`).
- [x] **Task 22.2**: **VitePress Global Configuration & Branding (`docs/.vitepress/config.mjs`)**
  - Set `base: '/Docs/'` for standalone path routing on `mydomain.com/Docs`.
  - Link GitHub Repository (`https://github.com/elfilaliamin/MasteryOS`) in socialLinks and top navigation.
  - Define custom theme accent colors matching MasteryOS palette (Deep Teal `#0d8a72` and Amber Gold `#f59e0b`).
  - Configure navigation bar, structured multi-section sidebar, local search provider, and footer copyright.
- [x] **Task 22.3**: **Web Server (Nginx) & Docker Multi-Stage Build Integration**
  - Update `frontend/Dockerfile` to compile both the React SPA and the VitePress documentation in isolated build stages.
  - Copy VitePress static build output (`docs/.vitepress/dist/`) to `/usr/share/nginx/html/Docs/`.
  - Update `frontend/nginx.conf` with dedicated `location /Docs/` and redirect rule `location = /docs { return 301 /Docs/; }`.
  - **Strict App Isolation**: Ensure ZERO documentation links, buttons, or navigations are added inside the React web application (`frontend/src/`).
- [x] **Task 22.4**: **Documentation Section 1: Overview, Getting Started & Architecture**
  - Write `docs/index.md` (Hero landing page with feature cards, system metrics, and quick actions).
  - Write `docs/getting-started/quickstart.md` (prerequisites, docker-compose setup, environment variables).
  - Write `docs/architecture/overview.md` & `docker-stack.md` (container topology, multi-tier isolation, Cloudflare tunnel).
- [x] **Task 22.5**: **Documentation Section 2: PostgreSQL Database & Data Flow**
  - Write `docs/database/schema.md` (complete relational schema, tables, foreign keys, indexes, cascades).
  - Write `docs/database/data-flow.md` (data lifecycle, client cache, optimistic updates, server persistence).
- [x] **Task 22.6**: **Documentation Section 3: Backend REST API Reference**
  - Write `docs/api/overview.md` (base URL, authentication headers, error formats, rate limiting).
  - Write `docs/api/auth.md` (`/api/auth/register`, `/login`, `/me`, `/logout`, `/change-password`).
  - Write `docs/api/tasks.md` & `categories.md` (CRUD, status updates, filtering, sorting).
  - Write `docs/api/goals.md`, `courses.md`, `habits.md` (goals, courses with lesson tracking, habits with streak matrices).
  - Write `docs/api/upload-analytics.md` (file upload with magic-byte check, dashboard statistics).
- [x] **Task 22.7**: **Documentation Section 4: Frontend UI, Gamification & Design System**
  - Write `docs/frontend/pages-components.md` (complete catalog of pages, layout, and UI components).
  - Write `docs/frontend/gamification.md` (XP math, 8 rank tiers, unlockable executive titles, psychological tracks).
  - Write `docs/frontend/state-management.md` (TanStack React Query architecture, query keys, invalidation).
- [x] **Task 22.8**: **Documentation Section 5: Security Architecture & Deployment**
  - Write `docs/security/hardening.md` (multi-tenant query guards, httpOnly cookies, CSRF, Zod validation, Helmet, rate limiting).
  - Write `docs/deployment/production.md` (Docker Compose deployment, Cloudflare tunnel setup, SSL, caching rules).
- [x] **Task 22.9**: **Build Verification, Link Checking & Isolation Audit**
  - Execute `npm run docs:build` to verify clean build without broken links or syntax issues.
  - Audit frontend code to confirm zero links to `/Docs` inside the React application UI.
  - Verify Nginx routing and asset paths for `/Docs/`.

### 📍 Phase 23: Interactive Audio Feedback Engine & Micro-Sound Design
- [x] **Task 23.1**: **Web Audio API Engine & Sound Synthesis Architecture (`soundService.js`)**
  - Implement a lightweight, zero-dependency audio synthesizer in `frontend/src/services/soundService.js` using the browser's native `AudioContext` (avoiding external heavy MP3/WAV assets, eliminating network latency, and functioning offline).
  - Comply with browser autoplay policies by lazily initializing and unlocking the `AudioContext` on the user's first interaction.
  - Design harmonic frequency envelopes for positive reinforcement feedback:
    - **Task Completion (`playTaskComplete`)**: Crisp, satisfying high-resonance chime/pop (sine/triangle envelope with rapid decay).
    - **Lesson Advance (`playLessonComplete`)**: Uplifting ascending dual-chime (e.g. C5 -> G5) to celebrate individual lesson completion.
    - **Full Course Finish (`playCourseComplete`)**: Triumphant celebratory multi-tonal arpeggio/fanfare for completing 100% of course lessons.
    - **Goal Milestone (`playGoalComplete`)**: Deep, rewarding harmonic chord progression reflecting strategic milestone achievement.
    - **Habit Check-in (`playHabitCheck`)**: Tactile snap/chime celebrating daily routine consistency and streak extension.
    - **Level Up Celebration (`playLevelUp`)**: Rich orchestral shimmer and fanfare chord progression for `LevelUpModal`.
- [x] **Task 23.2**: **Global Audio Context & User Preferences (`SoundContext.jsx` & Settings)**
  - Create `SoundContext.jsx` with `useSound` hook providing `playSound(type)`, `isMuted`, `toggleMute()`, `volume`, and `setVolume()`.
  - Persist sound settings in `localStorage` (`mastery_sound_enabled`, `mastery_sound_volume`) with fallback synchronization to user profile settings (`users.settings.sound_enabled`).
  - Add quick Mute/Unmute audio toggle icon button in the Top Navbar / Sidebar for immediate access.
  - Add dedicated **Audio & Sound Feedback** section in `SettingsPage.jsx` with master sound toggle, volume slider (0% to 100%), and interactive "Test Sound" buttons for each positive action sound.
- [x] **Task 23.3**: **Task Completion Sound Integration**
  - Connect `playTaskComplete` to task checkbox toggling and status changes to `'COMPLETED'` in:
    - `TasksPage.jsx` (List View checkboxes and Kanban Board column drag-to-complete).
    - `DashboardPage.jsx` (Upcoming/Urgent tasks list completion).
    - `FocusPage.jsx` (Pomodoro focus sprint task completion).
  - Prevent duplicate sound triggers and suppress audio when uncompleting or reverting task status.
- [x] **Task 23.4**: **Course & Lesson Progress Sound Integration**
  - In `CoursesPage.jsx` and `CourseModal.jsx`:
    - Trigger `playLessonComplete` when incrementing finished lessons (`finished_lessons + 1`).
    - Detect the boundary transition to 100% completion: when `finished_lessons === total_lessons`, trigger the triumphant `playCourseComplete` celebration fanfare instead of the standard lesson chime.
- [x] **Task 23.5**: **Goal, Habit & Gamification Level Up Integration**
  - In `GoalsPage.jsx`, trigger `playGoalComplete` when a strategic goal reaches 100% completion or all assigned tasks are completed.
  - In `HabitsPage.jsx` and Dashboard "Today's Habits" widget, trigger `playHabitCheck` on daily habit check-in.
  - In `LevelUpModal.jsx`, synchronize `playLevelUp` sound with modal entrance and celebration animations.
- [x] **Task 23.6**: **Audio Engine Testing, Accessibility & Verification**
  - Verify zero audio clipping, distortion, or memory leaks across rapid repeated user interactions.
  - Ensure accessibility compliance: respectful volume bounds, silent fallback when muted, and respecting OS quiet hours / reduced motion where applicable.
  - Run frontend linting and production build to verify zero compilation errors.




