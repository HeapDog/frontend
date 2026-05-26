# ---------- 1. Builder stage ----------
FROM node:25-alpine AS builder
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install pnpm globally & bypass strict build script blocks
RUN npm install -g pnpm && pnpm config set strict-dep-builds false

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .
ARG NEXT_PUBLIC_SSE_SERVER
ENV NEXT_PUBLIC_SSE_SERVER=${NEXT_PUBLIC_SSE_SERVER}
ARG NEXT_PUBLIC_BASE_URL
ENV NEXT_PUBLIC_BASE_URL=${NEXT_PUBLIC_BASE_URL}
ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm run build

# ---------- 2. Production runner ----------
FROM node:25-alpine
WORKDIR /app

RUN npm install -g pnpm && pnpm config set strict-dep-builds false

COPY --from=builder /app/package.json /app/pnpm-lock.yaml ./
RUN pnpm install --prod --frozen-lockfile

COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public

ENV PORT=5050
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
EXPOSE 5050

CMD ["pnpm", "run", "start"]
