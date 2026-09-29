const express = require('express');
const router = express.Router();
const {
  getDashboardStats,
  getUsers,
  getJobs,
  getModels,
} = require('../controllers/adminController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);
router.use(authorize('admin'));

router.get('/dashboard', getDashboardStats);
router.get('/users', getUsers);
router.get('/jobs', getJobs);
router.get('/models', getModels);

module.exports = router;
