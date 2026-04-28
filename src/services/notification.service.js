// Servicio de notificaciones basado en EventEmitter
// Emite eventos internos cuando ocurren acciones importantes
// Estos eventos son escuchados por otros servicios (email, logs, etc)

import { EventEmitter } from 'node:events';

class NotificationService extends EventEmitter {}

const notificationService = new NotificationService();

// Listeners por defecto

notificationService.on('user:registered', (datos) => {
  console.log(`[EVENTO] user:registered — ${datos.email} (codigo: ${datos.verificationCode})`);
});

notificationService.on('user:verified', (datos) => {
  console.log(`[EVENTO] user:verified — ${datos.email}`);
});

notificationService.on('user:invited', (datos) => {
  console.log(`[EVENTO] user:invited — ${datos.email} invitado por ${datos.invitadoPor}`);
});

notificationService.on('user:deleted', (datos) => {
  console.log(`[EVENTO] user:deleted — ${datos.email}`);
});

export default notificationService;