const mongoose = require('mongoose');

const processingJobSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  imageId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Image',
    required: true,
  },
  modelName: {
    type: String,
    default: 'SRM-Net (Residual Dense Attention)',
  },
  modelVersion: {
    type: String,
    default: '1.4.0',
  },
  scaleFactor: {
    type: Number,
    required: true,
    enum: [2, 4],
    default: 4,
  },
  targetPixelSpacingEstimate: {
    type: Number,
    default: 2.5,
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed', 'cancelled'],
    default: 'pending',
  },
  progress: {
    type: Number,
    default: 0,
    min: 0,
    max: 100,
  },
  outputPath: {
    type: String,
    default: null,
  },
  previewPath: {
    type: String,
    default: null,
  },
  outputWidth: {
    type: Number,
    default: 0,
  },
  outputHeight: {
    type: Number,
    default: 0,
  },
  durationSeconds: {
    type: Number,
    default: 0,
  },
  startedAt: {
    type: Date,
    default: null,
  },
  completedAt: {
    type: Date,
    default: null,
  },
  errorMessage: {
    type: String,
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

processingJobSchema.index({ userId: 1, createdAt: -1 });
processingJobSchema.index({ status: 1 });

module.exports = mongoose.model('ProcessingJob', processingJobSchema);
