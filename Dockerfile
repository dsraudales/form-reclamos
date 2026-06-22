FROM node:22-bookworm AS deps
WORKDIR /app
COPY package.json ./
RUN npm install --include=dev

FROM node:22-bookworm AS builder
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
ENV NEXTAUTH_SECRET=build-time-placeholder
ENV REDIS_URL=redis://redis:6379
ENV IP_HASH_SECRET=build-time-placeholder
ENV MINIO_ENDPOINT=minio
ENV MINIO_PORT=9000
ENV MINIO_BUCKET=cree-client-photos
ENV MINIO_ACCESS_KEY=build-time-placeholder
ENV MINIO_SECRET_KEY=build-time-placeholder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN npm run build

FROM node:22-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
USER node
EXPOSE 3000
CMD ["sh", "-c", "if [ -n \"$DATABASE_URL_FILE\" ]; then export DATABASE_URL=\"$(cat \"$DATABASE_URL_FILE\")\"; fi; node server.js"]
