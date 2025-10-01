const express = require('express');
const infoController = require('../controllers/info.controller');
const authorize = require('../middleware/rbac');
const audit = require('../middleware/audit');
const router = express.Router();

// Admin-only route for getting user list
router.get('/get-user-list', 
  authorize(['admin']), 
  audit('USER_LIST_ACCESS'),
  infoController.getUserListAction
);

// Client registration endpoint (no auth required for clients to register)
router.post('/register-client', 
  audit('CLIENT_REGISTRATION'),
  infoController.registerClientAction
);

// Client heartbeat endpoint (no auth required for clients to send heartbeat)
router.post('/client-heartbeat', 
  infoController.updateClientHeartbeatAction
);

router.get('/', (req, res) => {
  res.status(200).json({
    status: "success",
    message: "Info APIs",
  });
});

module.exports = router;
