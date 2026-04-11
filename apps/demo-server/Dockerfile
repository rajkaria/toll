FROM node:20-slim AS base
RUN corepack enable

WORKDIR /app

# Copy workspace root files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./

# Copy all packages and the demo-server app
COPY packages/ packages/
COPY apps/demo-server/ apps/demo-server/

# Install all dependencies (workspace mode)
RUN pnpm install --frozen-lockfile

# Build packages first, then demo server
RUN pnpm --filter @rajkaria123/toll-stellar build && \
    pnpm --filter @rajkaria123/toll-gateway build && \
    pnpm --filter demo-server build

# Production stage
FROM node:20-slim AS runner
RUN corepack enable

WORKDIR /app

COPY --from=base /app ./

# Create data directory for SQLite
RUN mkdir -p /data

ENV NODE_ENV=production
ENV PORT=3002
ENV TOLL_DATA_DIR=/data

EXPOSE 3002

CMD ["node", "apps/demo-server/dist/index.js"]
