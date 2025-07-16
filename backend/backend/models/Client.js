
const mongoose = require('mongoose');

const ClientSchema = new mongoose.Schema({
    uuid: { type: String, unique: true, required: true },
    ip: String,
    hostname: String,
    platform: String,
    lastSeen: { type: Date, default: Date.now },
    status: { type: String, enum: ['online', 'offline'], default: 'online' },
    tags: [String],
    group: String
});

module.exports = mongoose.model('Client', ClientSchema);
