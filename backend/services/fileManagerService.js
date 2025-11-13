const fs = require('fs');
const path = require('path');
const AgentBuild = require('../models/AgentBuild');

// Get storage path from environment or use default
const STORAGE_PATH = process.env.BUILD_STORAGE_PATH || path.join(__dirname, '../temp');
const ARCHIVE_PATH = process.env.BUILD_ARCHIVE_PATH || path.join(__dirname, '../archive');
const RETENTION_DAYS = parseInt(process.env.BUILD_RETENTION_DAYS || '30', 10);

/**
 * Ensure storage directories exist
 */
function ensureDirectories() {
    if (!fs.existsSync(STORAGE_PATH)) {
        fs.mkdirSync(STORAGE_PATH, { recursive: true });
    }
    if (!fs.existsSync(ARCHIVE_PATH)) {
        fs.mkdirSync(ARCHIVE_PATH, { recursive: true });
    }
}

/**
 * Cleanup old builds (older than specified days)
 */
async function cleanupOldBuilds(daysOld = RETENTION_DAYS) {
    ensureDirectories();
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const oldBuilds = await AgentBuild.find({
        createdAt: { $lt: cutoffDate },
        status: { $in: ['ready', 'error', 'cancelled'] }
    });

    let deletedCount = 0;
    let totalSizeFreed = 0;

    for (const build of oldBuilds) {
        try {
            const sizeFreed = await deleteBuildFiles(build._id);
            totalSizeFreed += sizeFreed;
            await AgentBuild.findByIdAndDelete(build._id);
            deletedCount++;
        } catch (error) {
            console.error(`Error cleaning up build ${build._id}:`, error);
        }
    }

    return {
        deletedCount,
        totalSizeFreed,
        cutoffDate: cutoffDate.toISOString()
    };
}

/**
 * Cleanup failed builds
 */
async function cleanupFailedBuilds() {
    ensureDirectories();

    const failedBuilds = await AgentBuild.find({
        status: 'error',
        createdAt: { $lt: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Older than 24 hours
    });

    let deletedCount = 0;
    let totalSizeFreed = 0;

    for (const build of failedBuilds) {
        try {
            const sizeFreed = await deleteBuildFiles(build._id);
            totalSizeFreed += sizeFreed;
            await AgentBuild.findByIdAndDelete(build._id);
            deletedCount++;
        } catch (error) {
            console.error(`Error cleaning up failed build ${build._id}:`, error);
        }
    }

    return {
        deletedCount,
        totalSizeFreed
    };
}

/**
 * Get storage usage statistics
 */
async function getStorageUsage() {
    ensureDirectories();

    const builds = await AgentBuild.find({ status: 'ready' });
    
    let totalSize = 0;
    let fileCount = 0;
    const buildsByStatus = {};

    for (const build of builds) {
        if (build.filePaths) {
            const filePaths = Object.values(build.filePaths).filter(Boolean);
            for (const filePath of filePaths) {
                if (fs.existsSync(filePath)) {
                    try {
                        const stats = fs.statSync(filePath);
                        totalSize += stats.size;
                        fileCount++;
                    } catch (error) {
                        console.error(`Error getting file stats for ${filePath}:`, error);
                    }
                }
            }
        }

        // Count by status
        buildsByStatus[build.status] = (buildsByStatus[build.status] || 0) + 1;
    }

    // Get directory sizes
    let tempDirSize = 0;
    let archiveDirSize = 0;

    try {
        tempDirSize = getDirectorySize(STORAGE_PATH);
    } catch (error) {
        console.error('Error calculating temp directory size:', error);
    }

    try {
        archiveDirSize = getDirectorySize(ARCHIVE_PATH);
    } catch (error) {
        console.error('Error calculating archive directory size:', error);
    }

    return {
        totalSize,
        totalSizeMB: (totalSize / 1024 / 1024).toFixed(2),
        fileCount,
        buildsByStatus,
        tempDirSize: (tempDirSize / 1024 / 1024).toFixed(2),
        archiveDirSize: (archiveDirSize / 1024 / 1024).toFixed(2),
        storagePath: STORAGE_PATH,
        archivePath: ARCHIVE_PATH
    };
}

/**
 * Calculate directory size recursively
 */
function getDirectorySize(dirPath) {
    let totalSize = 0;

    if (!fs.existsSync(dirPath)) {
        return 0;
    }

    const files = fs.readdirSync(dirPath);
    
    for (const file of files) {
        const filePath = path.join(dirPath, file);
        const stats = fs.statSync(filePath);
        
        if (stats.isDirectory()) {
            totalSize += getDirectorySize(filePath);
        } else {
            totalSize += stats.size;
        }
    }

    return totalSize;
}

/**
 * Archive a build (move to archive storage)
 */
async function archiveBuild(buildId) {
    ensureDirectories();

    const build = await AgentBuild.findById(buildId);
    if (!build) {
        throw new Error('Build not found');
    }

    if (!build.filePaths) {
        throw new Error('No files to archive');
    }

    const archivedPaths = {};
    let totalSize = 0;

    for (const [fileType, filePath] of Object.entries(build.filePaths)) {
        if (!filePath || !fs.existsSync(filePath)) {
            continue;
        }

        const fileName = path.basename(filePath);
        const archiveFilePath = path.join(ARCHIVE_PATH, `${build.agentId}_${fileName}`);

        try {
            fs.renameSync(filePath, archiveFilePath);
            archivedPaths[fileType] = archiveFilePath;
            
            const stats = fs.statSync(archiveFilePath);
            totalSize += stats.size;
        } catch (error) {
            console.error(`Error archiving file ${filePath}:`, error);
            throw error;
        }
    }

    // Update build with archived paths
    build.filePaths = archivedPaths;
    await build.save();

    return {
        buildId: build._id.toString(),
        archivedPaths,
        totalSize,
        totalSizeMB: (totalSize / 1024 / 1024).toFixed(2)
    };
}

/**
 * Delete all files for a build
 */
async function deleteBuildFiles(buildId) {
    const build = await AgentBuild.findById(buildId);
    if (!build || !build.filePaths) {
        return 0;
    }

    let totalSizeFreed = 0;
    const filePaths = Object.values(build.filePaths).filter(Boolean);

    for (const filePath of filePaths) {
        if (fs.existsSync(filePath)) {
            try {
                const stats = fs.statSync(filePath);
                totalSizeFreed += stats.size;
                fs.unlinkSync(filePath);
            } catch (error) {
                console.error(`Error deleting file ${filePath}:`, error);
            }
        }
    }

    return totalSizeFreed;
}

/**
 * Initialize cleanup job (to be called by scheduler)
 */
function initializeCleanupJob() {
    // Run cleanup daily
    const cleanupInterval = 24 * 60 * 60 * 1000; // 24 hours

    setInterval(async () => {
        console.log('[FileManager] Running scheduled cleanup...');
        try {
            const oldBuildsResult = await cleanupOldBuilds();
            const failedBuildsResult = await cleanupFailedBuilds();
            
            console.log('[FileManager] Cleanup completed:', {
                oldBuilds: oldBuildsResult,
                failedBuilds: failedBuildsResult
            });
        } catch (error) {
            console.error('[FileManager] Error during cleanup:', error);
        }
    }, cleanupInterval);

    // Run initial cleanup after 1 minute
    setTimeout(async () => {
        console.log('[FileManager] Running initial cleanup...');
        try {
            await cleanupOldBuilds();
            await cleanupFailedBuilds();
        } catch (error) {
            console.error('[FileManager] Error during initial cleanup:', error);
        }
    }, 60 * 1000);
}

module.exports = {
    cleanupOldBuilds,
    cleanupFailedBuilds,
    getStorageUsage,
    archiveBuild,
    deleteBuildFiles,
    initializeCleanupJob,
    ensureDirectories
};

