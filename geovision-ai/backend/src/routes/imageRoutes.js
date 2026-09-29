const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const fs = require('fs');

const {
  uploadImage,
  getImages,
  getImageById,
  deleteImage,
  serveImagePreview,
} = require('../controllers/imageController');
const { authenticate } = require('../middleware/auth');

const uploadsDir = path.resolve(__dirname, '../../../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const safeExt = ['.tif', '.tiff', '.png', '.jpg', '.jpeg'].includes(ext) ? ext : '.tif';
    const randomHex = crypto.randomBytes(8).toString('hex');
    cb(null, `s2_${Date.now()}_${randomHex}${safeExt}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowed = ['.tif', '.tiff', '.png', '.jpg', '.jpeg'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowed.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only GeoTIFF (.tif, .tiff), PNG, and JPEG formats are supported.'), false);
  }
};

const upload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB limit
  fileFilter,
});

router.post('/upload', authenticate, upload.single('image'), uploadImage);
router.get('/', authenticate, getImages);
router.get('/:id', authenticate, getImageById);
router.delete('/:id', authenticate, deleteImage);
router.get('/preview/:filename', serveImagePreview(uploadsDir));

module.exports = router;
