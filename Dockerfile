# ---------- 1. Builder stage ----------
FROM node:25-trixie AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
ARG NEXT_PUBLIC_SSE_SERVER
ENV NEXT_PUBLIC_SSE_SERVER=${NEXT_PUBLIC_SSE_SERVER}
RUN npm run build


# ---------- 2. Production runner ----------
FROM node:25-trixie

WORKDIR /app

COPY --from=builder /app/package*.json ./
RUN npm install --omit=dev

COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public

ENV PORT=5050
EXPOSE 5050

CMD ["npm", "run", "start"]

