const mongoose = require('mongoose');
const Client = require('../models/Client');
const Task =require('../models/Task');
const webSocketManager = require('./ws.manager');

module.exports = function connectionHandler(ws) {
    // Log when a new client connects to help with debugging
    console.log('A new client connected via WebSocket.');

    ws.on('message', async (message) => {
        try {
            // The incoming message is a Buffer, so it must be converted to a string
            // before it can be parsed as JSON. This was the source of the error.
            const messageString = message.toString();
            const data = JSON.parse(messageString);

            if (data.type === 'subscribe') {
                webSocketManager.addClient(data.uuid, ws);
                return;
            }

            if (data.type === 'output') {
                // This is an output message from a client
                const { taskId, output } = data;
                await Task.findByIdAndUpdate(taskId, { output: output });
                return;
            }

            if (data.type === 'metrics') {
                const { uuid, osInfo, cpuUsage, ramUsage, diskUsage } = data;
                await Client.findOneAndUpdate(
                    { uuid: uuid },
                    {
                        $set: {
                            osInfo,
                            cpuUsage,
                            ramUsage,
                            diskUsage,
                            lastSeen: new Date(),
                            status: 'online'
                        }
                    }
                );
                webSocketManager.broadcast(uuid, { type: 'metrics', osInfo, cpuUsage, ramUsage, diskUsage });
                return;
            }

            // Assign the uuid to the websocket connection instance for later use
            if (data.uuid) {
                ws.uuid = data.uuid;
            } else {
                return; // Ignore messages without a UUID
            }
            
            console.log(`Received data from client ${data.uuid}`);

            // Find the client by UUID and update its details, or create it if it doesn't exist.
            await Client.findOneAndUpdate(
                { uuid: data.uuid },
                {
                    $set: {
                        ipAddress: data.ipAddress,
                        computerName: data.computerName,
                        platform: data.platform,
                        lastSeen: new Date(),
                        status: 'online'
                    }
                },
                { upsert: true, new: true } // upsert:true creates the doc if it doesn't exist
            );

            // Check for any pending tasks for this client
            const tasks = await Task.find({ uuid: data.uuid, status: 'pending' });
            for (const task of tasks) {
                ws.send(JSON.stringify({ cmd: task.command, taskId: task._id }));
                task.status = 'executed';
                await task.save();
            }

        } catch (err) {
            console.error('WebSocket message processing error:', err);
        }
    });

    ws.on('close', async () => {
        webSocketManager.removeClient(ws);
        // When the connection closes, update the client's status to 'offline'.
        if (ws.uuid) {
            console.log(`Client ${ws.uuid} disconnected.`);
            await Client.updateOne({ uuid: ws.uuid }, { $set: { status: 'offline' } });
        } else {
            console.log('An unnamed client disconnected.');
        }
    });

    ws.on('error', (error) => {
        console.error('WebSocket error on connection:', error);
    });
};
