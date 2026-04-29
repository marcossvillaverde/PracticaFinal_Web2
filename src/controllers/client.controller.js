// Controlador de clientes
// Los clientes pertenecen a una compañia y son visibles por todos sus usuarios
// Implementa paginacion, filtros, soft delete y restauracion

import Client from '../models/Client.js';
import { AppError } from '../utils/AppError.js';

// POST /api/client
export const createClient = async (req, res, next) => {
  try {
    const { name, cif, email, phone, address } = req.body;
    const { _id: user, company } = req.user;

    if (!company) {
      return next(AppError.badRequest('Debes tener una compañia asignada para crear clientes'));
    }

    // Comprobamos que no exista ya un cliente con ese CIF en la compañia
    if (cif) {
      const existente = await Client.findOne({ company: company._id, cif, deleted: false });
      if (existente) {
        return next(AppError.conflict('Ya existe un cliente con ese CIF en tu compañia'));
      }
    }

    const cliente = await Client.create({
      user,
      company: company._id,
      name,
      cif,
      email,
      phone,
      address,
    });

    res.status(201).json({ mensaje: 'Cliente creado correctamente', cliente });
  } catch (err) {
    next(err);
  }
};

// PUT /api/client/:id
export const updateClient = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { company } = req.user;

    const cliente = await Client.findOne({
      _id:     id,
      company: company._id,
      deleted: false,
    });

    if (!cliente) {
      return next(AppError.notFound('Cliente'));
    }

    // Si cambia el CIF comprobamos que no exista otro cliente con ese CIF
    if (req.body.cif && req.body.cif !== cliente.cif) {
      const duplicado = await Client.findOne({
        company: company._id,
        cif:     req.body.cif,
        deleted: false,
        _id:     { $ne: id },
      });
      if (duplicado) {
        return next(AppError.conflict('Ya existe un cliente con ese CIF en tu compañia'));
      }
    }

    Object.assign(cliente, req.body);
    await cliente.save();

    res.json({ mensaje: 'Cliente actualizado correctamente', cliente });
  } catch (err) {
    next(err);
  }
};

// GET /api/client
export const getClients = async (req, res, next) => {
  try {
    const { company } = req.user;
    const { page, limit, name, sort } = req.query;

    // Construimos el filtro base
    const filtro = { company: company._id, deleted: false };

    // Filtro por nombre (busqueda parcial, insensible a mayusculas)
    if (name) {
      filtro.name = { $regex: name, $options: 'i' };
    }

    const total = await Client.countDocuments(filtro);
    const clientes = await Client.find(filtro)
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit);

    res.json({
      clientes,
      paginacion: {
        totalItems:  total,
        totalPages:  Math.ceil(total / limit),
        currentPage: page,
        limit,
      },
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/client/archived
export const getArchivedClients = async (req, res, next) => {
  try {
    const { company } = req.user;

    const clientes = await Client.find({
      company: company._id,
      deleted: true,
    });

    res.json({ clientes });
  } catch (err) {
    next(err);
  }
};

// GET /api/client/:id
export const getClient = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { company } = req.user;

    const cliente = await Client.findOne({
      _id:     id,
      company: company._id,
      deleted: false,
    });

    if (!cliente) {
      return next(AppError.notFound('Cliente'));
    }

    res.json({ cliente });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/client/:id
export const deleteClient = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { soft } = req.query;
    const { company } = req.user;

    const cliente = await Client.findOne({
      _id:     id,
      company: company._id,
      deleted: false,
    });

    if (!cliente) {
      return next(AppError.notFound('Cliente'));
    }

    if (soft === 'true') {
      // Borrado logico: el cliente queda archivado y se puede restaurar
      cliente.deleted = true;
      await cliente.save();
    } else {
      // Borrado fisico: eliminamos el documento de la BD
      await Client.findByIdAndDelete(id);
    }

    res.json({ mensaje: 'Cliente eliminado correctamente' });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/client/:id/restore
export const restoreClient = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { company } = req.user;

    const cliente = await Client.findOne({
      _id:     id,
      company: company._id,
      deleted: true,
    });

    if (!cliente) {
      return next(AppError.notFound('Cliente archivado'));
    }

    cliente.deleted = false;
    await cliente.save();

    res.json({ mensaje: 'Cliente restaurado correctamente', cliente });
  } catch (err) {
    next(err);
  }
};