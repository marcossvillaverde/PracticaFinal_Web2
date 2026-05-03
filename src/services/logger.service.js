// Servicio de logging de errores a Slack
// Envia un mensaje al canal de Slack configurado cuando ocurre un error 5XX
// Incluye timestamp, ruta, metodo HTTP, mensaje de error y stack trace

import { config } from '../config/index.js';

export const sendErrorToSlack = async (err, req) => {
  // Si no hay webhook configurado no hacemos nada
  if (!config.slack.webhookUrl) return;

  try {
    const mensaje = {
      text: '*Error 5XX en BildyApp*',
      attachments: [
        {
          color: '#ff0000',
          fields: [
            {
              title: 'Timestamp',
              value: new Date().toISOString(),
              short: true,
            },
            {
              title: 'Entorno',
              value: config.nodeEnv,
              short: true,
            },
            {
              title: 'Metodo',
              value: req?.method || 'N/A',
              short: true,
            },
            {
              title: 'Ruta',
              value: req?.originalUrl || 'N/A',
              short: true,
            },
            {
              title: 'Error',
              value: err.message || 'Error desconocido',
              short: false,
            },
            {
              title: 'Stack',
              value: err.stack ? `\`\`\`${err.stack.slice(0, 500)}\`\`\`` : 'N/A',
              short: false,
            },
          ],
        },
      ],
    };

    await fetch(config.slack.webhookUrl, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(mensaje),
    });
  } catch (slackError) {
    // Si falla el envio a Slack solo lo logamos en consola, no propagamos el error
    console.error('Error al enviar notificacion a Slack:', slackError.message);
  }
};