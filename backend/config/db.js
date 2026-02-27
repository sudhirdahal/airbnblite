const mongoose = require('mongoose');

/**
 * ============================================================================
 * DATABASE CONFIGURATION (The Persistence Layer)
 * ============================================================================
 * This module manages the connection to MongoDB Atlas (Cloud).
 * It implements 'Event-Driven Monitoring' to ensure the server can 
 * gracefully handle connectivity issues.
 * 
 * Performance: Utilizes Mongoose connection pooling defaults for 
 * efficient high-concurrency handling.
 */
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);

    console.log(`Seed Engine: MongoDB Connected: ${conn.connection.host}`);

    // --- EVENT LISTENERS: RESILIENCE ---
    mongoose.connection.on('error', (err) => {
      console.error('Mongoose Connectivity Error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('Mongoose Disconnected. Attempting reconnection...');
    });

  } catch (err) {
    console.error(`Database Initialization Failure: ${err.message}`);
    // Exit process with failure code if initial handshake fails
    process.exit(1);
  }
};

/* --- HISTORICAL STAGE 1: LOCALHOST CONNECTION ---
 * mongoose.connect('mongodb://localhost:27017/airnb');
 * // Problem: Hardcoded URLs break immediately in production!
 */

module.exports = connectDB;
