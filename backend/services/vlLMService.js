const { HfInference } = require('@huggingface/inference');

/**
 * VL LM (Vision-Language Model) Service
 * Fast backup LLM using Hugging Face inference
 * Used as backup to Gemini, will become primary once trained
 */
class VLLMService {
    constructor() {
        // Initialize Hugging Face client
        const apiKey = process.env.HUGGINGFACE_API_KEY || process.env.VL_LM_API_KEY;
        this.hf = apiKey ? new HfInference(apiKey) : null;
        
        // Use a fast, capable language model
        // Can be switched to a custom trained model later
        this.model = process.env.VL_LM_MODEL || 'microsoft/DialoGPT-large';
        this.isAvailable = !!apiKey && apiKey !== 'your-huggingface-api-key-here';
        
        // Training status - when true, VL LM becomes primary
        this.isTrained = process.env.VL_LM_TRAINED === 'true';
        
        console.log('[VL LM] Initialized:', {
            available: this.isAvailable,
            model: this.model,
            isTrained: this.isTrained,
            mode: this.isTrained ? 'PRIMARY' : 'BACKUP',
            hasApiKey: !!apiKey
        });
        
        // Conversation history
        this.conversationHistory = new Map();
    }

    /**
     * Process command with VL LM
     * @param {string} userInput - User command input
     * @param {object} clientInfo - Client information
     * @param {object} context - Additional context
     * @returns {Promise<object>} Processed command result
     */
    async processCommand(userInput, clientInfo, context = {}) {
        try {
            if (!this.isAvailable) {
                console.log('[VL LM] Not available, cannot process');
                throw new Error('VL LM service not available');
            }

            const clientId = clientInfo.uuid || 'default';
            const history = this.conversationHistory.get(clientId) || [];

            // Build prompt
            const prompt = this.buildPrompt(userInput, clientInfo, context, history);

            // Generate response
            const response = await this.hf.textGeneration({
                model: this.model,
                inputs: prompt,
                parameters: {
                    max_new_tokens: 600,
                    temperature: 0.7,
                    top_p: 0.9,
                    return_full_text: false
                }
            });

            // Parse response
            const result = this.parseResponse(response.generated_text, userInput);

            // Update conversation history
            history.push(
                { role: 'user', content: userInput },
                { role: 'assistant', content: response.generated_text }
            );
            
            // Keep last 10 messages
            if (history.length > 20) {
                history.splice(0, history.length - 20);
            }
            this.conversationHistory.set(clientId, history);

            console.log('[VL LM] Command processed successfully');
            return result;

        } catch (error) {
            console.error('[VL LM] Error processing command:', error);
            throw error;
        }
    }

    /**
     * Build prompt for VL LM
     */
    buildPrompt(userInput, clientInfo, context, history) {
        const platform = clientInfo.platform || 'unknown';
        const systemInfo = clientInfo.systemInfo || {};

        let prompt = `You are an expert system administrator AI for a Command & Control (C2) system. Generate reliable commands that work 100% of the time.

USER REQUEST: "${userInput}"

TARGET CLIENT:
- Platform: ${platform}
- Computer Name: ${systemInfo.ComputerName || 'Unknown'}
- OS Version: ${systemInfo.OSVersion || 'Unknown'}
- Architecture: ${systemInfo.Is64BitOperatingSystem === 'True' ? '64-bit' : '32-bit'}

Respond with JSON:
{
  "command": "actual_command_to_execute",
  "type": "powershell|cmd|bash",
  "timeout": 300,
  "explanation": "What this command does",
  "safety_level": "safe|moderate|risky",
  "alternatives": ["alternative1", "alternative2"],
  "steps": ["step1", "step2"]
}

Respond ONLY with valid JSON.`;

        // Add conversation history
        if (history.length > 0) {
            prompt += '\n\nRECENT CONVERSATION:';
            history.slice(-4).forEach(msg => {
                prompt += `\n${msg.role}: ${msg.content}`;
            });
        }

        return prompt;
    }

    /**
     * Parse VL LM response
     */
    parseResponse(responseText, userInput) {
        try {
            // Extract JSON from response
            const jsonMatch = responseText.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0]);
                
                // Validate response
                if (!parsed.command) {
                    throw new Error('No command in response');
                }

                return {
                    success: true,
                    data: {
                        command: parsed.command,
                        type: parsed.type || 'powershell',
                        timeout: parsed.timeout || 300,
                        explanation: parsed.explanation || 'Command generated by VL LM',
                        safety_level: parsed.safety_level || 'safe',
                        alternatives: parsed.alternatives || [],
                        steps: parsed.steps || [],
                        aiProcessed: true,
                        model: this.model,
                        provider: 'vl-lm',
                        timestamp: new Date().toISOString()
                    }
                };
            }
        } catch (error) {
            console.error('[VL LM] Error parsing response:', error);
        }

        // Fallback response
        return {
            success: true,
            data: {
                command: `echo "VL LM processing: ${userInput}"`,
                type: 'powershell',
                timeout: 300,
                explanation: 'VL LM generated command',
                safety_level: 'safe',
                alternatives: [],
                steps: [],
                aiProcessed: true,
                model: this.model,
                provider: 'vl-lm',
                timestamp: new Date().toISOString()
            }
        };
    }

    /**
     * Handle errors with VL LM
     */
    async handleError(error, originalCommand, clientInfo, retryCount = 0) {
        try {
            if (!this.isAvailable) {
                throw new Error('VL LM not available');
            }

            const prompt = `A command execution failed. Generate a fixed version.

Error: ${error.message || error}
Original Command: ${originalCommand.command || originalCommand}
Client Platform: ${clientInfo.platform || 'unknown'}
Retry Count: ${retryCount}

Respond with JSON:
{
  "fixed_command": "improved_command",
  "explanation": "why_this_will_work",
  "changes_made": ["change1", "change2"]
}`;

            const response = await this.hf.textGeneration({
                model: this.model,
                inputs: prompt,
                parameters: {
                    max_new_tokens: 400,
                    temperature: 0.7
                }
            });

            const jsonMatch = response.generated_text.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0]);
                
                return {
                    success: true,
                    data: {
                        command: parsed.fixed_command,
                        explanation: parsed.explanation,
                        changes_made: parsed.changes_made || [],
                        aiProcessed: true,
                        retryCount: retryCount + 1,
                        provider: 'vl-lm'
                    }
                };
            }

            throw new Error('Invalid response format');

        } catch (error) {
            console.error('[VL LM] Error handling failed:', error);
            throw error;
        }
    }

    /**
     * Test VL LM connection
     */
    async testConnection() {
        try {
            if (!this.isAvailable) {
                return false;
            }

            const response = await this.hf.textGeneration({
                model: this.model,
                inputs: 'Test',
                parameters: { max_new_tokens: 10 }
            });

            return !!response.generated_text;
        } catch (error) {
            console.error('[VL LM] Connection test failed:', error);
            return false;
        }
    }

    /**
     * Get service status
     */
    getStatus() {
        return {
            available: this.isAvailable,
            model: this.model,
            isTrained: this.isTrained,
            mode: this.isTrained ? 'PRIMARY' : 'BACKUP',
            activeConversations: this.conversationHistory.size,
            provider: 'vl-lm',
            timestamp: new Date().toISOString()
        };
    }
}

module.exports = VLLMService;
