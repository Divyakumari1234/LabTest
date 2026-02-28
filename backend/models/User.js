import mongoose from 'mongoose';
const UserSchema = new mongoose.Schema(
  {
    order: { type: Number, index: true },
    name: { type: String, required: true, trim: true, unique: true },
    shortName: { type: String, default: '' },
    category: { type: String, required: true, trim: true },
    price: { type: Number, default: 0 },
    serialNo: { type: Number, index: true },
    testName: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model('User', UserSchema);