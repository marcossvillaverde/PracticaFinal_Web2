
import { z } from 'zod';

const workerSchema = z.object({
  name:  z.string().trim().min(1, 'El nombre del trabajador es obligatorio'),
  hours: z.number().min(0, 'Las horas no pueden ser negativas'),
});

export const deliveryNoteSchema = z.object({
  body: z.discriminatedUnion('format', [

    // Albaran de materiales
    z.object({
      format:      z.literal('material'),
      project:     z.string().min(1, 'El proyecto es obligatorio'),
      client:      z.string().min(1, 'El cliente es obligatorio'),
      description: z.string().trim().optional(),
      workDate:    z.string().min(1, 'La fecha de trabajo es obligatoria'),
      material:    z.string().trim().min(1, 'El material es obligatorio'),
      quantity:    z.number().min(0, 'La cantidad no puede ser negativa'),
      unit:        z.string().trim().min(1, 'La unidad es obligatoria'),
    }),

    z.object({
      format:      z.literal('hours'),
      project:     z.string().min(1, 'El proyecto es obligatorio'),
      client:      z.string().min(1, 'El cliente es obligatorio'),
      description: z.string().trim().optional(),
      workDate:    z.string().min(1, 'La fecha de trabajo es obligatoria'),
      hours:       z.number().min(0, 'Las horas no pueden ser negativas').optional(),
      workers:     z.array(workerSchema).optional(),
    }),

  ]),
});

export const deliveryNoteQuerySchema = z.object({
  query: z.object({
    page:    z.string().optional().transform(v => Number(v) || 1),
    limit:   z.string().optional().transform(v => Number(v) || 10),
    project: z.string().optional(),
    client:  z.string().optional(),
    format:  z.enum(['material', 'hours']).optional(),
    signed:  z.string().optional().transform(v => {
      if (v === 'true') return true;
      if (v === 'false') return false;
      return undefined;
    }),
    from:    z.string().optional(),
    to:      z.string().optional(),
    sort:    z.string().optional().default('-workDate'),
  }),
});