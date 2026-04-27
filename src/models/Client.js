// Modelo de cliente
// Los clientes pertenecen a una compañía y son creados por un usuario
// Todos los usuarios de la misma compañía pueden ver los clientes
// Implementa soft delete con el campo deleted

import mongoose from 'mongoose';

const addressSchema = new mongoose.Schema({
  street:   { type: String, trim: true },
  number:   { type: String, trim: true },
  postal:   { type: String, trim: true },
  city:     { type: String, trim: true },
  province: { type: String, trim: true },
}, { _id: false });

const clientSchema = new mongoose.Schema(
  {
    // Usuario que creó el cliente
    user: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: true,
      index:    true,
    },
    // Compañía a la que pertenece, permite compartir clientes entre usuarios
    company: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'Company',
      required: true,
      index:    true,
    },
    name:    { type: String, required: true, trim: true },
    cif:     { type: String, trim: true },
    email:   { type: String, trim: true, lowercase: true },
    phone:   { type: String, trim: true },
    address: { type: addressSchema },
    deleted: { type: Boolean, default: false, index: true },
  },
  { timestamps: true, versionKey: false }
);

// Indice compuesto: un CIF no puede repetirse dentro de la misma compañía
clientSchema.index({ company: 1, cif: 1 }, { unique: true, sparse: true });

const Client = mongoose.model('Client', clientSchema);
export default Client;