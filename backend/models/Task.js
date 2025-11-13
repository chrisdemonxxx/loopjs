const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Task = sequelize.define('Task', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    taskId: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    agentUuid: {
        type: DataTypes.STRING,
        allowNull: false
    },
    command: {
        type: DataTypes.STRING,
        allowNull: false
    },
    params: {
        type: DataTypes.JSONB,
        defaultValue: {}
    },
    queue: {
        type: DataTypes.JSONB,
        defaultValue: {
            state: 'pending',
            reason: null,
            attempts: 0,
            lastAttemptAt: null,
            priority: 0
        }
    },
    createdBy: {
        type: DataTypes.STRING,
        allowNull: false
    },
    sentAt: {
        type: DataTypes.DATE
    },
    ackAt: {
        type: DataTypes.DATE
    },
    completedAt: {
        type: DataTypes.DATE
    },
    executionTimeMs: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    output: {
        type: DataTypes.TEXT,
        defaultValue: ''
    },
    errorMessage: {
        type: DataTypes.TEXT,
        defaultValue: ''
    },
    platform: {
        type: DataTypes.STRING,
        defaultValue: 'unknown'
    },
    meta: {
        type: DataTypes.JSONB,
        defaultValue: {}
    },
    // Legacy fields for backward compatibility
    uuid: {
        type: DataTypes.STRING
    },
    originalCommand: {
        type: DataTypes.STRING,
        defaultValue: ''
    },
    status: {
        type: DataTypes.ENUM('pending', 'executed', 'failed', 'cancelled'),
        defaultValue: 'pending'
    },
    executionTime: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    executedAt: {
        type: DataTypes.DATE
    }
}, {
    tableName: 'tasks',
    timestamps: true,
    indexes: [
        {
            unique: true,
            fields: ['taskId']
        },
        {
            fields: ['agentUuid', 'createdAt']
        },
        {
            fields: ['createdAt']
        }
    ]
});

module.exports = Task;
