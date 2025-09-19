const express = require('express');
const router = express.Router();
const telegramService = require('../services/telegramService');
const { protect } = require('../middleware/security');

/**
 * Get current Telegram configuration
 */
router.get('/config', protect, async (req, res) => {
  try {
    const config = telegramService.getConfig();
    
    // Don't send the bot token in the response for security
    const safeConfig = {
      ...config,
      botToken: config.botToken ? '***CONFIGURED***' : ''
    };
    
    res.json({
      status: 'success',
      data: safeConfig
    });
  } catch (error) {
    console.error('Error getting Telegram config:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get Telegram configuration'
    });
  }
});

/**
 * Update Telegram configuration
 */
router.post('/config', protect, async (req, res) => {
  try {
    const { botToken, chatId, enabled, notifications } = req.body;
    
    const updateData = {};
    
    if (botToken !== undefined) updateData.botToken = botToken;
    if (chatId !== undefined) updateData.chatId = chatId;
    if (enabled !== undefined) updateData.enabled = enabled;
    if (notifications !== undefined) updateData.notifications = notifications;
    
    await telegramService.updateConfig(updateData);
    
    res.json({
      status: 'success',
      message: 'Telegram configuration updated successfully'
    });
  } catch (error) {
    console.error('Error updating Telegram config:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update Telegram configuration'
    });
  }
});

/**
 * Test Telegram bot connection
 */
router.post('/test', protect, async (req, res) => {
  try {
    const result = await telegramService.testBot();
    
    res.json({
      status: 'success',
      message: 'Telegram bot test successful',
      data: { working: result }
    });
  } catch (error) {
    console.error('Telegram bot test failed:', error);
    res.status(400).json({
      status: 'error',
      message: error.message || 'Telegram bot test failed'
    });
  }
});

/**
 * Send custom notification
 */
router.post('/notify', protect, async (req, res) => {
  try {
    const { title, message, data } = req.body;
    
    if (!title || !message) {
      return res.status(400).json({
        status: 'error',
        message: 'Title and message are required'
      });
    }
    
    await telegramService.sendCustomNotification(title, message, data);
    
    res.json({
      status: 'success',
      message: 'Notification sent successfully'
    });
  } catch (error) {
    console.error('Error sending notification:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to send notification'
    });
  }
});

/**
 * Get notification status
 */
router.get('/status', protect, async (req, res) => {
  try {
    const isEnabled = telegramService.isEnabled();
    const config = telegramService.getConfig();
    
    res.json({
      status: 'success',
      data: {
        enabled: isEnabled,
        configured: !!(config.botToken && config.chatId),
        notifications: config.notifications
      }
    });
  } catch (error) {
    console.error('Error getting Telegram status:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get Telegram status'
    });
  }
});

module.exports = router;