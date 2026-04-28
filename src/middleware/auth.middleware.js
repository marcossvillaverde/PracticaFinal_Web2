// Middleware de autenticación JWT
// Verifica el token Bearer de la cabecera Authorization
// Si es válido añade el usuario completo a req.user para usarlo en los controladores

import User from '../models/User.js';
import { verifyAccessToken } from '../utils/handleJwt.js';
import { AppError } from '../utils/AppError.js';

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    // Comprobamos que viene la cabecera Authorization con formato Bearer
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(AppError.unauthorized('Token no proporcionado'));
    }

    const token = authHeader.split(' ')[1];
    const payload = verifyAccessToken(token);

    if (!payload) {
      return next(AppError.unauthorized('Token invalido o expirado'));
    }

    // Buscamos el usuario en BD para tener siempre datos actualizados
    const usuario = await User.findById(payload._id).populate('company');

    if (!usuario || usuario.deleted) {
      return next(AppError.unauthorized('Usuario no encontrado'));
    }

    // Adjuntamos el usuario a la peticion para usarlo en los controladores
    req.user = usuario;
    next();
  } catch {
    next(AppError.unauthorized('Error al verificar el token'));
  }
};

export default authMiddleware;