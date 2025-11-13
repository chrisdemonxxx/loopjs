const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const AuditLog = sequelize.define('AuditLog', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    userId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'users',
            key: 'id'
        }
    },
    action: {
        type: DataTypes.STRING,
        allowNull: false
    },
    details: {
        type: DataTypes.JSONB,
        defaultValue: {}
    }
}, {
    tableName: 'audit_logs',
    timestamps: true,
    updatedAt: false,
    indexes: [
        {
            fields: ['userId', 'createdAt']
        },
        {
            fields: ['action']
        },
        {
            fields: ['createdAt']
        }
    ]
});

module.exports = AuditLog;
