# 🎨 Pages & Design System

The MasteryOS frontend is engineered with **React 19**, **Vite**, **Tailwind CSS v4**, and **Lucide Icons**, following an ultra-clean, high-contrast aesthetic.

---

## Brand Palette & Design Tokens

- **Deep Teal** (`#0d8a72`): Primary brand color representing clarity and focus.
- **Amber Gold** (`#f59e0b`): Secondary accent representing urgency, XP rewards, and achievements.
- **Mint Tint** (`#e6f7f4`): Subtle tag backdrops and soft card states.
- **Surface Elevation**: Layered cards with subtle border strokes (`border-zinc-200 dark:border-zinc-800`).

---

## Application Route Map

| Path | Component | Responsibility |
|---|---|---|
| `/` | `DashboardPage.jsx` | Command center with KPI metrics, urgent tasks, deadlines, in-progress courses, and today's habits. |
| `/tasks` | `TasksPage.jsx` | Kanban board (drag & drop) and List view with search, filter, and completion toggles. |
| `/goals` | `GoalsPage.jsx` | Strategic goal rows with inline progress bars and expandable assigned task drawers. |
| `/courses` | `CoursesPage.jsx` | Learning cards with direct increment buttons, cover uploads, and certificate viewer. |
| `/habits` | `HabitsPage.jsx` | 7-day habit matrices, period analytics (Week/Month/Year), and streak badges. |
| `/categories` | `CategoriesPage.jsx` | Taxonomy tags manager with custom color picker and task counters. |
| `/analytics` | `AnalyticsPage.jsx` | Deep-dive productivity insights and priority workload distribution. |
| `/settings` | `SettingsPage.jsx` | Profile editor, avatar uploader, title equip, password change, and dashboard view customizer. |
| `/login` | `LoginPage.jsx` | Glassmorphic authentication portal with validation. |
| `/register` | `RegisterPage.jsx` | Onboarding register flow with live password strength indicator. |

---

## Core UI Components

- **`Button`**: Polished button supporting `primary`, `secondary`, `outline`, `ghost`, and `danger` variants with loading states.
- **`Modal`**: Accessible dialog with smooth scale-in animation, escape key handlers, and backdrop click dismissal.
- **`Card`**: Elevated surface with subtle borders, hover elevation, and dark mode transitions.
- **`Badge`**: Small semantic pill for status (`TODO`, `IN_PROGRESS`, etc.) and priority (`LOW`, `HIGH`, `URGENT`).
- **`OnboardingGuide`**: Interactive quest hub guiding zero-state accounts through their first 4 platform milestones.
