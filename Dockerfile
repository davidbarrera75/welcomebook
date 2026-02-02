# Dockerfile para Welcomebook
FROM node:20-alpine AS base

# Instalar dependencias necesarias para Prisma
RUN apk add --no-cache libc6-compat openssl

WORKDIR /app

# Instalar dependencias
FROM base AS deps
COPY package.json yarn.lock* package-lock.json* ./
COPY prisma ./prisma/

RUN npm install --legacy-peer-deps

# Generar Prisma Client
RUN npx prisma generate

# Imagen de desarrollo
FROM base AS development
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generar Prisma Client en desarrollo también
RUN npx prisma generate

ENV NODE_ENV=development
ENV NEXT_TELEMETRY_DISABLED=1

EXPOSE 3000

CMD ["npm", "run", "dev"]

# Build de producción
FROM base AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1

RUN npm run build

# Imagen de producción
FROM base AS production
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
