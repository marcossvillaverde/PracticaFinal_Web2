

import User from '../models/User.js';
import { verifyAccessToken } from '../utils/handleJwt.js';
import { AppError } from '../utils/AppError.js';

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(AppError.unauthorized('Token no proporcionado'));
    }

    const token = authHeader.split(' ')[1];
    const payload = verifyAccessToken(token);

    if (!payload) {
      return next(AppError.unauthorized('Token invalido o expirado'));
    }

    const usuario = await User.findById(payload._id).populate('company');

    if (!usuario || usuario.deleted) {
      return next(AppError.unauthorized('Usuario no encontrado'));
    }

    req.user = usuario;
    next();
  } catch {
    next(AppError.unauthorized('Error al verificar el token'));
  }
};

export default authMiddleware;