const express = require('express');
const buildController = require('../controllers/build.controller');
const { protect } = require('../middleware/security');
const buildAuth = require('../middleware/buildAuth');

const router = express.Router();

// All routes require authentication
router.use(protect);

// Build CRUD routes
router.get('/builds', buildController.getAllBuilds);
router.post('/builds', 
    buildAuth.rateLimitBuildCreation,
    buildAuth.checkBuildQuota,
    buildAuth.checkBuildPermission('canCreate'),
    buildController.createBuild
);
router.get('/builds/:buildId', buildAuth.checkBuildOwnership, buildController.getBuild);
router.delete('/builds/:buildId', 
    buildAuth.checkBuildOwnership,
    buildAuth.checkBuildPermission('canDelete'),
    buildController.deleteBuild
);
router.get('/builds/:buildId/download', 
    buildAuth.checkBuildOwnership,
    buildAuth.checkBuildPermission('canDownload'),
    buildController.downloadBuild
);
router.get('/builds/:buildId/logs', buildAuth.checkBuildOwnership, buildController.getBuildLogs);
router.post('/builds/:buildId/test', 
    buildAuth.checkBuildOwnership,
    buildAuth.checkBuildPermission('canTest'),
    buildController.testBuild
);
router.get('/builds/:buildId/test-results', buildAuth.checkBuildOwnership, buildController.getTestResults);
router.post('/builds/:buildId/archive', buildAuth.checkBuildOwnership, buildController.archiveBuild);
router.get('/storage/stats', buildController.getStorageStats);
router.post('/builds/:buildId/rebuild', 
    buildAuth.checkBuildOwnership,
    buildAuth.rateLimitBuildCreation,
    buildAuth.checkBuildQuota,
    buildAuth.checkBuildPermission('canCreate'),
    buildController.rebuild
);
router.get('/builds/:buildId/versions', buildAuth.checkBuildOwnership, buildController.getVersionHistory);

module.exports = router;

