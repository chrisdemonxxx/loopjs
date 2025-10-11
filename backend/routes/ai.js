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
    res.json({
        success: true,
        provider: 'gemini',
        available: isGeminiAvailable,
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

module.exports = router;