// Modelo de proyecto
// Los proyectos pertenecen a una compañía y están asociados a un cliente
// Implementa soft delete y campo active para proyectos en curso

import mongoose from 'mongoose';

const addressSchema = new mongoose.Schema({
  street:   { type: String, trim: true },
  number:   { type: String, trim: true },
  postal:   { type: String, trim: true },
  city:     { type: String, trim: true },
  province: { type: String, trim: true },
}, { _id: false });

const projectSchema = new mongoose.Schema(
  {
    // Usuario que creó el proyecto
    user: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: true,
      index:    true,
    },
    // Compañía a la que pertenece
    company: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'Company',
      required: true,
      index:    true,
    },
    // Cliente asociado al proyecto
    client: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'Client',
      required: true,
      index:    true,
    },
    name:        { type: String, required: true, trim: true },
    projectCode: { type: String, required: true, trim: true },
    address:     { type: addressSchema },
    email:       { type: String, trim: true, lowercase: true },
    notes:       { type: String, trim: true },
    active:      { type: Boolean, default: true, index: true },
    deleted:     { type: Boolean, default: false, index: true },
  },
  { timestamps: true, versionKey: false }
);

// Indice compuesto: el codigo de proyecto debe ser unico dentro de la compañía
projectSchema.index({ company: 1, projectCode: 1 }, { unique: true });

const Project = mongoose.model('Project', projectSchema);
export default Project;