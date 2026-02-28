# Predictive Outage Management — Operator Copilot

Decision-support and situational awareness tool for utility outage operations.
All insights are advisory and require explicit human operator review.

---

## Tech Stack

- **Frontend:** React 18 · Vite · TypeScript · Tailwind CSS · shadcn/ui
- **Backend:** Lovable Cloud — Edge Functions, Postgres, Auth
- **Maps:** Leaflet · react-leaflet-cluster
- **Charts:** Recharts
- **Animations:** Framer Motion

## Quick Start (Local)

```bash
# 1. Clone
git clone <YOUR_GIT_URL> && cd <YOUR_PROJECT_NAME>

# 2. Install
npm install        # or: bun install

# 3. Environment
cp .env.example .env
# Fill in VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY, VITE_SUPABASE_PROJECT_ID

# 4. Run
npm run dev        # → http://localhost:8080
```

## Scripts

| Command            | Description                        |
| ------------------ | ---------------------------------- |
| `npm run dev`      | Start Vite dev server (port 8080)  |
| `npm run build`    | Production build → `dist/`         |
| `npm run preview`  | Serve production build locally     |
| `npm run lint`     | Run ESLint                         |
| `npm run test`     | Run Vitest tests                   |

## Project Structure

```
src/
├── assets/          # Static images, logos
├── components/      # Reusable UI components (shadcn, domain)
│   ├── ui/          # shadcn primitives
│   ├── dashboard/   # Dashboard widgets
│   ├── map/         # Outage map layers & drawers
│   ├── copilot/     # Copilot panels & decision trace
│   ├── tour/        # Demo tour spotlight & narration
│   └── ...
├── contexts/        # React context providers
├── hooks/           # Custom React hooks (data fetching, etc.)
├── integrations/    # Supabase client & generated types
├── lib/             # Pure utility functions
├── pages/           # Route-level page components
├── types/           # TypeScript type definitions
└── test/            # Test setup & specs
supabase/
├── functions/       # Edge functions (copilot, weather, TTS, etc.)
└── migrations/      # Database migrations
```

## Environment Variables

| Variable                         | Required | Description                      |
| -------------------------------- | -------- | -------------------------------- |
| `VITE_SUPABASE_URL`             | ✅       | Supabase project URL             |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | ✅       | Supabase anon/public key         |
| `VITE_SUPABASE_PROJECT_ID`      | ✅       | Supabase project reference ID    |

Edge function secrets (configured in Lovable Cloud):
- `NVAPI_KEY` — NVIDIA NIM API key
- `ELEVENLABS_API_KEY` — ElevenLabs TTS key

## Brev Deployment (NVIDIA VM)

This project is configured for single-container Docker deployment on NVIDIA Brev CPU VMs.

### Prerequisites

- Brev VM with Docker pre-installed (CPU-only, no GPU required)
- Recommended: **2 vCPU / 4 GB RAM** minimum

### Environment Variables

Set these in **Brev Environment Variables** before creating the instance:

| Variable | Required | Type | Description |
|----------|----------|------|-------------|
| `REPO_URL` | ✅ | Build-time | GitHub repo URL (https) |
| `GITHUB_TOKEN` | ❌ | Build-time | Personal access token (private repos only) |
| `VITE_SUPABASE_URL` | ✅ | Build-time | Supabase project URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | ✅ | Build-time | Supabase anon/public key |
| `VITE_SUPABASE_PROJECT_ID` | ✅ | Build-time | Supabase project reference ID |

> All `VITE_*` vars are inlined by Vite at build time — they are **not** runtime secrets.

### Port Configuration

| Port | Role |
|------|------|
| `80` | Nginx inside container |
| `8080` | Host-mapped port (`-p 8080:80`) |

Brev port forwarding is configured via `.brev/ports.yaml` to expose `8080` over HTTPS.

### Deployment Lifecycle

The `.brev/setup.sh` oncreate script runs automatically and performs:

1. **Validates** all required environment variables
2. **Installs** git + curl (skips CUDA/GPU drivers)
3. **Clones** repo (or pulls latest if already cloned)
4. **Builds** Docker image with all `VITE_*` build args
5. **Installs** systemd service for auto-restart on reboot
6. **Starts** container via systemd
7. **Health check** — retries `GET /health.json` up to 10× (3s intervals), validates `"status":"ok"`

### Health Check Endpoints

| Endpoint | Content-Type | Purpose |
|----------|-------------|---------|
| `GET /health.html` | `text/html` | Browser-friendly status |
| `GET /health.json` | `application/json` | Monitoring / automation |

Both return build metadata: `version`, `commit`, `built_at`.

```bash
# Verify after deployment
curl -s http://localhost:8080/health.json | jq .
# {"status":"ok","version":"0.0.0","commit":"abc1234","built_at":"2026-02-28T12:00:00Z"}
```

### Manual Docker Build (without Brev)

```bash
docker build \
  --build-arg VITE_SUPABASE_URL=https://your-project.supabase.co \
  --build-arg VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key \
  --build-arg VITE_SUPABASE_PROJECT_ID=your-project-id \
  -t predictive-outage .

docker run -p 8080:80 predictive-outage
```

### Files

| File | Purpose |
|------|---------|
| `Dockerfile` | Multi-stage build (Node 20 → Nginx Alpine) |
| `.brev/setup.sh` | Oncreate lifecycle script |
| `.brev/redeploy.sh` | Pull + rebuild + restart convenience script |
| `.brev/predictive-outage.service` | Systemd unit for auto-restart |
| `.brev/ports.yaml` | Brev HTTPS port forwarding |
| `public/health.html` | HTML health check |
| `public/health.json` | JSON health check |

### Notes

- No GPU/CUDA required — this is a static SPA served by Nginx.
- Edge functions are deployed separately via Lovable Cloud.
- The systemd service ensures the container restarts on VM reboot.

## Deployment via Lovable

Open [Lovable](https://lovable.dev) → Share → Publish.

## Custom Domain

Project → Settings → Domains → Connect Domain.
See [docs](https://docs.lovable.dev/features/custom-domain#custom-domain).

## License

Proprietary — TCS internal use.
