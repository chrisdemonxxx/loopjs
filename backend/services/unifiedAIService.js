const GeminiAICommandProcessor = require('./geminiAICommandProcessor');
const VLLMService = require('./vlLMService');
const HuggingFaceService = require('./huggingFaceService');

/**
 * Unified AI Service
 * Manages fallback logic: Gemini → VL LM → Fallback
 * Uses Gemini initially, switches to VL LM after training
 */
class UnifiedAIService {
    constructor() {
        this.geminiProcessor = new GeminiAICommandProcessor();
        this.vllmService = new VLLMService();
        this.hfService = new HuggingFaceService();
        
        // Determine primary provider based on training status
        this.primaryProvider = this.vllmService.isModelTrained() ? 'vllm' : 'gemini';
        
        console.log('[UNIFIED AI] Primary provider:', this.primaryProvider);
        console.log('[UNIFIED AI] Gemini available:', this.geminiProcessor.isAvailable);
        console.log('[UNIFIED AI] VL LM available:', this.vllmService.isAvailable);
        console.log('[UNIFIED AI] VL LM trained:', this.vllmService.isModelTrained());
        console.log('[UNIFIED AI] Hugging Face available:', this.hfService.isAvailable);
    }

    /**
     * Process command with intelligent fallback
     * Priority: Primary Provider → Backup Provider → Fallback
     */
    async processCommand(userInput, clientInfo, context = {}) {
        try {
            // Step 1: Try primary provider
            if (this.primaryProvider === 'gemini' && this.geminiProcessor.isAvailable) {
                console.log('[UNIFIED AI] Using Gemini as primary provider');
                try {
                    const result = await this.geminiProcessor.processCommandWithAI(userInput, clientInfo, context);
                    if (result.success) {
                        return {
                            ...result,
                            provider: 'gemini',
                            fallbackUsed: false
                        };
                    }
                } catch (error) {
                    console.warn('[UNIFIED AI] Gemini failed, trying VL LM:', error.message);
                }
            } else if (this.primaryProvider === 'vllm' && this.vllmService.isAvailable) {
                console.log('[UNIFIED AI] Using VL LM as primary provider');
                try {
                    const result = await this.vllmService.processCommand(userInput, clientInfo, context);
                    if (result.success) {
                        return {
                            ...result,
                            provider: 'vllm',
                            fallbackUsed: false
                        };
                    }
                } catch (error) {
                    console.warn('[UNIFIED AI] VL LM failed, trying Gemini:', error.message);
                }
            }

            // Step 2: Try backup provider
            if (this.primaryProvider === 'gemini' && this.vllmService.isAvailable) {
                console.log('[UNIFIED AI] Using VL LM as backup provider');
                try {
                    const result = await this.vllmService.processCommand(userInput, clientInfo, context);
                    if (result.success) {
                        return {
                            ...result,
                            provider: 'vllm',
                            fallbackUsed: true
                        };
                    }
                } catch (error) {
                    console.warn('[UNIFIED AI] VL LM backup failed:', error.message);
                }
            } else if (this.primaryProvider === 'vllm' && this.geminiProcessor.isAvailable) {
                console.log('[UNIFIED AI] Using Gemini as backup provider');
                try {
                    const result = await this.geminiProcessor.processCommandWithAI(userInput, clientInfo, context);
                    if (result.success) {
                        return {
                            ...result,
                            provider: 'gemini',
                            fallbackUsed: true
                        };
                    }
                } catch (error) {
                    console.warn('[UNIFIED AI] Gemini backup failed:', error.message);
                }
            }

            // Step 3: Use fallback processing
            console.log('[UNIFIED AI] Using fallback processing');
            return await this.fallbackProcessing(userInput, clientInfo, context);

        } catch (error) {
            console.error('[UNIFIED AI] Error in unified processing:', error);
            return await this.fallbackProcessing(userInput, clientInfo, context);
        }
    }

    /**
     * Generate points using Hugging Face Point Generator
     */
    async generatePoints(userInput, clientInfo, context = {}) {
        try {
            if (this.hfService.isAvailable) {
                return await this.hfService.generatePoints(userInput, clientInfo, context);
            }
            
            // Fallback point generation
            return await this.hfService.fallbackPointGeneration(userInput, clientInfo, context);
        } catch (error) {
            console.error('[UNIFIED AI] Error generating points:', error);
            return await this.hfService.fallbackPointGeneration(userInput, clientInfo, context);
        }
    }

    /**
     * Handle errors with AI-powered solutions
     */
    async handleError(error, originalCommand, clientInfo, retryCount = 0) {
        try {
            // Try Gemini first
            if (this.geminiProcessor.isAvailable) {
                try {
                    return await this.geminiProcessor.handleErrorWithAI(error, originalCommand, clientInfo, retryCount);
                } catch (geminiError) {
                    console.warn('[UNIFIED AI] Gemini error handling failed:', geminiError.message);
                }
            }

            // Try VL LM
            if (this.vllmService.isAvailable) {
                try {
                    // VL LM can also handle errors by reprocessing
                    const errorContext = {
                        error: error.message,
                        originalCommand: originalCommand.command || originalCommand,
                        retryCount: retryCount
                    };
                    return await this.vllmService.processCommand(
                        `Fix this error: ${error.message}. Original command: ${originalCommand.command || originalCommand}`,
                        clientInfo,
                        errorContext
                    );
                } catch (vllmError) {
                    console.warn('[UNIFIED AI] VL LM error handling failed:', vllmError.message);
                }
            }

            // Fallback error handling
            return {
                success: false,
                error: error.message,
                retryCount: retryCount,
                fallback: true
            };

        } catch (error) {
            console.error('[UNIFIED AI] Error in error handling:', error);
            return {
                success: false,
                error: error.message,
                retryCount: retryCount,
                fallback: true
            };
        }
    }

    /**
     * Fallback processing
     */
    async fallbackProcessing(userInput, clientInfo, context) {
        // Use Gemini's fallback if available
        if (this.geminiProcessor) {
            return await this.geminiProcessor.fallbackProcessing(userInput, clientInfo, context);
        }
        
        // Otherwise use VL LM fallback
        if (this.vllmService) {
            return await this.vllmService.fallbackProcessing(userInput, clientInfo, context);
        }

        // Ultimate fallback
        return {
            success: true,
            data: {
                command: `echo "Command: ${userInput}"`,
                type: 'powershell',
                timeout: 300,
                explanation: 'Fallback command - AI services unavailable',
                safety_level: 'safe',
                alternatives: [],
                aiProcessed: false,
                model: 'fallback',
                provider: 'fallback',
                timestamp: new Date().toISOString()
            }
        };
    }

    /**
     * Get AI service status
     */
    getStatus() {
        return {
            primaryProvider: this.primaryProvider,
            gemini: {
                available: this.geminiProcessor.isAvailable,
                model: 'gemini-1.5-flash'
            },
            vllm: {
                available: this.vllmService.isAvailable,
                trained: this.vllmService.isModelTrained(),
                model: this.vllmService.modelName
            },
            huggingface: {
                available: this.hfService.isAvailable,
                pointGeneratorModel: this.hfService.pointGeneratorModel
            },
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Switch to VL LM as primary (after training)
     */
    switchToVLLM() {
        this.vllmService.markAsTrained();
        this.primaryProvider = 'vllm';
        console.log('[UNIFIED AI] Switched to VL LM as primary provider');
    }

    /**
     * Test all AI services
     */
    async testAllServices() {
        const results = {
            gemini: false,
            vllm: false,
            huggingface: false
        };

        try {
            if (this.geminiProcessor.isAvailable) {
                results.gemini = await this.geminiProcessor.testAIConnection();
            }
        } catch (error) {
            console.error('[UNIFIED AI] Gemini test failed:', error);
        }

        try {
            if (this.vllmService.isAvailable) {
                results.vllm = await this.vllmService.testConnection();
            }
        } catch (error) {
            console.error('[UNIFIED AI] VL LM test failed:', error);
        }

        try {
            if (this.hfService.isAvailable) {
                results.huggingface = await this.hfService.testConnection();
            }
        } catch (error) {
            console.error('[UNIFIED AI] Hugging Face test failed:', error);
        }

        return results;
    }
}

module.exports = UnifiedAIService;
