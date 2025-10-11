const express = require('express');
const taskController = require('../controllers/task.controller');
const { protect } = require('../middleware/security');
const authorize = require('../middleware/rbac');
const Task = require('../models/Task');

const router = express.Router();

// All task routes require authentication
router.use(protect);

// Task management routes
router.get('/', taskController.getTasks);
router.get('/stats', taskController.getTaskStats);
router.get('/:taskId', taskController.getTask);
router.post('/:taskId/retry', taskController.retryTask);
router.post('/:taskId/cancel', taskController.cancelTask);

// Clear all tasks/logs (admin only)
router.delete('/', authorize(['admin']), async (req, res) => {
  try {
    const result = await Task.deleteMany({});
    res.json({
      status: 'success',
      message: `Cleared ${result.deletedCount} tasks`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error('Error clearing tasks:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to clear tasks'
    });
  }
});

// Client-specific task history
router.get('/client/:agentUuid/history', taskController.getClientTaskHistory);

module.exports = router;
