// Conexión a MongoDB mediante Mongoose
// Se exporta la función dbConnect para llamarla al arrancar el servidor

import mongoose from 'mongoose';
import { config } from './index.js';

const dbConnect = async () => {
  try {
    await mongoose.connect(config.db.uri);
    console.log('Conectado a MongoDB');
  } catch (error) {
    console.error('Error de conexion a MongoDB:', error.message);
    process.exit(1);
  }
};

// Aviso si se pierde la conexion en tiempo de ejecucion
mongoose.connection.on('disconnected', () => {
  console.warn('Desconectado de MongoDB');
});

export default dbConnect;