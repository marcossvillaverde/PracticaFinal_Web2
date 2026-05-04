// Servicio de envío de emails con Nodemailer
// Usa Mailtrap como sandbox en desarrollo para no enviar emails reales
// En tests no se envian emails para no depender de credenciales externas

import nodemailer from 'nodemailer';
import { config } from '../config/index.js';

// Creamos el transporter con las credenciales del .env
const transporter = nodemailer.createTransport({
  host: config.mail.host,
  port: config.mail.port,
  auth: {
    user: config.mail.user,
    pass: config.mail.pass,
  },
});

// Funcion generica para enviar emails
const sendMail = async ({ to, subject, html }) => {
  // En modo test no enviamos emails reales para no depender de credenciales externas
  if (process.env.NODE_ENV === 'test') {
    console.log(`[TEST] Email simulado a ${to}: ${subject}`);
    return;
  }

  try {
    await transporter.sendMail({
      from:    '"BildyApp" <noreply@bildyapp.com>',
      to,
      subject,
      html,
    });
    console.log(`Email enviado a ${to}: ${subject}`);
  } catch (error) {
    console.error(`Error al enviar email a ${to}:`, error.message);
  }
};

// ── Templates de emails ────────────────────────────────────────────────────

// Email de verificacion de cuenta con el codigo de 6 digitos
export const sendVerificationEmail = async (email, code) => {
  await sendMail({
    to:      email,
    subject: 'Verifica tu cuenta en BildyApp',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Bienvenido a BildyApp</h2>
        <p>Gracias por registrarte. Usa el siguiente codigo para verificar tu cuenta:</p>
        <div style="background: #f3f4f6; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
          <span style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #1e40af;">
            ${code}
          </span>
        </div>
        <p style="color: #6b7280; font-size: 14px;">
          Este codigo caduca en 24 horas. Si no te has registrado en BildyApp ignora este email.
        </p>
      </div>
    `,
  });
};

// Email de bienvenida para usuarios invitados
export const sendInvitationEmail = async (email, nombre, invitadoPor) => {
  await sendMail({
    to:      email,
    subject: `Te han invitado a unirte a BildyApp`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Has sido invitado a BildyApp</h2>
        <p>Hola <strong>${nombre}</strong>,</p>
        <p><strong>${invitadoPor}</strong> te ha invitado a unirte a su equipo en BildyApp.</p>
        <p>Ya puedes iniciar sesion con tu email. Te recomendamos cambiar tu contraseña temporal lo antes posible.</p>
        <div style="margin: 20px 0;">
          <a href="${config.publicUrl}" 
             style="background: #2563eb; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none;">
            Acceder a BildyApp
          </a>
        </div>
        <p style="color: #6b7280; font-size: 14px;">
          Si no esperabas esta invitacion puedes ignorar este email.
        </p>
      </div>
    `,
  });
};