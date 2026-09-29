const mongoose = require('mongoose');

const validationReportSchema = new mongoose.Schema({
  jobId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ProcessingJob',
    required: true,
    unique: true,
  },
  referenceAvailable: {
    type: Boolean,
    required: true,
    default: false,
  },
  statusMessage: {
    type: String,
    default: '',
  },
  psnr: {
    type: Number,
    default: null,
  },
  ssim: {
    type: Number,
    default: null,
  },
  mae: {
    type: Number,
    default: null,
  },
  rmse: {
    type: Number,
    default: null,
  },
  bandMetrics: {
    type: [mongoose.Schema.Types.Mixed],
    default: [],
  },
  geospatialIntegrity: {
    type: String,
    default: 'Passed coordinate verification',
  },
  uncertaintyNotes: {
    type: String,
    default: 'Super-resolved details are inferred by the deep learning model and do not represent direct sensor ground observations.',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('ValidationReport', validationReportSchema);
