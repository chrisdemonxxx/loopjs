const express = require('express');
const router = express.Router();
const UnifiedAIService = require('../services/unifiedAIService');

// Initialize Unified AI Service (supports Gemini and Hugging Face)
const aiService = new UnifiedAIService();

// Check availability
const status = aiService.getStatus();
const isGeminiAvailable = status.gemini.available;
const isHuggingFaceAvailable = status.huggingface.available;

/**
 * POST /api/ai/process-command
 * Process a command using Unified AI Service (Gemini or Hugging Face)
 */
router.post('/process-command', async (req, res) => {
    try {
        const { userInput, clientInfo, context = {} } = req.body;
        
        console.log('[AI API] Processing command with Unified AI Service:', userInput);
        
        if (!userInput) {
            return res.status(400).json({
                success: false,
                error: 'User input is required'
            });
        }
        
        if (!isGeminiAvailable && !isHuggingFaceAvailable) {
            return res.status(400).json({
                success: false,
                error: 'No AI providers configured. Please set GEMINI_API_KEY or HUGGINGFACE_API_KEY environment variable.'
            });
        }
        
        // Process with Unified AI Service
        const result = await aiService.processCommandWithAI(
            userInput,
            clientInfo || {},
            context
        );
        
        res.json({
            success: true,
            ...result,
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
  const status = aiService.getStatus();
    
  res.json({
    success: true,
    ...status,
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
        const status = aiService.getStatus();
        
        if (!status.gemini.available && !status.huggingface.available) {
            return res.status(400).json({
                success: false,
                error: 'No AI providers are configured'
            });
        }
        
        // Test with a simple command
        const testResult = await aiService.processCommandWithAI(
            'Hello, can you respond with "AI test successful"?',
            { uuid: 'test-client' },
            {}
        );
        
        res.json({
            success: true,
            message: 'AI test successful',
            result: testResult,
            provider: status.primaryProvider,
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

// POST /api/ai/config - Save/Update AI API Keys
router.post('/config', protect, authorize(['admin']), async (req, res) => {
  try {
    const { geminiApiKey, huggingfaceApiKey, huggingfaceModel, useVLLM, vlLmTrained } = req.body;
    
    // Update Gemini API key if provided
    if (geminiApiKey !== undefined) {
      if (!geminiApiKey || !geminiApiKey.trim()) {
        return res.status(400).json({
          success: false,
          error: 'Gemini API key cannot be empty'
        });
      }
      process.env.GEMINI_API_KEY = geminiApiKey.trim();
    }
    
    // Update Hugging Face API key if provided
    if (huggingfaceApiKey !== undefined) {
      if (!huggingfaceApiKey || !huggingfaceApiKey.trim()) {
        return res.status(400).json({
          success: false,
          error: 'Hugging Face API key cannot be empty'
        });
      }
      process.env.HUGGINGFACE_API_KEY = huggingfaceApiKey.trim();
    }
    
    // Update Hugging Face model if provided
    if (huggingfaceModel) {
      process.env.HUGGINGFACE_MODEL = huggingfaceModel.trim();
    }
    
    // Update VL LM flags
    if (useVLLM !== undefined) {
      process.env.USE_VL_LM = useVLLM ? 'true' : 'false';
    }
    
    if (vlLmTrained !== undefined) {
      process.env.VL_LM_TRAINED = vlLmTrained ? 'true' : 'false';
    }
    
    // Try to persist to file, but don't fail if it doesn't work
    try {
      const envPath = path.join(__dirname, '..', '.env');
      let envContent = await fs.readFile(envPath, 'utf8').catch(() => '');
      
      // Update or add environment variables
      const updates = {
        'GEMINI_API_KEY': geminiApiKey,
        'HUGGINGFACE_API_KEY': huggingfaceApiKey,
        'HUGGINGFACE_MODEL': huggingfaceModel,
        'USE_VL_LM': useVLLM !== undefined ? (useVLLM ? 'true' : 'false') : undefined,
        'VL_LM_TRAINED': vlLmTrained !== undefined ? (vlLmTrained ? 'true' : 'false') : undefined
      };
      
      for (const [key, value] of Object.entries(updates)) {
        if (value !== undefined) {
          const regex = new RegExp(`^${key}=.*$`, 'm');
          if (envContent.match(regex)) {
            envContent = envContent.replace(regex, `${key}=${value}`);
          } else {
            envContent += `\n${key}=${value}\n`;
          }
        }
      }
      
      await fs.writeFile(envPath, envContent);
      console.log('[AI] Configuration saved to .env file');
    } catch (fileError) {
      console.warn('[AI] Could not save to .env file (this is normal in Cloud Run):', fileError.message);
    }
    
    // Reinitialize AI service with new configuration
    // Note: In a production environment, you may need to restart the service
    // for full reinitialization. This works for runtime config updates.
    const newAIService = new UnifiedAIService();
    // Copy properties to existing instance
    Object.keys(newAIService).forEach(key => {
      aiService[key] = newAIService[key];
    });
    
    // Get updated status
    const status = aiService.getStatus();
    
    res.json({
      success: true,
      message: 'AI configuration updated successfully',
      status: status
    });
  } catch (error) {
    console.error('Error saving AI configuration:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to save AI configuration'
    });
  }
});

// GET /api/ai/config - Get current configuration status
router.get('/config', protect, async (req, res) => {
    try {
        const status = aiService.getStatus();
        
        res.json({
            success: true,
            status: status,
            configured: status.gemini.available || status.huggingface.available
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
    
    const status = aiService.getStatus();
    if (!status.gemini.available && !status.huggingface.available) {
      return res.status(400).json({
        success: false,
        error: 'No AI providers are configured for error handling'
      });
    }
    
    // Use unified AI service error handling
    const errorResult = await aiService.handleErrorWithAI(
      { message: error },
      { command: originalCommand },
      clientInfo || {},
      retryCount || 0
    );
    
    if (errorResult.success) {
      res.json({
        success: true,
        data: errorResult.data
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

/**
 * POST /api/ai/generate-points
 * Generate command execution points using Point Generator (Hugging Face)
 */
router.post('/generate-points', protect, async (req, res) => {
  try {
    const { userInput, clientInfo, context } = req.body;
    
    console.log('[AI API] Generating points with Point Generator:', userInput);
    
    if (!userInput) {
      return res.status(400).json({
        success: false,
        error: 'User input is required'
      });
    }
    
    const status = aiService.getStatus();
    if (!status.huggingface.available) {
      return res.status(400).json({
        success: false,
        error: 'Hugging Face is not configured for Point Generator'
      });
    }
    
    const result = await aiService.generatePoints(
      userInput,
      clientInfo || {},
      context || {}
    );
    
    res.json({
      success: true,
      ...result
    });
    
  } catch (error) {
    console.error('[AI API] Point Generator error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/ai/statistics
 * Get AI service statistics
 */
router.get('/statistics', protect, async (req, res) => {
  try {
    const stats = aiService.getStatistics();
    res.json({
      success: true,
      ...stats
    });
  } catch (error) {
    console.error('[AI API] Error getting statistics:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;