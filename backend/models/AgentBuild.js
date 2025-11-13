const mongoose = require('mongoose');

const agentBuildSchema = new mongoose.Schema({
    agentId: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    name: {
        type: String,
        required: true
    },
    version: {
        type: String,
        default: '1.0.0'
    },
    description: {
        type: String,
        default: ''
    },
    config: {
        type: Object,
        required: true
    },
    status: {
        type: String,
        enum: ['queued', 'generating', 'compiling', 'packaging', 'ready', 'error', 'cancelled'],
        default: 'queued',
        index: true
    },
    progress: {
        type: Number,
        min: 0,
        max: 100,
        default: 0
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    filePaths: {
        exe: String,
        msi: String,
        zip: String,
        cpp: String,
        logs: String
    },
    metadata: {
        serviceName: String,
        clonedService: String,
        password: String,
        features: [String],
        codeStructure: Object,
        junkCodeLines: Number,
        entryPoint: String,
        codeSigningMetadata: Object,
        securityFeatures: [String]
    },
    errorMessage: {
        type: String,
        default: ''
    },
    startedAt: {
        type: Date
    },
    completedAt: {
        type: Date
    },
    fileSize: {
        type: Number,
        default: 0
    },
    downloadCount: {
        type: Number,
        default: 0
    },
    testResults: {
        type: Object,
        default: null
    },
    parentBuildId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'AgentBuild',
        default: null
    },
    versionHistory: [{
        version: String,
        buildId: mongoose.Schema.Types.ObjectId,
        createdAt: Date
    }]
}, {
    timestamps: true
});

// Indexes for performance
agentBuildSchema.index({ createdAt: -1 });
agentBuildSchema.index({ status: 1, createdAt: -1 });
agentBuildSchema.index({ createdBy: 1, createdAt: -1 });
agentBuildSchema.index({ parentBuildId: 1 });

const AgentBuild = mongoose.model('AgentBuild', agentBuildSchema);

module.exports = AgentBuild;

