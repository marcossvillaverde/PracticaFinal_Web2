
import request from 'supertest';
import app from '../src/app.js';
import User from '../src/models/User.js';
import Company from '../src/models/Company.js';
import { jest } from '@jest/globals';

jest.mock('../src/services/notification.service.js', () => ({
  default: { emit: jest.fn(), on: jest.fn() },
}));

jest.mock('../src/sockets/index.js', () => ({
  getIO: () => ({ to: () => ({ emit: jest.fn() }) }),
}));

const crearUsuarioConCompania = async (email = 'admin@example.com') => {
  const registro = await request(app)
    .post('/api/user/register')
    .send({ email, password: 'Test1234!' });

  const token = registro.body.accessToken;
  const userId = registro.body.usuario._id;

  const company = await Company.create({
    owner: userId,
    name:  'Empresa Test',
    cif:   'B12345678',
  });

  await User.findByIdAndUpdate(userId, { company: company._id });

  return { token, userId, companyId: company._id };
};

describe('Clientes', () => {

  describe('POST /api/client', () => {
    it('debe crear un cliente correctamente', async () => {
      const { token } = await crearUsuarioConCompania();

      const res = await request(app)
        .post('/api/client')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Cliente Test', cif: 'A12345678', email: 'cliente@test.com' });

      expect(res.status).toBe(201);
      expect(res.body.cliente.name).toBe('Cliente Test');
    });

    it('debe fallar si el nombre esta vacio', async () => {
      const { token } = await crearUsuarioConCompania();

      const res = await request(app)
        .post('/api/client')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: '' });

      expect(res.status).toBe(400);
    });

    it('debe fallar con CIF duplicado en la misma compañia', async () => {
      const { token } = await crearUsuarioConCompania();

      await request(app)
        .post('/api/client')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Cliente 1', cif: 'A12345678' });

      const res = await request(app)
        .post('/api/client')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Cliente 2', cif: 'A12345678' });

      expect(res.status).toBe(409);
    });
  });

  describe('GET /api/client', () => {
    it('debe listar los clientes con paginacion', async () => {
      const { token } = await crearUsuarioConCompania();

      await request(app)
        .post('/api/client')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Cliente Test' });

      const res = await request(app)
        .get('/api/client')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('clientes');
      expect(res.body).toHaveProperty('paginacion');
      expect(res.body.clientes.length).toBeGreaterThan(0);
    });
  });

  describe('DELETE /api/client/:id', () => {
    it('debe hacer soft delete correctamente', async () => {
      const { token } = await crearUsuarioConCompania();

      const crear = await request(app)
        .post('/api/client')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Cliente a borrar' });

      const clienteId = crear.body.cliente._id;

      const res = await request(app)
        .delete(`/api/client/${clienteId}?soft=true`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);

      const listado = await request(app)
        .get('/api/client')
        .set('Authorization', `Bearer ${token}`);

      expect(listado.body.clientes.length).toBe(0);
    });
  });

  describe('PATCH /api/client/:id/restore', () => {
    it('debe restaurar un cliente archivado', async () => {
      const { token } = await crearUsuarioConCompania();

      const crear = await request(app)
        .post('/api/client')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Cliente a restaurar' });

      const clienteId = crear.body.cliente._id;

      await request(app)
        .delete(`/api/client/${clienteId}?soft=true`)
        .set('Authorization', `Bearer ${token}`);

      const res = await request(app)
        .patch(`/api/client/${clienteId}/restore`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.cliente.deleted).toBe(false);
    });
  });

});