# Dockerfile con multi-stage build
# Stage 1 (builder): instala todas las dependencias incluyendo devDependencies
# Stage 2 (production): copia solo lo necesario para produccion

# Stage 1: Builder
FROM node:22-alpine AS builder

WORKDIR /app

# Copiamos primero los archivos de dependencias para aprovechar la cache de Docker
COPY package*.json ./

# Instalamos todas las dependencias (incluyendo dev para los tests)
RUN npm ci

# Copiamos el resto del codigo fuente
COPY . .

# Stage 2: Production
FROM node:22-alpine AS production

WORKDIR /app

# Copiamos los archivos de dependencias
COPY package*.json ./

# Instalamos solo las dependencias de produccion
RUN npm ci --omit=dev

# Copiamos el codigo fuente desde el stage builder
COPY --from=builder /app/src ./src

# Creamos la carpeta de uploads
RUN mkdir -p uploads

# Exponemos el puerto de la aplicacion
EXPOSE 3000

# Variables de entorno por defecto (se sobreescriben en docker-compose)
ENV NODE_ENV=production
ENV PORT=3000

# Comando de inicio
CMD ["node", "src/index.js"]