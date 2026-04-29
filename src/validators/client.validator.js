// Validadores Zod para el módulo de clientes

import { z } from 'zod';

const addressSchema = z.object({
  street:   z.string().trim().optional(),
  number:   z.string().trim().optional(),
  postal:   z.string().trim().optional(),
  city:     z.string().trim().optional(),
  province: z.string().trim().optional(),
}).optional();

// Crear o actualizar cliente
export const clientSchema = z.object({
  body: z.object({
    name:    z.string().trim().min(1, 'El nombre es obligatorio'),
    cif:     z.string().trim().optional(),
    email:   z.string().email('El email no es valido').optional(),
    phone:   z.string().trim().optional(),
    address: addressSchema,
  }),
});

// Parametros de paginacion y filtros para el listado
export const clientQuerySchema = z.object({
  query: z.object({
    page:  z.string().optional().transform(v => Number(v) || 1),
    limit: z.string().optional().transform(v => Number(v) || 10),
    name:  z.string().optional(),
    sort:  z.string().optional().default('createdAt'),
  }),
});