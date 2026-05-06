
import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title:       'BildyApp API',
      version:     '1.0.0',
      description: 'API REST para la gestion de albaranes de obra',
    },
    servers: [
      { url: 'http://localhost:3000', description: 'Servidor de desarrollo' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type:         'http',
          scheme:       'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        Usuario: {
          type: 'object',
          properties: {
            _id:      { type: 'string', example: '65f8b3...' },
            email:    { type: 'string', example: 'usuario@example.com' },
            role:     { type: 'string', enum: ['admin', 'guest'] },
            status:   { type: 'string', enum: ['pending', 'verified'] },
            fullName: { type: 'string', example: 'Juan Garcia' },
            name:     { type: 'string', example: 'Juan' },
            lastName: { type: 'string', example: 'Garcia' },
            nif:      { type: 'string', example: '12345678A' },
            company:  { $ref: '#/components/schemas/Compania' },
          },
        },
        Compania: {
          type: 'object',
          properties: {
            _id:         { type: 'string' },
            name:        { type: 'string', example: 'Acme Construcciones' },
            cif:         { type: 'string', example: 'B12345678' },
            isFreelance: { type: 'boolean' },
            logo:        { type: 'string', nullable: true },
          },
        },
        Cliente: {
          type: 'object',
          properties: {
            _id:     { type: 'string' },
            name:    { type: 'string', example: 'Cliente SA' },
            cif:     { type: 'string', example: 'A12345678' },
            email:   { type: 'string', example: 'cliente@example.com' },
            phone:   { type: 'string', example: '600000000' },
            deleted: { type: 'boolean' },
          },
        },
        Proyecto: {
          type: 'object',
          properties: {
            _id:         { type: 'string' },
            name:        { type: 'string', example: 'Reforma oficinas' },
            projectCode: { type: 'string', example: 'PRJ-001' },
            client:      { $ref: '#/components/schemas/Cliente' },
            active:      { type: 'boolean' },
            deleted:     { type: 'boolean' },
          },
        },
        Albaran: {
          type: 'object',
          properties: {
            _id:         { type: 'string' },
            format:      { type: 'string', enum: ['material', 'hours'] },
            description: { type: 'string' },
            workDate:    { type: 'string', format: 'date' },
            signed:      { type: 'boolean' },
            signedAt:    { type: 'string', format: 'date-time', nullable: true },
            signatureUrl:{ type: 'string', nullable: true },
            pdfUrl:      { type: 'string', nullable: true },
            client:      { $ref: '#/components/schemas/Cliente' },
            project:     { $ref: '#/components/schemas/Proyecto' },
          },
        },
        Error: {
          type: 'object',
          properties: {
            error:   { type: 'boolean', example: true },
            mensaje: { type: 'string', example: 'Mensaje de error' },
            code:    { type: 'string', example: 'NOT_FOUND' },
          },
        },
        Paginacion: {
          type: 'object',
          properties: {
            totalItems:  { type: 'number', example: 50 },
            totalPages:  { type: 'number', example: 5 },
            currentPage: { type: 'number', example: 1 },
            limit:       { type: 'number', example: 10 },
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: ['./src/routes/*.js'],
};

export const swaggerSpec = swaggerJsdoc(options);