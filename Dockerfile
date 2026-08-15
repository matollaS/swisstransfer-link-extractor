# Use lightweight Node.js 20 Alpine base image
FROM node:20-alpine AS base

WORKDIR /app

# Copy dependency definition files
COPY package*.json ./

# Install production dependencies
RUN npm ci --only=production

# Copy application source code
COPY . .

# Expose server port 8080
EXPOSE 8080

# Define environment variables
ENV PORT=8080 \
    NODE_ENV=production

# Command to run the Express application
CMD ["npm", "start"]
