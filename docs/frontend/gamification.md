# 🏆 Gamification Engine (XP & Ranks)

MasteryOS incorporates a psychology-backed gamification engine that rewards daily execution, high-priority triage, and consistency without inducing burnout.

---

## XP Calculation Rules

Experience Points (XP) are earned through meaningful system milestones:

| Action | XP Awarded | Multiplier / Condition |
|---|---|---|
| Complete Standard Task | `+20 XP` | Task status transitioned to `COMPLETED` |
| Complete High Priority Task | `+35 XP` | Priority = `HIGH` |
| Complete Urgent Priority Task | `+50 XP` | Priority = `URGENT` |
| Complete Onboarding Foundation Quest | `+50 XP` | One-time bonus per starter quest |
| Complete Strategic Goal | `+100 XP` | All assigned tasks finished |
| Finish Course | `+150 XP` | `finished_lessons == total_lessons` |

---

## 8 Executive Rank Tiers

Progress through the ranks is defined by logarithmic XP thresholds:

| Rank Level | Title | XP Required | Badge Theme |
|---|---|---|---|
| Level 1 | Novice Explorer | `0 XP` | Zinc |
| Level 2 | Focused Apprentice | `150 XP` | Sky Blue |
| Level 3 | Task Orchestrator | `400 XP` | Emerald |
| Level 4 | Efficiency Strategist | `800 XP` | Teal |
| Level 5 | Workflow Commander | `1,400 XP` | Indigo |
| Level 6 | High-Output Executive | `2,200 XP` | Purple |
| Level 7 | Productivity Architect | `3,200 XP` | Amber Gold |
| Level 8 | Grandmaster of Systems | `4,500+ XP` | Rose / Obsidian |

---

## Unlockable Executive Titles

Users can unlock and equip prestige titles displayed on their public avatar and profile:

- **"The Punctual"**: Complete 10 tasks before their designated due date.
- **"Crisis Handler"**: Complete 5 `URGENT` priority tasks.
- **"Lifelong Scholar"**: Complete 3 learning courses.
- **"Iron Discipline"**: Achieve a 14-day streak on any daily habit.
- **"Mastery Pathfinder"**: Complete all 4 introductory onboarding quests.
