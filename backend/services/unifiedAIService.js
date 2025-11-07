const GeminiAICommandProcessor = require('./geminiAICommandProcessor');
const VLLMService = require('./vlLMService');
const HuggingFaceService = require('./huggingFaceService');

/**
 * Unified AI Service
 * Manages multiple AI providers with fallback logic
 * Primary: Gemini API
 * Backup: VL LM (Vision Language Model)
 * Special: Hugging Face for Point Generation
 */
class UnifiedAIService {
    constructor() {
        this.geminiProcessor = new GeminiAICommandProcessor();
        this.vllmService = new VLLMService();
        this.hfService = new HuggingFaceService();
        
        // Configuration from environment or settings
        this.primaryProvider = process.env.AI_PRIMARY_PROVIDER || 'gemini';
        this.useVLLMAsBackup = process.env.AI_USE_VLLM_BACKUP !== 'false';
        this.vllmTrained = process.env.VLLM_TRAINED === 'true'; // Set to true when VL LM is trained
        
        console.log('[UNIFIED AI] Service initialized');
        console.log('[UNIFIED AI] Primary provider:', this.primaryProvider);
        console.log('[UNIFIED AI] VL LM backup enabled:', this.useVLLMAsBackup);
        console.log('[UNIFIED AI] VL LM trained:', this.vllmTrained);
    }

    /**
     * Process command with AI (primary: Gemini, fallback: VL LM)
     */
    async processCommandWithAI(userInput, clientInfo, context = {}) {
        try {
            // If VL LM is trained, use it as primary
            if (this.vllmTrained && this.vllmService.isAvailable) {
                console.log('[UNIFIED AI] Using VL LM as primary (trained)');
                try {
                    const result = await this.vllmService.processCommand(userInput, clientInfo, context);
                    // Ensure consistent response format
                    if (result && result.success && result.data) {
                        return result;
                    }
                    // If result is already in correct format, return as-is
                    return result;
                } catch (error) {
                    console.error('[UNIFIED AI] VL LM failed, falling back to Gemini:', error);
                    // Fallback to Gemini if VL LM fails
                    if (this.geminiProcessor.isAvailable) {
                        return await this.geminiProcessor.processCommandWithAI(userInput, clientInfo, context);
                    }
                    throw error;
                }
            }
            
            // Use Gemini as primary
            if (this.geminiProcessor.isAvailable) {
                console.log('[UNIFIED AI] Using Gemini as primary');
                try {
                    return await this.geminiProcessor.processCommandWithAI(userInput, clientInfo, context);
                } catch (error) {
                    console.error('[UNIFIED AI] Gemini failed, falling back to VL LM:', error);
                    // Fallback to VL LM if enabled
                    if (this.useVLLMAsBackup && this.vllmService.isAvailable) {
                        const result = await this.vllmService.processCommand(userInput, clientInfo, context);
                        // Ensure consistent response format
                        if (result && result.success && result.data) {
                            return result;
                        }
                        return result;
                    }
                    throw error;
                }
            }
            
            // Try VL LM if Gemini not available
            if (this.vllmService.isAvailable) {
                console.log('[UNIFIED AI] Gemini not available, using VL LM');
                const result = await this.vllmService.processCommand(userInput, clientInfo, context);
                // Ensure consistent response format
                if (result && result.success && result.data) {
                    return result;
                }
                return result;
            }
            
            // Both unavailable - use fallback
            console.log('[UNIFIED AI] Both providers unavailable, using fallback');
            return await this.geminiProcessor.fallbackProcessing(userInput, clientInfo, context);
            
        } catch (error) {
            console.error('[UNIFIED AI] Error processing command:', error);
            // Final fallback
            return await this.geminiProcessor.fallbackProcessing(userInput, clientInfo, context);
        }
    }

    /**
     * Handle errors with AI (try primary, then backup)
     */
    async handleErrorWithAI(error, originalCommand, clientInfo, retryCount = 0) {
        try {
            // If VL LM is trained, use it first
            if (this.vllmTrained && this.vllmService.isAvailable) {
                try {
                    return await this.vllmService.handleError(error, originalCommand, clientInfo, retryCount);
                } catch (vllmError) {
                    console.error('[UNIFIED AI] VL LM error handling failed:', vllmError);
                    // Fallback to Gemini
                    if (this.geminiProcessor.isAvailable) {
                        return await this.geminiProcessor.handleErrorWithAI(error, originalCommand, clientInfo, retryCount);
                    }
                }
            }
            
            // Use Gemini first
            if (this.geminiProcessor.isAvailable) {
                try {
                    return await this.geminiProcessor.handleErrorWithAI(error, originalCommand, clientInfo, retryCount);
                } catch (geminiError) {
                    console.error('[UNIFIED AI] Gemini error handling failed:', geminiError);
                    // Fallback to VL LM
                    if (this.useVLLMAsBackup && this.vllmService.isAvailable) {
                        return await this.vllmService.handleError(error, originalCommand, clientInfo, retryCount);
                    }
                }
            }
            
            // Fallback to VL LM if Gemini not available
            if (this.vllmService.isAvailable) {
                return await this.vllmService.handleError(error, originalCommand, clientInfo, retryCount);
            }
            
            // Both unavailable
            return await this.geminiProcessor.fallbackErrorHandling(error, originalCommand, clientInfo, retryCount);
            
        } catch (error) {
            console.error('[UNIFIED AI] Error handling failed:', error);
            return await this.geminiProcessor.fallbackErrorHandling(error, originalCommand, clientInfo, retryCount);
        }
    }

    /**
     * Generate points using Hugging Face Point Generator
     */
    async generatePoints(prompt, context = {}) {
        try {
            if (!this.hfService.isAvailable) {
                throw new Error('Hugging Face API key not configured');
            }
            
            return await this.hfService.generatePoints(prompt, context);
        } catch (error) {
            console.error('[UNIFIED AI] Point generation failed:', error);
            throw error;
        }
    }

    /**
     * Get service status
     */
    getStatus() {
        return {
            gemini: {
                available: this.geminiProcessor.isAvailable,
                provider: 'gemini'
            },
            vllm: {
                available: this.vllmService.isAvailable,
                provider: 'vllm',
                trained: this.vllmTrained,
                model: this.vllmService.model
            },
            huggingface: {
                available: this.hfService.isAvailable,
                provider: 'huggingface'
            },
            primaryProvider: this.primaryProvider,
            useVLLMAsBackup: this.useVLLMAsBackup,
            vllmTrained: this.vllmTrained
        };
    }

    /**
     * Update configuration
     */
    updateConfig(config) {
        if (config.primaryProvider) {
            this.primaryProvider = config.primaryProvider;
        }
        if (config.useVLLMAsBackup !== undefined) {
            this.useVLLMAsBackup = config.useVLLMAsBackup;
        }
        if (config.vllmTrained !== undefined) {
            this.vllmTrained = config.vllmTrained;
            process.env.VLLM_TRAINED = config.vllmTrained ? 'true' : 'false';
        }
        
        console.log('[UNIFIED AI] Configuration updated:', {
            primaryProvider: this.primaryProvider,
            useVLLMAsBackup: this.useVLLMAsBackup,
            vllmTrained: this.vllmTrained
        });
    }
}

module.exports = UnifiedAIService;
