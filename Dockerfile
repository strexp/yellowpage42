FROM node:24-alpine AS builder

RUN apk add --no-cache python3 make gcc g++

WORKDIR /build/backend
COPY backend/package*.json ./
RUN npm ci

COPY backend .
RUN npm run build
RUN npm ci --omit=dev

WORKDIR /build/frontend
COPY frontend/package*.json ./
RUN npm ci

COPY frontend .
RUN npm run build

FROM node:24-alpine
WORKDIR /app

COPY --from=builder /build/backend/dist ./backend/dist
COPY --from=builder /build/backend/node_modules ./backend/node_modules
COPY --from=builder /build/backend/package.json ./backend/package.json

COPY --from=builder /build/frontend/.output ./frontend/.output

WORKDIR /app
RUN apk add --no-cache supervisor
COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf
ENTRYPOINT ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]
