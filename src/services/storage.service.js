

import { v2 as cloudinary } from 'cloudinary';
import sharp from 'sharp';
import { config } from '../config/index.js';

cloudinary.config({
  cloud_name: config.cloudinary.cloudName,
  api_key:    config.cloudinary.apiKey,
  api_secret: config.cloudinary.apiSecret,
});

const subirBuffer = (buffer, opciones) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(opciones, (error, result) => {
      if (error) return reject(error);
      resolve(result.secure_url);
    });
    stream.end(buffer);
  });
};

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

export const uploadPDF = async (buffer, nombreArchivo) => {
  return subirBuffer(buffer, {
    folder:        'bildyapp/albaranes',
    resource_type: 'raw',
    public_id:     nombreArchivo,
    format:        'pdf',
  });
};