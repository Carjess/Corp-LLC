# Multi-stage build para el Backend NestJS (Juliam Corp LLC)
FROM node:22-alpine AS builder

WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar dependencias completas para compilación
RUN npm install --legacy-peer-deps

# Copiar código fuente y configuración
COPY . .

# Compilar proyecto NestJS a JavaScript
RUN npm run build

# Stage de Producción
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3001

# Copiar definiciones de dependencias
COPY package*.json ./

# Instalar únicamente dependencias de producción
RUN npm install --legacy-peer-deps --omit=dev

# Copiar código compilado desde la etapa de compilación
COPY --from=builder /app/dist ./dist

EXPOSE 3001

CMD ["node", "dist/main.js"]

