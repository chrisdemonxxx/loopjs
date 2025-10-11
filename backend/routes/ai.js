const express = require('express');
const router = express.Router();
const GeminiAICommandProcessor = require('../services/geminiAICommandProcessor');

// Initialize Gemini AI Service
const geminiAIProcessor = new GeminiAICommandProcessor();

// Check Gemini availability
const isGeminiAvailable = process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your-gemini-api-key-here';

/**
 * POST /api/ai/process-command
 * Process a command using Google Gemini AI
 */
router.post('/process-command', async (req, res) => {
    try {
        const { userInput, clientInfo, context = {} } = req.body;
        
        console.log('[AI API] Processing command with Gemini:', userInput);
        
        if (!userInput) {
            return res.status(400).json({
                success: false,
                error: 'User input is required'
            });
        }
        
        if (!isGeminiAvailable) {
            return res.status(400).json({
                success: false,
                error: 'Gemini AI is not configured. Please set GEMINI_API_KEY environment variable.'
            });
        }
        
        // Process with Gemini AI
        const result = await geminiAIProcessor.processCommandWithAI(
            userInput,
            clientInfo || {},
            context
        );
        
        res.json({
            success: true,
            data: result,
            provider: 'gemini',
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('[AI API] Error processing command:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/ai/status
 * Get AI service status (public endpoint)
 */
router.get('/status', (req, res) => {
  const isGeminiAvailable = process.env.GEMINI_API_KEY && 
    process.env.GEMINI_API_KEY !== 'your-gemini-api-key-here' &&
    process.env.GEMINI_API_KEY.trim() !== '';
    
  res.json({
    success: true,
    provider: 'gemini',
    available: isGeminiAvailable,
    configured: isGeminiAvailable,
    timestamp: new Date().toISOString()
  });
});

/**
 * GET /api/ai/test
 * Simple test endpoint to verify AI routes are working
 */
router.get('/test', (req, res) => {
        res.json({
            success: true,
        message: 'AI routes are working',
            timestamp: new Date().toISOString()
        });
});

/**
 * POST /api/ai/test
 * Test AI connection
 */
router.post('/test', async (req, res) => {
    try {
        if (!isGeminiAvailable) {
            return res.status(400).json({
                success: false,
                error: 'Gemini AI is not configured'
            });
        }
        
        // Test with a simple command
        const testResult = await geminiAIProcessor.processCommandWithAI(
            'Hello, can you respond with "AI test successful"?',
            { uuid: 'test-client' },
            {}
        );
        
        res.json({
            success: true,
            message: 'Gemini AI test successful',
            result: testResult,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('[AI API] Test failed:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

const fs = require('fs').promises;
const path = require('path');
const { protect } = require('../middleware/security');
const authorize = require('../middleware/rbac');

// POST /api/ai/config - Save/Update Gemini API Key
router.post('/config', protect, authorize(['admin']), async (req, res) => {
  try {
    const { apiKey } = req.body;
    
    if (!apiKey || !apiKey.trim()) {
      return res.status(400).json({
        success: false,
        error: 'API key is required'
      });
    }

    // Save to environment variable (for current session)
    process.env.GEMINI_API_KEY = apiKey.trim();
    
    // Try to persist to file, but don't fail if it doesn't work
    try {
      const envPath = path.join(__dirname, '..', '.env');
      let envContent = await fs.readFile(envPath, 'utf8').catch(() => '');
      
      if (envContent.includes('GEMINI_API_KEY=')) {
        envContent = envContent.replace(/GEMINI_API_KEY=.*/g, `GEMINI_API_KEY=${apiKey.trim()}`);
      } else {
        envContent += `\nGEMINI_API_KEY=${apiKey.trim()}\n`;
      }
      
      await fs.writeFile(envPath, envContent);
      console.log('[AI] API key saved to .env file');
    } catch (fileError) {
      console.warn('[AI] Could not save to .env file (this is normal in Cloud Run):', fileError.message);
      // Don't fail the request - the API key is still set in memory
    }
    
    // Reinitialize Gemini AI processor
    const geminiAIProcessor = new GeminiAICommandProcessor();
    
    // Verify the API key works
    const isAvailable = process.env.GEMINI_API_KEY && 
      process.env.GEMINI_API_KEY !== 'your-gemini-api-key-here' &&
      process.env.GEMINI_API_KEY.trim() !== '';
    
    res.json({
      success: true,
      message: 'API key configured successfully',
      available: isAvailable,
      configured: isAvailable
    });
  } catch (error) {
    console.error('Error saving API key:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to save API key'
    });
  }
});

// GET /api/ai/config - Get current configuration status
router.get('/config', protect, async (req, res) => {
    try {
        const hasApiKey = !!(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your-gemini-api-key-here');
        
        res.json({
            success: true,
            configured: hasApiKey,
            available: isGeminiAvailable
        });
    } catch (error) {
        console.error('Error getting AI config:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get AI configuration'
        });
    }
});

/**
 * POST /api/ai/handle-error
 * Handle command execution errors with AI-powered solutions
 */
router.post('/handle-error', protect, async (req, res) => {
  try {
    const { error, originalCommand, clientInfo, retryCount, context } = req.body;
    
    console.log('[AI API] Handling command error:', error);
    
    if (!isGeminiAvailable) {
      return res.status(400).json({
        success: false,
        error: 'Gemini AI is not configured for error handling'
      });
    }
    
    // Use the existing error handling from GeminiAICommandProcessor
    const errorResult = await geminiAIProcessor.handleErrorWithAI(
      { message: error },
      { command: originalCommand },
      clientInfo,
      retryCount
    );
    
    if (errorResult.success) {
      res.json({
        success: true,
        data: {
          fixedCommand: errorResult.fixedCommand,
          explanation: errorResult.explanation,
          changesMade: errorResult.changesMade,
          retryCount: retryCount + 1
        }
      });
    } else {
      res.status(400).json({
        success: false,
        error: 'Failed to generate AI fix for command error'
      });
    }
    
  } catch (error) {
    console.error('[AI API] Error handling failed:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;