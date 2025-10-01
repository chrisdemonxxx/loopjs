const mongoose = require('mongoose');
const Client = require('../models/Client');
const Task = require('../models/Task');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

/**
 * Get system metrics
 */
exports.getSystemMetrics = catchAsync(async (req, res, next) => {
  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  // Client metrics
  const totalClients = await Client.countDocuments();
  const onlineClients = await Client.countDocuments({ 
    status: 'online',
    lastHeartbeat: { $gte: new Date(now.getTime() - 2 * 60 * 1000) }
  });
  const offlineClients = totalClients - onlineClients;

  // Task metrics
  const totalTasks = await Task.countDocuments();
  const pendingTasks = await Task.countDocuments({ 'queue.state': 'pending' });
  const sentTasks = await Task.countDocuments({ 'queue.state': 'sent' });
  const completedTasks = await Task.countDocuments({ 'queue.state': 'completed' });
  const failedTasks = await Task.countDocuments({ 'queue.state': 'failed' });

  // Performance metrics
  const avgExecutionTime = await Task.aggregate([
    { $match: { 'queue.state': 'completed', executionTimeMs: { $gt: 0 } } },
    { $group: { _id: null, avgTime: { $avg: '$executionTimeMs' } } }
  ]);

  const successRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  // Recent activity
  const recentTasks = await Task.countDocuments({ createdAt: { $gte: oneHourAgo } });
  const recentClients = await Client.countDocuments({ 
    $or: [
      { createdAt: { $gte: oneHourAgo } },
      { lastHeartbeat: { $gte: oneHourAgo } }
    ]
  });

  // Platform distribution
  const platformStats = await Client.aggregate([
    { $group: { _id: '$operatingSystem', count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ]);

  // Task trends (last 7 days)
  const taskTrends = await Task.aggregate([
    { $match: { createdAt: { $gte: oneWeekAgo } } },
    {
      $group: {
        _id: {
          date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          state: '$queue.state'
        },
        count: { $sum: 1 }
      }
    },
    { $sort: { '_id.date': 1 } }
  ]);

  // Client connection trends
  const clientTrends = await Client.aggregate([
    { $match: { createdAt: { $gte: oneWeekAgo } } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        count: { $sum: 1 }
      }
    },
    { $sort: { '_id': 1 } }
  ]);

  // Top commands
  const topCommands = await Task.aggregate([
    { $match: { 'queue.state': 'completed' } },
    { $group: { _id: '$command', count: { $sum: 1 }, avgTime: { $avg: '$executionTimeMs' } } },
    { $sort: { count: -1 } },
    { $limit: 10 }
  ]);

  // Error analysis
  const errorAnalysis = await Task.aggregate([
    { $match: { 'queue.state': 'failed' } },
    { $group: { _id: '$errorMessage', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 10 }
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      overview: {
        totalClients,
        onlineClients,
        offlineClients,
        totalTasks,
        pendingTasks,
        sentTasks,
        completedTasks,
        failedTasks,
        successRate: Math.round(successRate * 100) / 100,
        avgExecutionTimeMs: avgExecutionTime.length > 0 ? Math.round(avgExecutionTime[0].avgTime) : 0
      },
      recentActivity: {
        tasksLastHour: recentTasks,
        clientsLastHour: recentClients
      },
      platformDistribution: platformStats,
      taskTrends,
      clientTrends,
      topCommands,
      errorAnalysis,
      timestamp: now.toISOString()
    }
  });
});

/**
 * Get client metrics
 */
exports.getClientMetrics = catchAsync(async (req, res, next) => {
  const { agentUuid } = req.params;

  // Verify client exists
  const client = await Client.findOne({ uuid: agentUuid });
  if (!client) {
    return next(new AppError('Client not found', 404));
  }

  // Client-specific metrics
  const totalTasks = await Task.countDocuments({ agentUuid });
  const completedTasks = await Task.countDocuments({ agentUuid, 'queue.state': 'completed' });
  const failedTasks = await Task.countDocuments({ agentUuid, 'queue.state': 'failed' });
  const pendingTasks = await Task.countDocuments({ agentUuid, 'queue.state': 'pending' });

  // Performance metrics
  const avgExecutionTime = await Task.aggregate([
    { $match: { agentUuid, 'queue.state': 'completed', executionTimeMs: { $gt: 0 } } },
    { $group: { _id: null, avgTime: { $avg: '$executionTimeMs' } } }
  ]);

  const successRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  // Recent activity
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const recentTasks = await Task.countDocuments({ 
    agentUuid, 
    createdAt: { $gte: oneDayAgo } 
  });

  // Command history
  const commandHistory = await Task.find({ agentUuid })
    .sort({ createdAt: -1 })
    .limit(20)
    .select('command queue.state executionTimeMs createdAt output')
    .lean();

  // Uptime calculation
  let uptimeDisplay = '';
  if (client.status === 'online' && client.uptimeSeconds) {
    const days = Math.floor(client.uptimeSeconds / 86400);
    const hours = Math.floor((client.uptimeSeconds % 86400) / 3600);
    const minutes = Math.floor((client.uptimeSeconds % 3600) / 60);
    
    if (days > 0) {
      uptimeDisplay = `${days}d ${hours}h ${minutes}m`;
    } else if (hours > 0) {
      uptimeDisplay = `${hours}h ${minutes}m`;
    } else {
      uptimeDisplay = `${minutes}m`;
    }
  }

  res.status(200).json({
    status: 'success',
    data: {
      client: {
        uuid: client.uuid,
        computerName: client.computerName,
        ipAddress: client.ipAddress,
        status: client.status,
        uptime: uptimeDisplay,
        lastHeartbeat: client.lastHeartbeat,
        connectedAt: client.connectedAt,
        firstSeen: client.firstSeen
      },
      metrics: {
        totalTasks,
        completedTasks,
        failedTasks,
        pendingTasks,
        successRate: Math.round(successRate * 100) / 100,
        avgExecutionTimeMs: avgExecutionTime.length > 0 ? Math.round(avgExecutionTime[0].avgTime) : 0,
        recentTasks
      },
      commandHistory,
      timestamp: new Date().toISOString()
    }
  });
});

/**
 * Get health status
 */
exports.getHealthStatus = catchAsync(async (req, res, next) => {
  const now = new Date();
  const twoMinutesAgo = new Date(now.getTime() - 2 * 60 * 1000);

  // Database health
  const dbStatus = mongoose.connection.readyState === 1 ? 'healthy' : 'unhealthy';

  // Client health
  const totalClients = await Client.countDocuments();
  const onlineClients = await Client.countDocuments({ 
    status: 'online',
    lastHeartbeat: { $gte: twoMinutesAgo }
  });

  // Task queue health
  const pendingTasks = await Task.countDocuments({ 'queue.state': 'pending' });
  const failedTasks = await Task.countDocuments({ 
    'queue.state': 'failed',
    createdAt: { $gte: new Date(now.getTime() - 60 * 60 * 1000) } // Last hour
  });

  // System health score
  let healthScore = 100;
  if (dbStatus !== 'healthy') healthScore -= 50;
  if (totalClients > 0 && onlineClients / totalClients < 0.5) healthScore -= 20;
  if (failedTasks > 10) healthScore -= 15;
  if (pendingTasks > 100) healthScore -= 10;

  const healthStatus = healthScore >= 80 ? 'healthy' : 
                      healthScore >= 60 ? 'warning' : 'critical';

  res.status(200).json({
    status: 'success',
    data: {
      health: {
        status: healthStatus,
        score: healthScore,
        timestamp: now.toISOString()
      },
      database: {
        status: dbStatus,
        connectionState: mongoose.connection.readyState
      },
      clients: {
        total: totalClients,
        online: onlineClients,
        offline: totalClients - onlineClients
      },
      tasks: {
        pending: pendingTasks,
        failed: failedTasks
      }
    }
  });
});

/**
 * Export metrics in Prometheus format
 */
exports.getPrometheusMetrics = catchAsync(async (req, res, next) => {
  const now = new Date();
  const twoMinutesAgo = new Date(now.getTime() - 2 * 60 * 1000);

  // Get basic metrics
  const totalClients = await Client.countDocuments();
  const onlineClients = await Client.countDocuments({ 
    status: 'online',
    lastHeartbeat: { $gte: twoMinutesAgo }
  });
  const totalTasks = await Task.countDocuments();
  const pendingTasks = await Task.countDocuments({ 'queue.state': 'pending' });
  const completedTasks = await Task.countDocuments({ 'queue.state': 'completed' });
  const failedTasks = await Task.countDocuments({ 'queue.state': 'failed' });

  // Prometheus format
  const metrics = [
    `# HELP loopjs_clients_total Total number of clients`,
    `# TYPE loopjs_clients_total counter`,
    `loopjs_clients_total ${totalClients}`,
    ``,
    `# HELP loopjs_clients_online Number of online clients`,
    `# TYPE loopjs_clients_online gauge`,
    `loopjs_clients_online ${onlineClients}`,
    ``,
    `# HELP loopjs_tasks_total Total number of tasks`,
    `# TYPE loopjs_tasks_total counter`,
    `loopjs_tasks_total ${totalTasks}`,
    ``,
    `# HELP loopjs_tasks_pending Number of pending tasks`,
    `# TYPE loopjs_tasks_pending gauge`,
    `loopjs_tasks_pending ${pendingTasks}`,
    ``,
    `# HELP loopjs_tasks_completed Number of completed tasks`,
    `# TYPE loopjs_tasks_completed counter`,
    `loopjs_tasks_completed ${completedTasks}`,
    ``,
    `# HELP loopjs_tasks_failed Number of failed tasks`,
    `# TYPE loopjs_tasks_failed counter`,
    `loopjs_tasks_failed ${failedTasks}`,
    ``,
    `# HELP loopjs_system_uptime System uptime in seconds`,
    `# TYPE loopjs_system_uptime counter`,
    `loopjs_system_uptime ${Math.floor(process.uptime())}`,
    ``
  ].join('\n');

  res.set('Content-Type', 'text/plain; version=0.0.4; charset=utf-8');
  res.status(200).send(metrics);
});
