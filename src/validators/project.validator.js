
import { z } from 'zod';

const addressSchema = z.object({
  street:   z.string().trim().optional(),
  number:   z.string().trim().optional(),
  postal:   z.string().trim().optional(),
  city:     z.string().trim().optional(),
  province: z.string().trim().optional(),
}).optional();

export const projectSchema = z.object({
  body: z.object({
    name:        z.string().trim().min(1, 'El nombre es obligatorio'),
    projectCode: z.string().trim().min(1, 'El codigo de proyecto es obligatorio'),
    client:      z.string().min(1, 'El cliente es obligatorio'),
    address:     addressSchema,
    email:       z.string().email('El email no es valido').optional(),
    notes:       z.string().trim().optional(),
    active:      z.boolean().optional(),
  }),
});

export const projectQuerySchema = z.object({
  query: z.object({
    page:   z.string().optional().transform(v => Number(v) || 1),
    limit:  z.string().optional().transform(v => Number(v) || 10),
    name:   z.string().optional(),
    client: z.string().optional(),
    active: z.string().optional().transform(v => {
      if (v === 'true') return true;
      if (v === 'false') return false;
      return undefined;
    }),
    sort:   z.string().optional().default('-createdAt'),
  }),
});