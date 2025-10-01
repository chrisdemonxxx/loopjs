const express = require('express');
const metricsController = require('../controllers/metrics.controller');
const auth = require('../middleware/auth');

const router = express.Router();

// All metrics routes require authentication
router.use(auth);

// Metrics endpoints
router.get('/system', metricsController.getSystemMetrics);
router.get('/client/:agentUuid', metricsController.getClientMetrics);
router.get('/health', metricsController.getHealthStatus);
router.get('/prometheus', metricsController.getPrometheusMetrics);

module.exports = router;
