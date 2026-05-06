
import { AppError } from '../utils/AppError.js';

const checkRole = (roles) => (req, res, next) => {
  if (!req.user) {
    return next(AppError.unauthorized('No autenticado'));
  }

  if (!roles.includes(req.user.role)) {
    return next(AppError.forbidden('No tienes permisos para realizar esta accion'));
  }

  next();
};

export default checkRole;