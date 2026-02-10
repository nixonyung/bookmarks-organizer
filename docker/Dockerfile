FROM oven/bun:1.3-slim AS build

WORKDIR /app

COPY . .
RUN --mount=type=cache,target=/root/.bun/install/cache \
    bun install --frozen-lockfile --production

CMD bun run index.ts | bunx pino-pretty --translateTime "SYS:standard"