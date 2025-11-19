#####################################################################
# Dockerfile for obsidian-http-mcp
# 2 Stages: 1 to build service and 1 to deploy service
# Runs rootless and Updates packages to address vulnerabilities
#####################################################################

# Build stage
FROM node:20-alpine AS builder

# Make sure OS is patched
RUN apk update && apk upgrade

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including devDependencies for build)
RUN npm ci

# Copy source code
COPY . .

# Build the project
RUN npm run build

# Deploy stage
FROM node:20-alpine

# Make sure OS is patched
RUN apk update && apk upgrade

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production

# Copy built files from builder stage
COPY --from=builder /app/dist ./dist

# Create non-root user
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001
RUN chown -R nodejs:nodejs /app
USER nodejs

# Expose HTTP server port
EXPOSE 3000

# Run server
CMD ["node", "dist/index.js"]
