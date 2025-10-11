FROM node:18-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install --legacy-peer-deps

COPY . .

# Explicitly set PORT for Cloud Run
ENV PORT=8080
EXPOSE 8080

CMD ["node", "index.js"]