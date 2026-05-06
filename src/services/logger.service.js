
import { config } from '../config/index.js';

export const sendErrorToSlack = async (err, req) => {
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
    console.error('Error al enviar notificacion a Slack:', slackError.message);
  }
};