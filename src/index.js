// Punto de entrada de la aplicacion
// Arranca la conexion a BD y luego el servidor HTTP con Socket.IO
// Implementa graceful shutdown para cerrar limpiamente al recibir señales del SO

import { createServer } from 'node:http';
import mongoose from 'mongoose';
import app from './app.js';
import dbConnect from './config/db.js';
import { config } from './config/index.js';
import { initSocket } from './sockets/index.js';

const start = async () => {
  await dbConnect();

  // Creamos el servidor HTTP para que Socket.IO pueda compartirlo con Express
  const server = createServer(app);

  // Inicializamos Socket.IO sobre el servidor HTTP
  initSocket(server);

  server.listen(config.port, () => {
    console.log(`Servidor corriendo en http://localhost:${config.port}`);
    console.log(`Entorno: ${config.nodeEnv}`);
  });

  // Graceful shutdown: cerramos ordenadamente al recibir señales del SO
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