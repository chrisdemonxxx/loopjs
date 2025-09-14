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
    status: {
        type: String,
        enum: ['pending', 'executed', 'failed'],
        default: 'pending',
    },
    output: {
        type: String,
        default: '',
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

const Task = mongoose.model('Task', taskSchema);

module.exports = Task;