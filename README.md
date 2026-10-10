# MasteryOS (Pro Version)

> **All-in-One Productivity & Life Mastery Dashboard**: Tasks • Goals • Courses • Balanced Gamification

MasteryOS is a modern, high-performance web application designed to help individuals organize work, conquer strategic long-term goals, track courses and certifications, and maintain steady momentum through an engineered, non-distracting gamification psychology.

---

## ✨ Features

- **📊 Dynamic Dashboard**:
  - Top KPI metrics and summary cards.
  - Urgent & high-priority task triage.
  - Upcoming nearest deadlines countdown with direct "View all Tasks" navigation.
  - Active in-progress courses tracker.
  - Strategic goals alignment.
  - Customizable widgets & display order via Settings.
- **✅ Tasks Management**:
  - List & Kanban Board views.
  - Priority levels (Urgent, High, Medium, Low), due dates, and relative days countdown.
  - Toggle to hide completed tasks and infinite load pagination for large lists.
  - Search and filter states preserved seamlessly across page navigations.
- **🎯 Goals & Milestones**:
  - Clean single-line goal overviews with curated visual icons (Training, Health, Career, Tech, etc.).
  - Multi-task assignment with real-time task search.
  - Status tracking (Not Started, In Progress, Completed, On Hold).
- **🎓 Courses & Learning**:
  - Track finished vs total lessons with instant `+1 Lesson` increment buttons.
  - Progress percentage visualization and dynamic status tags.
  - Certificate links & PDF uploads.
  - Course-linked tasks with quick search assignment.
- **🏆 Balanced Gamification**:
  - Level-up XP milestones designed to sustain steady motivation without distracting alerts.
  - Focused achievements separating tasks, goals, and learning progression.
- **⚙️ Complete Customization**:
  - Configurable dashboard layout order, category management (Personal, Work, School), and persistent user preferences.

---

## 🛠️ Tech Stack

- **Frontend**: React 19, Vite, Tailwind CSS v4, Lucide Icons, React Router 7.
- **Backend**: Node.js, Express, Helmet, Morgan, PostgreSQL (`pg`).
- **DevOps & CI**: GitHub Actions automated build pipeline, Docker Compose.

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js (v18 or higher recommended)
- npm or pnpm

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### 3. Backend Setup
```bash
cd backend
npm install
npm run dev
```

---

## 📦 GitHub Actions CI

Automated checks run on every push and pull request to the `main` branch to ensure frontend build stability and backend dependency integrity.
