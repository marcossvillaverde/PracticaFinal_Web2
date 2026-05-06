

import { createServer } from 'node:http';
import mongoose from 'mongoose';
import app from './app.js';
import dbConnect from './config/db.js';
import { config } from './config/index.js';
import { initSocket } from './sockets/index.js';

const start = async () => {
  await dbConnect();

  const server = createServer(app);

  initSocket(server);

  server.listen(config.port, () => {
    console.log(`Servidor corriendo en http://localhost:${config.port}`);
    console.log(`Entorno: ${config.nodeEnv}`);
  });

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