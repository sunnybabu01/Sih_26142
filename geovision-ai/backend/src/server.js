require('dotenv').config();
const app = require('./app');
const { connectDB } = require('./config/db');

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  // Connect to MongoDB Atlas or local MongoDB
  await connectDB();

  app.listen(PORT, () => {
    console.log(`===========================================================`);
    console.log(`  GeoVision AI Node.js Backend Server`);
    console.log(`  Running on: http://localhost:${PORT}`);
    console.log(`  API Base:   http://localhost:${PORT}/api`);
    console.log(`  Health:     http://localhost:${PORT}/api/health`);
    console.log(`===========================================================`);
  });
};

startServer();
