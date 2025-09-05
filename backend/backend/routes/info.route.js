const express = require('express');
const infoController = require('../controllers/info.controller');
const router = express.Router();

// 🔒 Middleware to check authentication
function isAuthenticated(req, res, next) {
  if (req.isAuthenticated()) return next();
  res.status(401).json({ message: 'Unauthorized' });
}

// ✅ Protect this route
router.get('/get-user-list', isAuthenticated, infoController.getUserListAction);
router.get('/get-user/:uuid', isAuthenticated, infoController.getUserAction);

router.get('/', (req, res) => {
  res.status(200).json({
    status: "success",
    message: "Info APIs",
  });
});

module.exports = router;
