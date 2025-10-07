
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
    username: { type: String, unique: true, required: true },
    email: { type: String, unique: true, required: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['admin', 'user', 'viewer'], default: 'user' },
    displayName: { type: String },
    profilePicture: { type: String },
    twoFactorEnabled: { type: Boolean, default: false },
    preferences: {
        theme: { type: String, default: 'dark' },
        language: { type: String, default: 'en' },
        notifications: { type: Boolean, default: true },
        autoRefresh: { type: Boolean, default: true },
        refreshInterval: { type: Number, default: 30 }
    },
    refreshTokens: [{
        token: { type: String, required: true },
        createdAt: { type: Date, default: Date.now },
        lastUsed: { type: Date, default: Date.now },
        userAgent: { type: String },
        ipAddress: { type: String }
    }],
    lastLogin: { type: Date },
    isActive: { type: Boolean, default: true }
}, { timestamps: true });

// Hash password before saving
UserSchema.pre('save', async function(next) {
    // Only hash the password if it has been modified (or is new)
    if (!this.isModified('password')) return next();

    // Don't re-hash already hashed passwords
    const isHashed = /^\$2[aby]\$\d{2}\$/.test(this.password);
    if (isHashed) {
        return next();
    }

    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (err) {
        next(err);
    }
});

module.exports = mongoose.model('User', UserSchema);
