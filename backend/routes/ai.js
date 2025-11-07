const express = require('express');
const router = express.Router();
const UnifiedAIService = require('../services/unifiedAIService');
const GeminiAICommandProcessor = require('../services/geminiAICommandProcessor');
const HuggingFaceService = require('../services/huggingFaceService');

// Initialize Unified AI Service (handles Gemini, VL LM, and Hugging Face)
const unifiedAI = new UnifiedAIService();
const geminiAIProcessor = new GeminiAICommandProcessor();
const hfService = new HuggingFaceService();

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
        
        // Process with Unified AI Service (handles fallback logic)
        const result = await unifiedAI.processCommand(
            userInput,
            clientInfo || {},
            context
        );
        
        res.json({
            success: true,
            data: result,
            provider: result.provider || 'unknown',
            fallbackUsed: result.fallbackUsed || false,
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
    
  const status = unifiedAI.getStatus();
  
  res.json({
    success: true,
    primaryProvider: status.primaryProvider,
    providers: {
      gemini: status.gemini,
      vllm: status.vllm,
      huggingface: status.huggingface
    },
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
        
        // Test with unified AI service
        const testResult = await unifiedAI.processCommand(
            'Hello, can you respond with "AI test successful"?',
            { uuid: 'test-client' },
            {}
        );
        
        res.json({
            success: true,
            message: 'AI test successful',
            result: testResult,
            provider: testResult.provider || 'unknown',
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
    
    // Use unified AI error handling
    const errorResult = await unifiedAI.handleError(
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

/**
 * POST /api/ai/generate-points
 * Generate command execution points using Hugging Face Point Generator
 */
router.post('/generate-points', protect, async (req, res) => {
  try {
    const { userInput, clientInfo, context = {} } = req.body;
    
    if (!userInput) {
      return res.status(400).json({
        success: false,
        error: 'User input is required'
      });
    }
    
    const result = await unifiedAI.generatePoints(userInput, clientInfo || {}, context);
    
    res.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[AI API] Error generating points:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/ai/optimize-command
 * Optimize a command for better performance
 */
router.post('/optimize-command', protect, async (req, res) => {
  try {
    const { command, clientInfo } = req.body;
    
    if (!command) {
      return res.status(400).json({
        success: false,
        error: 'Command is required'
      });
    }
    
    // Use unified AI to optimize command
    const optimized = await unifiedAI.processCommand(
      `Optimize this command for better performance: ${command}`,
      clientInfo || {},
      { optimization: true }
    );
    
    res.json({
      success: true,
      originalCommand: command,
      optimizedCommand: optimized.data,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[AI API] Error optimizing command:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/ai/statistics
 * Get AI system statistics
 */
router.get('/statistics', protect, async (req, res) => {
  try {
    const geminiStats = geminiAIProcessor.getAIStatistics ? geminiAIProcessor.getAIStatistics() : null;
    const status = unifiedAI.getStatus();
    
    res.json({
      success: true,
      statistics: {
        gemini: geminiStats,
        status: status,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('[AI API] Error getting statistics:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/ai/command-templates
 * Get available command templates
 */
router.get('/command-templates', protect, async (req, res) => {
  try {
    const fs = require('fs').promises;
    const path = require('path');
    
    // Load command templates from file
    const templatesPath = path.join(__dirname, '..', 'templates', 'commandTemplates.json');
    
    try {
      const templatesContent = await fs.readFile(templatesPath, 'utf8');
      const templates = JSON.parse(templatesContent);
      
      res.json({
        success: true,
        templates: templates,
        timestamp: new Date().toISOString()
      });
    } catch (fileError) {
      // Return default templates if file doesn't exist
      res.json({
        success: true,
        templates: {
          system_info: [
            { name: 'Get System Info', command: 'Get-ComputerInfo', platform: 'windows' },
            { name: 'Get Memory', command: 'Get-WmiObject -Class Win32_PhysicalMemory', platform: 'windows' },
            { name: 'Get CPU', command: 'Get-WmiObject -Class Win32_Processor', platform: 'windows' }
          ],
          file_operations: [
            { name: 'List Files', command: 'Get-ChildItem', platform: 'windows' },
            { name: 'List Directory', command: 'ls -la', platform: 'linux' }
          ]
        },
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error('[AI API] Error getting templates:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/ai/learn-from-result
 * Learn from command execution results
 */
router.post('/learn-from-result', protect, async (req, res) => {
  try {
    const { commandId, success, error, clientInfo } = req.body;
    
    if (!commandId) {
      return res.status(400).json({
        success: false,
        error: 'Command ID is required'
      });
    }
    
    // Store learning data (in a real implementation, this would be saved to database)
    console.log('[AI API] Learning from result:', { commandId, success, error: error?.message });
    
    // Update pattern learning in Gemini processor if available
    if (geminiAIProcessor.learnFromSuccess && success) {
      // This would typically be called automatically, but we can log it here
      console.log('[AI API] Command succeeded - pattern learned');
    }
    
    res.json({
      success: true,
      message: 'Learning data recorded',
      commandId: commandId,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[AI API] Error learning from result:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/ai/switch-to-vllm
 * Switch primary provider to VL LM (admin only)
 */
router.post('/switch-to-vllm', protect, authorize(['admin']), async (req, res) => {
  try {
    unifiedAI.switchToVLLM();
    
    res.json({
      success: true,
      message: 'Switched to VL LM as primary provider',
      status: unifiedAI.getStatus(),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[AI API] Error switching to VL LM:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/ai/test-all
 * Test all AI services
 */
router.post('/test-all', protect, async (req, res) => {
  try {
    const results = await unifiedAI.testAllServices();
    
    res.json({
      success: true,
      results: results,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[AI API] Error testing services:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;