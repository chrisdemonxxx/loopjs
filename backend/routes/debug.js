const express = require('express');
const router = express.Router();
const wsHandler = require('../configs/ws.handler');

// Debug endpoint to check current WebSocket connections
router.get('/connections', (req, res) => {
    try {
        const stats = wsHandler.getConnectionStats();
        res.json({
            status: 'success',
            data: stats
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'Failed to get connection stats',
            error: error.message
        });
    }
});

// Debug endpoint to broadcast connection stats to web clients
router.post('/broadcast-stats', (req, res) => {
    try {
        wsHandler.broadcastConnectionStats();
        res.json({
            status: 'success',
            message: 'Connection stats broadcasted to web clients'
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'Failed to broadcast connection stats',
            error: error.message
        });
    }
});

module.exports = router;