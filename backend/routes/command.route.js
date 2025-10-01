const express = require('express');
const commandController = require('../controllers/command.controller');
const authorize = require('../middleware/rbac');
const audit = require('../middleware/audit');
const { commandRateLimit } = require('../middleware/security');

const router = express.Router();

router.post('/send-script-to-client', 
  commandRateLimit,
  authorize(['admin', 'user']), 
  audit('COMMAND_EXECUTE', (req) => ({ command: req.body.commandKey, target: req.body.uuid })),
  commandController.sendScriptToClientAction
);

router.get('/tasks/:uuid', 
  authorize(['admin', 'user', 'viewer']), 
  audit('TASKS_VIEW', (req) => ({ uuid: req.params.uuid })),
  commandController.getTasksForClientAction
);

router.get('/', (req, res) => {
    res.status(200).json({
        status: "success",
        message: "Command APIs",
    });
});
module.exports = router;