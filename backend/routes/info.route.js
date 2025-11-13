const express = require('express');
const infoController = require('../controllers/info.controller');
const authorize = require('../middleware/rbac');
const audit = require('../middleware/audit');
const { protect } = require('../middleware/security');
const Client = require('../models/Client');
const Task = require('../models/Task');
const router = express.Router();

// Admin-only route for getting user list
router.get('/get-user-list', 
  authorize(['admin']), 
  audit('USER_LIST_ACCESS'),
  infoController.getUserListAction
);

// Client registration endpoint (no auth required for clients to register)
router.post('/register-client', 
  audit('CLIENT_REGISTRATION'),
  infoController.registerClientAction
);

// Client heartbeat endpoint (no auth required for clients to send heartbeat)
router.post('/client-heartbeat', 
  infoController.updateClientHeartbeatAction
);

// Clear all clients except admin connections
router.delete('/clients', protect, authorize(['admin']), async (req, res) => {
  try {
    const result = await Client.deleteMany({});
    res.json({
      status: 'success',
      message: `Cleared ${result.deletedCount} clients`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error('Error clearing clients:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to clear clients'
    });
  }
});

// Clear everything (clients and tasks)
router.delete('/clients/all', protect, authorize(['admin']), async (req, res) => {
  try {
    const clientResult = await Client.deleteMany({});
    const taskResult = await Task.deleteMany({});
    
    res.json({
      status: 'success',
      message: `Cleared ${clientResult.deletedCount} clients and ${taskResult.deletedCount} tasks`,
      clientsDeleted: clientResult.deletedCount,
      tasksDeleted: taskResult.deletedCount
    });
  } catch (error) {
    console.error('Error clearing database:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to clear database'
    });
  }
});

router.get('/', (req, res) => {
  res.status(200).json({
    status: "success",
    message: "Info APIs",
  });
});

module.exports = router;
