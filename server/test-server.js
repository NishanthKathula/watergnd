const express = require('express');
const mongoose = require('mongoose');
require('dotenv').config();

console.log('Starting test server...');

const app = express();

// Basic middleware
app.use(express.json());

// Test route
app.get('/test', (req, res) => {
  res.json({ message: 'Server is working!' });
});

// MongoDB connection
const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/groundwater';
console.log('Connecting to MongoDB...');

mongoose.connect(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('MongoDB connected successfully');
  
  // Start server
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Test endpoint: http://localhost:${PORT}/test`);
  });
})
.catch(err => {
  console.error('MongoDB connection error:', err);
  console.log('Please make sure MongoDB is running or set MONGODB_URI in .env file');
  process.exit(1);
});
