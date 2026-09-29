const express = require('express');
const router = express.Router();
const {
  startProcessing,
  getJobs,
  getJobById,
  getJobStatus,
  cancelJob,
} = require('../controllers/processingController');
const { authenticate } = require('../middleware/auth');

router.post('/start', authenticate, startProcessing);
router.get('/jobs', authenticate, getJobs);
router.get('/jobs/:id', authenticate, getJobById);
router.get('/jobs/:id/status', authenticate, getJobStatus);
router.post('/jobs/:id/cancel', authenticate, cancelJob);

module.exports = router;
