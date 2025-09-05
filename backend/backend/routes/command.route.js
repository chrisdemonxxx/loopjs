// This file has been corrected to remove the extra closing brace
// that was causing a syntax error.

const express = require('express');
const { body } = require('express-validator');
const commandController = require('../controllers/command.controller');
const { verifyToken } = require('../middleware/authMiddleware');

const router = express.Router();

router.post(
    '/send-script-to-client',
    verifyToken,
    [
        body('uuid').isUUID().withMessage('Invalid UUID format'),
        body('commandKey').notEmpty().trim().escape().withMessage('commandKey is required')
    ],
    commandController.sendScriptToClientAction
);

router.get('/tasks/:uuid', verifyToken, commandController.getTasksForClientAction);

router.get('/', (req, res) => {
    res.status(200).json({
        status: "success",
        message: "Command APIs",
    });
});
module.exports = router;