const express = require('express');

console.log('Starting simple server...');

const app = express();

// Basic middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Test route
app.get('/test', (req, res) => {
  res.json({ message: 'Server is working!', timestamp: new Date().toISOString() });
});

// Registration route (simplified)
app.post('/api/auth/register', (req, res) => {
  console.log('Registration request received:', req.body);
  
  const { name, email, password, role, latitude, longitude } = req.body;
  
  // Basic validation
  if (!name || !email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Name, email, and password are required'
    });
  }
  
  if (password.length < 6) {
    return res.status(400).json({
      success: false,
      message: 'Password must be at least 6 characters'
    });
  }
  
  // Simulate successful registration
  res.status(201).json({
    success: true,
    message: 'User registered successfully',
    data: {
      token: 'fake-jwt-token-' + Date.now(),
      user: {
        id: 'user-' + Date.now(),
        name,
        email,
        role: role || 'citizen'
      }
    }
  });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Simple server running on port ${PORT}`);
  console.log(`🌐 Test endpoint: http://localhost:${PORT}/test`);
  console.log(`📝 Registration: http://localhost:${PORT}/api/auth/register`);
  console.log('Press Ctrl+C to stop the server');
});
