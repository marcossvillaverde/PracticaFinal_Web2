

import DeliveryNote from '../models/DeliveryNote.js';
import Project from '../models/Project.js';
import Client from '../models/Client.js';
import { AppError } from '../utils/AppError.js';
import { generateDeliveryNotePDF } from '../services/pdf.service.js';
import { uploadSignature, uploadPDF } from '../services/storage.service.js';
import { getIO } from '../sockets/index.js';

export const createDeliveryNote = async (req, res, next) => {
  try {
    const { _id: user, company } = req.user;

    if (!company) {
      return next(AppError.badRequest('Debes tener una compañia asignada para crear albaranes'));
    }

    const { project, client, format, description, workDate,
            material, quantity, unit, hours, workers } = req.body;

    const proyectoExiste = await Project.findOne({
      _id:     project,
      company: company._id,
      deleted: false,
    });

    if (!proyectoExiste) {
      return next(AppError.notFound('Proyecto'));
    }

    const clienteExiste = await Client.findOne({
      _id:     client,
      company: company._id,
      deleted: false,
    });

    if (!clienteExiste) {
      return next(AppError.notFound('Cliente'));
    }

    const albaran = await DeliveryNote.create({
      user,
      company:  company._id,
      project,
      client,
      format,
      description,
      workDate:  new Date(workDate),
      material,
      quantity,
      unit,
      hours,
      workers,
    });

    getIO().to(company._id.toString()).emit('deliverynote:new', {
      _id:    albaran._id,
      format: albaran.format,
  });

    res.status(201).json({ mensaje: 'Albaran creado correctamente', albaran });
  } catch (err) {
    next(err);
  }
};

export const getDeliveryNotes = async (req, res, next) => {
  try {
    const { company } = req.user;
    const { page, limit, project, client, format, signed, from, to, sort } = req.query;

    const filtro = { company: company._id, deleted: false };

    if (project) filtro.project = project;
    if (client)  filtro.client  = client;
    if (format)  filtro.format  = format;
    if (signed !== undefined) filtro.signed = signed;

    if (from || to) {
      filtro.workDate = {};
      if (from) filtro.workDate.$gte = new Date(from);
      if (to)   filtro.workDate.$lte = new Date(to);
    }

    const total = await DeliveryNote.countDocuments(filtro);
    const albaranes = await DeliveryNote.find(filtro)
      .populate('client',  'name cif')
      .populate('project', 'name projectCode')
      .populate('user',    'name lastName email')
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit);

    res.json({
      albaranes,
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

export const getDeliveryNote = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { company } = req.user;

    const albaran = await DeliveryNote.findOne({
      _id:     id,
      company: company._id,
      deleted: false,
    })
      .populate('user',    'name lastName email')
      .populate('client',  'name cif email phone address')
      .populate('project', 'name projectCode address email notes')
      .populate('company', 'name cif address logo');

    if (!albaran) {
      return next(AppError.notFound('Albaran'));
    }

    res.json({ albaran });
  } catch (err) {
    next(err);
  }
};

export const deleteDeliveryNote = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { company } = req.user;

    const albaran = await DeliveryNote.findOne({
      _id:     id,
      company: company._id,
      deleted: false,
    });

    if (!albaran) {
      return next(AppError.notFound('Albaran'));
    }

    if (albaran.signed) {
      return next(AppError.forbidden('No se puede eliminar un albaran firmado'));
    }

    await DeliveryNote.findByIdAndDelete(id);

    res.json({ mensaje: 'Albaran eliminado correctamente' });
  } catch (err) {
    next(err);
  }
};

export const downloadPDF = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { company } = req.user;

    const albaran = await DeliveryNote.findOne({
      _id:     id,
      company: company._id,
      deleted: false,
    })
      .populate('user',    'name lastName email')
      .populate('client',  'name cif email phone address')
      .populate('project', 'name projectCode address email notes')
      .populate('company', 'name cif address logo');

    if (!albaran) {
      return next(AppError.notFound('Albaran'));
    }

    if (albaran.signed && albaran.pdfUrl) {
      return res.redirect(albaran.pdfUrl);
    }

    const pdfBuffer = await generateDeliveryNotePDF(albaran);

    res.set({
      'Content-Type':        'application/pdf',
      'Content-Disposition': `attachment; filename="albaran-${albaran._id}.pdf"`,
      'Content-Length':      pdfBuffer.length,
    });

    res.send(pdfBuffer);
  } catch (err) {
    next(err);
  }
};

export const signDeliveryNote = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { company } = req.user;

    if (!req.file) {
      return next(AppError.badRequest('Debes subir una imagen de la firma'));
    }

    const albaran = await DeliveryNote.findOne({
      _id:     id,
      company: company._id,
      deleted: false,
    })
      .populate('user',    'name lastName email')
      .populate('client',  'name cif email phone address')
      .populate('project', 'name projectCode address email notes')
      .populate('company', 'name cif address logo');

    if (!albaran) {
      return next(AppError.notFound('Albaran'));
    }

    if (albaran.signed) {
      return next(AppError.conflict('El albaran ya esta firmado'));
    }

    const signatureUrl = await uploadSignature(req.file.buffer);

    albaran.signed       = true;
    albaran.signedAt     = new Date();
    albaran.signatureUrl = signatureUrl;

    const pdfBuffer = await generateDeliveryNotePDF(albaran);
    const pdfUrl    = await uploadPDF(pdfBuffer, `albaran-${albaran._id}`);
    albaran.pdfUrl  = pdfUrl;

    await albaran.save();

    getIO().to(company._id.toString()).emit('deliverynote:signed', {
      _id:          albaran._id,
      signatureUrl,
      pdfUrl,
    });

    res.json({
      mensaje:      'Albaran firmado correctamente',
      signatureUrl,
      pdfUrl,
    });
  } catch (err) {
    next(err);
  }
};