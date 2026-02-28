import mongoose from 'mongoose';

const ReportSchema = new mongoose.Schema(
  {
    sampleId: { type: String,required: true, trim: true },
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    age: { type: String, required: true, trim: true },
    gender: { type: String, required: true, enum: ['Male', 'Female', 'Other'] },
    mobile: { type: String, required: true, trim: true },
    refBy: { type: String, required: true, trim: true },
    regNo: { type: String, required: true, unique: true, trim: true },
    dt: { type: Date, required: true },
    status: { type: String, default: 'new', enum: ['new', 'inprogress', 'final', 'signed'] },
    collectedBy: { type: String, required: true, trim: true },
    sampleType: { type: String, required: true, trim: true },
    address: { type: String, required: true, trim: true },
    tests: [{
      name: { type: String, required: true },
      shortName: { type: String, default: '' }
    }],
    results: { type: mongoose.Schema.Types.Mixed, default: {} }
  },
  { timestamps: true }
);

export default mongoose.model('Report', ReportSchema);
