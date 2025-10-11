FROM node:18-alpine as build

WORKDIR /app

# Add build argument for cache busting
ARG BUILD_DATE
ARG GIT_COMMIT

COPY package*.json ./

RUN npm ci --legacy-peer-deps || npm install --legacy-peer-deps

# Fix permissions for node_modules binaries BEFORE copying source
RUN chmod -R +x node_modules/.bin

COPY . .

# Build with environment variables
RUN npm run build

FROM nginx:alpine

COPY --from=build /app/dist /usr/share/nginx/html

# Nginx config for single page application
RUN rm /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/conf.d

EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
