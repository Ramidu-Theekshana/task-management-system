# Build stage
FROM node:22-alpine AS build

WORKDIR /app

COPY package*.json ./

RUN npm install --legacy-peer-deps

COPY . .

# Set Vite env during build
ENV VITE_API_URL=http://localhost:5000/api

RUN npm run build

# Serve stage
FROM nginx:alpine

COPY --from=build /app/dist /usr/share/nginx/html

# Copy default nginx configuration if custom routing is needed, else standard is fine
# For SPA routing support in Nginx, we can write a simple nginx conf:
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
