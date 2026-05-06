
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

projectSchema.index({ company: 1, projectCode: 1 }, { unique: true });

const Project = mongoose.model('Project', projectSchema);
export default Project;