const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
    taskId: {
        type: String,
        required: true,
        unique: true,
    },
    agentUuid: {
        type: String,
        required: true,
    },
    command: {
        type: String,
        required: true,
    },
    params: {
        type: Object,
        default: {},
    },
    queue: {
        state: {
            type: String,
            enum: ['pending', 'sent', 'ack', 'completed', 'failed'],
            default: 'pending',
        },
        reason: String,
        attempts: {
            type: Number,
            default: 0,
        },
        lastAttemptAt: Date,
        priority: {
            type: Number,
            default: 0,
        },
    },
    createdBy: {
        type: String,
        required: true,
    },
    sentAt: Date,
    ackAt: Date,
    completedAt: Date,
    executionTimeMs: {
        type: Number,
        default: 0,
    },
    output: {
        type: String,
        default: '',
    },
    errorMessage: {
        type: String,
        default: '',
    },
    platform: {
        type: String,
        default: 'unknown',
    },
    meta: {
        type: Object,
        default: {},
    },
    // Legacy fields for backward compatibility
    uuid: {
        type: String,
    },
    originalCommand: {
        type: String,
        default: '',
    },
    status: {
        type: String,
        enum: ['pending', 'executed', 'failed', 'cancelled'],
        default: 'pending',
    },
    executionTime: {
        type: Number,
        default: 0,
    },
    executedAt: {
        type: Date,
    },
}, {
    timestamps: true,
});

// Add indexes for performance
taskSchema.index({ taskId: 1 }, { unique: true });
taskSchema.index({ agentUuid: 1, 'queue.state': 1, createdAt: -1 });
taskSchema.index({ createdAt: -1 });
taskSchema.index({ 'queue.state': 1, createdAt: -1 });

const Task = mongoose.model('Task', taskSchema);

module.exports = Task;