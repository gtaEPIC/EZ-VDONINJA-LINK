# Base image for Node.js
FROM node:20 AS builder

# Set working directory
WORKDIR /app

# Copy shared directory first
COPY shared /shared

# Copy frontend package files and install dependencies
COPY frontend/package*.json /app
RUN npm install

ENV VITE_SERVER=/api
# Copy the rest of the frontend code and build it
COPY frontend /app
RUN npm run build --production

RUN ls -la /app/dist


# Use a minimal server to host the built files
FROM nginx:alpine AS runner
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy the nginx configuration file
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf

# Expose the port
EXPOSE 80

# Start the server
CMD ["nginx", "-g", "daemon off;"]
