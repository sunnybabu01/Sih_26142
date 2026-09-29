const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');

const authRoutes = require('./routes/authRoutes');
const imageRoutes = require('./routes/imageRoutes');
const processingRoutes = require('./routes/processingRoutes');
const resultsRoutes = require('./routes/resultsRoutes');
const adminRoutes = require('./routes/adminRoutes');
const demoRoutes = require('./routes/demoRoutes');

const app = express();

// Security and middleware
app.use(helmet({
  crossOriginResourcePolicy: false, // Allow cross-origin image loads for preview and tiles
}));
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(morgan('dev'));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Static uploads and outputs serving
const uploadsDir = path.resolve(__dirname, '../../uploads');
const outputsDir = path.resolve(__dirname, '../../outputs');
app.use('/static/uploads', express.static(uploadsDir));
app.use('/static/outputs', express.static(outputsDir));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/images', imageRoutes);
app.use('/api/processing', processingRoutes);
app.use('/api/results', resultsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/demo', demoRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    platform: 'GeoVision AI Backend API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// Central Error Handler
app.use((err, req, res, next) => {
  console.error('[Global Error]', err);
  const status = err.status || 500;
  res.status(status).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

module.exports = app;
