# ===== Stage 1: build frontend =====
FROM node:18-alpine AS frontend-build
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ .
RUN npm run build

# ===== Stage 2: build backend =====
FROM node:18-alpine AS backend-build
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm ci
COPY backend/ .
COPY --from=frontend-build /app/frontend/build ./public

# ===== Stage 3: runtime =====
FROM node:18-alpine
WORKDIR /app
COPY --from=backend-build /app/backend ./
ENV NODE_ENV=production
RUN mkdir -p /app/data /app/uploads
EXPOSE 4000
CMD ["node", "src/index.js"]

