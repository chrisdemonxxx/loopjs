// This file has been corrected to remove the extra closing brace
// that was causing a syntax error.

const express = require('express');
const commandController = require('../controllers/command.controller');

const router = express.Router();

router.post('/send-script-to-client', commandController.sendScriptToClientAction);

router.get('/', (req, res) => {
    res.status(200).json({
        status: "success",
        message: "Command APIs",
    });
});
module.exports = router;