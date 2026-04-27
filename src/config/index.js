// Configuración centralizada de la aplicación
// Todas las variables de entorno se leen aquí una sola vez
// Si falta una variable obligatoria, el proceso se detiene
const required = (name) => {
  const value = process.env[name];
  if (!value) {
    console.error(`Falta la variable de entorno obligatoria: ${name}`);
    process.exit(1);
  }
  return value;
};

export const config = {
  // Servidor
  port: Number(process.env.PORT) || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',

  // Base de datos
  db: {
    uri: required('DB_URI'),
  },

  // Autenticación JWT
  jwt: {
    secret: required('JWT_SECRET'),
    accessExpires:  process.env.JWT_ACCESS_EXPIRES  || '15m',
    refreshExpires: process.env.JWT_REFRESH_EXPIRES || '7d',
  },

  // URL pública para archivos estáticos
  publicUrl: process.env.PUBLIC_URL || 'http://localhost:3000',

  // Cloudinary — almacenamiento de firmas y PDFs en la nube
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey:    process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET,
  },

  // Nodemailer — envío de emails
  mail: {
    host: process.env.MAIL_HOST,
    port: Number(process.env.MAIL_PORT) || 587,
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },

  // Slack — notificaciones de errores críticos
  slack: {
    webhookUrl: process.env.SLACK_WEBHOOK_URL,
  },
};