# Multi-stage build para el Frontend React + Vite (Juliam Corp LLC)
FROM node:22-alpine AS builder

WORKDIR /app

# Argumentos de compilación para Vite
ARG VITE_API_URL=http://localhost:3001/api
ENV VITE_API_URL=$VITE_API_URL

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar dependencias
RUN npm install

# Copiar código fuente
COPY . .

# Compilar SPA de producción
RUN npm run build

# Stage de Producción con Nginx Alpine
FROM nginx:alpine AS runner

# Copiar configuración personalizada de Nginx (puerto 3000 y SPA routing)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copiar artefactos estáticos compilados
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 3000

CMD ["nginx", "-g", "daemon off;"]

