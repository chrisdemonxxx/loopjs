const express = require('express');
const commandRoute = require('./command.route');
const infoRoute = require('./info.route');

const router = express.Router();

router.use('/command', commandRoute);
router.use('/info', infoRoute);

// Base route
router.get('/', (req, res) => {
  res.status(200).json({
    status: "success",
    message: "Windows System Management & Deployment Tool APIs",
  });
});

module.exports = router;
