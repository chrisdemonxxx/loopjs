const Task = require('../models/Task');
const Client = require('../models/Client');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

/**
 * Get tasks with filtering and pagination
 */
exports.getTasks = catchAsync(async (req, res, next) => {
  const { 
    agentUuid, 
    state, 
    limit = 50, 
    offset = 0,
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = req.query;

  // Build filter object
  const filter = {};
  
  if (agentUuid) {
    filter.agentUuid = agentUuid;
  }
  
  if (state) {
    filter['queue.state'] = state;
  }

  // Build sort object
  const sort = {};
  sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

  // Get tasks with pagination
  const tasks = await Task.find(filter)
    .sort(sort)
    .limit(parseInt(limit))
    .skip(parseInt(offset))
    .populate('agentUuid', 'computerName ipAddress')
    .lean();

  // Get total count for pagination
  const total = await Task.countDocuments(filter);

  res.status(200).json({
    status: 'success',
    data: {
      tasks,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: (parseInt(offset) + parseInt(limit)) < total
      }
    }
  });
});

/**
 * Get task by ID
 */
exports.getTask = catchAsync(async (req, res, next) => {
  const { taskId } = req.params;

  const task = await Task.findOne({ taskId })
    .populate('agentUuid', 'computerName ipAddress')
    .lean();

  if (!task) {
    return next(new AppError('Task not found', 404));
  }

  res.status(200).json({
    status: 'success',
    data: { task }
  });
});

/**
 * Get task statistics
 */
exports.getTaskStats = catchAsync(async (req, res, next) => {
  const { agentUuid } = req.query;

  // Build filter object
  const filter = {};
  if (agentUuid) {
    filter.agentUuid = agentUuid;
  }

  // Get counts by state
  const stats = await Task.aggregate([
    { $match: filter },
    {
      $group: {
        _id: '$queue.state',
        count: { $sum: 1 },
        avgExecutionTime: { $avg: '$executionTimeMs' }
      }
    }
  ]);

  // Get total counts
  const totalTasks = await Task.countDocuments(filter);
  const completedTasks = await Task.countDocuments({ ...filter, 'queue.state': 'completed' });
  const failedTasks = await Task.countDocuments({ ...filter, 'queue.state': 'failed' });
  const pendingTasks = await Task.countDocuments({ ...filter, 'queue.state': 'pending' });
  const sentTasks = await Task.countDocuments({ ...filter, 'queue.state': 'sent' });

  // Calculate success rate
  const successRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  // Get average execution time for completed tasks
  const avgExecutionTime = await Task.aggregate([
    { $match: { ...filter, 'queue.state': 'completed', executionTimeMs: { $gt: 0 } } },
    { $group: { _id: null, avgTime: { $avg: '$executionTimeMs' } } }
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      total: totalTasks,
      pending: pendingTasks,
      sent: sentTasks,
      completed: completedTasks,
      failed: failedTasks,
      successRate: Math.round(successRate * 100) / 100,
      avgExecutionTimeMs: avgExecutionTime.length > 0 ? Math.round(avgExecutionTime[0].avgTime) : 0,
      stats: stats
    }
  });
});

/**
 * Retry a failed task
 */
exports.retryTask = catchAsync(async (req, res, next) => {
  const { taskId } = req.params;

  const task = await Task.findOne({ taskId });

  if (!task) {
    return next(new AppError('Task not found', 404));
  }

  if (task.queue.state !== 'failed') {
    return next(new AppError('Only failed tasks can be retried', 400));
  }

  // Get client connection
  const wsHandler = require('../configs/ws.handler');
  const clientConnection = wsHandler.getClientConnection(task.agentUuid);

  if (!clientConnection) {
    return next(new AppError('Client is offline, task will be queued', 400));
  }

  // Reset task state
  await Task.findOneAndUpdate(
    { taskId },
    {
      $set: {
        'queue.state': 'pending',
        'queue.reason': null,
        errorMessage: '',
        output: ''
      }
    }
  );

  // Send command to client
  const commandPayload = {
    cmd: 'execute',
    taskId: task.taskId,
    command: task.command,
    params: task.params || {},
    timestamp: new Date().toISOString()
  };

  try {
    clientConnection.send(JSON.stringify(commandPayload));
    
    // Update task as sent
    await Task.findOneAndUpdate(
      { taskId },
      {
        $set: {
          'queue.state': 'sent',
          sentAt: new Date(),
          'queue.attempts': (task.queue.attempts || 0) + 1,
          'queue.lastAttemptAt': new Date()
        }
      }
    );

    res.status(200).json({
      status: 'success',
      message: 'Task retried successfully',
      data: { taskId }
    });
  } catch (error) {
    // Revert to pending state
    await Task.findOneAndUpdate(
      { taskId },
      {
        $set: {
          'queue.state': 'pending',
          'queue.reason': 'WebSocket send failed'
        }
      }
    );
    
    return next(new AppError('Failed to send retry command', 500));
  }
});

/**
 * Cancel a pending task
 */
exports.cancelTask = catchAsync(async (req, res, next) => {
  const { taskId } = req.params;

  const task = await Task.findOne({ taskId });

  if (!task) {
    return next(new AppError('Task not found', 404));
  }

  if (!['pending', 'sent'].includes(task.queue.state)) {
    return next(new AppError('Only pending or sent tasks can be cancelled', 400));
  }

  // Update task state
  await Task.findOneAndUpdate(
    { taskId },
    {
      $set: {
        'queue.state': 'cancelled',
        'queue.reason': 'Cancelled by admin',
        completedAt: new Date()
      }
    }
  );

  res.status(200).json({
    status: 'success',
    message: 'Task cancelled successfully',
    data: { taskId }
  });
});

/**
 * Get task history for a specific client
 */
exports.getClientTaskHistory = catchAsync(async (req, res, next) => {
  const { agentUuid } = req.params;
  const { limit = 20, offset = 0 } = req.query;

  // Verify client exists
  const client = await Client.findOne({ uuid: agentUuid });
  if (!client) {
    return next(new AppError('Client not found', 404));
  }

  // Get tasks for this client
  const tasks = await Task.find({ agentUuid })
    .sort({ createdAt: -1 })
    .limit(parseInt(limit))
    .skip(parseInt(offset))
    .lean();

  const total = await Task.countDocuments({ agentUuid });

  res.status(200).json({
    status: 'success',
    data: {
      client: {
        uuid: client.uuid,
        computerName: client.computerName,
        ipAddress: client.ipAddress
      },
      tasks,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: (parseInt(offset) + parseInt(limit)) < total
      }
    }
  });
});
