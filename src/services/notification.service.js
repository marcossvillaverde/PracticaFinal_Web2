// Servicio de notificaciones basado en EventEmitter
// Los eventos internos disparan acciones como envio de emails
// Separamos la logica de negocio (controladores) de los efectos secundarios (emails)

import { EventEmitter } from 'node:events';
import { sendVerificationEmail, sendInvitationEmail } from './mail.service.js';

class NotificationService extends EventEmitter {}

const notificationService = new NotificationService();

// Listeners

// Al registrarse enviamos el codigo de verificacion por email
notificationService.on('user:registered', async (datos) => {
  console.log(`[EVENTO] user:registered — ${datos.email} (codigo: ${datos.verificationCode})`);
  await sendVerificationEmail(datos.email, datos.verificationCode);
});

notificationService.on('user:verified', (datos) => {
  console.log(`[EVENTO] user:verified — ${datos.email}`);
});

// Al invitar a un usuario enviamos email de bienvenida
notificationService.on('user:invited', async (datos) => {
  console.log(`[EVENTO] user:invited — ${datos.email} invitado por ${datos.invitadoPor}`);
  await sendInvitationEmail(datos.email, datos.nombre, datos.invitadoPor);
});

notificationService.on('user:deleted', (datos) => {
  console.log(`[EVENTO] user:deleted — ${datos.email}`);
});

export default notificationService;