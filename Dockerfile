FROM node:22-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY index.html vite.config.js postcss.config.js tailwind.config.js ./
COPY public ./public
COPY src ./src

ARG VITE_API_BASE_URL=
ARG VITE_APP_API_BASE_URL=
ARG VITE_APP_AUTH_GOOGLE_CLIENT_ID=
ARG VITE_GOOGLE_CLIENT_ID=
ARG VITE_RAZORPAY_KEY_ID=
ARG VITE_APP_NAME=
ARG VITE_ADMIN_USERNAME=CreateSheets
ARG VITE_SITE_URL=

ENV VITE_API_BASE_URL=$VITE_API_BASE_URL \
    VITE_APP_API_BASE_URL=$VITE_APP_API_BASE_URL \
    VITE_APP_AUTH_GOOGLE_CLIENT_ID=$VITE_APP_AUTH_GOOGLE_CLIENT_ID \
    VITE_GOOGLE_CLIENT_ID=$VITE_GOOGLE_CLIENT_ID \
    VITE_RAZORPAY_KEY_ID=$VITE_RAZORPAY_KEY_ID \
    VITE_APP_NAME=$VITE_APP_NAME \
    VITE_ADMIN_USERNAME=$VITE_ADMIN_USERNAME \
    VITE_SITE_URL=$VITE_SITE_URL

RUN npm run build

FROM nginx:1.27-alpine AS runtime

COPY deploy/frontend-nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1/healthz || exit 1
