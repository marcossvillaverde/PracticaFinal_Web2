
import mongoose from 'mongoose';

const addressSchema = new mongoose.Schema({
  street:   { type: String, trim: true },
  number:   { type: String, trim: true },
  postal:   { type: String, trim: true },
  city:     { type: String, trim: true },
  province: { type: String, trim: true },
}, { _id: false });

const userSchema = new mongoose.Schema(
  {
    email: {
      type:      String,
      required:  true,
      unique:    true,
      lowercase: true,
      trim:      true,
      index:     true,
    },
    password: {
      type:     String,
      required: true,
      select:   false,
    },
    name:     { type: String, trim: true },
    lastName: { type: String, trim: true },
    nif:      { type: String, trim: true },
    role: {
      type:    String,
      enum:    ['admin', 'guest'],
      default: 'admin',
      index:   true,
    },
    status: {
      type:    String,
      enum:    ['pending', 'verified'],
      default: 'pending',
      index:   true,
    },
    verificationCode:     { type: String },
    verificationAttempts: { type: Number, default: 3 },
    company: {
      type:    mongoose.Schema.Types.ObjectId,
      ref:     'Company',
      default: null,
      index:   true,
    },
    address:      { type: addressSchema },
    refreshToken: { type: String, default: null, select: false },
    deleted:      { type: Boolean, default: false, index: true },
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: { virtuals: true },
  }
);

userSchema.virtual('fullName').get(function () {
  if (this.name && this.lastName) return `${this.name} ${this.lastName}`;
  return this.name || '';
});

const User = mongoose.model('User', userSchema);
export default User;