const mongoose = require('mongoose');

const connectDB = async () => {
  const { MONGODB_URI } = process.env;

  if (!MONGODB_URI) {
    throw new Error('MONGODB_URI is not configured in your backend/.env file.');
  }

  try {
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
    });

    console.log(`✓ MongoDB connected successfully: ${mongoose.connection.host}`);
  } catch (error) {
    if (error.message.includes('ECONNREFUSED')) {
      console.error('\n❌ [MongoDB Connection Error]');
      console.error(`Unable to connect to local MongoDB at "${MONGODB_URI}".`);
      console.error('\nHow to fix this:');
      console.error('1. If using MongoDB Atlas (Cloud - Recommended):');
      console.error('   Update MONGODB_URI in backend/.env with your Atlas connection string:');
      console.error('   MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/hackbuddy?retryWrites=true&w=majority\n');
      console.error('2. If using Local MongoDB:');
      console.error('   Start your local MongoDB service (e.g. net start MongoDB) or launch MongoDB Compass.\n');
    }
    throw error;
  }
};

module.exports = connectDB;
