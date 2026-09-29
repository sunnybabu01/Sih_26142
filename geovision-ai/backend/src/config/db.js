const mongoose = require('mongoose');

let isConnected = false;

const connectDB = async () => {
  const mongoURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/geovision_ai';
  
  try {
    const conn = await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 3000,
    });
    isConnected = true;
    console.log(`[MongoDB Connected] Host: ${conn.connection.host}`);
  } catch (err) {
    console.warn(`[MongoDB Warning] Could not connect to MongoDB at ${mongoURI} (${err.message}).`);
    console.warn(`[Resilience Mode] Using memory-backed resilient store for active session.`);
    isConnected = false;
  }
};

const getIsConnected = () => isConnected;

module.exports = { connectDB, getIsConnected };
