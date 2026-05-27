# ---------- 1. Base stage ----------
FROM node:25-alpine AS base
RUN apk add --no-cache libc6-compat
WORKDIR /app
# Install pnpm globally & bypass strict build script blocks
RUN npm install -g pnpm && pnpm config set strict-dep-builds false

# ---------- 2. Dependencies stage ----------
FROM base AS dependencies
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# ---------- 3. Development runtime ----------
FROM base AS development
COPY --from=dependencies /app/node_modules ./node_modules
COPY . .
ENV PORT=3000
ENV NODE_ENV=development
ENV NEXT_PUBLIC_APP_ENV=development
ENV NEXT_TELEMETRY_DISABLED=1
EXPOSE 3000
CMD ["pnpm", "run", "dev"]

# ---------- 4. Production builder stage ----------
FROM dependencies AS builder
COPY . .
ARG NEXT_PUBLIC_SSE_SERVER
ENV NEXT_PUBLIC_SSE_SERVER=${NEXT_PUBLIC_SSE_SERVER}
ARG NEXT_PUBLIC_BASE_URL
ENV NEXT_PUBLIC_BASE_URL=${NEXT_PUBLIC_BASE_URL}
ARG NEXT_PUBLIC_APP_ENV
ENV NEXT_PUBLIC_APP_ENV=${NEXT_PUBLIC_APP_ENV}
ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm run build

# ---------- 5. Production runner stage ----------
FROM base AS runner
COPY --from=builder /app/package.json /app/pnpm-lock.yaml ./
RUN pnpm install --prod --frozen-lockfile

COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public

ENV PORT=5050
ENV NODE_ENV=production
ARG NEXT_PUBLIC_APP_ENV
ENV NEXT_PUBLIC_APP_ENV=${NEXT_PUBLIC_APP_ENV}
ENV NEXT_TELEMETRY_DISABLED=1
EXPOSE 5050

CMD ["pnpm", "run", "start"]
