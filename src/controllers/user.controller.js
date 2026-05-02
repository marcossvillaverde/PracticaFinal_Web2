// Controlador de usuarios
// Gestiona registro, verificacion, login, onboarding, sesion y administracion

import User from '../models/User.js';
import Company from '../models/Company.js';
import { encrypt, compare } from '../utils/handlePassword.js';
import { generateAccessToken, generateRefreshToken } from '../utils/handleJwt.js';
import { AppError } from '../utils/AppError.js';
import notificationService from '../services/notification.service.js';
import { config } from '../config/index.js';

// Genera un codigo de verificacion de 6 digitos
const generarCodigo = () => String(Math.floor(100000 + Math.random() * 900000));

// Construye la respuesta estandar con tokens y datos basicos del usuario
const respuestaConTokens = (res, statusCode, usuario, refreshToken) => {
  const accessToken = generateAccessToken(usuario);
  res.status(statusCode).json({
    accessToken,
    refreshToken,
    usuario: {
      _id:      usuario._id,
      email:    usuario.email,
      role:     usuario.role,
      status:   usuario.status,
      fullName: usuario.fullName,
    },
  });
};

// POST /api/user/register
export const register = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Evitamos registros duplicados de cuentas ya verificadas
    const existente = await User.findOne({ email, status: 'verified' });
    if (existente) {
      return next(AppError.conflict('Ya existe una cuenta verificada con ese email'));
    }

    const passwordHash = await encrypt(password);
    const verificationCode = generarCodigo();

    const usuario = await User.create({
      email,
      password:             passwordHash,
      verificationCode,
      verificationAttempts: 3,
    });

    const refreshToken = generateRefreshToken();
    usuario.refreshToken = refreshToken;
    await usuario.save();

    // Emitimos evento para enviar email de verificacion
    notificationService.emit('user:registered', { email, verificationCode });

    respuestaConTokens(res, 201, usuario, refreshToken);
  } catch (err) {
    next(err);
  }
};

// PUT /api/user/validation
export const validateEmail = async (req, res, next) => {
  try {
    const { code } = req.body;
    const usuario = await User.findById(req.user._id);

    if (usuario.status === 'verified') {
      return res.json({ mensaje: 'El email ya estaba verificado' });
    }

    if (usuario.verificationAttempts <= 0) {
      return next(AppError.tooManyRequests('Has agotado los intentos de verificacion'));
    }

    if (usuario.verificationCode !== code) {
      usuario.verificationAttempts -= 1;
      await usuario.save();
      return next(AppError.badRequest(
        `Codigo incorrecto. Te quedan ${usuario.verificationAttempts} intentos`
      ));
    }

    usuario.status = 'verified';
    usuario.verificationCode = undefined;
    await usuario.save();

    notificationService.emit('user:verified', { email: usuario.email });

    res.json({ mensaje: 'Email verificado correctamente' });
  } catch (err) {
    next(err);
  }
};

// POST /api/user/login
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const usuario = await User.findOne({ email, deleted: false }).select('+password');

    if (!usuario) {
      return next(AppError.unauthorized('Credenciales incorrectas'));
    }

    const passwordOk = await compare(password, usuario.password);
    if (!passwordOk) {
      return next(AppError.unauthorized('Credenciales incorrectas'));
    }

    const refreshToken = generateRefreshToken();
    usuario.refreshToken = refreshToken;
    await usuario.save();

    respuestaConTokens(res, 200, usuario, refreshToken);
  } catch (err) {
    next(err);
  }
};

// POST /api/user/refresh
export const refresh = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return next(AppError.badRequest('El refresh token es obligatorio'));
    }

    const usuario = await User.findOne({ refreshToken, deleted: false });

    if (!usuario) {
      return next(AppError.unauthorized('Refresh token invalido o expirado'));
    }

    // Rotacion de tokens: invalidamos el anterior y generamos uno nuevo
    const nuevoRefreshToken = generateRefreshToken();
    usuario.refreshToken = nuevoRefreshToken;
    await usuario.save();

    const accessToken = generateAccessToken(usuario);
    res.json({ accessToken, refreshToken: nuevoRefreshToken });
  } catch (err) {
    next(err);
  }
};

// POST /api/user/logout
export const logout = async (req, res, next) => {
  try {
    const usuario = await User.findById(req.user._id);
    usuario.refreshToken = null;
    await usuario.save();

    res.json({ mensaje: 'Sesion cerrada correctamente' });
  } catch (err) {
    next(err);
  }
};

// PUT /api/user/register (datos personales)
export const updatePersonalData = async (req, res, next) => {
  try {
    const { name, lastName, nif, address } = req.body;

    const usuario = await User.findByIdAndUpdate(
      req.user._id,
      { name, lastName, nif, address },
      { new: true, runValidators: true }
    );

    res.json({ mensaje: 'Datos personales actualizados', usuario });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/user/company
export const updateCompany = async (req, res, next) => {
  try {
    const usuario = await User.findById(req.user._id);
    const { isFreelance, name, cif, address } = req.body;

    let cifFinal      = cif;
    let nombreFinal   = name;
    let direccionFinal = address;

    // Si es autonomo usamos sus datos personales como datos de la compañia
    if (isFreelance) {
      cifFinal       = usuario.nif;
      nombreFinal    = `${usuario.name} ${usuario.lastName}`;
      direccionFinal = usuario.address;
    }

    // Si ya existe una compañia con ese CIF el usuario se une como guest
    let company = await Company.findOne({ cif: cifFinal, deleted: false });

    if (company) {
      if (company.owner.toString() !== usuario._id.toString()) {
        usuario.role = 'guest';
      }
    } else {
      company = await Company.create({
        owner:       usuario._id,
        name:        nombreFinal,
        cif:         cifFinal,
        address:     direccionFinal,
        isFreelance: isFreelance ?? false,
      });
    }

    usuario.company = company._id;
    await usuario.save();

    res.json({ mensaje: 'Compañia asignada correctamente', company });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/user/logo
export const uploadLogo = async (req, res, next) => {
  try {
    if (!req.file) {
      return next(AppError.badRequest('No se ha subido ninguna imagen'));
    }

    const usuario = await User.findById(req.user._id);

    if (!usuario.company) {
      return next(AppError.badRequest('El usuario no tiene una compañia asignada'));
    }

    const logoUrl = `${config.publicUrl}/uploads/${req.file.filename}`;

    const company = await Company.findByIdAndUpdate(
      usuario.company,
      { logo: logoUrl },
      { new: true }
    );

    res.json({ mensaje: 'Logo actualizado correctamente', logo: company.logo });
  } catch (err) {
    next(err);
  }
};

// GET /api/user
export const getUser = async (req, res, next) => {
  try {
    const usuario = await User.findById(req.user._id).populate('company');
    res.json({ usuario });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/user
export const deleteUser = async (req, res, next) => {
  try {
    const { soft } = req.query;
    const usuario = await User.findById(req.user._id);

    if (soft === 'true') {
      // Borrado logico: marcamos como eliminado pero mantenemos los datos
      usuario.deleted = true;
      usuario.refreshToken = null;
      await usuario.save();
    } else {
      // Borrado fisico: eliminamos el documento de la BD
      await User.findByIdAndDelete(req.user._id);
    }

    notificationService.emit('user:deleted', { email: usuario.email });
    res.json({ mensaje: 'Usuario eliminado correctamente' });
  } catch (err) {
    next(err);
  }
};

// PUT /api/user/password
export const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const usuario = await User.findById(req.user._id).select('+password');

    const passwordOk = await compare(currentPassword, usuario.password);
    if (!passwordOk) {
      return next(AppError.unauthorized('La contraseña actual es incorrecta'));
    }

    usuario.password = await encrypt(newPassword);
    await usuario.save();

    res.json({ mensaje: 'Contraseña actualizada correctamente' });
  } catch (err) {
    next(err);
  }
};

// POST /api/user/invite
export const inviteUser = async (req, res, next) => {
  try {
    const { email, name, lastName } = req.body;
    const usuarioAdmin = req.user;

    if (!usuarioAdmin.company) {
      return next(AppError.badRequest('Debes tener una compañia para invitar companeros'));
    }

    const existente = await User.findOne({ email });
    if (existente) {
      return next(AppError.conflict('Ya existe un usuario con ese email'));
    }

    const passwordTemporal = Math.random().toString(36).slice(-8);
    const passwordHash = await encrypt(passwordTemporal);
    const verificationCode = generarCodigo();

    const usuarioInvitado = await User.create({
      email,
      name,
      lastName,
      password:             passwordHash,
      role:                 'guest',
      company:              usuarioAdmin.company,
      verificationCode,
      verificationAttempts: 3,
    });

    notificationService.emit('user:invited', {
      email:       email,
      nombre:      `${name} ${lastName}`,
      invitadoPor: usuarioAdmin.email,
    });

    res.status(201).json({
      mensaje: 'Usuario invitado correctamente',
      usuario: {
        _id:     usuarioInvitado._id,
        email:   usuarioInvitado.email,
        role:    usuarioInvitado.role,
        company: usuarioInvitado.company,
      },
    });
  } catch (err) {
    next(err);
  }
};