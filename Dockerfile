# Use official Node.js runtime as the base image
FROM node:18-alpine

# Create app directory
WORKDIR /usr/src/app

# Copy package.json and package-lock.json (if exists)
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy app source code
COPY . .

# Expose the port service listens on
EXPOSE 3002

# Run migrations first, then start the server
CMD ["sh", "-c", "node migrate.js && node server.js"]
