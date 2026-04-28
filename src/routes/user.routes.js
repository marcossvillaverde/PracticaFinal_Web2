// Rutas del módulo de usuarios
// Todas las rutas protegidas requieren el middleware de autenticacion JWT

import { Router } from 'express';
import {
  register, validateEmail, login, refresh, logout,
  updatePersonalData, updateCompany, uploadLogo,
  getUser, deleteUser, changePassword, inviteUser,
} from '../controllers/user.controller.js';
import { validate } from '../middleware/validate.js';
import authMiddleware from '../middleware/auth.middleware.js';
import checkRole from '../middleware/role.middleware.js';
import upload from '../middleware/upload.js';
import {
  registerSchema, validationCodeSchema, loginSchema,
  personalDataSchema, companyDataBodySchema,
  changePasswordSchema, inviteSchema,
} from '../validators/user.validator.js';

const router = Router();

// Rutas publicas
router.post('/register', validate(registerSchema), register);
router.post('/login',    validate(loginSchema),    login);
router.post('/refresh',                            refresh);

// Rutas protegidas
router.put('/validation', authMiddleware, validate(validationCodeSchema), validateEmail);
router.put('/register',   authMiddleware, validate(personalDataSchema),   updatePersonalData);
router.patch('/company',  authMiddleware, validate(companyDataBodySchema), updateCompany);
router.patch('/logo',     authMiddleware, upload.single('logo'),           uploadLogo);
router.get('/',           authMiddleware,                                  getUser);
router.post('/logout',    authMiddleware,                                  logout);
router.delete('/',        authMiddleware,                                  deleteUser);
router.put('/password',   authMiddleware, validate(changePasswordSchema),  changePassword);

// Solo administradores pueden invitar
router.post('/invite', authMiddleware, checkRole(['admin']), validate(inviteSchema), inviteUser);

export default router;