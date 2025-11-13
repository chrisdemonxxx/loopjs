const express = require('express');
const userController = require('../controllers/user.controller');
const { protect } = require('../middleware/security');
const audit = require('../middleware/audit');

const router = express.Router();

// All profile routes require authentication
router.use(protect);

// Profile management routes
router.get('/profile', 
  audit('PROFILE_VIEW'),
  userController.getProfile
);

router.put('/profile', 
  audit('PROFILE_UPDATE'),
  userController.updateProfile
);

router.post('/profile/picture', 
  userController.uploadProfilePicture,
  audit('PROFILE_PICTURE_UPLOAD'),
  userController.uploadProfilePictureHandler
);

router.post('/password/change', 
  audit('PASSWORD_CHANGE'),
  userController.changePassword
);

router.post('/two-factor/toggle', 
  audit('TWO_FACTOR_TOGGLE'),
  userController.toggleTwoFactor
);

router.get('/sessions', 
  audit('SESSIONS_VIEW'),
  userController.getSessions
);

router.delete('/sessions/:sessionId', 
  audit('SESSION_REVOKE'),
  userController.revokeSession
);

router.delete('/sessions', 
  audit('ALL_SESSIONS_REVOKE'),
  userController.revokeAllSessions
);

router.delete('/account', 
  audit('ACCOUNT_DELETE'),
  userController.deleteAccount
);

module.exports = router;
