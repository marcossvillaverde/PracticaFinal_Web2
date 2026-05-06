

import { EventEmitter } from 'node:events';
import { sendVerificationEmail, sendInvitationEmail } from './mail.service.js';

class NotificationService extends EventEmitter {}

const notificationService = new NotificationService();


notificationService.on('user:registered', async (datos) => {
  console.log(`[EVENTO] user:registered — ${datos.email} (codigo: ${datos.verificationCode})`);
  await sendVerificationEmail(datos.email, datos.verificationCode);
});

notificationService.on('user:verified', (datos) => {
  console.log(`[EVENTO] user:verified — ${datos.email}`);
});

notificationService.on('user:invited', async (datos) => {
  console.log(`[EVENTO] user:invited — ${datos.email} invitado por ${datos.invitadoPor}`);
  await sendInvitationEmail(datos.email, datos.nombre, datos.invitadoPor);
});

notificationService.on('user:deleted', (datos) => {
  console.log(`[EVENTO] user:deleted — ${datos.email}`);
});

export default notificationService;