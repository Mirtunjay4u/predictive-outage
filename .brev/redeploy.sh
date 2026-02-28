#!/usr/bin/env bash
# ─── Quick redeploy on Brev ─────────────────────────────────────
# Pull latest → rebuild Docker image → restart service
# ─────────────────────────────────────────────────────────────────
set -euo pipefail

APP_DIR="${APP_DIR:-/home/user/app}"
CONTAINER_NAME="predictive-outage"
HOST_PORT="8080"

log()  { printf '\n\033[1;34m▸ %s\033[0m\n' "$*"; }
err()  { printf '\033[1;31m✗ %s\033[0m\n' "$*" >&2; exit 1; }

[ -d "$APP_DIR/.git" ] || err "Repo not found at $APP_DIR. Run setup.sh first."
cd "$APP_DIR"

log "Pulling latest code"
git pull --ff-only || git reset --hard origin/main

log "Rebuilding Docker image"
docker build \
  --build-arg VITE_SUPABASE_URL="${VITE_SUPABASE_URL:-}" \
  --build-arg VITE_SUPABASE_PUBLISHABLE_KEY="${VITE_SUPABASE_PUBLISHABLE_KEY:-}" \
  --build-arg VITE_SUPABASE_PROJECT_ID="${VITE_SUPABASE_PROJECT_ID:-}" \
  -t "$CONTAINER_NAME" .

log "Restarting service"
docker rm -f "$CONTAINER_NAME" 2>/dev/null || true
sudo systemctl restart predictive-outage.service

log "Running health check"
for i in $(seq 1 10); do
  RESPONSE=$(curl -sf "http://localhost:$HOST_PORT/health.json" 2>/dev/null) && break
  sleep 3
done
[ -z "${RESPONSE:-}" ] && err "Health check failed."
echo "$RESPONSE" | sed 's/,/\n  /g; s/{/{\n  /; s/}/\n}/'

log "Redeploy complete ✓"
