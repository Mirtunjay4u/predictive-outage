#!/usr/bin/env bash
# ─── Brev oncreate lifecycle script ─────────────────────────────
# CPU-only · Minimal · Idempotent
# ─────────────────────────────────────────────────────────────────
set -euo pipefail

# ── Configuration ────────────────────────────────────────────────
REPO_URL="${REPO_URL:-}"
GITHUB_TOKEN="${GITHUB_TOKEN:-}"
APP_DIR="${APP_DIR:-/home/user/app}"
NODE_VERSION="20"

# ── Helpers ──────────────────────────────────────────────────────
log()  { printf '\n\033[1;34m▸ %s\033[0m\n' "$*"; }
err()  { printf '\033[1;31m✗ %s\033[0m\n' "$*" >&2; exit 1; }

# ── Validate ─────────────────────────────────────────────────────
if [ -z "$REPO_URL" ]; then
  err "REPO_URL is not set. Export it before running:
       export REPO_URL=https://github.com/your-org/your-repo.git
       Or set it in Brev environment variables."
fi

# ── System packages (skip CUDA / GPU) ───────────────────────────
log "Installing base packages"
sudo apt-get update -qq
sudo apt-get install -y -qq --no-install-recommends \
  git curl ca-certificates build-essential >/dev/null

# ── Node.js via nvm (idempotent) ────────────────────────────────
log "Setting up Node.js $NODE_VERSION"
export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
if [ ! -d "$NVM_DIR" ]; then
  curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
fi
# shellcheck source=/dev/null
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
nvm install "$NODE_VERSION" >/dev/null 2>&1
nvm use "$NODE_VERSION" >/dev/null 2>&1

# ── Clone repo (idempotent) ─────────────────────────────────────
log "Cloning repository"
CLONE_URL="$REPO_URL"
if [ -n "$GITHUB_TOKEN" ]; then
  # Inject token for private repos: https://<token>@github.com/...
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

# ── Install dependencies ────────────────────────────────────────
log "Installing npm dependencies"
npm ci --prefer-offline 2>/dev/null || npm install

# ── Build ────────────────────────────────────────────────────────
log "Building production bundle"
npm run build

# ── Serve (simple static server on port 8080) ───────────────────
log "Installing serve"
npm install -g serve >/dev/null 2>&1

log "Done ✓  Run:  serve -s dist -l 8080"
echo ""
echo "  To start:  cd $APP_DIR && serve -s dist -l 8080"
echo ""
