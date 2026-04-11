FROM node:20-slim AS base
RUN npm i -g pnpm@10

FROM base AS build
WORKDIR /app
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json tsconfig.base.json ./
COPY packages/sdk/ packages/sdk/
COPY packages/stellar/ packages/stellar/
COPY apps/proxy/ apps/proxy/
RUN pnpm install --frozen-lockfile || pnpm install
RUN pnpm --filter @rajkaria123/toll-stellar build
RUN pnpm --filter @rajkaria123/toll-sdk build
RUN pnpm --filter @rajkaria123/toll-proxy build

FROM base AS runtime
WORKDIR /app
COPY --from=build /app /app
ENV NODE_ENV=production
EXPOSE 3010
CMD ["node", "apps/proxy/dist/index.js", "--port", "3010"]
