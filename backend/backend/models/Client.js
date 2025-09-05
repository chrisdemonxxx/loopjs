const mongoose = require('mongoose');

const clientSchema = new mongoose.Schema({
    uuid: {
        type: String,
        required: true,
        unique: true,
    },
    ipAddress: {
        type: String,
    },
    computerName: {
        type: String,
    },
    platform: {
        type: String,
    },
    lastSeen: {
        type: Date,
    },
    status: {
        type: String,
        enum: ['online', 'offline'],
        default: 'offline',
    },
    osInfo: {
        type: String,
    },
    cpuUsage: {
        type: Number,
    },
    ramUsage: {
        type: Number,
    },
    diskUsage: {
        total: Number,
        used: Number,
        free: Number,
    },
});

const Client = mongoose.model('Client', clientSchema);

module.exports = Client;