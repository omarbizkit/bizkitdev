# Multi-stage Dockerfile for production deployment
FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json package-lock.json* ./
RUN npm ci --only=production && npm cache clean --force

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Environment variables must be present at build time
ARG PUBLIC_SUPABASE_URL
ARG PUBLIC_SUPABASE_ANON_KEY
ARG PUBLIC_SITE_URL
ENV PUBLIC_SUPABASE_URL=${PUBLIC_SUPABASE_URL}
ENV PUBLIC_SUPABASE_ANON_KEY=${PUBLIC_SUPABASE_ANON_KEY}
ENV PUBLIC_SITE_URL=${PUBLIC_SITE_URL}

# Install all dependencies for build
RUN npm ci

# Build the app
RUN npm run build

# Production image, copy all the files and run astro
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0

# Create app user for security
RUN addgroup --system --gid 1001 astro && \
    adduser --system --uid 1001 astro

# Copy the built application and required runtime files
COPY --from=builder --chown=astro:astro /app/dist ./dist
COPY --from=builder --chown=astro:astro /app/package.json ./package.json
COPY --from=deps --chown=astro:astro /app/node_modules ./node_modules

# Create necessary directories
RUN mkdir -p /app/logs && chown astro:astro /app/logs

# Switch to non-root user
USER astro

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "fetch('http://localhost:3000/').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))" || exit 1

# Start the server
CMD ["node", "./dist/server/entry.mjs"]