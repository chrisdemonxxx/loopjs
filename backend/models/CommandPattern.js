const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const CommandPattern = sequelize.define('CommandPattern', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    userIntent: {
        type: DataTypes.STRING,
        allowNull: false
    },
    softwareName: {
        type: DataTypes.STRING
    },
    category: {
        type: DataTypes.ENUM('download', 'install', 'network', 'file', 'system', 'process', 'automation', 'general'),
        defaultValue: 'general'
    },
    platform: {
        type: DataTypes.STRING,
        defaultValue: 'windows'
    },
    successfulApproach: {
        type: DataTypes.JSONB,
        defaultValue: {
            steps: [],
            urls: [],
            commands: [],
            strategy: '',
            successRate: 1.0,
            averageTime: 0,
            executionCount: 1
        }
    },
    failedApproaches: {
        type: DataTypes.JSONB,
        defaultValue: []
    },
    metadata: {
        type: DataTypes.JSONB,
        defaultValue: {
            firstSeen: new Date(),
            lastUsed: new Date(),
            totalExecutions: 1,
            successCount: 1,
            failureCount: 0
        }
    },
    systemContext: {
        type: DataTypes.JSONB,
        defaultValue: {
            requiresAdmin: false,
            requiresInternet: false,
            requiredTools: []
        }
    }
}, {
    tableName: 'command_patterns',
    timestamps: true,
    indexes: [
        {
            fields: ['userIntent', 'category']
        },
        {
            fields: ['softwareName']
        }
    ]
});

// Instance methods
CommandPattern.prototype.recordSuccess = async function(executionTime) {
    const metadata = this.metadata || {};
    metadata.successCount = (metadata.successCount || 0) + 1;
    metadata.totalExecutions = (metadata.totalExecutions || 0) + 1;
    metadata.lastUsed = new Date();

    const approach = this.successfulApproach || {};
    approach.executionCount = (approach.executionCount || 0) + 1;

    const currentTotal = (approach.averageTime || 0) * (approach.executionCount - 1);
    approach.averageTime = (currentTotal + executionTime) / approach.executionCount;
    approach.successRate = metadata.successCount / metadata.totalExecutions;

    this.metadata = metadata;
    this.successfulApproach = approach;
    await this.save();
};

CommandPattern.prototype.recordFailure = async function(approach, error, errorCategory) {
    const metadata = this.metadata || {};
    metadata.failureCount = (metadata.failureCount || 0) + 1;
    metadata.totalExecutions = (metadata.totalExecutions || 0) + 1;
    metadata.lastUsed = new Date();

    const failures = this.failedApproaches || [];
    const existingFailure = failures.find(f => f.approach === approach);

    if (existingFailure) {
        existingFailure.frequency += 1;
        existingFailure.lastOccurred = new Date();
        if (error) existingFailure.error = error;
        if (errorCategory) existingFailure.errorCategory = errorCategory;
    } else {
        failures.push({
            approach,
            error,
            errorCategory,
            frequency: 1,
            lastOccurred: new Date()
        });
    }

    this.metadata = metadata;
    this.failedApproaches = failures;

    if (this.successfulApproach) {
        this.successfulApproach.successRate = metadata.successCount / metadata.totalExecutions;
    }

    await this.save();
};

module.exports = CommandPattern;
