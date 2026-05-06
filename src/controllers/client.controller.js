

import Client from '../models/Client.js';
import { AppError } from '../utils/AppError.js';
import { getIO } from '../sockets/index.js';

export const createClient = async (req, res, next) => {
  try {
    const { name, cif, email, phone, address } = req.body;
    const { _id: user, company } = req.user;

    if (!company) {
      return next(AppError.badRequest('Debes tener una compañia asignada para crear clientes'));
    }

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

    getIO().to(company._id.toString()).emit('client:new', {
      _id:  cliente._id,
      name: cliente.name,
    });

    res.status(201).json({ mensaje: 'Cliente creado correctamente', cliente });
  } catch (err) {
    next(err);
  }
};

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

    const filtro = { company: company._id, deleted: false };

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
        totalPages:  Math.ceil(total / Number(limit)),
        currentPage: Number(page),
        limit:       Number(limit),
      },
    });
  } catch (err) {
    next(err);
  }
};

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