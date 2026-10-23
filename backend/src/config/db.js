const mongoose = require('mongoose');

const connectDB = async () => {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    console.error('[MongoDB] FATAL: MONGODB_URI is not set in environment variables.');
    throw new Error('MONGODB_URI is not set in environment variables.');
  }

  try {
    const conn = await mongoose.connect(uri);
    console.log(`[MongoDB] Connected to Database: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`[MongoDB] Connection Error: ${error.message}`);
    throw error;
  }
};

module.exports = connectDB;
