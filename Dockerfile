# syntax=docker.io/docker/dockerfile:1

FROM node:24-alpine AS base

# --- deps: install dependencies with pnpm, cached separately from source ---
FROM base AS deps
RUN corepack enable
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

# --- builder: build the Next.js app ---
FROM base AS builder
RUN corepack enable
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# NEXT_PUBLIC_* vars are inlined into the client bundle at build time, so
# this must be set here (not just at runtime in the final stage).
ARG NEXT_PUBLIC_API_BASE_URL=https://cms-gateway.polskieradio.pl/dev-proxy
ENV NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL
ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm build

# --- runner: minimal production image, runs the standalone server ---
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Next.js standalone output already contains a minimal node_modules with only
# the deps needed at runtime, plus a self-contained server.js entrypoint.
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

CMD ["node", "server.js"]
