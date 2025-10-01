require('dotenv').config();
const jwt = require('jsonwebtoken');

// Generate a test token using the JWT_SECRET from .env
const generateToken = () => {
  if (!process.env.JWT_SECRET) {
    console.error('JWT_SECRET is not defined in .env file');
    process.exit(1);
  }

  // Create a test user payload
  const payload = {
    id: '123456789012345678901234', // Mock MongoDB ObjectId
    username: 'test-user',
    role: 'admin'
  };

  // Sign the token
  const token = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_ACCESS_TOKEN_EXPIRATION || '1h'
  });

  console.log('Generated JWT token:');
  console.log(token);
  console.log('\nUse this token for WebSocket authentication testing.');
};

generateToken();