const express = require('express');
const router = express.Router();
const UnifiedAIService = require('../services/unifiedAIService');

// Initialize Unified AI Service (manages Gemini + VL LM + Hugging Face)
const unifiedAI = new UnifiedAIService();

// Check availability
const aiStatus = unifiedAI.getStatus();
const isGeminiAvailable = aiStatus.gemini.available;
const isVLLMAvailable = aiStatus.vllm.available;
const isHuggingFaceAvailable = aiStatus.huggingface.available;

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
        
        // Check if any AI provider is available
        if (!isGeminiAvailable && !isVLLMAvailable) {
            return res.status(400).json({
                success: false,
                error: 'No AI provider configured. Please set GEMINI_API_KEY or HUGGINGFACE_API_KEY environment variable.'
            });
        }
        
        // Process with Unified AI Service (Gemini primary, VL LM backup)
        const result = await unifiedAI.processCommandWithAI(
            userInput,
            clientInfo || {},
            context
        );
        
        res.json({
            success: true,
            data: result.data || result,
            provider: result.data?.provider || 'unified',
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
  const status = unifiedAI.getStatus();
    
  res.json({
    success: true,
    providers: {
      gemini: status.gemini,
      vllm: status.vllm,
      huggingface: status.huggingface
    },
    primaryProvider: status.primaryProvider,
    useVLLMAsBackup: status.useVLLMAsBackup,
    vllmTrained: status.vllmTrained,
    available: status.gemini.available || status.vllm.available,
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
        // Check if any AI provider is available
        if (!isGeminiAvailable && !isVLLMAvailable) {
            return res.status(400).json({
                success: false,
                error: 'No AI provider configured'
            });
        }
        
        // Test with a simple command
        const testResult = await unifiedAI.processCommandWithAI(
            'Hello, can you respond with "AI test successful"?',
            { uuid: 'test-client' },
            {}
        );
        
        res.json({
            success: true,
            message: 'AI test successful',
            result: testResult,
            provider: testResult.data?.provider || 'unified',
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

// POST /api/ai/config - Save/Update API Keys (Gemini, Hugging Face, VL LM)
router.post('/config', protect, authorize(['admin']), async (req, res) => {
  try {
    const { geminiApiKey, huggingfaceApiKey, vllmApiKey } = req.body;
    
    // Update Gemini API key if provided
    if (geminiApiKey) {
      process.env.GEMINI_API_KEY = geminiApiKey.trim();
    }
    
    // Update Hugging Face API key if provided (used for both HF and VL LM)
    if (huggingfaceApiKey) {
      process.env.HUGGINGFACE_API_KEY = huggingfaceApiKey.trim();
      // VL LM can use the same key
      if (!vllmApiKey) {
        process.env.VLLM_API_KEY = huggingfaceApiKey.trim();
      }
    }
    
    // Update VL LM API key if provided separately
    if (vllmApiKey) {
      process.env.VLLM_API_KEY = vllmApiKey.trim();
    }
    
    // Check if at least one API key is provided
    if (!geminiApiKey && !huggingfaceApiKey && !vllmApiKey) {
      return res.status(400).json({
        success: false,
        error: 'At least one API key is required (geminiApiKey, huggingfaceApiKey, or vllmApiKey)'
      });
    }
    
    // Try to persist to file, but don't fail if it doesn't work
    try {
      const envPath = path.join(__dirname, '..', '.env');
      let envContent = await fs.readFile(envPath, 'utf8').catch(() => '');
      
      // Update Gemini API key
      if (geminiApiKey) {
        if (envContent.includes('GEMINI_API_KEY=')) {
          envContent = envContent.replace(/GEMINI_API_KEY=.*/g, `GEMINI_API_KEY=${geminiApiKey.trim()}`);
        } else {
          envContent += `\nGEMINI_API_KEY=${geminiApiKey.trim()}\n`;
        }
      }
      
      // Update Hugging Face API key
      if (huggingfaceApiKey) {
        if (envContent.includes('HUGGINGFACE_API_KEY=')) {
          envContent = envContent.replace(/HUGGINGFACE_API_KEY=.*/g, `HUGGINGFACE_API_KEY=${huggingfaceApiKey.trim()}`);
        } else {
          envContent += `\nHUGGINGFACE_API_KEY=${huggingfaceApiKey.trim()}\n`;
        }
      }
      
      // Update VL LM API key
      if (vllmApiKey) {
        if (envContent.includes('VLLM_API_KEY=')) {
          envContent = envContent.replace(/VLLM_API_KEY=.*/g, `VLLM_API_KEY=${vllmApiKey.trim()}`);
        } else {
          envContent += `\nVLLM_API_KEY=${vllmApiKey.trim()}\n`;
        }
      }
      
      await fs.writeFile(envPath, envContent);
      console.log('[AI] API keys saved to .env file');
    } catch (fileError) {
      console.warn('[AI] Could not save to .env file (this is normal in Cloud Run):', fileError.message);
      // Don't fail the request - the API keys are still set in memory
    }
    
    // Reinitialize unified AI service
    const newUnifiedAI = new UnifiedAIService();
    Object.assign(unifiedAI, newUnifiedAI);
    
    // Verify the API key works
    const status = unifiedAI.getStatus();
    
    res.json({
      success: true,
      message: 'API keys configured successfully',
      available: status.gemini.available || status.vllm.available || status.huggingface.available,
      configured: {
        gemini: status.gemini.available,
        vllm: status.vllm.available,
        huggingface: status.huggingface.available
      },
      providers: status
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
        const status = unifiedAI.getStatus();
        
        res.json({
            success: true,
            configured: status.gemini.available || status.vllm.available,
            available: status.gemini.available || status.vllm.available,
            providers: status,
            primaryProvider: status.primaryProvider,
            useVLLMAsBackup: status.useVLLMAsBackup,
            vllmTrained: status.vllmTrained
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
    
    // Check if any AI provider is available
    if (!isGeminiAvailable && !isVLLMAvailable) {
      return res.status(400).json({
        success: false,
        error: 'No AI provider configured for error handling'
      });
    }
    
    // Use unified AI service error handling
    const errorResult = await unifiedAI.handleErrorWithAI(
      { message: error },
      { command: originalCommand },
      clientInfo,
      retryCount
    );
    
    if (errorResult.success) {
      res.json({
        success: true,
        data: {
          fixedCommand: errorResult.data?.command || errorResult.fixedCommand,
          explanation: errorResult.data?.explanation || errorResult.explanation,
          changesMade: errorResult.data?.changes_made || errorResult.changesMade,
          retryCount: errorResult.data?.retryCount || retryCount + 1,
          provider: errorResult.data?.provider || 'unified'
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
 * Generate points/coordinates using Hugging Face Point Generator
 */
router.post('/generate-points', protect, async (req, res) => {
  try {
    const { prompt, context = {} } = req.body;
    
    if (!prompt) {
      return res.status(400).json({
        success: false,
        error: 'Prompt is required for point generation'
      });
    }
    
    if (!isHuggingFaceAvailable) {
      return res.status(400).json({
        success: false,
        error: 'Hugging Face API key not configured. Please set HUGGINGFACE_API_KEY environment variable.'
      });
    }
    
    console.log('[AI API] Generating points with Hugging Face:', prompt);
    
    const result = await unifiedAI.generatePoints(prompt, context);
    
    res.json({
      success: true,
      data: result,
      provider: 'huggingface',
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
 * POST /api/ai/config/update
 * Update AI configuration (provider selection, training status, etc.)
 */
router.post('/config/update', protect, authorize(['admin']), async (req, res) => {
  try {
    const { primaryProvider, useVLLMAsBackup, vllmTrained } = req.body;
    
    unifiedAI.updateConfig({
      primaryProvider,
      useVLLMAsBackup,
      vllmTrained
    });
    
    // Update environment variables
    if (primaryProvider) {
      process.env.AI_PRIMARY_PROVIDER = primaryProvider;
    }
    if (useVLLMAsBackup !== undefined) {
      process.env.AI_USE_VLLM_BACKUP = useVLLMAsBackup ? 'true' : 'false';
    }
    if (vllmTrained !== undefined) {
      process.env.VLLM_TRAINED = vllmTrained ? 'true' : 'false';
    }
    
    const status = unifiedAI.getStatus();
    
    res.json({
      success: true,
      message: 'AI configuration updated successfully',
      config: {
        primaryProvider: status.primaryProvider,
        useVLLMAsBackup: status.useVLLMAsBackup,
        vllmTrained: status.vllmTrained
      }
    });
    
  } catch (error) {
    console.error('[AI API] Error updating config:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update AI configuration'
    });
  }
});

module.exports = router;