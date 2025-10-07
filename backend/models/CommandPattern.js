/**
 * Command Pattern Model
 * Stores successful command patterns and failed anti-patterns for learning
 */

const mongoose = require('mongoose');

const commandPatternSchema = new mongoose.Schema({
    userIntent: {
        type: String,
        required: true,
        index: true
    },
    
    softwareName: {
        type: String,
        index: true
    },
    
    category: {
        type: String,
        enum: ['download', 'install', 'network', 'file', 'system', 'process', 'automation', 'general'],
        default: 'general',
        index: true
    },
    
    platform: {
        type: String,
        default: 'windows'
    },
    
    successfulApproach: {
        steps: [{
            type: String
        }],
        urls: [{
            type: String
        }],
        commands: [{
            type: String
        }],
        strategy: {
            type: String
        },
        successRate: {
            type: Number,
            default: 1.0,
            min: 0,
            max: 1
        },
        averageTime: {
            type: Number, // in milliseconds
            default: 0
        },
        executionCount: {
            type: Number,
            default: 1
        }
    },
    
    failedApproaches: [{
        approach: {
            type: String,
            required: true
        },
        error: {
            type: String
        },
        errorCategory: {
            type: String
        },
        frequency: {
            type: Number,
            default: 1
        },
        lastOccurred: {
            type: Date,
            default: Date.now
        }
    }],
    
    metadata: {
        firstSeen: {
            type: Date,
            default: Date.now
        },
        lastUsed: {
            type: Date,
            default: Date.now
        },
        totalExecutions: {
            type: Number,
            default: 1
        },
        successCount: {
            type: Number,
            default: 1
        },
        failureCount: {
            type: Number,
            default: 0
        }
    },
    
    systemContext: {
        requiresAdmin: {
            type: Boolean,
            default: false
        },
        requiresInternet: {
            type: Boolean,
            default: false
        },
        requiredTools: [{
            type: String
        }]
    }
}, {
    timestamps: true
});

// Indexes for efficient querying
commandPatternSchema.index({ userIntent: 1, category: 1 });
commandPatternSchema.index({ softwareName: 1 });
commandPatternSchema.index({ 'metadata.lastUsed': -1 });
commandPatternSchema.index({ 'successfulApproach.successRate': -1 });

// Methods
commandPatternSchema.methods.recordSuccess = function(executionTime) {
    this.metadata.successCount += 1;
    this.metadata.totalExecutions += 1;
    this.metadata.lastUsed = new Date();
    
    if (this.successfulApproach) {
        this.successfulApproach.executionCount += 1;
        
        // Update average time
        const currentTotal = this.successfulApproach.averageTime * (this.successfulApproach.executionCount - 1);
        this.successfulApproach.averageTime = (currentTotal + executionTime) / this.successfulApproach.executionCount;
        
        // Update success rate
        this.successfulApproach.successRate = this.metadata.successCount / this.metadata.totalExecutions;
    }
    
    return this.save();
};

commandPatternSchema.methods.recordFailure = function(approach, error, errorCategory) {
    this.metadata.failureCount += 1;
    this.metadata.totalExecutions += 1;
    this.metadata.lastUsed = new Date();
    
    // Find existing failed approach or create new one
    const existingFailure = this.failedApproaches.find(f => f.approach === approach);
    
    if (existingFailure) {
        existingFailure.frequency += 1;
        existingFailure.lastOccurred = new Date();
        if (error) existingFailure.error = error;
        if (errorCategory) existingFailure.errorCategory = errorCategory;
    } else {
        this.failedApproaches.push({
            approach: approach,
            error: error,
            errorCategory: errorCategory,
            frequency: 1,
            lastOccurred: new Date()
        });
    }
    
    // Update success rate
    if (this.successfulApproach) {
        this.successfulApproach.successRate = this.metadata.successCount / this.metadata.totalExecutions;
    }
    
    return this.save();
};

// Static methods
commandPatternSchema.statics.findByIntent = function(userIntent, category = null) {
    const query = { userIntent: new RegExp(userIntent, 'i') };
    if (category) {
        query.category = category;
    }
    return this.find(query).sort({ 'successfulApproach.successRate': -1, 'metadata.totalExecutions': -1 });
};

commandPatternSchema.statics.findBySoftware = function(softwareName) {
    return this.find({ softwareName: new RegExp(softwareName, 'i') })
        .sort({ 'successfulApproach.successRate': -1 });
};

commandPatternSchema.statics.getTopPatterns = function(limit = 10) {
    return this.find()
        .sort({ 'successfulApproach.successRate': -1, 'metadata.totalExecutions': -1 })
        .limit(limit);
};

commandPatternSchema.statics.getRecentPatterns = function(limit = 10) {
    return this.find()
        .sort({ 'metadata.lastUsed': -1 })
        .limit(limit);
};

const CommandPattern = mongoose.model('CommandPattern', commandPatternSchema);

module.exports = CommandPattern;
