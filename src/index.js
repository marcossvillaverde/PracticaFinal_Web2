// Punto de entrada de la aplicacion
// Arranca la conexion a BD y luego el servidor HTTP
// Implementa graceful shutdown para cerrar limpiamente al recibir señales del SO

import mongoose from 'mongoose';
import app from './app.js';
import dbConnect from './config/db.js';
import { config } from './config/index.js';

const start = async () => {
  // Primero conectamos a MongoDB, luego arrancamos el servidor
  await dbConnect();

  const server = app.listen(config.port, () => {
    console.log(`Servidor corriendo en http://localhost:${config.port}`);
    console.log(`Entorno: ${config.nodeEnv}`);
  });

  // Graceful shutdown: al recibir SIGTERM o SIGINT cerramos ordenadamente
  // Esto es importante en Docker
  const shutdown = async (signal) => {
    console.log(`${signal} recibido, cerrando servidor...`);
    server.close(async () => {
      await mongoose.connection.close();
      console.log('Servidor cerrado correctamente');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT',  () => shutdown('SIGINT'));
};

start();