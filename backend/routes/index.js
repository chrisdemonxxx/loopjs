const { debugLog } = require('../utils/debugLogger');
const express = require('express');

const passport = require('passport');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const User = require('../models/User');
const RefreshToken = require('../models/RefreshToken');
const commandRoute = require('./command.route');
const infoRoute = require('./info.route');
const agentRoute = require('./agent.route');
const taskRoute = require('./task.route');
const metricsRoute = require('./metrics.route');
const telegramRoute = require('./telegram');
const userRoute = require('./user.route');
const authorize = require('../middleware/rbac');
const audit = require('../middleware/audit');
const { authRateLimit } = require('../middleware/security');

const router = express.Router();

// Use our custom JWT authentication middleware
const { protect } = require('../middleware/security');

router.use('/command', protect, commandRoute);
router.use('/agent', agentRoute); // Remove global protection - individual routes will handle auth
router.use('/task', protect, taskRoute); // Task management routes
router.use('/metrics', protect, metricsRoute); // Metrics and monitoring routes
router.use('/telegram', telegramRoute); // Telegram routes with their own auth
router.use('/user', userRoute); // User profile management routes

// Allow specific client endpoints without authentication (must come before general /info route)
router.post('/info/register-client', require('../controllers/info.controller').registerClientAction);
router.post('/info/client-heartbeat', require('../controllers/info.controller').updateClientHeartbeatAction);

// All other info routes require authentication
router.use('/info', protect, infoRoute);

// POST /api/register (for testing)
router.post('/register', async (req, res) => {
  const { username, password, role = 'admin' } = req.body;

  try {
    // Check if user already exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Create new user
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({
      username,
      password: hashedPassword,
      role
    });

    await user.save();
    res.status(201).json({ message: 'User created successfully', username: user.username, role: user.role });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Server error during registration' });
  }
});

// POST /api/login
router.post('/login', authRateLimit, async (req, res) => {
  const { username, password } = req.body;
  
  debugLog.auth('Login attempt', { username, hasPassword: !!password });
  

  try {
    // Check if database is connected
    if (mongoose.connection.readyState !== 1) {
      debugLog.auth('Database not connected - using development mode');
      // Database not connected - use hardcoded admin for development
      if (username === 'admin' && password === 'admin123') {
        const accessToken = jwt.sign({ id: 'admin-dev-id' }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_ACCESS_TOKEN_EXPIRATION });
        return res.json({ 
          message: 'Logged in (development mode)', 
          accessToken, 
          user: { id: 'admin-dev-id', username: 'admin', role: 'admin' } 
        });
      } else {
        return res.status(401).json({ error: 'Invalid username or password' });
      }
    }

    // Database connected - normal login flow
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const accessToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_ACCESS_TOKEN_EXPIRATION });
    const refreshToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_REFRESH_TOKEN_EXPIRATION });

    // Store refresh token in DB
    const newRefreshToken = new RefreshToken({ user: user._id, token: refreshToken });
    await newRefreshToken.save();

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // Use secure in production
      sameSite: 'strict', // CSRF protection
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.json({ message: 'Logged in', accessToken, user: { id: user.id, username: user.username, role: user.role } });

  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/me
router.get('/me', passport.authenticate('jwt', { session: false }), (req, res) => {
  res.json({ user: { id: req.user.id, username: req.user.username, role: req.user.role } });
});

// GET /api/logout
router.get('/logout', audit('LOGOUT'), async (req, res) => {
  const refreshToken = req.cookies.refreshToken;
  if (refreshToken) {
    await RefreshToken.deleteOne({ token: refreshToken });
  }
  res.clearCookie('refreshToken');
  res.json({ message: 'Logged out' });
});

router.post('/refresh-token', async (req, res) => {
  const oldRefreshToken = req.cookies.refreshToken;

  if (!oldRefreshToken) {
    return res.status(401).json({ error: 'No refresh token provided' });
  }

  try {
    const decoded = jwt.verify(oldRefreshToken, process.env.JWT_SECRET);
    const storedToken = await RefreshToken.findOne({ token: oldRefreshToken, user: decoded.id });

    if (!storedToken) {
      return res.status(403).json({ error: 'Invalid refresh token' });
    }

    // Delete the old refresh token from DB
    await RefreshToken.deleteOne({ token: oldRefreshToken });

    const newAccessToken = jwt.sign({ id: decoded.id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_ACCESS_TOKEN_EXPIRATION });
    const newRefreshToken = jwt.sign({ id: decoded.id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_REFRESH_TOKEN_EXPIRATION });

    // Store new refresh token in DB
    const newRefreshTokenDoc = new RefreshToken({ user: decoded.id, token: newRefreshToken });
    await newRefreshTokenDoc.save();

    res.cookie('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.json({ accessToken: newAccessToken });

  } catch (err) {
    console.error("Refresh token error:", err);
    return res.status(403).json({ error: 'Invalid or expired refresh token' });
  }
});

// Base route
router.get('/', (req, res) => {
  res.status(200).json({
    status: "success",
    message: "Windows System Management & Deployment Tool APIs",
  });
});

module.exports = router;
