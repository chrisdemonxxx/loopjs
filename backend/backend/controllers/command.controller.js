const Task = require('../models/Task');

/**
 * Creates a new task in the database for an agent to execute.
 */
const sendScriptToClientAction = async (req, res) => {
    try {
        const { uuid, command } = req.body;

        if (!uuid || !command) {
            return res.status(400).json({
                status: 'fail',
                message: 'Request body must contain uuid and command.',
            });
        }

        const newTask = new Task({
            uuid,
            command,
            status: 'pending',
        });

        await newTask.save();

        res.status(201).json({
            status: 'success',
            message: `Task created for client ${uuid}`,
            task: newTask,
        });
    } catch (error) {
        console.error('Error creating task:', error);
        res.status(500).json({
            status: 'error',
            message: 'Internal server error while creating task.',
        });
    }
};

// Export the function so it can be used by command.route.js
module.exports = {
    sendScriptToClientAction,
};