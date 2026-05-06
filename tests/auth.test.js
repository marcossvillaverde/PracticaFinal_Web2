

import request from 'supertest';
import app from '../src/app.js';
import User from '../src/models/User.js';
import { jest } from '@jest/globals';

jest.mock('../src/services/notification.service.js', () => ({
  default: { emit: jest.fn(), on: jest.fn() },
}));

jest.mock('../src/sockets/index.js', () => ({
  getIO: () => ({ to: () => ({ emit: jest.fn() }) }),
}));

describe('Autenticacion', () => {

  describe('POST /api/user/register', () => {
    it('debe registrar un usuario correctamente', async () => {
      const res = await request(app)
        .post('/api/user/register')
        .send({ email: 'test@example.com', password: 'Test1234!' });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('accessToken');
      expect(res.body).toHaveProperty('refreshToken');
      expect(res.body.usuario.email).toBe('test@example.com');
      expect(res.body.usuario.status).toBe('pending');
    });

    it('debe fallar si el email no es valido', async () => {
      const res = await request(app)
        .post('/api/user/register')
        .send({ email: 'no-es-email', password: 'Test1234!' });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe(true);
    });

    it('debe fallar si la contraseña tiene menos de 8 caracteres', async () => {
      const res = await request(app)
        .post('/api/user/register')
        .send({ email: 'test@example.com', password: '123' });

      expect(res.status).toBe(400);
    });

    it('debe fallar si el email ya esta verificado', async () => {
      await User.create({
        email:    'test@example.com',
        password: 'hash',
        status:   'verified',
      });

      const res = await request(app)
        .post('/api/user/register')
        .send({ email: 'test@example.com', password: 'Test1234!' });

      expect(res.status).toBe(409);
    });
  });

  describe('POST /api/user/login', () => {
    beforeEach(async () => {
      await request(app)
        .post('/api/user/register')
        .send({ email: 'login@example.com', password: 'Test1234!' });
    });

    it('debe hacer login correctamente', async () => {
      const res = await request(app)
        .post('/api/user/login')
        .send({ email: 'login@example.com', password: 'Test1234!' });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('accessToken');
    });

    it('debe fallar con contraseña incorrecta', async () => {
      const res = await request(app)
        .post('/api/user/login')
        .send({ email: 'login@example.com', password: 'WrongPass!' });

      expect(res.status).toBe(401);
    });

    it('debe fallar con email inexistente', async () => {
      const res = await request(app)
        .post('/api/user/login')
        .send({ email: 'noexiste@example.com', password: 'Test1234!' });

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/user', () => {
    it('debe obtener el usuario autenticado', async () => {
      const registro = await request(app)
        .post('/api/user/register')
        .send({ email: 'getuser@example.com', password: 'Test1234!' });

      const token = registro.body.accessToken;

      const res = await request(app)
        .get('/api/user')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.usuario.email).toBe('getuser@example.com');
    });

    it('debe fallar sin token', async () => {
      const res = await request(app).get('/api/user');
      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/user/refresh', () => {
    it('debe renovar el access token', async () => {
      const registro = await request(app)
        .post('/api/user/register')
        .send({ email: 'refresh@example.com', password: 'Test1234!' });

      const { refreshToken } = registro.body;

      const res = await request(app)
        .post('/api/user/refresh')
        .send({ refreshToken });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('accessToken');
      expect(res.body).toHaveProperty('refreshToken');
    });

    it('debe fallar con refresh token invalido', async () => {
      const res = await request(app)
        .post('/api/user/refresh')
        .send({ refreshToken: 'token-invalido' });

      expect(res.status).toBe(401);
    });
  });

});