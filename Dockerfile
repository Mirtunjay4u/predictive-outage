# ─── Stage 1: Build ──────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

COPY package.json bun.lock ./
RUN npm install --frozen-lockfile || npm install

COPY . .

# Build-time env vars (override at build or via .env)
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_PUBLISHABLE_KEY
ARG VITE_SUPABASE_PROJECT_ID

RUN npm run build \
 && COMMIT=$(git rev-parse --short HEAD 2>/dev/null || echo "unknown") \
 && VERSION=$(node -p "require('./package.json').version" 2>/dev/null || echo "0.0.0") \
 && BUILT_AT=$(date -u +"%Y-%m-%dT%H:%M:%SZ") \
 && sed -i "s/__COMMIT__/$COMMIT/g; s/__VERSION__/$VERSION/g; s/__BUILT_AT__/$BUILT_AT/g" dist/health.html

# ─── Stage 2: Serve ──────────────────────────────────────────
FROM nginx:stable-alpine AS runner
COPY --from=builder /app/dist /usr/share/nginx/html

# SPA fallback
RUN printf 'server {\n  listen 80;\n  root /usr/share/nginx/html;\n  location / {\n    try_files $uri $uri/ /index.html;\n  }\n}\n' > /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
