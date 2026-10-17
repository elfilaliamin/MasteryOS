# 🏛️ Architecture Overview

MasteryOS follows a multi-tier microservices architecture engineered for resilience, clear boundaries of concern, low latency, and bank-grade data security.

---

## High-Level Topology

```
                              Public Internet
                                     │
                                     ▼
                   [ Cloudflare Edge CDN / Tunnel ]
                                     │
                               Port 80 / 443
                                     ▼
       ┌───────────────────────────────────────────────────────────┐
       │               Frontend Container (nginx:alpine)           │
       │                                                           │
       │  /          ───► Serves React 19 SPA (Vite)               │
       │  /Docs/*    ───► Serves VitePress Documentation Engine    │
       │  /api/*     ───► Proxies to backend:5000/api/*            │
       └─────────────────────────────┬─────────────────────────────┘
                                     │
                             Internal Bridge
                                     │
                                     ▼
       ┌───────────────────────────────────────────────────────────┐
       │             Backend Container (node:26-slim)              │
       │                                                           │
       │  • Express REST API Server with Zod Payload Validation     │
       │  • Multi-tenant user ownership enforcement                │
       │  • HTTP-only cookie session management                    │
       │  • Multer magic-byte upload inspection pipeline           │
       └─────────────────────────────┬─────────────────────────────┘
                                     │
                               Port 5432
                                     │
                                     ▼
       ┌───────────────────────────────────────────────────────────┐
       │             Database Container (postgres:16-alpine)       │
       │                                                           │
       │  • PostgreSQL Relational Engine                           │
       │  • Foreign keys with CASCADE rules                        │
       │  • Indexed user queries and JSONB state storage           │
       │  • Persistent Volume (postgres_data)                      │
       └───────────────────────────────────────────────────────────┘
```

---

## Core Pillars of the Platform

MasteryOS binds 4 foundational workflow disciplines into an interconnected ecosystem:

1. **Strategic Goals 🎯**: Defines visionary north-star outcomes with priority, deadlines, and milestone progress.
2. **Skill Courses 📚**: Knowledge repository tracking structured learning materials, lesson increments, and verified certifications.
3. **Actionable Tasks ✅**: Daily execution engine with Kanban drag-and-drop, priority sorting, categorization, and completion history.
4. **Daily Habits 🔥**: High-consistency streak builder with daily check-off matrices and period analytics.
5. **Gamification Layer 🏆**: Mathematical XP progression and unlockable rank titles recognizing disciplined execution.
