# 🚀 Production Deployment & Cloudflare Tunnel

Deploying MasteryOS to production with Docker Compose and Cloudflare Zero Trust tunnel.

---

## 1. Production Docker Stack

Run the stack in detached daemon mode:

```bash
docker compose up -d --build
```

Ensure the containers are reporting healthy:
```bash
docker compose ps
```

---

## 2. Cloudflare Tunnel Ingress

Cloudflare Tunnels create an encrypted outbound connection to Cloudflare's edge network, eliminating open ports on your server.

### Setup Steps
1. Navigate to **Cloudflare Zero Trust Dashboard** > **Networks** > **Tunnels**.
2. Click **Create a Tunnel** and select the Cloudflare connector.
3. Copy the tunnel token provided in the UI.
4. Add the token to your `.env` file on your server:
   ```ini
   CLOUDFLARE_TUNNEL_TOKEN=eyJhIjoi...
   ```
5. In Cloudflare Tunnel Public Hostname configuration, route your domain:
   - **Service Type**: `HTTP`
   - **URL**: `frontend:80` (or `localhost:80`)

---

## 3. Serving MasteryOS & Documentation

- **Web Application**: Access your configured public domain `https://mydomain.com` to use the MasteryOS React single-page app.
- **Documentation Platform**: Access `https://mydomain.com/Docs` (or `/docs`) to view this VitePress documentation.
- **GitHub Repository**: Accessible via the header link or at [https://github.com/elfilaliamin/MasteryOS](https://github.com/elfilaliamin/MasteryOS).
