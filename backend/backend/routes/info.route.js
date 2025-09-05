const express = require('express');
const infoController = require('../controllers/info.controller');
const { verifyToken, checkRole } = require('../middleware/authMiddleware');
const router = express.Router();

// ✅ Protect this route
router.get('/get-user-list', verifyToken, checkRole(['admin']), infoController.getUserListAction);

router.get('/', (req, res) => {
  res.status(200).json({
    status: "success",
    message: "Info APIs",
  });
});

module.exports = router;
