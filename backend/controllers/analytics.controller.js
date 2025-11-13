const AgentBuild = require('../models/AgentBuild');
const AgentTemplate = require('../models/AgentTemplate');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

/**
 * Get build analytics
 */
exports.getBuildAnalytics = catchAsync(async (req, res, next) => {
    // Only admins can view analytics
    if (req.user.role !== 'admin') {
        return next(new AppError('Only admins can view analytics', 403));
    }

    const { startDate, endDate } = req.query;
    const filter = {};

    if (startDate || endDate) {
        filter.createdAt = {};
        if (startDate) filter.createdAt.$gte = new Date(startDate);
        if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    // Total builds
    const totalBuilds = await AgentBuild.countDocuments(filter);

    // Builds by status
    const buildsByStatus = await AgentBuild.aggregate([
        { $match: filter },
        { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    // Builds by user
    const buildsByUser = await AgentBuild.aggregate([
        { $match: filter },
        { $group: { _id: '$createdBy', count: { $sum: 1 } } },
        { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
        { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
        { $project: { username: '$user.username', count: 1 } },
        { $sort: { count: -1 } },
        { $limit: 10 }
    ]);

    // Time-based trends (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const dailyTrends = await AgentBuild.aggregate([
        { $match: { ...filter, createdAt: { $gte: thirtyDaysAgo } } },
        {
            $group: {
                _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                count: { $sum: 1 },
                successful: {
                    $sum: { $cond: [{ $eq: ['$status', 'ready'] }, 1, 0] }
                },
                failed: {
                    $sum: { $cond: [{ $eq: ['$status', 'error'] }, 1, 0] }
                }
            }
        },
        { $sort: { _id: 1 } }
    ]);

    // Success/failure rates
    const successCount = await AgentBuild.countDocuments({ ...filter, status: 'ready' });
    const failureCount = await AgentBuild.countDocuments({ ...filter, status: 'error' });
    const successRate = totalBuilds > 0 ? ((successCount / totalBuilds) * 100).toFixed(2) : 0;
    const failureRate = totalBuilds > 0 ? ((failureCount / totalBuilds) * 100).toFixed(2) : 0;

    // Average build time (for completed builds)
    const completedBuilds = await AgentBuild.find({
        ...filter,
        status: { $in: ['ready', 'error'] },
        startedAt: { $exists: true },
        completedAt: { $exists: true }
    }).select('startedAt completedAt');

    let totalBuildTime = 0;
    let avgBuildTime = 0;
    if (completedBuilds.length > 0) {
        completedBuilds.forEach(build => {
            const buildTime = new Date(build.completedAt) - new Date(build.startedAt);
            totalBuildTime += buildTime;
        });
        avgBuildTime = Math.round(totalBuildTime / completedBuilds.length / 1000); // in seconds
    }

    res.status(200).json({
        status: 'success',
        data: {
            totalBuilds,
            buildsByStatus: buildsByStatus.reduce((acc, item) => {
                acc[item._id] = item.count;
                return acc;
            }, {}),
            buildsByUser,
            dailyTrends,
            successRate: parseFloat(successRate),
            failureRate: parseFloat(failureRate),
            avgBuildTimeSeconds: avgBuildTime,
            timeRange: {
                startDate: startDate || null,
                endDate: endDate || null
            }
        }
    });
});

/**
 * Get template analytics
 */
exports.getTemplateAnalytics = catchAsync(async (req, res, next) => {
    // Only admins can view analytics
    if (req.user.role !== 'admin') {
        return next(new AppError('Only admins can view analytics', 403));
    }

    // Most used templates
    const mostUsedTemplates = await AgentTemplate.find()
        .sort({ usageCount: -1 })
        .limit(10)
        .populate('createdBy', 'username')
        .select('name description usageCount lastUsedAt createdBy');

    // Template success rates (templates used in successful builds)
    const templatesWithBuilds = await AgentTemplate.aggregate([
        {
            $lookup: {
                from: 'agentbuilds',
                localField: '_id',
                foreignField: 'config',
                as: 'builds'
            }
        },
        {
            $project: {
                name: 1,
                usageCount: 1,
                totalBuilds: { $size: '$builds' },
                successfulBuilds: {
                    $size: {
                        $filter: {
                            input: '$builds',
                            as: 'build',
                            cond: { $eq: ['$$build.status', 'ready'] }
                        }
                    }
                }
            }
        },
        {
            $project: {
                name: 1,
                usageCount: 1,
                totalBuilds: 1,
                successfulBuilds: 1,
                successRate: {
                    $cond: [
                        { $gt: ['$totalBuilds', 0] },
                        { $multiply: [{ $divide: ['$successfulBuilds', '$totalBuilds'] }, 100] },
                        0
                    ]
                }
            }
        },
        { $sort: { usageCount: -1 } },
        { $limit: 10 }
    ]);

    // Total templates
    const totalTemplates = await AgentTemplate.countDocuments();
    const publicTemplates = await AgentTemplate.countDocuments({ isPublic: true });

    res.status(200).json({
        status: 'success',
        data: {
            totalTemplates,
            publicTemplates,
            mostUsedTemplates,
            templatesWithBuilds
        }
    });
});

