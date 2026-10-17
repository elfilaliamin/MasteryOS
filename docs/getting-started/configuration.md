# ⚙️ Environment Configuration

MasteryOS utilizes clean environment-driven configuration across all containers.

---

## Environment Variables Reference

| Variable | Description | Default / Example | Required |
|---|---|---|---|
| `DB_USER` | PostgreSQL superuser username | `postgres` | Yes |
| `DB_PASSWORD` | PostgreSQL database user password | `postgres123` | Yes |
| `DB_NAME` | Initial database name | `tasktracker_db` | Yes |
| `DB_HOST` | Hostname of database container | `db` (in Docker) or `localhost` | Yes |
| `DB_PORT` | PostgreSQL port | `5432` | Yes |
| `PORT` | Express server listen port | `5000` | No |
| `NODE_ENV` | Runtime environment (`development` / `production`) | `production` | Yes |
| `JWT_SECRET` | 32+ character cryptographic secret for signing JWTs | *Must be high entropy* | Yes |
| `JWT_EXPIRES_IN` | Session token validity duration | `30d` | No |
| `CLOUDFLARE_TUNNEL_TOKEN` | Tunnel authentication token for edge ingress | `ey...` | Production only |

---

## Docker Compose Mounts & Volumes

- **`postgres_data`**: Named persistent Docker volume bound to `/var/lib/postgresql/data` within the PostgreSQL container. Keeps all user accounts, tasks, habits, and courses intact across restarts.
- **`uploads_data`**: Named persistent Docker volume bound to `/app/uploads` in the backend container for storage of uploaded course covers, avatars, and certificates.
- **`./backend/src/db/init.sql`**: Read-only volume mount into `/docker-entrypoint-initdb.d/init.sql` for automated zero-step schema bootstrapping on fresh databases.
