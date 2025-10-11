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

// General command sending endpoint (alias for send-script-to-client)
router.post('/send', 
  commandRateLimit,
  authorize(['admin', 'user']), 
  audit('COMMAND_EXECUTE', (req) => ({ command: req.body.command, target: req.body.uuid })),
  commandController.sendScriptToClientAction
);

router.get('/tasks/:uuid', 
  authorize(['admin', 'user', 'viewer']), 
  audit('TASKS_VIEW', (req) => ({ uuid: req.params.uuid })),
  commandController.getTasksForClientAction
);

router.get('/available/:uuid', 
  authorize(['admin', 'user']), 
  audit('COMMANDS_LIST', (req) => ({ uuid: req.params.uuid })),
  commandController.getAvailableCommandsAction
);

router.post('/validate', 
  authorize(['admin', 'user']), 
  audit('COMMAND_VALIDATE', (req) => ({ command: req.body.command, target: req.body.uuid })),
  commandController.validateCommandAction
);

router.post('/result', 
  commandController.handleCommandResultAction
);

router.get('/', (req, res) => {
    res.status(200).json({
        status: "success",
        message: "Command APIs",
    });
});
module.exports = router;