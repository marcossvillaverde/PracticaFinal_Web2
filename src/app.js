// Configuracion principal de Express
// Aqui se registran todos los middlewares globales y las rutas

import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import mongoose from 'mongoose';
import swaggerUi from 'swagger-ui-express';
import { notFound, errorHandler } from './middleware/error-handler.js';
import { swaggerSpec } from './config/swagger.js';
import userRoutes from './routes/user.routes.js';
import clientRoutes from './routes/client.routes.js';
import projectRoutes from './routes/project.routes.js';
import deliveryNoteRoutes from './routes/deliverynote.routes.js';

const app = express();

// Seguridad
app.use(helmet());
app.use(cors());
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: true, mensaje: 'Demasiadas peticiones, prueba mas tarde.' },
  })
);

// Parseo del body
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true }));

// Archivos estaticos
app.use('/uploads', express.static('uploads'));

// Documentacion Swagger
// Accesible en http://localhost:3000/api-docs
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Health check
app.get('/health', (_req, res) => {
  res.json({
    status:    'ok',
    db:        mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    uptime:    process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// Rutas de la API
app.use('/api/user',         userRoutes);
app.use('/api/client',       clientRoutes);
app.use('/api/project',      projectRoutes);
app.use('/api/deliverynote', deliveryNoteRoutes);

// Manejo de errores
app.use(notFound);
app.use(errorHandler);

export default app;