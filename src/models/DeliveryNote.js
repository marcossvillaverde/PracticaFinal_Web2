

import mongoose from 'mongoose';

const workerSchema = new mongoose.Schema({
  name:  { type: String, required: true, trim: true },
  hours: { type: Number, required: true, min: 0 },
}, { _id: false });

const deliveryNoteSchema = new mongoose.Schema(
  {
    user: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: true,
      index:    true,
    },
    company: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'Company',
      required: true,
      index:    true,
    },
    client: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'Client',
      required: true,
      index:    true,
    },
    project: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'Project',
      required: true,
      index:    true,
    },
    format: {
      type:     String,
      enum:     ['material', 'hours'],
      required: true,
    },
    description: { type: String, trim: true },
    workDate:    { type: Date, required: true, index: true },

    material: { type: String, trim: true },
    quantity: { type: Number, min: 0 },
    unit:     { type: String, trim: true },

    hours:   { type: Number, min: 0 },
    workers: { type: [workerSchema], default: [] },

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