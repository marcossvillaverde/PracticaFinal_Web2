// Servicio de almacenamiento en Cloudinary
// Sube imagenes y PDFs a la nube y devuelve la URL publica
// Usa Sharp para optimizar las imagenes antes de subirlas

import { v2 as cloudinary } from 'cloudinary';
import sharp from 'sharp';
import { config } from '../config/index.js';

// Configuramos Cloudinary con las credenciales del .env
cloudinary.config({
  cloud_name: config.cloudinary.cloudName,
  api_key:    config.cloudinary.apiKey,
  api_secret: config.cloudinary.apiSecret,
});

// Sube un buffer a Cloudinary y devuelve la URL publica
const subirBuffer = (buffer, opciones) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(opciones, (error, result) => {
      if (error) return reject(error);
      resolve(result.secure_url);
    });
    stream.end(buffer);
  });
};

// Sube una imagen de firma optimizada con Sharp
// Redimensiona a maximo 800px de ancho y convierte a WebP
export const uploadSignature = async (buffer) => {
  const imagenOptimizada = await sharp(buffer)
    .resize({ width: 800, withoutEnlargement: true })
    .webp({ quality: 85 })
    .toBuffer();

  return subirBuffer(imagenOptimizada, {
    folder:         'bildyapp/firmas',
    resource_type:  'image',
    format:         'webp',
  });
};

// Sube un PDF generado con pdfkit a Cloudinary
export const uploadPDF = async (buffer, nombreArchivo) => {
  return subirBuffer(buffer, {
    folder:        'bildyapp/albaranes',
    resource_type: 'raw',
    public_id:     nombreArchivo,
    format:        'pdf',
  });
};