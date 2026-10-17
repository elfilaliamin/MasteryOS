# Stage 1: Build React App with Node
FROM node:26-slim AS build-app

WORKDIR /app

COPY frontend/package*.json ./
RUN npm install

COPY frontend/ ./
RUN npm run build

# Stage 2: Build VitePress Documentation with Node
FROM node:26-slim AS build-docs

WORKDIR /docs

COPY docs/package*.json ./
RUN npm install

COPY docs/ ./
RUN npm run docs:build

# Stage 3: Serve with Nginx Alpine
FROM nginx:alpine

# Copy built frontend SPA assets to web root
COPY --from=build-app /app/dist /usr/share/nginx/html

# Copy built VitePress documentation to /Docs subdirectory
COPY --from=build-docs /docs/.vitepress/dist /usr/share/nginx/html/Docs

# Copy custom Nginx configuration
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
