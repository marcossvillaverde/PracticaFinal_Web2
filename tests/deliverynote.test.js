import { jest } from '@jest/globals';

jest.unstable_mockModule('../src/services/notification.service.js', () => ({
  default: { emit: jest.fn(), on: jest.fn() },
}));

jest.unstable_mockModule('../src/sockets/index.js', () => ({
  getIO: () => ({ to: () => ({ emit: jest.fn() }) }),
}));

jest.unstable_mockModule('../src/services/storage.service.js', () => ({
  uploadSignature: jest.fn().mockResolvedValue('https://cloudinary.com/firma-test.webp'),
  uploadPDF:       jest.fn().mockResolvedValue('https://cloudinary.com/albaran-test.pdf'),
}));

jest.unstable_mockModule('../src/services/pdf.service.js', () => ({
  generateDeliveryNotePDF: jest.fn().mockResolvedValue(Buffer.from('fake-pdf')),
}));

const { default: app } = await import('../src/app.js');
const { default: User } = await import('../src/models/User.js');
const { default: Company } = await import('../src/models/Company.js');
const { default: DeliveryNote } = await import('../src/models/DeliveryNote.js');
const request = (await import('supertest')).default;

const crearUsuarioConCompania = async (email, nombreEmpresa = 'Empresa Test', cif = 'B12345678') => {
  const registro = await request(app)
    .post('/api/user/register')
    .send({ email, password: 'Test1234!' });

  const token = registro.body.accessToken;
  const userId = registro.body.usuario._id;

  const company = await Company.create({
    owner: userId,
    name:  nombreEmpresa,
    cif,
  });

  await User.findByIdAndUpdate(userId, { company: company._id });

  return { token, userId, companyId: company._id };
};

const crearCliente = async (token, cif = 'A11111111') => {
  const res = await request(app)
    .post('/api/client')
    .set('Authorization', `Bearer ${token}`)
    .send({ name: 'Cliente Test', cif });
  return res.body.cliente._id;
};

const crearProyecto = async (token, clienteId, code = 'PRJ-001') => {
  const res = await request(app)
    .post('/api/project')
    .set('Authorization', `Bearer ${token}`)
    .send({ name: 'Proyecto Test', projectCode: code, client: clienteId });
  return res.body.proyecto._id;
};

describe('Albaranes (DeliveryNote)', () => {

  describe('POST /api/deliverynote', () => {
    it('debe crear un albarán de materiales correctamente y devolver 201 con los campos esperados', async () => {
      const { token } = await crearUsuarioConCompania('albaran1@test.com');
      const clienteId = await crearCliente(token);
      const proyectoId = await crearProyecto(token, clienteId);

      const res = await request(app)
        .post('/api/deliverynote')
        .set('Authorization', `Bearer ${token}`)
        .send({
          format:      'material',
          project:     proyectoId,
          client:      clienteId,
          workDate:    '2025-06-01',
          material:    'Cemento',
          quantity:    100,
          unit:        'kg',
          description: 'Entrega de cemento en obra',
        });

      expect(res.status).toBe(201);
      expect(res.body.albaran).toBeDefined();
      expect(res.body.albaran.format).toBe('material');
      expect(res.body.albaran.client).toBe(clienteId);
      expect(res.body.albaran.project).toBe(proyectoId);
      expect(res.body.albaran.workDate).toBeDefined();
    });
  });

  describe('PATCH /api/deliverynote/:id/sign', () => {
    it('debe firmar un albarán correctamente y devolver 200 con signatureUrl y pdfUrl', async () => {
      const { token } = await crearUsuarioConCompania('albaran2@test.com');
      const clienteId = await crearCliente(token);
      const proyectoId = await crearProyecto(token, clienteId);

      const crear = await request(app)
        .post('/api/deliverynote')
        .set('Authorization', `Bearer ${token}`)
        .send({
          format:   'material',
          project:  proyectoId,
          client:   clienteId,
          workDate: '2025-06-01',
          material: 'Ladrillos',
          quantity: 500,
          unit:     'unidades',
        });

      const albaranId = crear.body.albaran._id;

      const firmaBuffer = Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
        'base64'
      );

      const res = await request(app)
        .patch(`/api/deliverynote/${albaranId}/sign`)
        .set('Authorization', `Bearer ${token}`)
        .attach('signature', firmaBuffer, 'firma.png');

      expect(res.status).toBe(200);
      expect(res.body.signatureUrl).toBeDefined();
      expect(res.body.pdfUrl).toBeDefined();
    });
  });

  describe('DELETE /api/deliverynote/:id', () => {
    it('debe devolver 409 (conflict) al intentar eliminar un albarán firmado', async () => {
      const { token, companyId, userId } = await crearUsuarioConCompania('albaran3@test.com');
      const clienteId = await crearCliente(token);
      const proyectoId = await crearProyecto(token, clienteId);

      const albaran = await DeliveryNote.create({
        user:     userId,
        company:  companyId,
        project:  proyectoId,
        client:   clienteId,
        format:   'hours',
        workDate: new Date('2025-06-01'),
        hours:    8,
        signed:   true,
        signedAt: new Date(),
      });

      const res = await request(app)
        .delete(`/api/deliverynote/${albaran._id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(409);
      expect(res.body.error).toBe(true);
    });
  });

  describe('Multi-tenant: aislamiento entre compañías', () => {
    it('un usuario de la compañía B no puede ver ni borrar el albarán de la compañía A (espera 404)', async () => {
      const empresaA = await crearUsuarioConCompania('empresaA@test.com', 'Empresa A', 'B11111111');
      const clienteA = await crearCliente(empresaA.token, 'A22222222');
      const proyectoA = await crearProyecto(empresaA.token, clienteA, 'PRJ-A01');

      const crearAlbaran = await request(app)
        .post('/api/deliverynote')
        .set('Authorization', `Bearer ${empresaA.token}`)
        .send({
          format:   'material',
          project:  proyectoA,
          client:   clienteA,
          workDate: '2025-06-01',
          material: 'Arena',
          quantity: 200,
          unit:     'kg',
        });

      const albaranIdA = crearAlbaran.body.albaran._id;

      const empresaB = await crearUsuarioConCompania('empresaB@test.com', 'Empresa B', 'B99999999');

      const resGet = await request(app)
        .get(`/api/deliverynote/${albaranIdA}`)
        .set('Authorization', `Bearer ${empresaB.token}`);

      expect(resGet.status).toBe(404);

      const resDelete = await request(app)
        .delete(`/api/deliverynote/${albaranIdA}`)
        .set('Authorization', `Bearer ${empresaB.token}`);

      expect(resDelete.status).toBe(404);
    });
  });

});