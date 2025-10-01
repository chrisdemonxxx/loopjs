const express = require('express');
const taskController = require('../controllers/task.controller');
const auth = require('../middleware/auth');

const router = express.Router();

// All task routes require authentication
router.use(auth);

// Task management routes
router.get('/', taskController.getTasks);
router.get('/stats', taskController.getTaskStats);
router.get('/:taskId', taskController.getTask);
router.post('/:taskId/retry', taskController.retryTask);
router.post('/:taskId/cancel', taskController.cancelTask);

// Client-specific task history
router.get('/client/:agentUuid/history', taskController.getClientTaskHistory);

module.exports = router;
