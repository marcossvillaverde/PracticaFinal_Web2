

import mongoose from 'mongoose';
import { sendErrorToSlack } from '../services/logger.service.js';

export const errorHandler = async (err, req, res, next) => {
  console.error('Error:', err.message);

  if (err.isOperational) {
    return res.status(err.statusCode).json({
      error:   true,
      mensaje: err.message,
      code:    err.code,
    });
  }

  if (err instanceof mongoose.Error.ValidationError) {
    const detalles = Object.values(err.errors).map((e) => ({
      campo:   e.path,
      mensaje: e.message,
    }));
    return res.status(400).json({
      error:    true,
      mensaje:  'Error de validacion',
      detalles,
    });
  }

  if (err.code === 11000) {
    const campo = Object.keys(err.keyValue || {})[0];
    return res.status(409).json({
      error:   true,
      mensaje: `Ya existe un registro con ese '${campo}'`,
    });
  }

  await sendErrorToSlack(err, req);

  const esDev = process.env.NODE_ENV === 'development';
  res.status(500).json({
    error:   true,
    mensaje: esDev ? err.message : 'Error interno del servidor',
    ...(esDev && { stack: err.stack }),
  });
};

export const notFound = (req, res) => {
  res.status(404).json({
    error:   true,
    mensaje: `Ruta no encontrada: ${req.method} ${req.originalUrl}`,
  });
};