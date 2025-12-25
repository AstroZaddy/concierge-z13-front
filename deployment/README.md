# Z13 Astrology Frontend — Deployment Configuration

This directory contains deployment configuration and instructions for running the Z13 Astrology Frontend as a server-side rendered (SSR) Astro application, backed by a Node.js server and reverse-proxied by Caddy.

⸻

## Architecture Overview

Internet
   ↓
Caddy (80 / 443)
 ├─ /api/*  → FastAPI backend (127.0.0.1:9002)
 └─ /*      → Astro SSR frontend (127.0.0.1:8002)

	•	Frontend: Astro SSR, Node.js
	•	Backend: FastAPI (Docker), port 9002
	•	Reverse Proxy: Caddy
	•	Ports:
	•	8002 → Frontend SSR
	•	9002 → Backend API
	•	API access: Frontend calls /api/* (relative paths, no CORS)

⸻

## Build Instructions

From the frontend project root:

npm install
npm run build

This must produce a server entrypoint, typically:

dist/server/entry.mjs

(Exact output depends on the Astro adapter configuration.)

⸻

Environment Variables

Set via systemd or PM2 (systemd recommended):

Variable	Required	Example	Notes
PORT	✅	8002	Port the Node SSR server listens on
NODE_ENV	✅	production	Required for production builds
PUBLIC_API_URL	❌	/api	Optional helper; API calls should be relative

⚠️ Do not set a full API domain here.
All API traffic is routed internally via Caddy.

⸻

Running the Frontend (Recommended: systemd)

1. Create systemd Service

Copy the service file to /etc/systemd/system/:

sudo cp deployment/z13-frontend.service /etc/systemd/system/

Edit it to match your deployment path:

sudo nano /etc/systemd/system/z13-frontend.service

Example z13-frontend.service

[Unit]
Description=Z13 Astrology Frontend (Astro SSR)
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/srv/z13/concierge-z13-front
Environment=NODE_ENV=production
Environment=PORT=8002
Environment=PUBLIC_API_URL=/api
ExecStart=/usr/bin/node dist/server/entry.mjs
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target

If your build does not produce dist/server/entry.mjs, replace ExecStart with:

ExecStart=/usr/bin/npm run start



Enable & Start the Service

sudo systemctl daemon-reload
sudo systemctl enable z13-frontend
sudo systemctl start z13-frontend
sudo systemctl status z13-frontend


⸻

Alternative: PM2 (Optional)

PM2 is supported but not required.
systemd is preferred for long-running production services.

Manual PM2 Start

PORT=8002 NODE_ENV=production PUBLIC_API_URL=/api \
pm2 start dist/server/entry.mjs --name z13-frontend
pm2 save
pm2 startup


⸻

Caddy Configuration

Caddy must route API requests to the backend before proxying everything else to the frontend.

Required Caddyfile Block

z13astro.com {
  # API → FastAPI backend (strip /api prefix before forwarding)
  @api path /api/* /openapi.json /docs /redoc
  handle @api {
    uri strip_prefix /api
    reverse_proxy 127.0.0.1:9002
  }

  # Frontend → Astro SSR Node server
  reverse_proxy 127.0.0.1:8002
}

Reload Caddy after changes:

sudo systemctl reload caddy


⸻

Verification Checklist

1. Confirm Frontend Is Listening

sudo ss -tlnp | grep 8002

2. Test Frontend Directly

curl http://localhost:8002

3. Test Through Caddy

curl -I https://z13astro.com/

4. Verify API Routing

curl https://z13astro.com/api/meta/ping

You should receive a FastAPI JSON response.

⸻

Logs & Troubleshooting

Frontend (systemd)

sudo journalctl -u z13-frontend -f

Backend (Docker)

docker logs -f z13-api

Caddy

sudo journalctl -u caddy -f


⸻

Common Issues

❌ 404 at Domain Root
	•	Frontend SSR server not running
	•	Incorrect ExecStart
	•	Caddy still configured for static file serving

❌ API Calls Return HTML
	•	/api/* route missing or placed after frontend proxy

❌ Auth Cookies Not Persisting
	•	Ensure frontend fetch calls include:

fetch("/api/auth/me", { credentials: "include" })



⸻

Notes on Dockerizing the Frontend

Docker is not required at this stage.

Current approach advantages:
	•	Faster iteration
	•	Easier debugging
	•	Clear separation from backend services

Dockerizing later is straightforward once the frontend stabilizes.

⸻

Final Recommendation
	•	✅ Astro SSR via Node.js on port 8002
	•	✅ Caddy reverse proxy
	•	✅ systemd for process management
	•	❌ Static file serving
	•	❌ Cross-domain API calls

This setup is production-grade, scalable, and future-proof — exactly where Z13 should be at launch 🚀