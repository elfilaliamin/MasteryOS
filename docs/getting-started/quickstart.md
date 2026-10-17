# 🚀 Quickstart & Installation

MasteryOS is orchestrated via Docker Compose for turnkey local development and production deployment. Follow these steps to run the complete stack.

---

## Prerequisites

Ensure you have the following installed on your host system:
- **Git**: [git-scm.com](https://git-scm.com/)
- **Docker & Docker Compose**: Docker Engine v24+ & Docker Compose v2+
- **Node.js** (Optional for local development outside Docker): Node.js v20+

---

## 1. Clone the Repository

Clone the official repository from GitHub:

```bash
git clone https://github.com/elfilaliamin/MasteryOS.git
cd MasteryOS
```

---

## 2. Environment Configuration

Copy the example environment configuration template:

```bash
cp .env.example .env
```

Open `.env` and verify or adjust the default environment variables:

```ini
# PostgreSQL Credentials
DB_USER=postgres
DB_PASSWORD=your_secure_password_here
DB_NAME=tasktracker_db

# JWT Security
JWT_SECRET=super_secret_jwt_key_master_tasks_tracker_2026_at_least_32_chars
JWT_EXPIRES_IN=30d

# Cloudflare Tunnel (for production exposure, optional locally)
CLOUDFLARE_TUNNEL_TOKEN=
```

---

## 3. Run with Docker Compose

Launch the three core microservices (PostgreSQL 16, Node.js 26 Backend, and Nginx Alpine Frontend):

```bash
docker compose up -d --build
```

### Checking Container Health

```bash
docker compose ps
```

You should observe the following services running:
- `mastery_os_postgres_db`: PostgreSQL 16 Alpine (Port `5432`)
- `mastery_os_backend_api`: Node.js Express Server (Internal Port `5000`)
- `mastery_os_frontend_web`: Nginx Web Server (Exposed on Port `80`)

---

## 4. Access the Application

Once the containers are healthy:
- **MasteryOS Web Application**: [http://localhost](http://localhost)
- **Documentation Hub**: [http://localhost/Docs](http://localhost/Docs) (or `mydomain.com/Docs` in production)
- **Backend Health Check**: [http://localhost/api/health](http://localhost/api/health)

---

## 5. First-Run Guided Quests

When registering a brand new user account, MasteryOS detects a zero-state profile and automatically launches the **Gamified Onboarding Quests Hub**:
1. 🎯 **First Goal Quest**: Chart your vision and earn +50 XP.
2. 📚 **First Course Quest**: Add your skill learning material and earn +50 XP.
3. ✅ **First Task Quest**: Create your first actionable task and earn +50 XP.
4. 🔥 **First Habit Quest**: Set up a daily discipline tracker and earn +50 XP.
