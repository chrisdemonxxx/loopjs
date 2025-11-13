const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Settings = sequelize.define('Settings', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    // General Settings
    siteName: {
        type: DataTypes.STRING,
        defaultValue: 'LoopJS Management Panel'
    },
    adminEmail: {
        type: DataTypes.STRING,
        defaultValue: 'admin@loopjs.com'
    },
    timezone: {
        type: DataTypes.STRING,
        defaultValue: 'UTC'
    },
    language: {
        type: DataTypes.STRING,
        defaultValue: 'en'
    },
    autoRefresh: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    refreshInterval: {
        type: DataTypes.INTEGER,
        defaultValue: 30
    },
    // Security Settings
    sessionTimeout: {
        type: DataTypes.INTEGER,
        defaultValue: 60
    },
    maxLoginAttempts: {
        type: DataTypes.INTEGER,
        defaultValue: 5
    },
    requireStrongPasswords: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    enableTwoFactor: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    allowRemoteAccess: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    // Appearance Settings
    theme: {
        type: DataTypes.STRING,
        defaultValue: 'dark'
    },
    primaryColor: {
        type: DataTypes.STRING,
        defaultValue: '#3C50E0'
    },
    sidebarCollapsed: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    showNotifications: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    compactMode: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    // AI Settings
    aiEnabled: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    aiProvider: {
        type: DataTypes.STRING,
        defaultValue: 'gemini'
    },
    // Telegram Settings
    telegramEnabled: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    telegramBotToken: {
        type: DataTypes.STRING,
        defaultValue: ''
    },
    telegramChatId: {
        type: DataTypes.STRING,
        defaultValue: ''
    }
}, {
    tableName: 'settings',
    timestamps: true
});

module.exports = Settings;
