const express = require('express');
const metricsController = require('../controllers/metrics.controller');
const { protect } = require('../middleware/security');

const router = express.Router();

// All metrics routes require authentication
router.use(protect);

// Metrics endpoints
router.get('/system', metricsController.getSystemMetrics);
router.get('/client/:agentUuid', metricsController.getClientMetrics);
router.get('/health', metricsController.getHealthStatus);
router.get('/prometheus', metricsController.getPrometheusMetrics);

module.exports = router;
