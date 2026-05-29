FROM node:20-slim AS base

# Dependencias
FROM base AS deps
WORKDIR /app
COPY package.json ./

# 1. Limpiamos cualquier caché previo y actualizamos npm
RUN npm cache clean --force && npm install -g npm@latest

# 2. Instalamos las dependencias
RUN npm install

# 3. FIX: Instalamos explícitamente los binarios nativos de Tailwind v4 para Linux
# Esto soluciona el bug conocido de NPM con dependencias opcionales en Docker
RUN npm install @tailwindcss/oxide-linux-x64-gnu --no-save

# Constructor
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED 1
RUN npm run build

# Ejecución (Production)
FROM base AS runner
WORKDIR /app
ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder --chown=nextjs:nodejs /app/public ./public
# Copiamos la versión optimizada "standalone"
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
ENV PORT 3000
ENV HOSTNAME 0.0.0.0
CMD ["node", "server.js"]