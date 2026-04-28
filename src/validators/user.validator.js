// Validadores Zod para el módulo de usuarios
// Cada schema valida el body de una petición concreta
// Los transforms normalizan los datos (email a minúsculas, etc.)

import { z } from 'zod';

const addressSchema = z.object({
  street:   z.string().trim().optional(),
  number:   z.string().trim().optional(),
  postal:   z.string().trim().optional(),
  city:     z.string().trim().optional(),
  province: z.string().trim().optional(),
}).optional();

// Registro de usuario
export const registerSchema = z.object({
  body: z.object({
    email:    z.string().email('El email no es valido').transform(v => v.toLowerCase().trim()),
    password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
  }),
});

// Validacion del codigo de verificacion de email
export const validationCodeSchema = z.object({
  body: z.object({
    code: z.string().length(6, 'El codigo debe tener 6 digitos').regex(/^\d{6}$/, 'El codigo debe ser numerico'),
  }),
});

// Login
export const loginSchema = z.object({
  body: z.object({
    email:    z.string().email('El email no es valido').transform(v => v.toLowerCase().trim()),
    password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
  }),
});

// Onboarding — datos personales
export const personalDataSchema = z.object({
  body: z.object({
    name:     z.string().trim().min(1, 'El nombre es obligatorio'),
    lastName: z.string().trim().min(1, 'Los apellidos son obligatorios'),
    nif:      z.string().trim().min(1, 'El NIF es obligatorio'),
    address:  addressSchema,
  }),
});

// Onboarding, datos de compañía
// discriminatedUnion permite validar segun si es autonomo o empresa
export const companyDataBodySchema = z.object({
  body: z.discriminatedUnion('isFreelance', [
    z.object({ isFreelance: z.literal(true) }),
    z.object({
      isFreelance: z.literal(false),
      name:        z.string().trim().min(1, 'El nombre de la empresa es obligatorio'),
      cif:         z.string().trim().min(1, 'El CIF es obligatorio'),
      address:     addressSchema,
    }),
  ]),
});

// Cambio de contraseña con refine para verificar que son diferentes
export const changePasswordSchema = z.object({
  body: z.object({
    currentPassword: z.string().min(8, 'La contraseña actual debe tener al menos 8 caracteres'),
    newPassword:     z.string().min(8, 'La nueva contraseña debe tener al menos 8 caracteres'),
  }).refine(
    (data) => data.currentPassword !== data.newPassword,
    { message: 'La nueva contraseña debe ser diferente a la actual', path: ['newPassword'] }
  ),
});

// Invitar companero
export const inviteSchema = z.object({
  body: z.object({
    email:    z.string().email('El email no es valido').transform(v => v.toLowerCase().trim()),
    name:     z.string().trim().min(1, 'El nombre es obligatorio'),
    lastName: z.string().trim().min(1, 'Los apellidos son obligatorios'),
  }),
});