# Use an official Node.js image
FROM node:18-alpine

# Install build dependencies for native modules
RUN apk add --no-cache python3 make g++

# Set the working directory inside the container
WORKDIR /usr/src/app

# Copy package files and install dependencies
# This is done first to leverage Docker's layer caching
COPY package*.json ./
RUN npm install --build-from-source

# Copy the rest of the application code
COPY . .

# Expose the port the app runs on
EXPOSE 3000

# The command to start the server
CMD [ "node", "index.js" ]