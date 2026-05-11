# syntax=docker/dockerfile:1

# ── Stage 1: build ──────────────────────────────────────────────────────────
FROM node:20-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# Vite bakes VITE_* vars into the static bundle at build time.
# Pass them as --build-arg when running docker build.
ARG VITE_ARCGIS_CLIENT_ID
ARG VITE_PORTAL_URL=https://www.arcgis.com
ARG VITE_MAP_ITEM_ID
ARG VITE_APP_TITLE=Agriculture Assistant
ARG VITE_CONFIG_ITEM_ID

ENV VITE_ARCGIS_CLIENT_ID=${VITE_ARCGIS_CLIENT_ID}
ENV VITE_PORTAL_URL=${VITE_PORTAL_URL}
ENV VITE_MAP_ITEM_ID=${VITE_MAP_ITEM_ID}
ENV VITE_APP_TITLE=${VITE_APP_TITLE}
ENV VITE_CONFIG_ITEM_ID=${VITE_CONFIG_ITEM_ID}

RUN npm run build

# ── Stage 2: serve ──────────────────────────────────────────────────────────
FROM nginx:1.27-alpine AS runtime
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
