# 🏆 Gamification Engine (XP, Ranks & Streaks)

MasteryOS incorporates an advanced, psychology-backed gamification engine that rewards daily execution, strategic milestone completion, knowledge acquisition, and habit consistency without inducing burnout.

---

## ⚡ XP Calculation Architecture

Experience Points (XP) are calculated dynamically across all operational domains:

### 1. Actionable Tasks
| Action / Priority | XP Awarded | Multiplier / Condition |
|---|---|---|
| Complete Low Priority Task | `+50 XP` | Status moved to `COMPLETED` |
| Complete Medium Priority Task | `+60 XP` | `+50 XP` base + `+10 XP` Medium bonus |
| Complete High Priority Task | `+75 XP` | `+50 XP` base + `+25 XP` High bonus |
| Complete Urgent Priority Task | `+90 XP` | `+50 XP` base + `+40 XP` Urgent critical resolver bonus |

### 2. Strategic Goals
| Action | XP Awarded | Multiplier / Condition |
|---|---|---|
| Complete Strategic Goal | `+150 XP` | All assigned tasks for the goal are `COMPLETED` |

### 3. Knowledge & Courses
| Action | XP Awarded | Multiplier / Condition |
|---|---|---|
| Finish Course Lesson | `+15 XP` | Earned per finished lesson module |
| Complete Full Course | `+100 XP` | `finished_lessons >= total_lessons` (`total_lessons > 0`) |

### 4. Habits & Continuous Consistency
| Action | XP Awarded | Multiplier / Condition |
|---|---|---|
| Logged Habit Completion | `+10 XP` | Per completed habit check-in |
| Continuous Active Streak | `+15 XP / day` | Multiplied by current active streak length |
| 7-Day Streak Milestone | `+50 XP` | Bonus for reaching or maintaining $\ge 7$ days streak |
| 14-Day Streak Milestone | `+100 XP` | Bonus for reaching or maintaining $\ge 14$ days streak |
| 30-Day Streak Milestone | `+200 XP` | Bonus for reaching or maintaining $\ge 30$ days streak |

### 5. Foundation Starter Quests
| Action | XP Awarded | Condition |
|---|---|---|
| First Task Created | `+25 XP` | Create your first task |
| First Goal Created | `+25 XP` | Create your first strategic goal |
| First Course Created | `+25 XP` | Track your first skill course |
| First Habit Created | `+25 XP` | Set up your first recurring habit |
| All 4 Pillars Active | `+50 XP` | Completion bonus when all 4 entities exist |

---

## 🏛️ 20 Executive Mastery Tiers

Progress through the ranks is governed by balanced, incremental progression milestones (+300 XP delta per level):

| Level | Title | XP Required | Span | Icon | Theme |
|:---:|---|:---:|:---:|:---:|---|
| **Lv. 1** | Associate Practitioner | `0 – 200 XP` | 200 XP | 🏛️ | Emerald Teal |
| **Lv. 2** | Strategic Specialist | `200 – 500 XP` | 300 XP | ⚡ | Emerald Teal |
| **Lv. 3** | High-Impact Operator | `500 – 950 XP` | 450 XP | 🎯 | Sky Blue |
| **Lv. 4** | Systems Architect | `950 – 1,600 XP` | 650 XP | 📐 | Indigo |
| **Lv. 5** | Executive Director | `1,600 – 2,500 XP` | 900 XP | 🛡️ | Violet Purple |
| **Lv. 6** | Master of Operations | `2,500 – 3,700 XP` | 1,200 XP | 👑 | Amber Gold |
| **Lv. 7** | Principal Strategist | `3,700 – 5,200 XP` | 1,500 XP | 🌟 | Pink Rose |
| **Lv. 8** | Apex Executive | `5,200 – 7,000 XP` | 1,800 XP | 💎 | Emerald Green |
| **Lv. 9** | Senior Managing Director | `7,000 – 9,100 XP` | 2,100 XP | 🏛️ | Emerald Teal |
| **Lv. 10** | Vice President of Execution | `9,100 – 11,500 XP` | 2,400 XP | 🎖️ | Sky Blue |
| **Lv. 11** | Chief of Strategy | `11,500 – 14,200 XP` | 2,700 XP | 🧭 | Indigo |
| **Lv. 12** | Enterprise Architect | `14,200 – 17,200 XP` | 3,000 XP | ⚡ | Violet Purple |
| **Lv. 13** | Global Operations Director | `17,200 – 20,500 XP` | 3,300 XP | 🌐 | Amber Gold |
| **Lv. 14** | Chief Operating Officer | `20,500 – 24,100 XP` | 3,600 XP | ⚔️ | Pink Rose |
| **Lv. 15** | Executive Chancellor | `24,100 – 28,000 XP` | 3,900 XP | 🔮 | Cyan Teal |
| **Lv. 16** | Distinguished Fellow | `28,000 – 32,200 XP` | 4,200 XP | 🌌 | Cyan |
| **Lv. 17** | Master Strategist | `32,200 – 36,700 XP` | 4,500 XP | 🪐 | Royal Blue |
| **Lv. 18** | Sovereign Leader | `36,700 – 41,500 XP` | 4,800 XP | ☀️ | Orange |
| **Lv. 19** | Grand Chancellor | `41,500 – 46,600 XP` | 5,100 XP | 🔥 | Crimson Red |
| **Lv. 20** | Apex Grandmaster | `46,600 – 52,000 XP` | 5,400 XP | 🏆 | Emerald Gold |

---

## 🚀 Post-Level 20 Infinite Progression

Beyond Level 20 ($> 52,000\text{ XP}$):
- **Level Number Scales Dynamically**: The level increments indefinitely (`Level 21`, `Level 22`, `Level 23`, ...) for every $5,500\text{ XP}$ accumulated.
- **Fixed Pinnacle Prestige Title**: Users retain the supreme executive title **"Apex Grandmaster"** without cluttering the system with artificial titles.
- **Continuous Milestone Celebrations**: Progress bars continue filling smoothly, and celebratory level-up modals trigger reliably upon every rank advancement.

---

## 🎖️ Unlockable Executive Titles

Users can equip prestige titles that appear on their profile, sidebar badge, and dashboard header:

| Title | Domain | Requirement | Icon |
|---|---|---|:---:|
| **Practitioner** | Tasks | Complete 1 operational task | 🌱 |
| **Sprint Operator** | Tasks | Complete 3 operational tasks | ⚡ |
| **Critical Resolver** | Tasks | Complete 2 `HIGH` or `URGENT` priority tasks | 🔥 |
| **Milestone Architect** | Goals | Complete at least 1 strategic goal | 🎯 |
| **Domain Scholar** | Courses | Complete at least 1 full course | 🎓 |
| **Systems Lead** | Mastery | Reach Level 4 Systems Architect | 🛡️ |
| **Apex Director** | Mastery | Reach Level 6 Master of Operations | 👑 |
| **Grand Architect** | Mastery | Reach Level 10 Vice President | 🏛️ |
| **Apex Grandmaster** | Mastery | Reach Level 20 Apex Grandmaster | 🏆 |
