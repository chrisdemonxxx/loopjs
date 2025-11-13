const { sequelize } = require('../config/database');

// Import all models
const User = require('./User');
const Client = require('./Client');
const Task = require('./Task');
const RefreshToken = require('./RefreshToken');
const Settings = require('./Settings');
const AgentBuild = require('./AgentBuild');
const AgentTemplate = require('./AgentTemplate');
const AuditLog = require('./AuditLog');
const CommandPattern = require('./CommandPattern');

// Define relationships
User.hasMany(RefreshToken, { foreignKey: 'userId', onDelete: 'CASCADE' });
RefreshToken.belongsTo(User, { foreignKey: 'userId' });

User.hasMany(AgentBuild, { foreignKey: 'createdBy', onDelete: 'CASCADE' });
AgentBuild.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });

User.hasMany(AgentTemplate, { foreignKey: 'createdBy', onDelete: 'CASCADE' });
AgentTemplate.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });

User.hasMany(AuditLog, { foreignKey: 'userId', onDelete: 'CASCADE' });
AuditLog.belongsTo(User, { foreignKey: 'userId' });

AgentBuild.belongsTo(AgentBuild, { foreignKey: 'parentBuildId', as: 'parentBuild' });

// Export all models and sequelize instance
module.exports = {
    sequelize,
    User,
    Client,
    Task,
    RefreshToken,
    Settings,
    AgentBuild,
    AgentTemplate,
    AuditLog,
    CommandPattern
};
