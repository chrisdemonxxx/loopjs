const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
    uuid: {
        type: String,
        required: true,
    },
    command: {
        type: String,
        required: true,
    },
    originalCommand: {
        type: String,
        default: '',
    },
    platform: {
        type: String,
        default: 'unknown',
    },
    status: {
        type: String,
        enum: ['pending', 'executed', 'failed', 'cancelled'],
        default: 'pending',
    },
    output: {
        type: String,
        default: '',
    },
    errorMessage: {
        type: String,
        default: '',
    },
    executionTime: {
        type: Number,
        default: 0,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    executedAt: {
        type: Date,
    },
    completedAt: {
        type: Date,
    },
});

const Task = mongoose.model('Task', taskSchema);

module.exports = Task;