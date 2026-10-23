# 🔊 Audio & Positive Feedback Engine

MasteryOS features an embedded, zero-dependency audio feedback engine built entirely on the native **Web Audio API**. It delivers crisp, satisfying micro-soundscapes for positive actions—such as checking off tasks, finishing course lessons, completing strategic goals, logging habits, and ranking up.

---

## 🎧 Architecture & Design Principles

```
User Action (Check Task / Complete Lesson / Goal / Habit / Level Up)
                              │
                              ▼
                SoundContext / useSound() Hook
                              │
                              ▼
                soundService (Web Audio API)
               ┌──────────────┴──────────────┐
               ▼                             ▼
       AudioContext Resumed           Oscillator Nodes
     (Auto-Unlocked on Gesture)      (Harmonic Envelopes)
               │                             │
               └──────────────┬──────────────┘
                              ▼
                  GainNode (Volume & Mute)
                              │
                              ▼
                 Destination (Speakers / Audio)
```

1. **Zero External Assets**: All sounds are synthesized in real time via frequency math and gain envelopes (`sine` and `triangle` oscillators). This eliminates heavy MP3/WAV asset downloads, prevents missing file 404s, and delivers instantaneous playback with sub-millisecond latency.
2. **Offline by Default**: Works seamlessly offline, in progressive web app (PWA) environments, and inside isolated Docker network containers.
3. **Browser Autoplay Compliance**: Modern browsers suspend audio contexts until an explicit user gesture occurs. The engine automatically unlocks and resumes `AudioContext` upon the user's first click, keystroke, or touch interaction.

---

## 🎵 Positive Action Sound Profiles

| Event | Synthesizer Envelope | Musical Character | Trigger Points |
|---|---|---|---|
| **Task Completed** | $D_5 \ (587\text{ Hz}) \to A_5 \ (880\text{ Hz})$ sweep with sparkling harmonic overtone ($1,760\text{ Hz}$) and $0.18\text{s}$ decay. | Crisp, bright, high-resonance pop & ping. | Tasks List checkboxes, Kanban Board drag-to-complete, Dashboard urgent tasks, and Focus Mode sprints. |
| **Lesson Advanced** | Dual-chime: $C_5 \ (523\text{ Hz})$ at $t=0$, followed by $G_5 \ (784\text{ Hz})$ at $t=0.12\text{s}$ with $0.35\text{s}$ gentle decay. | Warm, ascending harmonic progression. | Increments in Courses Page and Dashboard Active Courses widget. |
| **Full Course Finished** | Triumphant major arpeggio ($C_5 \to E_5 \to G_5 \to C_6 \to E_6$) culminating in a sustained celebratory chord with shimmer. | Majestic fanfare and celebratory chord. | Boundary transition when `finished_lessons == total_lessons` (100% completion). |
| **Goal Milestone** | Rich $F\text{ Major }9$ resonant chord ($349\text{ Hz}, 440\text{ Hz}, 523\text{ Hz}, 659\text{ Hz}, 698\text{ Hz}$) with high harmonic bell ($1,397\text{ Hz}$). | Deep, rewarding prestige harmony. | All linked tasks for a strategic goal reach `COMPLETED` status. |
| **Habit Checked** | Sharp $E_5 \ (659\text{ Hz}) + E_6 \ (1,318\text{ Hz})$ transient with soft sub-bass tap ($329\text{ Hz}$) in $<0.1\text{s}$. | Snappy, tactile wooden/metallic click. | Marking a habit as completed for today. |
| **Level Up Fanfare** | Ascending triumphant fanfare ($G_4 \to C_5 \to E_5 \to G_5 \to C_6$) followed by a grand finale chord with shimmering decay ($1.2\text{s}$). | Orchestral celebration fanfare. | Opening of `LevelUpModal` upon genuine rank tier advancement. |

---

## 🎛️ User Preferences & Controls

### 1. Global Mute & Unmute Quick Toggle
Users can toggle audio feedback instantly from anywhere in the application:
- **Top Navigation Bar (`Navbar.jsx`)**: Volume icon button located directly next to the Dark/Light Mode switch.
- **Persistent Sidebar (`Sidebar.jsx`)**: Compact audio toggle button in the desktop sidebar header.

### 2. Audio Customizer in Settings (`SettingsPage.jsx`)
Located in **Settings > Audio & Positive Feedback**:
- **Master Sound Toggle Switch**: Enable or disable audio feedback globally.
- **Master Volume Slider**: Fine-tune volume from `0%` to `100%` with real-time percentage feedback.
- **Interactive Micro-Sounds Preview Grid**: 6 dedicated test buttons allowing users to audition every sound profile at their chosen volume level.

### 3. State Persistence
- Preferences are cached locally in browser storage:
  - `mastery_sound_enabled`: `'true'` or `'false'`.
  - `mastery_sound_volume`: Float value between `0.0` and `1.0`.
- Automatically synchronized with the backend database in `users.settings` via `PUT /api/auth/settings` when authenticated.
