const express = require('express');
const analyticsController = require('../controllers/analytics.controller');
const { protect } = require('../middleware/security');

const router = express.Router();

// All routes require authentication
router.use(protect);

// Analytics routes
router.get('/builds', analyticsController.getBuildAnalytics);
router.get('/templates', analyticsController.getTemplateAnalytics);

module.exports = router;

