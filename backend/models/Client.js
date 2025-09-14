const mongoose = require('mongoose');

const clientSchema = new mongoose.Schema({
    uuid: {
        type: String,
        required: true,
        unique: true,
    },
    computerName: {
        type: String,
        required: true,
    },
    ipAddress: {
        type: String,
        required: true,
    },
    country: {
        type: String,
        default: 'Unknown',
    },
    hostname: {
        type: String,
    },
    platform: {
        type: String,
    },
    lastActiveTime: {
        type: Date,
        default: Date.now,
    },
    additionalSystemDetails: {
        type: String,
        default: '',
    },
    status: {
        type: String,
        enum: ['online', 'offline'],
        default: 'offline',
    },
    // Keep legacy fields for backward compatibility
    ip: {
        type: String,
    },
    lastSeen: {
        type: Date,
    },
}, {
    timestamps: true,
});

const Client = mongoose.model('Client', clientSchema);

module.exports = Client;