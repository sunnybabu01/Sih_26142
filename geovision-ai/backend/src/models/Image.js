const mongoose = require('mongoose');

const imageSchema = new mongoose.Schema({
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  originalFilename: {
    type: String,
    required: true,
  },
  storedFilename: {
    type: String,
    required: true,
  },
  filePath: {
    type: String,
    required: true,
  },
  fileFormat: {
    type: String,
    required: true,
  },
  fileSizeBytes: {
    type: Number,
    default: 0,
  },
  width: {
    type: Number,
    default: 0,
  },
  height: {
    type: Number,
    default: 0,
  },
  bands: {
    type: Number,
    default: 3,
  },
  crs: {
    type: String,
    default: 'EPSG:32643',
  },
  geotransform: {
    type: [Number],
    default: null,
  },
  sourceResolution: {
    type: Number,
    default: 10.0,
  },
  bounds: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  isGeoreferenced: {
    type: Boolean,
    default: false,
  },
  previewUrl: {
    type: String,
    default: '',
  },
  uploadedAt: {
    type: Date,
    default: Date.now,
  },
});

imageSchema.index({ ownerId: 1, uploadedAt: -1 });

module.exports = mongoose.model('Image', imageSchema);
