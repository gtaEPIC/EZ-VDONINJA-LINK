# Base image for Node.js
FROM node:20 AS builder

# Set working directory
WORKDIR /app

# Copy shared directory first
COPY shared /shared

# Copy backend package files and install dependencies
COPY backend/package*.json /app/
RUN npm install

# Copy the rest of the backend code and build it
COPY backend .
RUN npm run build

# Use Node.js to run the server
FROM node:20-alpine AS runner
WORKDIR /app
COPY --from=builder /app/dist /app/dist
COPY backend/package*.json /app/
RUN npm install --production

RUN ls -la /app/dist/app


# Expose the port your backend uses
EXPOSE 3000

# Start the backend server
CMD ["node", "/app/dist/app/src/index.js"]
