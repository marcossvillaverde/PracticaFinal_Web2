// Utilidades para la generación y verificación de tokens JWT
// Usamos dos tipos de tokens:
//  Access token: corta duración (15min), contiene el id y rol del usuario
//  Refresh token: larga duración (7d), opaco (no es JWT), se guarda en BD

import jwt from 'jsonwebtoken';
import crypto from 'node:crypto';
import { config } from '../config/index.js';

// Genera un access token firmado con el secret de la app
export const generateAccessToken = (usuario) => {
  return jwt.sign(
    { _id: usuario._id, role: usuario.role },
    config.jwt.secret,
    { expiresIn: config.jwt.accessExpires }
  );
};

// Genera un refresh token aleatorio opaco (64 bytes en hex)
export const generateRefreshToken = () => {
  return crypto.randomBytes(64).toString('hex');
};

// Verifica y decodifica un access token
// Devuelve el payload si es válido, null si no lo es
export const verifyAccessToken = (token) => {
  try {
    return jwt.verify(token, config.jwt.secret);
  } catch {
    return null;
  }
};