# 📦 Persistence & Migrations

PostgreSQL in MasteryOS is configured for automated bootstrapping, volume resilience, and zero-downtime schema evolution.

---

## Volume Persistence

The database data files are housed inside the named Docker volume `postgres_data`, mapped to:
```
/var/lib/postgresql/data
```

This guarantees:
- Rebuilding containers (`docker compose up --build`) preserves all accounts and tasks.
- System reboots and container upgrades retain relational tables without data corruption.

---

## Automatic Bootstrap Initialization

When Docker creates a new container and detects an uninitialized data directory, it runs all SQL scripts placed within `/docker-entrypoint-initdb.d/` in alphabetical sequence.

MasteryOS mounts:
```yaml
volumes:
  - postgres_data:/var/lib/postgresql/data
  - ./backend/src/db/init.sql:/docker-entrypoint-initdb.d/init.sql:ro
```

`backend/src/db/init.sql` provisions:
1. `uuid-ossp` or native `gen_random_uuid()` extensions.
2. Custom PostgreSQL ENUM types (`task_status`, `task_priority`).
3. Core relational tables (`users`, `categories`, `tasks`, `task_activities`, `goals`, `courses`, `habits`).
4. High-performance compound indexes for query speed.

---

## Backup & Restore Commands

### Database Backup
```bash
docker exec -t mastery_os_postgres_db pg_dump -U postgres tasktracker_db > backup_$(date +%Y%m%d).sql
```

### Database Restore
```bash
cat backup_20261017.sql | docker exec -i mastery_os_postgres_db psql -U postgres -d tasktracker_db
```
