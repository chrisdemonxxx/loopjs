const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');
const { sequelize } = require('../config/database');

const User = sequelize.define('User', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    username: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: false,
        validate: {
            notEmpty: true
        }
    },
    email: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: false,
        validate: {
            isEmail: true
        }
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false
    },
    role: {
        type: DataTypes.ENUM('admin', 'user', 'viewer'),
        defaultValue: 'user'
    },
    displayName: {
        type: DataTypes.STRING
    },
    profilePicture: {
        type: DataTypes.STRING
    },
    twoFactorEnabled: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    preferences: {
        type: DataTypes.JSONB,
        defaultValue: {
            theme: 'dark',
            language: 'en',
            notifications: true,
            autoRefresh: true,
            refreshInterval: 30
        }
    },
    refreshTokens: {
        type: DataTypes.JSONB,
        defaultValue: []
    },
    lastLogin: {
        type: DataTypes.DATE
    },
    isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    buildQuota: {
        type: DataTypes.INTEGER,
        defaultValue: 50
    },
    buildCount: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    quotaResetAt: {
        type: DataTypes.DATE
    },
    buildPermissions: {
        type: DataTypes.JSONB,
        defaultValue: {
            canCreate: true,
            canDelete: true,
            canDownload: true,
            canTest: true
        }
    }
}, {
    tableName: 'users',
    timestamps: true,
    hooks: {
        beforeSave: async (user) => {
            // Only hash if password was modified
            if (user.changed('password')) {
                const isHashed = /^\$2[aby]\$\d{2}\$/.test(user.password);
                if (!isHashed) {
                    const salt = await bcrypt.genSalt(10);
                    user.password = await bcrypt.hash(user.password, salt);
                }
            }

            // Set build quota based on role if not already set
            if (user.changed('role') && !user.buildQuota) {
                if (user.role === 'admin') {
                    user.buildQuota = -1; // Unlimited
                } else if (user.role === 'user') {
                    user.buildQuota = 50;
                } else {
                    user.buildQuota = 10; // viewer
                }
            }

            // Set quota reset date if not set
            if (!user.quotaResetAt) {
                const resetDate = new Date();
                resetDate.setMonth(resetDate.getMonth() + 1);
                user.quotaResetAt = resetDate;
            }
        }
    }
});

// Instance methods
User.prototype.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

User.prototype.addRefreshToken = async function(tokenData) {
    const tokens = this.refreshTokens || [];
    tokens.push({
        token: tokenData.token,
        createdAt: new Date(),
        lastUsed: new Date(),
        userAgent: tokenData.userAgent,
        ipAddress: tokenData.ipAddress
    });
    this.refreshTokens = tokens;
    await this.save();
};

User.prototype.removeRefreshToken = async function(token) {
    const tokens = this.refreshTokens || [];
    this.refreshTokens = tokens.filter(t => t.token !== token);
    await this.save();
};

module.exports = User;
