const express = require('express');
const settingsController = require('../controllers/settings.controller');
const { protect } = require('../middleware/security');
const authorize = require('../middleware/rbac');
const audit = require('../middleware/audit');

const router = express.Router();

// All settings routes require authentication and admin role
router.use(protect);
router.use(authorize(['admin']));

router.get('/', 
  audit('SETTINGS_VIEW'),
  settingsController.getSettings
);

router.post('/', 
  audit('SETTINGS_UPDATE'),
  settingsController.updateSettings
);

module.exports = router;