# ── Stage 1: Dependencies ──
FROM node:20-alpine AS deps
WORKDIR /app

# Install compilation tools for native modules (bcrypt)
RUN apk add --no-cache python3 make g++ libc6-compat

COPY package*.json ./
RUN npm ci --omit=dev

# ── Stage 2: Production Runner ──
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5000

# Install curl for container health check
RUN apk add --no-cache curl

# Create non-root system user and group
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nodejs

# Copy dependencies and application source
COPY --from=deps --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --chown=nodejs:nodejs . .

# Ensure uploads directory exists with correct permissions
RUN mkdir -p uploads && chown -R nodejs:nodejs /app

USER nodejs

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:5000/ || exit 1

CMD ["node", "server.js"]

