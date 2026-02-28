#!/usr/bin/env bash
# ─── Brev oncreate lifecycle script ─────────────────────────────
# CPU-only · Single-container Docker deployment · Idempotent
# ─────────────────────────────────────────────────────────────────
set -euo pipefail

# ── Configuration ────────────────────────────────────────────────
REPO_URL="${REPO_URL:-}"
GITHUB_TOKEN="${GITHUB_TOKEN:-}"
APP_DIR="${APP_DIR:-/home/user/app}"
CONTAINER_NAME="predictive-outage"
HOST_PORT="8080"

# Vite build-time vars (set these in Brev environment variables)
VITE_SUPABASE_URL="${VITE_SUPABASE_URL:-}"
VITE_SUPABASE_PUBLISHABLE_KEY="${VITE_SUPABASE_PUBLISHABLE_KEY:-}"
VITE_SUPABASE_PROJECT_ID="${VITE_SUPABASE_PROJECT_ID:-}"

# ── Helpers ──────────────────────────────────────────────────────
log()  { printf '\n\033[1;34m▸ %s\033[0m\n' "$*"; }
err()  { printf '\033[1;31m✗ %s\033[0m\n' "$*" >&2; exit 1; }

# ── Validate ─────────────────────────────────────────────────────
[ -z "$REPO_URL" ] && err "REPO_URL is not set. Export it or set it in Brev environment variables."
[ -z "$VITE_SUPABASE_URL" ] && err "VITE_SUPABASE_URL is not set."
[ -z "$VITE_SUPABASE_PUBLISHABLE_KEY" ] && err "VITE_SUPABASE_PUBLISHABLE_KEY is not set."
[ -z "$VITE_SUPABASE_PROJECT_ID" ] && err "VITE_SUPABASE_PROJECT_ID is not set."

# ── System packages (skip CUDA / GPU) ───────────────────────────
log "Installing base packages"
sudo apt-get update -qq
sudo apt-get install -y -qq --no-install-recommends \
  git curl ca-certificates >/dev/null

# ── Ensure Docker is available ───────────────────────────────────
if ! command -v docker &>/dev/null; then
  err "Docker is not installed on this VM. Please use a Brev image with Docker pre-installed."
fi

# ── Clone repo (idempotent) ─────────────────────────────────────
log "Cloning repository"
CLONE_URL="$REPO_URL"
if [ -n "$GITHUB_TOKEN" ]; then
  CLONE_URL="${REPO_URL/https:\/\//https://${GITHUB_TOKEN}@}"
fi

if [ -d "$APP_DIR/.git" ]; then
  log "Repo already cloned — pulling latest"
  cd "$APP_DIR"
  git pull --ff-only || git reset --hard origin/main
else
  rm -rf "$APP_DIR"
  git clone "$CLONE_URL" "$APP_DIR"
  cd "$APP_DIR"
fi

# ── Build Docker image ──────────────────────────────────────────
log "Building Docker image: $CONTAINER_NAME"
docker build \
  --build-arg VITE_SUPABASE_URL="$VITE_SUPABASE_URL" \
  --build-arg VITE_SUPABASE_PUBLISHABLE_KEY="$VITE_SUPABASE_PUBLISHABLE_KEY" \
  --build-arg VITE_SUPABASE_PROJECT_ID="$VITE_SUPABASE_PROJECT_ID" \
  -t "$CONTAINER_NAME" .

# ── Install systemd service ──────────────────────────────────────
log "Installing systemd service"
sudo cp "$APP_DIR/.brev/predictive-outage.service" /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable predictive-outage.service

# ── Start via systemd (replace if already running) ───────────────
log "Starting container on port $HOST_PORT"
docker rm -f "$CONTAINER_NAME" 2>/dev/null || true
sudo systemctl restart predictive-outage.service

# ── Post-deploy health check ─────────────────────────────────────
log "Running health check on http://localhost:$HOST_PORT/health.json"
RETRIES=10
DELAY=3
for i in $(seq 1 $RETRIES); do
  RESPONSE=$(curl -sf "http://localhost:$HOST_PORT/health.json" 2>/dev/null) && break
  log "Attempt $i/$RETRIES — waiting ${DELAY}s..."
  sleep "$DELAY"
done

if [ -z "${RESPONSE:-}" ]; then
  err "Health check failed after $RETRIES attempts. Container may not be serving."
fi

STATUS=$(echo "$RESPONSE" | grep -o '"status":"[^"]*"' | head -1)
if [ "$STATUS" != '"status":"ok"' ]; then
  err "Health check returned unexpected status: $RESPONSE"
fi

log "Health check passed ✓"
echo "$RESPONSE" | sed 's/,/\n  /g; s/{/{\n  /; s/}/\n}/'
echo ""
log "Done ✓  App running at http://localhost:$HOST_PORT"
