const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/security');  // Import protect middleware
const User = require('../models/User'); // Assuming User model is in ../models/User.js
const Client = require('../models/Client'); // Assuming Client model is in ../models/Client.js
const Task = require('../models/Task'); // Assuming Task model is in ../models/Task.js
const AuditLog = require('../models/AuditLog'); // Assuming AuditLog model is in ../models/AuditLog.js
const RefreshToken = require('../models/RefreshToken'); // Assuming RefreshToken model is in ../models/RefreshToken.js

// Apply protect middleware to all admin routes
router.use(protect);

// Database clearing endpoints
router.post('/clear-database', async (req, res) => {
  try {
    const { type } = req.body;
    
    switch (type) {
      case 'users':
        await User.deleteMany({});
        break;
      case 'clients':
        await Client.deleteMany({});
        break;
      case 'tasks':
        await Task.deleteMany({});
        break;
      case 'all':
        await User.deleteMany({});
        await Client.deleteMany({});
        await Task.deleteMany({});
        await AuditLog.deleteMany({});
        await RefreshToken.deleteMany({});
        break;
      default:
        return res.status(400).json({ error: 'Invalid clear type' });
    }
    
    res.json({ success: true, message: `${type} cleared successfully` });
  } catch (error) {
    console.error('Database clear error:', error);
    res.status(500).json({ error: 'Failed to clear database' });
  }
});

// Delete specific client
router.delete('/client/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await Client.deleteOne({ uuid: id });
    res.json({ success: true, message: 'Client deleted successfully' });
  } catch (error) {
    console.error('Client deletion error:', error);
    res.status(500).json({ error: 'Failed to delete client' });
  }
});

module.exports = router;