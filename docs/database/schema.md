# 🗄️ PostgreSQL Relational Schema

MasteryOS runs on **PostgreSQL 16**, enforcing strong referential integrity, foreign key cascades, and performant indexes.

---

## Entity-Relationship Diagram

```
  ┌──────────────┐          1:N          ┌───────────────────┐
  │    users     │ ───────────────────── │    categories     │
  └──────┬───────┘                       └─────────┬─────────┘
         │                                         │
         │ 1:N                                     │ 1:N
         ▼                                         ▼
  ┌──────────────┐         0..1:N        ┌───────────────────┐
  │    goals     │ ───────────────────── │      tasks        │
  └──────────────┘                       └─────────┬─────────┘
         ▲                                         │
         │                                         │ 1:N
  ┌──────┴───────┐                                 ▼
  │   courses    │                       ┌───────────────────┐
  └──────────────┘                       │  task_activities  │
         ▲                               └───────────────────┘
         │ 1:N
  ┌──────┴───────┐
  │    habits    │
  └──────────────┘
```

---

## Table Definitions

### 1. `users` Table
Stores authentication credentials, identity, gamification XP, and customized dashboard preferences.

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    avatar_url TEXT,
    equipped_title VARCHAR(100) DEFAULT 'Novice Explorer',
    settings JSONB DEFAULT '{"theme": "system", "dashboardOrder": ["stats", "urgent", "deadlines", "courses", "goals", "habits"]}',
    token_version INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### 2. `categories` Table
User-defined taxonomy pills with custom hex colors.

```sql
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(50) NOT NULL,
    color VARCHAR(7) DEFAULT '#0d8a72',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_user_category UNIQUE (user_id, name)
);
```

### 3. `tasks` Table
The primary execution entity supporting Kanban statuses and priority weighting.

```sql
CREATE TYPE task_status AS ENUM ('TODO', 'IN_PROGRESS', 'IN_REVIEW', 'COMPLETED');
CREATE TYPE task_priority AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    goal_id UUID REFERENCES goals(id) ON DELETE SET NULL,
    course_id UUID REFERENCES courses(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status task_status DEFAULT 'TODO',
    priority task_priority DEFAULT 'MEDIUM',
    due_date TIMESTAMP WITH TIME ZONE,
    estimated_minutes INTEGER DEFAULT 0,
    is_archived BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### 4. `goals` Table
Strategic milestones linked to tasks.

```sql
CREATE TABLE goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    due_date TIMESTAMP WITH TIME ZONE,
    priority VARCHAR(20) DEFAULT 'MEDIUM',
    status VARCHAR(20) DEFAULT 'IN_PROGRESS',
    icon VARCHAR(50) DEFAULT '🎯',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### 5. `courses` Table
Learning pathways with lesson counters and certificates.

```sql
CREATE TABLE courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    platform VARCHAR(100),
    total_lessons INTEGER DEFAULT 0,
    finished_lessons INTEGER DEFAULT 0,
    cover_image_url TEXT,
    certificate_url TEXT,
    is_completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### 6. `habits` Table
Recurring habits tracking streaks and daily logs.

```sql
CREATE TABLE habits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    time_of_day VARCHAR(20) DEFAULT 'ANYTIME',
    icon VARCHAR(50) DEFAULT '🔥',
    color VARCHAR(7) DEFAULT '#0d8a72',
    streak_count INTEGER DEFAULT 0,
    longest_streak INTEGER DEFAULT 0,
    history JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```
