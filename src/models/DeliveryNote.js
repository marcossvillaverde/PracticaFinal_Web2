// Modelo de albarán
// Puede ser de tipo 'material' (materiales entregados) o 'hours' (horas trabajadas)
// Una vez firmado no puede modificarse ni borrarse
// La firma y el PDF se almacenan en Cloudinary

import mongoose from 'mongoose';

// Subschema para trabajadores en albaranes de horas
const workerSchema = new mongoose.Schema({
  name:  { type: String, required: true, trim: true },
  hours: { type: Number, required: true, min: 0 },
}, { _id: false });

const deliveryNoteSchema = new mongoose.Schema(
  {
    // Usuario que crea el albarán
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
    // Cliente asociado
    client: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'Client',
      required: true,
      index:    true,
    },
    // Proyecto asociado
    project: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'Project',
      required: true,
      index:    true,
    },
    // Tipo de albarán
    format: {
      type:     String,
      enum:     ['material', 'hours'],
      required: true,
    },
    description: { type: String, trim: true },
    workDate:    { type: Date, required: true, index: true },

    // Campos para albaranes de tipo 'material'
    material: { type: String, trim: true },
    quantity: { type: Number, min: 0 },
    unit:     { type: String, trim: true },

    // Campos para albaranes de tipo 'hours'
    hours:   { type: Number, min: 0 },
    workers: { type: [workerSchema], default: [] },

    // Firma digital
    signed:       { type: Boolean, default: false, index: true },
    signedAt:     { type: Date, default: null },
    signatureUrl: { type: String, default: null }, // URL en Cloudinary
    pdfUrl:       { type: String, default: null }, // URL del PDF en Cloudinary

    deleted: { type: Boolean, default: false, index: true },
  },
  { timestamps: true, versionKey: false }
);

const DeliveryNote = mongoose.model('DeliveryNote', deliveryNoteSchema);
export default DeliveryNote;