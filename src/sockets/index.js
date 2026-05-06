

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
      socket.join(companyId);
      console.log(`Usuario ${user.email} conectado a room de compañia ${companyId}`);
    }

    socket.on('disconnect', () => {
      console.log(`Usuario ${user.email} desconectado`);
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    return { to: () => ({ emit: () => {} }) };
  }
  return io;
};