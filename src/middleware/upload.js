
import multer from 'multer';
import { AppError } from '../utils/AppError.js';

// Almacenamiento en memoria para subir directamente a Cloudinary
const storage = multer.memoryStorage();

const fileFilter = (_req, file, cb) => {
  const tiposPermitidos = ['image/jpeg', 'image/png', 'image/webp'];
  if (tiposPermitidos.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new AppError('Solo se permiten imagenes (jpeg, png, webp)', 400), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});

export default upload;