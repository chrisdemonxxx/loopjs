const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const RefreshToken = sequelize.define('RefreshToken', {
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
    token: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    expiresAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: () => {
            const date = new Date();
            date.setDate(date.getDate() + 7);
            return date;
        }
    }
}, {
    tableName: 'refresh_tokens',
    timestamps: true,
    indexes: [
        {
            unique: true,
            fields: ['token']
        },
        {
            fields: ['userId']
        },
        {
            fields: ['expiresAt']
        }
    ]
});

module.exports = RefreshToken;
