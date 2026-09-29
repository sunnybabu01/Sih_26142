const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const {
  getResult,
  downloadResult,
  getValidationReport,
  serveOutputPreview,
} = require('../controllers/resultsController');
const { authenticate } = require('../middleware/auth');

const outputsDir = path.resolve(__dirname, '../../../outputs');
if (!fs.existsSync(outputsDir)) {
  fs.mkdirSync(outputsDir, { recursive: true });
}

router.get('/:jobId', authenticate, getResult);
router.get('/:jobId/download', authenticate, downloadResult);
router.get('/:jobId/validation', authenticate, getValidationReport);
router.get('/preview/:filename', serveOutputPreview(outputsDir));

module.exports = router;
