# Stage 1: Build the React application
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

# Vite embeds environment variables at build time
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

# Permisos de ejecución a los binarios de npm en Linux
RUN chmod -R +x node_modules/.bin/

RUN npm run build

# Stage 2: Serve the application using Nginx
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80

ENTRYPOINT ["nginx", "-g", "daemon off;"]