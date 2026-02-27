# Predictive Outage Management — Operator Copilot

Decision-support and situational awareness tool for utility outage operations.
All insights are advisory and require explicit human operator review.

---

## Tech Stack

- **Frontend:** React 18 · Vite · TypeScript · Tailwind CSS · shadcn/ui
- **Backend:** Lovable Cloud (Supabase) — Edge Functions, Postgres, Auth
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

| Command          | Description                        |
| ---------------- | ---------------------------------- |
| `npm run dev`    | Start Vite dev server (port 8080)  |
| `npm run build`  | Production build → `dist/`         |
| `npm run preview`| Serve production build locally     |
| `npm run lint`   | Run ESLint                         |
| `npm run format` | Run Prettier (write)               |

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

## Container / Brev Deployment

A multi-stage `Dockerfile` is included for containerized deployment.

```bash
# Build image (pass env vars at build time for Vite inlining)
docker build \
  --build-arg VITE_SUPABASE_URL=https://your-project.supabase.co \
  --build-arg VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key \
  --build-arg VITE_SUPABASE_PROJECT_ID=your-project-id \
  -t predictive-outage .

# Run
docker run -p 8080:80 predictive-outage
```

### Brev-Ready Notes

- The container serves a static SPA via nginx on port 80.
- All `VITE_*` env vars must be passed as **build args** (Vite inlines them at build time).
- Edge functions are deployed separately via Lovable Cloud / Supabase CLI.
- No server-side runtime is needed — the container is purely static.
- Health check: `GET /` returns `200`.

## Deployment via Lovable

Open [Lovable](https://lovable.dev) → Share → Publish.

## Custom Domain

Project → Settings → Domains → Connect Domain.
See [docs](https://docs.lovable.dev/features/custom-domain#custom-domain).

## License

Proprietary — TCS internal use.
