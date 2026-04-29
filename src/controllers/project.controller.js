// Controlador de proyectos
// Los proyectos pertenecen a una compañia y estan asociados a un cliente
// Implementa paginacion, filtros, soft delete y restauracion

import Project from '../models/Project.js';
import Client from '../models/Client.js';
import { AppError } from '../utils/AppError.js';

// POST /api/project
export const createProject = async (req, res, next) => {
  try {
    const { name, projectCode, client, address, email, notes } = req.body;
    const { _id: user, company } = req.user;

    if (!company) {
      return next(AppError.badRequest('Debes tener una compañia asignada para crear proyectos'));
    }

    // Verificamos que el cliente pertenece a la misma compañia
    const clienteExiste = await Client.findOne({
      _id:     client,
      company: company._id,
      deleted: false,
    });

    if (!clienteExiste) {
      return next(AppError.notFound('Cliente'));
    }

    // El codigo de proyecto debe ser unico dentro de la compañia
    const codigoDuplicado = await Project.findOne({
      company:     company._id,
      projectCode,
      deleted:     false,
    });

    if (codigoDuplicado) {
      return next(AppError.conflict('Ya existe un proyecto con ese codigo en tu compañia'));
    }

    const proyecto = await Project.create({
      user,
      company: company._id,
      client,
      name,
      projectCode,
      address,
      email,
      notes,
    });

    res.status(201).json({ mensaje: 'Proyecto creado correctamente', proyecto });
  } catch (err) {
    next(err);
  }
};

// PUT /api/project/:id
export const updateProject = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { company } = req.user;

    const proyecto = await Project.findOne({
      _id:     id,
      company: company._id,
      deleted: false,
    });

    if (!proyecto) {
      return next(AppError.notFound('Proyecto'));
    }

    // Si cambia el codigo verificamos que no exista otro proyecto con ese codigo
    if (req.body.projectCode && req.body.projectCode !== proyecto.projectCode) {
      const duplicado = await Project.findOne({
        company:     company._id,
        projectCode: req.body.projectCode,
        deleted:     false,
        _id:         { $ne: id },
      });
      if (duplicado) {
        return next(AppError.conflict('Ya existe un proyecto con ese codigo en tu compañia'));
      }
    }

    // Si cambia el cliente verificamos que pertenece a la compañia
    if (req.body.client) {
      const clienteExiste = await Client.findOne({
        _id:     req.body.client,
        company: company._id,
        deleted: false,
      });
      if (!clienteExiste) {
        return next(AppError.notFound('Cliente'));
      }
    }

    Object.assign(proyecto, req.body);
    await proyecto.save();

    res.json({ mensaje: 'Proyecto actualizado correctamente', proyecto });
  } catch (err) {
    next(err);
  }
};

// GET /api/project
export const getProjects = async (req, res, next) => {
  try {
    const { company } = req.user;
    const { page, limit, name, client, active, sort } = req.query;

    // Construimos el filtro base
    const filtro = { company: company._id, deleted: false };

    // Filtros opcionales
    if (name)   filtro.name   = { $regex: name, $options: 'i' };
    if (client) filtro.client = client;
    if (active !== undefined) filtro.active = active;

    const total = await Project.countDocuments(filtro);
    const proyectos = await Project.find(filtro)
      .populate('client', 'name cif email')
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit);

    res.json({
      proyectos,
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

// GET /api/project/archived
export const getArchivedProjects = async (req, res, next) => {
  try {
    const { company } = req.user;

    const proyectos = await Project.find({
      company: company._id,
      deleted: true,
    }).populate('client', 'name cif');

    res.json({ proyectos });
  } catch (err) {
    next(err);
  }
};

// GET /api/project/:id
export const getProject = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { company } = req.user;

    const proyecto = await Project.findOne({
      _id:     id,
      company: company._id,
      deleted: false,
    }).populate('client', 'name cif email phone');

    if (!proyecto) {
      return next(AppError.notFound('Proyecto'));
    }

    res.json({ proyecto });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/project/:id
export const deleteProject = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { soft } = req.query;
    const { company } = req.user;

    const proyecto = await Project.findOne({
      _id:     id,
      company: company._id,
      deleted: false,
    });

    if (!proyecto) {
      return next(AppError.notFound('Proyecto'));
    }

    if (soft === 'true') {
      proyecto.deleted = true;
      await proyecto.save();
    } else {
      await Project.findByIdAndDelete(id);
    }

    res.json({ mensaje: 'Proyecto eliminado correctamente' });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/project/:id/restore
export const restoreProject = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { company } = req.user;

    const proyecto = await Project.findOne({
      _id:     id,
      company: company._id,
      deleted: true,
    });

    if (!proyecto) {
      return next(AppError.notFound('Proyecto archivado'));
    }

    proyecto.deleted = false;
    await proyecto.save();

    res.json({ mensaje: 'Proyecto restaurado correctamente', proyecto });
  } catch (err) {
    next(err);
  }
};