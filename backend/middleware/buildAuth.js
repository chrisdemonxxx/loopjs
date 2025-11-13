const User = require('../models/User');
const AgentBuild = require('../models/AgentBuild');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

/**
 * Check if user has not exceeded build quota
 */
exports.checkBuildQuota = catchAsync(async (req, res, next) => {
    if (!req.user) {
        return next(new AppError('User not authenticated', 401));
    }

    const user = await User.findById(req.user.id);
    if (!user) {
        return next(new AppError('User not found', 404));
    }

    // Check if quota needs to be reset
    if (user.quotaResetAt && new Date() > user.quotaResetAt) {
        user.buildCount = 0;
        // Reset for next month
        const resetDate = new Date();
        resetDate.setMonth(resetDate.getMonth() + 1);
        user.quotaResetAt = resetDate;
        await user.save();
    }

    // Admin has unlimited quota (-1)
    if (user.buildQuota === -1) {
        return next();
    }

    // Check if user has exceeded quota
    if (user.buildCount >= user.buildQuota) {
        return next(new AppError(
            `Build quota exceeded. You have reached your limit of ${user.buildQuota} builds. Quota resets on ${user.quotaResetAt.toLocaleDateString()}`,
            429
        ));
    }

    // Increment build count
    user.buildCount += 1;
    await user.save();

    next();
});

/**
 * Check if user owns the build or is admin
 */
exports.checkBuildOwnership = catchAsync(async (req, res, next) => {
    if (!req.user) {
        return next(new AppError('User not authenticated', 401));
    }

    const build = await AgentBuild.findById(req.params.buildId);
    if (!build) {
        return next(new AppError('Build not found', 404));
    }

    // Admin can access any build
    if (req.user.role === 'admin') {
        return next();
    }

    // Check ownership
    if (build.createdBy.toString() !== req.user.id) {
        return next(new AppError('You do not have permission to access this build', 403));
    }

    next();
});

/**
 * Check specific build permission
 */
exports.checkBuildPermission = (permission) => {
    return catchAsync(async (req, res, next) => {
        if (!req.user) {
            return next(new AppError('User not authenticated', 401));
        }

        const user = await User.findById(req.user.id);
        if (!user) {
            return next(new AppError('User not found', 404));
        }

        // Admin has all permissions
        if (req.user.role === 'admin') {
            return next();
        }

        // Check specific permission
        if (!user.buildPermissions || !user.buildPermissions[permission]) {
            return next(new AppError(`You do not have permission to ${permission} builds`, 403));
        }

        next();
    });
};

/**
 * Rate limiting for build creation
 */
exports.rateLimitBuildCreation = catchAsync(async (req, res, next) => {
    if (!req.user) {
        return next(new AppError('User not authenticated', 401));
    }

    const user = await User.findById(req.user.id);
    if (!user) {
        return next(new AppError('User not found', 404));
    }

    // Rate limits based on role (builds per hour)
    const rateLimits = {
        admin: 100,
        user: 10,
        viewer: 2
    };

    const limit = rateLimits[user.role] || 2;
    
    // Check recent builds (last hour)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentBuilds = await AgentBuild.countDocuments({
        createdBy: user._id,
        createdAt: { $gte: oneHourAgo }
    });

    if (recentBuilds >= limit) {
        return next(new AppError(
            `Rate limit exceeded. Maximum ${limit} builds per hour. Please try again later.`,
            429
        ));
    }

    next();
});

