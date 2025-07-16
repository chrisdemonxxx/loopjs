
const { body, validationResult } = require('express-validator');
const Task = require('../models/Task');

exports.sendCommand = [
    body('uuid').isString().notEmpty().trim().escape(),
    body('command').isString().notEmpty().trim().escape(),

    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { uuid, command } = req.body;

        try {
            const task = new Task({ uuid, command });
            await task.save();
            return res.status(200).json({ message: 'Task queued successfully.' });
        } catch (err) {
            console.error('Error sending command:', err);
            return res.status(500).json({ error: 'Server error' });
        }
    }
];
