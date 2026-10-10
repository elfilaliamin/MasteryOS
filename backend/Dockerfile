FROM node:26-slim

# Set working directory
WORKDIR /app

# Set production environment
ENV NODE_ENV=production

# Copy package files and install production dependencies
COPY package*.json ./
RUN npm install --omit=dev

# Copy application source code
COPY . .

# Expose backend API port
EXPOSE 5000

# Start server
CMD ["node", "server.js"]
