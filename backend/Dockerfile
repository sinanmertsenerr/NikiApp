# Multi-stage build for minimal attack surface
FROM node:22-alpine AS base
RUN apk add --no-cache dumb-init
WORKDIR /app

# Build stage
FROM base AS build
COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci
RUN npx prisma generate
COPY . .
RUN npm run build

# Production dependencies
FROM base AS prod-deps
COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci --omit=dev
RUN npx prisma generate

# Production stage - distroless-like minimal image
FROM node:22-alpine AS production

# Security: Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001

WORKDIR /app

# Copy only necessary files
COPY --from=prod-deps --chown=nestjs:nodejs /app/node_modules ./node_modules
COPY --from=build --chown=nestjs:nodejs /app/dist ./dist
COPY --from=build --chown=nestjs:nodejs /app/package*.json ./
COPY --from=prod-deps --chown=nestjs:nodejs /app/prisma ./prisma
COPY --from=base /usr/bin/dumb-init /usr/bin/dumb-init

# Security: Run as non-root
USER nestjs

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s \
  CMD node -e "require('http').get('http://localhost:3000/api/v1/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Use dumb-init for proper signal handling
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/src/main.js"]

# Metadata
LABEL org.opencontainers.image.title="Niki Coffee API" \
      org.opencontainers.image.vendor="Niki Coffee"
