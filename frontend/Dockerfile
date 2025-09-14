# Stage 1: Build the React application
FROM node:18-alpine AS builder
WORKDIR /app

# Accept build arguments
ARG VITE_BACKEND_URL
ENV VITE_BACKEND_URL=$VITE_BACKEND_URL

COPY package*.json ./
RUN npm install
COPY . ./
RUN npm run build

# Stage 2: Serve the built assets using Nginx
FROM nginx:stable-alpine
# Copy the built files from the 'builder' stage
COPY --from=builder /app/dist /usr/share/nginx/html
# Copy the custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf
# Expose port 80
EXPOSE 80
# Start Nginx
CMD ["nginx", "-g", "daemon off;"]