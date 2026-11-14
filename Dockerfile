# ===== Etape 1 : compilation (l'atelier) =====
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# ===== Etape 2 : service (la boite finale) =====
FROM nginx:alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist/frontend-ci/browser /usr/share/nginx/html
EXPOSE 80