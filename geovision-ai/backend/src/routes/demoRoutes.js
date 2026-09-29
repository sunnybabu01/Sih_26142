const express = require('express');
const router = express.Router();
const { seedDemoScene } = require('../controllers/demoController');
const { authenticate } = require('../middleware/auth');

router.post('/seed', authenticate, seedDemoScene);

module.exports = router;
