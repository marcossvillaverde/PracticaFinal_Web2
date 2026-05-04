// Tests de integracion para el modulo de proyectos

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

const crearCliente = async (token) => {
  const res = await request(app)
    .post('/api/client')
    .set('Authorization', `Bearer ${token}`)
    .send({ name: 'Cliente Test', cif: 'A11111111' });
  return res.body.cliente._id;
};

describe('Proyectos', () => {

  describe('POST /api/project', () => {
    it('debe crear un proyecto correctamente', async () => {
      const { token } = await crearUsuarioConCompania();
      const clienteId = await crearCliente(token);

      const res = await request(app)
        .post('/api/project')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name:        'Proyecto Test',
          projectCode: 'PRJ-001',
          client:      clienteId,
        });

      expect(res.status).toBe(201);
      expect(res.body.proyecto.name).toBe('Proyecto Test');
    });

    it('debe fallar con codigo de proyecto duplicado', async () => {
      const { token } = await crearUsuarioConCompania();
      const clienteId = await crearCliente(token);

      await request(app)
        .post('/api/project')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Proyecto 1', projectCode: 'PRJ-001', client: clienteId });

      const res = await request(app)
        .post('/api/project')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Proyecto 2', projectCode: 'PRJ-001', client: clienteId });

      expect(res.status).toBe(409);
    });
  });

  describe('GET /api/project', () => {
    it('debe listar proyectos con paginacion', async () => {
      const { token } = await crearUsuarioConCompania();
      const clienteId = await crearCliente(token);

      await request(app)
        .post('/api/project')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Proyecto Test', projectCode: 'PRJ-001', client: clienteId });

      const res = await request(app)
        .get('/api/project')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('proyectos');
      expect(res.body).toHaveProperty('paginacion');
    });
  });

});