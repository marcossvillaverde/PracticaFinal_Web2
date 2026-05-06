
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

/**
 * @swagger
 * /api/user/register:
 *   post:
 *     summary: Registrar un nuevo usuario
 *     tags: [Usuarios]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 example: usuario@example.com
 *               password:
 *                 type: string
 *                 example: MiContraseña123
 *     responses:
 *       201:
 *         description: Usuario registrado correctamente
 *       409:
 *         description: Ya existe una cuenta con ese email
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/register', validate(registerSchema), register);

/**
 * @swagger
 * /api/user/validation:
 *   put:
 *     summary: Verificar email con codigo de 6 digitos
 *     tags: [Usuarios]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [code]
 *             properties:
 *               code:
 *                 type: string
 *                 example: "123456"
 *     responses:
 *       200:
 *         description: Email verificado correctamente
 *       400:
 *         description: Codigo incorrecto
 */
router.put('/validation', authMiddleware, validate(validationCodeSchema), validateEmail);

/**
 * @swagger
 * /api/user/login:
 *   post:
 *     summary: Iniciar sesion
 *     tags: [Usuarios]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 example: usuario@example.com
 *               password:
 *                 type: string
 *                 example: MiContraseña123
 *     responses:
 *       200:
 *         description: Login correcto, devuelve tokens JWT
 *       401:
 *         description: Credenciales incorrectas
 */
router.post('/login', validate(loginSchema), login);

/**
 * @swagger
 * /api/user/refresh:
 *   post:
 *     summary: Renovar access token con refresh token
 *     tags: [Usuarios]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [refreshToken]
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Nuevos tokens generados
 *       401:
 *         description: Refresh token invalido
 */
router.post('/refresh', refresh);

/**
 * @swagger
 * /api/user/logout:
 *   post:
 *     summary: Cerrar sesion
 *     tags: [Usuarios]
 *     responses:
 *       200:
 *         description: Sesion cerrada correctamente
 */
router.post('/logout', authMiddleware, logout);

/**
 * @swagger
 * /api/user/register:
 *   put:
 *     summary: Onboarding — datos personales
 *     tags: [Usuarios]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, lastName, nif]
 *             properties:
 *               name:
 *                 type: string
 *                 example: Juan
 *               lastName:
 *                 type: string
 *                 example: Garcia
 *               nif:
 *                 type: string
 *                 example: 12345678A
 *     responses:
 *       200:
 *         description: Datos personales actualizados
 */
router.put('/register', authMiddleware, validate(personalDataSchema), updatePersonalData);

/**
 * @swagger
 * /api/user/company:
 *   patch:
 *     summary: Onboarding — datos de compania
 *     tags: [Usuarios]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [isFreelance]
 *             properties:
 *               isFreelance:
 *                 type: boolean
 *               name:
 *                 type: string
 *               cif:
 *                 type: string
 *     responses:
 *       200:
 *         description: Compania asignada correctamente
 */
router.patch('/company', authMiddleware, validate(companyDataBodySchema), updateCompany);

/**
 * @swagger
 * /api/user/logo:
 *   patch:
 *     summary: Subir logo de la compania
 *     tags: [Usuarios]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               logo:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Logo actualizado correctamente
 */
router.patch('/logo', authMiddleware, upload.single('logo'), uploadLogo);

/**
 * @swagger
 * /api/user:
 *   get:
 *     summary: Obtener usuario autenticado
 *     tags: [Usuarios]
 *     responses:
 *       200:
 *         description: Datos del usuario
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Usuario'
 */
router.get('/', authMiddleware, getUser);

/**
 * @swagger
 * /api/user:
 *   delete:
 *     summary: Eliminar usuario (hard o soft)
 *     tags: [Usuarios]
 *     parameters:
 *       - in: query
 *         name: soft
 *         schema:
 *           type: boolean
 *         description: Si es true hace borrado logico
 *     responses:
 *       200:
 *         description: Usuario eliminado correctamente
 */
router.delete('/', authMiddleware, deleteUser);

/**
 * @swagger
 * /api/user/password:
 *   put:
 *     summary: Cambiar contraseña
 *     tags: [Usuarios]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [currentPassword, newPassword]
 *             properties:
 *               currentPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Contraseña actualizada correctamente
 *       401:
 *         description: Contraseña actual incorrecta
 */
router.put('/password', authMiddleware, validate(changePasswordSchema), changePassword);

/**
 * @swagger
 * /api/user/invite:
 *   post:
 *     summary: Invitar un companero (solo admin)
 *     tags: [Usuarios]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, name, lastName]
 *             properties:
 *               email:
 *                 type: string
 *               name:
 *                 type: string
 *               lastName:
 *                 type: string
 *     responses:
 *       201:
 *         description: Usuario invitado correctamente
 *       403:
 *         description: No tienes permisos para realizar esta accion
 */
router.post('/invite', authMiddleware, checkRole(['admin']), validate(inviteSchema), inviteUser);

export default router;