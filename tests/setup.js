// Configuracion global de los tests
// Usa mongodb-memory-server para crear una BD en memoria
// Asi los tests no tocan la BD real y son completamente aislados

import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

let mongod;

// Antes de todos los tests arrancamos la BD en memoria
beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  await mongoose.connect(uri);
});

// Despues de cada test limpiamos todas las colecciones
afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});

// Despues de todos los tests cerramos la conexion y paramos la BD
afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  await mongod.stop();
});