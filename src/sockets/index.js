// Configuracion de Socket.IO para eventos en tiempo real
// Los usuarios se unen a una room con el ID de su compañia
// Esto permite emitir eventos solo a los usuarios de la misma compañia
// La conexion WebSocket requiere autenticacion JWT

import { Server } from 'socket.io';
import { verifyAccessToken } from '../utils/handleJwt.js';
import User from '../models/User.js';

let io;

export const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin:  '*',
      methods: ['GET', 'POST'],
    },
  });

  // Middleware de autenticacion para Socket.IO
  // El cliente debe enviar el token JWT en el handshake
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token ||
                    socket.handshake.headers?.authorization?.replace('Bearer ', '');

      if (!token) {
        return next(new Error('Token no proporcionado'));
      }

      const payload = verifyAccessToken(token);
      if (!payload) {
        return next(new Error('Token invalido o expirado'));
      }

      const usuario = await User.findById(payload._id).populate('company');
      if (!usuario || usuario.deleted) {
        return next(new Error('Usuario no encontrado'));
      }

      // Adjuntamos el usuario al socket para usarlo en los eventos
      socket.user = usuario;
      next();
    } catch {
      next(new Error('Error de autenticacion'));
    }
  });

  io.on('connection', (socket) => {
    const { user } = socket;
    const companyId = user.company?._id?.toString();

    if (companyId) {
      // El usuario se une a la room de su compañia
      socket.join(companyId);
      console.log(`Usuario ${user.email} conectado a room de compañia ${companyId}`);
    }

    socket.on('disconnect', () => {
      console.log(`Usuario ${user.email} desconectado`);
    });
  });

  return io;
};

// Devuelve la instancia de Socket.IO
// Si no esta inicializado devuelve un mock vacio para no romper los tests
export const getIO = () => {
  if (!io) {
    return { to: () => ({ emit: () => {} }) };
  }
  return io;
};