const mongoose = require('mongoose');

// Connects to MongoDB. Called once from server.js (tests connect on their own).
async function connectDB(uri = process.env.MONGO_URI) {
  if (!uri) throw new Error('MONGO_URI is not set');
  mongoose.set('strictQuery', true);
  await mongoose.connect(uri);
  console.log('MongoDB connected');
  return mongoose.connection;
}

module.exports = connectDB;
