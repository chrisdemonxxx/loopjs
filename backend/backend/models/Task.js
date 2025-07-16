
const mongoose = require('mongoose');

const TaskSchema = new mongoose.Schema({
    uuid: String,
    command: String,
    status: { type: String, enum: ['pending', 'executed', 'failed'], default: 'pending' },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Task', TaskSchema);
