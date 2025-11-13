const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const AgentTemplate = sequelize.define('AgentTemplate', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    description: {
        type: DataTypes.TEXT,
        defaultValue: ''
    },
    config: {
        type: DataTypes.JSONB,
        allowNull: false
    },
    createdBy: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'users',
            key: 'id'
        }
    },
    isPublic: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    usageCount: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    lastUsedAt: {
        type: DataTypes.DATE
    }
}, {
    tableName: 'agent_templates',
    timestamps: true,
    indexes: [
        {
            fields: ['name']
        },
        {
            fields: ['isPublic', 'createdAt']
        },
        {
            fields: ['createdBy', 'createdAt']
        }
    ]
});

module.exports = AgentTemplate;
