FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json package-lock.json* ./
RUN npm ci --only=production

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Environment variables must be present at build time
# https://github.com/vercel/next.js/discussions/14030
ARG PUBLIC_SUPABASE_URL
ARG PUBLIC_SUPABASE_ANON_KEY
ENV PUBLIC_SUPABASE_URL=${PUBLIC_SUPABASE_URL}
ENV PUBLIC_SUPABASE_ANON_KEY=${PUBLIC_SUPABASE_ANON_KEY}

# Install all dependencies for build
RUN npm ci

# Build the app
RUN npm run build

# Production image, copy all the files and run astro
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 astro
RUN adduser --system --uid 1001 astro

# Copy the built application
COPY --from=builder --chown=astro:astro /app/dist ./dist
COPY --from=builder --chown=astro:astro /app/package.json ./package.json

USER astro

EXPOSE 4321

ENV PORT=4321
ENV HOST=0.0.0.0

# Start the server
CMD ["node", "./dist/server/entry.mjs"]