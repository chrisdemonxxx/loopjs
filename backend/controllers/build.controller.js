const AgentBuild = require('../models/AgentBuild');
const User = require('../models/User');
const agentBuildService = require('../services/agentBuildService');
const buildTestService = require('../services/buildTestService');
const fs = require('fs');
const path = require('path');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

/**
 * Get all builds with filtering and pagination
 */
exports.getAllBuilds = catchAsync(async (req, res, next) => {
    const { status, page = 1, limit = 20 } = req.query;
    const userId = req.user ? req.user.id : null;

    // Build filter
    const filter = {};
    if (status) {
        filter.status = status;
    }
    if (userId && req.user.role !== 'admin') {
        filter.createdBy = userId;
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const builds = await AgentBuild.find(filter)
        .populate('createdBy', 'username email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));

    const total = await AgentBuild.countDocuments(filter);

    res.status(200).json({
        status: 'success',
        results: builds.length,
        total: total,
        page: parseInt(page),
        limit: parseInt(limit),
        data: {
            builds: builds
        }
    });
});

/**
 * Get a single build by ID
 */
exports.getBuild = catchAsync(async (req, res, next) => {
    const build = await AgentBuild.findById(req.params.buildId)
        .populate('createdBy', 'username email');

    if (!build) {
        return next(new AppError('Build not found', 404));
    }

    // Check ownership or admin
    if (req.user.role !== 'admin' && build.createdBy.toString() !== req.user.id) {
        return next(new AppError('You do not have permission to view this build', 403));
    }

    res.status(200).json({
        status: 'success',
        data: {
            build: build
        }
    });
});

/**
 * Create a new build
 */
exports.createBuild = catchAsync(async (req, res, next) => {
    const config = req.body;
    const userId = req.user ? req.user.id : null;

    if (!userId) {
        return next(new AppError('User not authenticated', 401));
    }

    // Generate unique agent ID
    const agentId = 'AGENT_' + Math.random().toString(36).substr(2, 8).toUpperCase();
    
    // Create build record
    const build = new AgentBuild({
        agentId: agentId,
        name: config.agentName || `Agent_${agentId}`,
        version: '1.0.0',
        description: config.description || '',
        config: config,
        status: 'queued',
        progress: 0,
        createdBy: userId
    });

    await build.save();

    // Emit queued event
    agentBuildService.emitBuildEvent('build_queued', {
        buildId: build._id.toString(),
        agentId: build.agentId,
        name: build.name
    });

    // Start generation asynchronously
    agentBuildService.generateAgent(build._id, config).catch(error => {
        console.error('Error in async agent generation:', error);
    });

    res.status(201).json({
        status: 'success',
        data: {
            build: build
        }
    });
});

/**
 * Delete a build
 */
exports.deleteBuild = catchAsync(async (req, res, next) => {
    const build = await AgentBuild.findById(req.params.buildId);

    if (!build) {
        return next(new AppError('Build not found', 404));
    }

    // Check ownership or admin
    if (req.user.role !== 'admin' && build.createdBy.toString() !== req.user.id) {
        return next(new AppError('You do not have permission to delete this build', 403));
    }

    // Delete files if they exist
    if (build.filePaths) {
        const filePaths = Object.values(build.filePaths).filter(Boolean);
        filePaths.forEach(filePath => {
            if (fs.existsSync(filePath)) {
                try {
                    fs.unlinkSync(filePath);
                } catch (error) {
                    console.error(`Error deleting file ${filePath}:`, error);
                }
            }
        });
    }

    // Delete build record
    await AgentBuild.findByIdAndDelete(req.params.buildId);

    // Emit deleted event
    agentBuildService.emitBuildEvent('build_deleted', {
        buildId: req.params.buildId,
        agentId: build.agentId
    });

    res.status(204).json({
        status: 'success',
        data: null
    });
});

/**
 * Download build archive
 */
exports.downloadBuild = catchAsync(async (req, res, next) => {
    const build = await AgentBuild.findById(req.params.buildId);

    if (!build) {
        return next(new AppError('Build not found', 404));
    }

    // Check ownership or admin
    if (req.user.role !== 'admin' && build.createdBy.toString() !== req.user.id) {
        return next(new AppError('You do not have permission to download this build', 403));
    }

    if (build.status !== 'ready') {
        return next(new AppError('Build is not ready for download', 400));
    }

    if (!build.filePaths || !build.filePaths.zip) {
        return next(new AppError('Build file not found', 404));
    }

    const filePath = build.filePaths.zip;
    if (!fs.existsSync(filePath)) {
        return next(new AppError('Build file not found on disk', 404));
    }

    // Increment download count
    build.downloadCount += 1;
    await build.save();

    // Set headers and stream file
    const filename = path.basename(filePath);
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);

    fileStream.on('error', (error) => {
        console.error('Error streaming file:', error);
        if (!res.headersSent) {
            res.status(500).json({ error: 'Error downloading file' });
        }
    });
});

/**
 * Get build logs
 */
exports.getBuildLogs = catchAsync(async (req, res, next) => {
    const build = await AgentBuild.findById(req.params.buildId);

    if (!build) {
        return next(new AppError('Build not found', 404));
    }

    // Check ownership or admin
    if (req.user.role !== 'admin' && build.createdBy.toString() !== req.user.id) {
        return next(new AppError('You do not have permission to view this build', 403));
    }

    // Read log file if it exists
    if (build.filePaths && build.filePaths.logs && fs.existsSync(build.filePaths.logs)) {
        const logContent = fs.readFileSync(build.filePaths.logs, 'utf8');
        return res.status(200).json({
            status: 'success',
            data: {
                logs: logContent,
                buildId: build._id.toString()
            }
        });
    }

    // Return build status as log if no log file
    res.status(200).json({
        status: 'success',
        data: {
            logs: `Build Status: ${build.status}\nProgress: ${build.progress}%\n${build.errorMessage ? `Error: ${build.errorMessage}` : ''}`,
            buildId: build._id.toString()
        }
    });
});

/**
 * Run tests on a build
 */
exports.testBuild = catchAsync(async (req, res, next) => {
    const build = await AgentBuild.findById(req.params.buildId);

    if (!build) {
        return next(new AppError('Build not found', 404));
    }

    // Check ownership or admin
    if (req.user.role !== 'admin' && build.createdBy.toString() !== req.user.id) {
        return next(new AppError('You do not have permission to test this build', 403));
    }

    try {
        const testResults = await buildTestService.runAllTests(req.params.buildId);
        
        res.status(200).json({
            status: 'success',
            data: {
                testResults: testResults
            }
        });
    } catch (error) {
        return next(new AppError(error.message || 'Failed to run tests', 500));
    }
});

/**
 * Get test results for a build
 */
exports.getTestResults = catchAsync(async (req, res, next) => {
    const build = await AgentBuild.findById(req.params.buildId);

    if (!build) {
        return next(new AppError('Build not found', 404));
    }

    // Check ownership or admin
    if (req.user.role !== 'admin' && build.createdBy.toString() !== req.user.id) {
        return next(new AppError('You do not have permission to view this build', 403));
    }

    if (!build.testResults) {
        return next(new AppError('No test results found for this build', 404));
    }

    res.status(200).json({
        status: 'success',
        data: {
            testResults: build.testResults
        }
    });
});

/**
 * Archive a build
 */
exports.archiveBuild = catchAsync(async (req, res, next) => {
    const build = await AgentBuild.findById(req.params.buildId);

    if (!build) {
        return next(new AppError('Build not found', 404));
    }

    // Check ownership or admin
    if (req.user.role !== 'admin' && build.createdBy.toString() !== req.user.id) {
        return next(new AppError('You do not have permission to archive this build', 403));
    }

    if (build.status !== 'ready') {
        return next(new AppError('Only ready builds can be archived', 400));
    }

    const fileManagerService = require('../services/fileManagerService');
    const result = await fileManagerService.archiveBuild(req.params.buildId);

    res.status(200).json({
        status: 'success',
        data: result
    });
});

/**
 * Get storage statistics
 */
exports.getStorageStats = catchAsync(async (req, res, next) => {
    // Only admins can view storage stats
    if (req.user.role !== 'admin') {
        return next(new AppError('Only admins can view storage statistics', 403));
    }

    const fileManagerService = require('../services/fileManagerService');
    const stats = await fileManagerService.getStorageUsage();

    res.status(200).json({
        status: 'success',
        data: stats
    });
});

/**
 * Rebuild an existing build (create new version)
 */
exports.rebuild = catchAsync(async (req, res, next) => {
    const parentBuild = await AgentBuild.findById(req.params.buildId);

    if (!parentBuild) {
        return next(new AppError('Build not found', 404));
    }

    // Check ownership or admin
    if (req.user.role !== 'admin' && parentBuild.createdBy.toString() !== req.user.id) {
        return next(new AppError('You do not have permission to rebuild this build', 403));
    }

    // Generate new version
    const versionParts = parentBuild.version.split('.');
    const patchVersion = parseInt(versionParts[2] || '0', 10) + 1;
    const newVersion = `${versionParts[0]}.${versionParts[1]}.${patchVersion}`;

    // Generate unique agent ID
    const agentId = 'AGENT_' + Math.random().toString(36).substr(2, 8).toUpperCase();

    // Create new build record
    const newBuild = new AgentBuild({
        agentId: agentId,
        name: parentBuild.name,
        version: newVersion,
        description: parentBuild.description,
        config: parentBuild.config,
        status: 'queued',
        progress: 0,
        createdBy: req.user.id,
        parentBuildId: parentBuild._id
    });

    await newBuild.save();

    // Update parent build version history
    parentBuild.versionHistory.push({
        version: newVersion,
        buildId: newBuild._id,
        createdAt: new Date()
    });
    await parentBuild.save();

    // Emit queued event
    agentBuildService.emitBuildEvent('build_queued', {
        buildId: newBuild._id.toString(),
        agentId: newBuild.agentId,
        name: newBuild.name
    });

    // Start generation asynchronously
    agentBuildService.generateAgent(newBuild._id, parentBuild.config).catch(error => {
        console.error('Error in async agent generation:', error);
    });

    res.status(201).json({
        status: 'success',
        data: {
            build: newBuild
        }
    });
});

/**
 * Get version history for a build
 */
exports.getVersionHistory = catchAsync(async (req, res, next) => {
    const build = await AgentBuild.findById(req.params.buildId);

    if (!build) {
        return next(new AppError('Build not found', 404));
    }

    // Check ownership or admin
    if (req.user.role !== 'admin' && build.createdBy.toString() !== req.user.id) {
        return next(new AppError('You do not have permission to view this build', 403));
    }

    // Get all versions (parent and children)
    const versions = await AgentBuild.find({
        $or: [
            { _id: build._id },
            { parentBuildId: build._id }
        ]
    }).sort({ version: 1, createdAt: 1 }).select('_id agentId name version status createdAt');

    res.status(200).json({
        status: 'success',
        data: {
            versions: versions
        }
    });
});

