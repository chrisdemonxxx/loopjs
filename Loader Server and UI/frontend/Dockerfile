# Multi-stage build for optimized React production
FROM node:18-alpine AS builder

# Install build dependencies
RUN apk add --no-cache python3 make g++ && \
    ln -sf python3 /usr/bin/python

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci && \
    npm cache clean --force

# Copy source code
COPY . .

# Build arguments for environment configuration
ARG REACT_APP_API_URL
ARG REACT_APP_WS_URL
ARG NODE_ENV=production

# Set environment variables
ENV REACT_APP_API_URL=${REACT_APP_API_URL}
ENV REACT_APP_WS_URL=${REACT_APP_WS_URL}
ENV NODE_ENV=${NODE_ENV}

# Build the React application
RUN npm run build

# Production stage with Nginx
FROM nginx:stable-alpine AS production

# Install security updates
RUN apk upgrade --no-cache && \
    apk add --no-cache dumb-init

# Create non-root user
RUN addgroup -g 1001 -S nginx && \
    adduser -S nginxuser -u 1001 -G nginx

# Copy custom Nginx configuration
COPY --chown=nginxuser:nginx nginx.conf /etc/nginx/nginx.conf

# Copy built React app from builder stage
COPY --from=builder --chown=nginxuser:nginx /app/dist /usr/share/nginx/html

# Create necessary directories and set permissions
RUN mkdir -p /var/cache/nginx /var/log/nginx /var/run && \
    chown -R nginxuser:nginx /var/cache/nginx /var/log/nginx /var/run /usr/share/nginx/html && \
    chmod -R 755 /usr/share/nginx/html

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:80/ || exit 1

# Switch to non-root user
USER nginxuser

# Expose port
EXPOSE 80

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]