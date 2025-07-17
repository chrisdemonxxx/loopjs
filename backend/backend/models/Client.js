const mongoose = require('mongoose');

const clientSchema = new mongoose.Schema({
    uuid: {
        type: String,
        required: true,
        unique: true,
    },
    ip: {
        type: String,
    },
    hostname: {
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
});

const Client = mongoose.model('Client', clientSchema);

module.exports = Client;