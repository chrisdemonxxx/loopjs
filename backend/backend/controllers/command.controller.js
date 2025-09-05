const Task = require('../models/Task');
const commandQueue = require('../configs/queue');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

// Whitelist of allowed commands
const allowedCommands = {
    'get-processes': 'powershell -c "Get-Process | Select-Object -Property Name, CPU, Memory | ConvertTo-Json"',
    'get-services': 'powershell -c "Get-Service | Select-Object -Property Name, Status | ConvertTo-Json"',
    'get-system-info': 'powershell -c "Get-ComputerInfo | ConvertTo-Json"',
    'reboot-computer': 'powershell -c "Restart-Computer -Force"',
};

/**
 * Adds a new job to the command queue.
 */
const sendScriptToClientAction = catchAsync(async (req, res, next) => {
    const { uuid, commandKey } = req.body;

    if (!uuid || !commandKey) {
        return next(new AppError('Request body must contain uuid and commandKey.', 400));
    }

    const command = allowedCommands[commandKey];

    if (!command) {
        return next(new AppError('Invalid command.', 400));
    }

    const job = await commandQueue.add('execute-command', {
        uuid,
        command,
    });

    res.status(202).json({
        status: 'accepted',
        message: `Job accepted for client ${uuid}`,
        jobId: job.id,
    });
});

/**
 * Fetches all tasks for a specific client.
 */
const getTasksForClientAction = catchAsync(async (req, res, next) => {
    const { uuid } = req.params;
    const tasks = await Task.find({ uuid });
    res.status(200).json({
        status: 'success',
        data: tasks,
    });
});

// Export the function so it can be used by command.route.js
module.exports = {
    sendScriptToClientAction,
    getTasksForClientAction,
};