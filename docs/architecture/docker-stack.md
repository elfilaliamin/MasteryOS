# 🐳 Docker Container Stack

MasteryOS encapsulates services across dedicated, lightweight Linux containers orchestrated with Docker Compose.

---

## 1. Database Service (`db`)
- **Image**: `postgres:16-alpine`
- **Container Name**: `mastery_os_postgres_db`
- **Volume Mount**: `postgres_data` -> `/var/lib/postgresql/data`
- **Automatic Healthcheck**:
  ```yaml
  healthcheck:
    test: ["CMD-SHELL", "pg_isready -U ${DB_USER:-postgres} -d ${DB_NAME:-tasktracker_db}"]
    interval: 5s
    timeout: 5s
    retries: 5
  ```
- **Initialization**: Automatically mounts `./backend/src/db/init.sql` to execute database schemas, enum types, and default seeds upon initial boot.

---

## 2. Backend Service (`backend`)
- **Image**: Built from `node:26-slim`
- **Container Name**: `mastery_os_backend_api`
- **Port**: Internal port `5000` (bridged to Nginx)
- **Dependency Guard**: Waits for `db` container to reach `service_healthy` before initiating Express.
- **Upload Storage**: Mounts `uploads_data` volume to `/app/uploads` for non-volatile asset storage outside code execution roots.

---

## 3. Frontend Service (`frontend`)
- **Image**: Multi-stage build -> `nginx:alpine`
- **Container Name**: `mastery_os_frontend_web`
- **Exposed Port**: `80` (HTTP ingress from Cloudflare Tunnel or local browser)
- **Responsibilities**:
  1. Serves compiled React 19 SPA from `/usr/share/nginx/html`.
  2. Serves compiled VitePress Documentation from `/usr/share/nginx/html/Docs`.
  3. Reverse proxies `/api/*` requests internally to `http://backend:5000/api/` with zero CORS hurdles.
  4. Enforces HTTP security headers (`nosniff`, `DENY` clickjacking, strict Referrer).

---

## 4. Cloudflare Ingress Service (`tunnel`)
- **Image**: `cloudflare/cloudflared:latest`
- **Container Name**: `cloudflared_tunnel`
- **Purpose**: Establishes secure outbound TLS tunnel to Cloudflare Edge network without opening router inbound ports or requiring public static IP addresses.
