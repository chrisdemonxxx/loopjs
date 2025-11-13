const mongoose = require('mongoose');

const agentTemplateSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        default: ''
    },
    config: {
        type: Object,
        required: true
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    isPublic: {
        type: Boolean,
        default: false,
        index: true
    },
    usageCount: {
        type: Number,
        default: 0
    },
    lastUsedAt: {
        type: Date
    }
}, {
    timestamps: true
});

// Indexes for performance
agentTemplateSchema.index({ name: 1 });
agentTemplateSchema.index({ isPublic: 1, createdAt: -1 });
agentTemplateSchema.index({ createdBy: 1, createdAt: -1 });

const AgentTemplate = mongoose.model('AgentTemplate', agentTemplateSchema);

module.exports = AgentTemplate;

