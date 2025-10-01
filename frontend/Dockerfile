FROM node:18-alpine as build

WORKDIR /app

COPY package*.json ./

RUN npm ci --legacy-peer-deps || npm install --legacy-peer-deps

COPY . .

# Fix permissions for node_modules binaries
RUN chmod -R +x node_modules/.bin

RUN npm run build

FROM nginx:alpine

COPY --from=build /app/dist /usr/share/nginx/html

# Nginx config for single page application
RUN rm /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/conf.d

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
