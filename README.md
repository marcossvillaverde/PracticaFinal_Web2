BildyApp API
API REST para la digitalización y gestión de albaranes de obra. Permite a empresas del sector de la construcción gestionar sus clientes, proyectos y albaranes, con soporte para firma digital, generación de PDFs y notificaciones en tiempo real.
Stack

Runtime: Node.js 22+
Framework: Express 5
Base de datos: MongoDB Atlas + Mongoose 8
Autenticación: JWT (access + refresh tokens) + bcryptjs
Validación: Zod
Tiempo real: Socket.IO
Almacenamiento: Cloudinary (firmas y PDFs)
Generación de PDFs: PDFKit
Emails: Nodemailer + Mailtrap
Documentación: Swagger/OpenAPI 3.0
Testing: Jest + Supertest + mongodb-memory-server
Contenedores: Docker + Docker Compose
CI/CD: GitHub Actions

Requisitos

Node.js >= 22
Cuenta en MongoDB Atlas
Cuenta en Cloudinary (para firmas y PDFs)

Instalación
bashnpm install
cp .env.example .env

# Rellena las variables en .env
npm run dev
Variables de entorno
Consulta .env.example para ver todas las variables necesarias. Las obligatorias son DB_URI y JWT_SECRET.
Docker
bashdocker compose up
Levanta la aplicación y una instancia de MongoDB. No necesitas MongoDB instalado localmente.
Tests
bashnpm test           # Ejecuta los tests
npm run test:coverage  # Ejecuta los tests con cobertura
Los tests usan mongodb-memory-server y no modifican la base de datos real.
Documentación
Con el servidor corriendo accede a la documentación interactiva en http://localhost:3000/api-docs.
Endpoints
Usuarios /api/user

POST /register — Registro
PUT /validation — Verificación de email
POST /login — Login
POST /refresh — Renovar token
POST /logout — Logout
PUT /register — Onboarding datos personales
PATCH /company — Onboarding datos de empresa
PATCH /logo — Subir logo
GET / — Obtener usuario autenticado
DELETE / — Eliminar cuenta
PUT /password — Cambiar contraseña
POST /invite — Invitar compañero

Clientes /api/client

POST / — Crear cliente
GET / — Listar clientes (paginación + filtros)
GET /archived — Listar clientes archivados
GET /:id — Obtener cliente
PUT /:id — Actualizar cliente
DELETE /:id — Eliminar cliente (hard/soft)
PATCH /:id/restore — Restaurar cliente archivado

Proyectos /api/project

POST / — Crear proyecto
GET / — Listar proyectos (paginación + filtros)
GET /archived — Listar proyectos archivados
GET /:id — Obtener proyecto
PUT /:id — Actualizar proyecto
DELETE /:id — Eliminar proyecto (hard/soft)
PATCH /:id/restore — Restaurar proyecto archivado

Albaranes /api/deliverynote

POST / — Crear albarán (horas o materiales)
GET / — Listar albaranes (paginación + filtros)
GET /:id — Obtener albarán con populate completo
GET /pdf/:id — Descargar albarán en PDF
PATCH /:id/sign — Firmar albarán
DELETE /:id — Eliminar albarán (solo si no está firmado)