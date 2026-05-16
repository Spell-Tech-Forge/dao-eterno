# =============================================================================
# Dao Eterno — Dockerfile (multi-stage)
# Stage 1: build do frontend (React/Vite)
# Stage 2: build do servidor (TypeScript → JS)
# Stage 3: imagem final de produção (somente o necessário)
# =============================================================================

# ── Stage 1: Frontend build ───────────────────────────────────────────────────
FROM node:22-alpine AS frontend-builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY index.html vite.config.ts tsconfig*.json ./
COPY src ./src
COPY public ./public

RUN npm run build

# ── Stage 2: Server build ─────────────────────────────────────────────────────
FROM node:22-alpine AS server-builder
WORKDIR /app/server

COPY server/package*.json ./
RUN npm ci

COPY server/src ./src
COPY server/tsconfig.json ./

RUN npx tsc

# ── Stage 3: Produção ─────────────────────────────────────────────────────────
FROM node:22-alpine AS production
WORKDIR /app/server

# Dependências de produção apenas
COPY server/package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Servidor compilado
COPY --from=server-builder /app/server/dist ./dist

# Frontend buildado (servido pelo Express em prod)
COPY --from=frontend-builder /app/dist /app/dist

# Usuário não-root por segurança
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:3001/api/health || exit 1

CMD ["node", "dist/index.js"]
