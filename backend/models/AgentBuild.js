const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const AgentBuild = sequelize.define('AgentBuild', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    agentId: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    version: {
        type: DataTypes.STRING,
        defaultValue: '1.0.0'
    },
    description: {
        type: DataTypes.TEXT,
        defaultValue: ''
    },
    config: {
        type: DataTypes.JSONB,
        allowNull: false
    },
    status: {
        type: DataTypes.ENUM('queued', 'generating', 'compiling', 'packaging', 'ready', 'error', 'cancelled'),
        defaultValue: 'queued'
    },
    progress: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        validate: {
            min: 0,
            max: 100
        }
    },
    createdBy: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'users',
            key: 'id'
        }
    },
    filePaths: {
        type: DataTypes.JSONB,
        defaultValue: {}
    },
    metadata: {
        type: DataTypes.JSONB,
        defaultValue: {}
    },
    errorMessage: {
        type: DataTypes.TEXT,
        defaultValue: ''
    },
    startedAt: {
        type: DataTypes.DATE
    },
    completedAt: {
        type: DataTypes.DATE
    },
    fileSize: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    downloadCount: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    testResults: {
        type: DataTypes.JSONB,
        defaultValue: null
    },
    parentBuildId: {
        type: DataTypes.UUID,
        references: {
            model: 'agent_builds',
            key: 'id'
        }
    },
    versionHistory: {
        type: DataTypes.JSONB,
        defaultValue: []
    }
}, {
    tableName: 'agent_builds',
    timestamps: true,
    indexes: [
        {
            unique: true,
            fields: ['agentId']
        },
        {
            fields: ['status', 'createdAt']
        },
        {
            fields: ['createdBy', 'createdAt']
        },
        {
            fields: ['parentBuildId']
        }
    ]
});

module.exports = AgentBuild;
