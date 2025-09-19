const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();

// Health check endpoint for Google Cloud
router.get('/health', (req, res) => {
  const healthCheck = {
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: process.env.npm_package_version || '1.0.0'
  };

  // Check database connection
  if (mongoose.connection.readyState === 1) {
    healthCheck.database = 'connected';
  } else {
    healthCheck.database = 'disconnected';
    healthCheck.status = 'ERROR';
  }

  // Check memory usage
  const memUsage = process.memoryUsage();
  healthCheck.memory = {
    rss: Math.round(memUsage.rss / 1024 / 1024) + ' MB',
    heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024) + ' MB',
    heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024) + ' MB'
  };

  const statusCode = healthCheck.status === 'OK' ? 200 : 503;
  res.status(statusCode).json(healthCheck);
});

// Readiness check endpoint
router.get('/ready', (req, res) => {
  if (mongoose.connection.readyState === 1) {
    res.status(200).json({ status: 'ready' });
  } else {
    res.status(503).json({ status: 'not ready', reason: 'database not connected' });
  }
});

module.exports = router;