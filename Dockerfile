FROM node:20-slim AS base

# Dependencias
FROM base AS deps
WORKDIR /app

# 1. Copiamos el manifiesto Y el lockfile: `npm ci` exige ambos e instala
# exactamente las versiones fijadas. Antes se copiaba solo package.json y se
# usaba `npm install`, con lo que cada build podía resolver dependencias
# distintas (builds no reproducibles).
COPY package.json package-lock.json ./

# 2. Instalación limpia y determinista a partir del lockfile
RUN npm ci

# 3. FIX: Instalamos explícitamente los binarios nativos de Tailwind v4 para Linux
# Esto soluciona el bug conocido de NPM con dependencias opcionales en Docker
RUN npm install @tailwindcss/oxide-linux-x64-gnu --no-save

# Constructor
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Next incrusta las variables NEXT_PUBLIC_* en el bundle del cliente durante el
# build, así que tienen que estar disponibles en esta etapa. Se pasan como build
# args desde docker-compose.yml en lugar de copiar el .env completo: de esa forma
# los secretos (SUPABASE_SERVICE_ROLE_KEY, SUPABASE_JWT_SECRET, POSTGRES_PASSWORD)
# no entran en ninguna capa de la imagen.
#
# Que estos dos valores queden en el historial de la imagen no es un problema:
# son públicos por diseño y viajan igual en el JavaScript que recibe el navegador.
# Las variables de runtime las inyecta docker-compose con `env_file`.
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY

# Falla temprano y con un mensaje claro si faltan: sin ellas el build revienta
# más adelante con un error de export opaco en /auth/sign-up.
RUN test -n "$NEXT_PUBLIC_SUPABASE_URL" -a -n "$NEXT_PUBLIC_SUPABASE_ANON_KEY" \
  || (echo "ERROR: faltan NEXT_PUBLIC_SUPABASE_URL y/o NEXT_PUBLIC_SUPABASE_ANON_KEY como build args. Verificá que estén en el .env junto al docker-compose.yml." && exit 1)

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
CMD ["node", "server.js", "-H", "0.0.0.0"]