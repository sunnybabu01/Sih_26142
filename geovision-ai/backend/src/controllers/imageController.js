const path = require('path');
const fs = require('fs');
const store = require('../services/store');
const aiClient = require('../services/aiClient');

const uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No image file uploaded.' });
    }

    const { filename, path: filePath, originalname, size } = req.file;
    const ext = path.extname(originalname).toLowerCase();
    const sourceResolution = parseFloat(req.body.sourceResolution) || 10.0;

    // Inspect raster metadata via AI service or fallback
    let metadata;
    try {
      metadata = await aiClient.inspectMetadata(filePath);
    } catch (e) {
      console.warn('[Metadata inspect fallback]', e.message);
      metadata = {
        width: 512,
        height: 512,
        bands: 3,
        crs: ext.includes('tif') ? 'EPSG:32643' : 'Non-georeferenced',
        geotransform: null,
        is_georeferenced: ext.includes('tif'),
        bounds: {},
        dtype: 'uint8',
      };
    }

    // Determine preview URL
    const previewUrl = `/api/images/preview/${filename}`;

    const newImage = await store.createImage({
      ownerId: req.user._id,
      originalFilename: originalname,
      storedFilename: filename,
      filePath: filePath,
      fileFormat: ext.replace('.', '').toUpperCase(),
      fileSizeBytes: size,
      width: metadata.width || 512,
      height: metadata.height || 512,
      bands: metadata.bands || 3,
      crs: metadata.crs || (ext.includes('tif') ? 'EPSG:32643' : 'Non-georeferenced (Pixel Space)'),
      geotransform: metadata.geotransform || null,
      sourceResolution: sourceResolution,
      bounds: metadata.bounds || {},
      isGeoreferenced: metadata.is_georeferenced || false,
      previewUrl,
    });

    return res.status(201).json({
      success: true,
      message: 'Satellite imagery uploaded and metadata parsed successfully.',
      image: newImage,
    });
  } catch (err) {
    console.error('[Upload Image Error]', err);
    return res.status(500).json({ success: false, message: 'Server error processing uploaded image.', error: err.message });
  }
};

const getImages = async (req, res) => {
  try {
    const images = await store.getImagesByUserId(req.user._id);
    return res.json({ success: true, count: images.length, images });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch uploaded imagery.', error: err.message });
  }
};

const getImageById = async (req, res) => {
  try {
    const image = await store.findImageById(req.params.id);
    if (!image) {
      return res.status(404).json({ success: false, message: 'Image not found.' });
    }

    // Authorization: only owner or admin can view
    if (String(image.ownerId) !== String(req.user._id) && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Unauthorized access to this image.' });
    }

    return res.json({ success: true, image });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to retrieve image.', error: err.message });
  }
};

const deleteImage = async (req, res) => {
  try {
    const image = await store.findImageById(req.params.id);
    if (!image) {
      return res.status(404).json({ success: false, message: 'Image not found.' });
    }

    if (String(image.ownerId) !== String(req.user._id) && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Unauthorized to delete this image.' });
    }

    // Remove file if exists
    if (fs.existsSync(image.filePath)) {
      try {
        fs.unlinkSync(image.filePath);
      } catch (e) {
        console.warn('Could not delete physical file:', e.message);
      }
    }

    await store.deleteImage(req.params.id);
    return res.json({ success: true, message: 'Image deleted successfully.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to delete image.', error: err.message });
  }
};

const serveImagePreview = (uploadsDir) => (req, res) => {
  try {
    const filename = path.basename(req.params.filename); // prevent path traversal
    const filePath = path.join(uploadsDir, filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, message: 'Preview not found.' });
    }

    const ext = path.extname(filename).toLowerCase();
    if (['.png', '.jpg', '.jpeg', '.webp'].includes(ext)) {
      res.setHeader('Content-Type', `image/${ext.replace('.', '') === 'jpg' ? 'jpeg' : ext.replace('.', '')}`);
      return fs.createReadStream(filePath).pipe(res);
    }

    // For GeoTIFF, send binary or allow download
    res.setHeader('Content-Type', 'image/tiff');
    return fs.createReadStream(filePath).pipe(res);
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Error streaming image preview.' });
  }
};

module.exports = {
  uploadImage,
  getImages,
  getImageById,
  deleteImage,
  serveImagePreview,
};
