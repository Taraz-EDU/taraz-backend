# Multi-stage Dockerfile for NestJS application
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files and prisma schema
COPY package*.json ./
COPY prisma ./prisma

# Install all dependencies (including dev dependencies for build)
# Skip all lifecycle scripts (including husky prepare script)
RUN npm ci --ignore-scripts && npm cache clean --force

# Generate Prisma Client before copying source (needed for build)
RUN npx prisma generate

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Verify build output exists
RUN ls -la dist/ && test -f dist/main.js

# Production stage
FROM node:18-alpine AS production

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nestjs -u 1001

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma

# Install only production dependencies
# Skip all lifecycle scripts (including husky prepare script)
RUN npm ci --omit=dev --ignore-scripts && npm cache clean --force

# Copy built application
COPY --from=builder /app/dist ./dist

# Generate Prisma Client for production (after copying dist)
RUN npx prisma generate

# Verify files exist
RUN ls -la dist/ && test -f dist/main.js

# Change ownership to non-root user
RUN chown -R nestjs:nodejs /app
USER nestjs

# Expose port
EXPOSE 3030

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node dist/health-check.js

# Start the application
CMD ["node", "dist/main.js"]
