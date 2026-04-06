# Multi-stage Dockerfile for Toll MCP Gateway
FROM node:22-alpine AS builder

RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY packages/ packages/
COPY apps/demo-server/ apps/demo-server/

RUN pnpm install --frozen-lockfile
RUN pnpm turbo build --filter=demo-server

# Production
FROM node:22-alpine AS runner
WORKDIR /app

COPY --from=builder /app/apps/demo-server/dist ./dist
COPY --from=builder /app/apps/demo-server/toll.config.json ./
COPY --from=builder /app/apps/demo-server/package.json ./
COPY --from=builder /app/node_modules ./node_modules

ENV NODE_ENV=production
ENV PORT=3002
EXPOSE 3002

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s CMD wget -qO- http://localhost:3002/health || exit 1

CMD ["node", "dist/index.js"]
