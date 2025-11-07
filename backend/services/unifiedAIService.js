const { GoogleGenerativeAI } = require('@google/generative-ai');
const { HfInference } = require('@huggingface/inference');

/**
 * Unified AI Service
 * Supports Gemini API (primary) and Hugging Face VL LM (backup/future primary)
 * Includes Point Generator functionality using Hugging Face inference
 */
class UnifiedAIService {
    constructor() {
        // Initialize Gemini
        this.initializeGemini();
        
        // Initialize Hugging Face
        this.initializeHuggingFace();
        
        // Provider selection logic
        this.primaryProvider = 'gemini'; // Start with Gemini
        this.useVLLM = process.env.USE_VL_LM === 'true' || process.env.USE_VL_LM === '1';
        this.vlLmTrained = process.env.VL_LM_TRAINED === 'true' || process.env.VL_LM_TRAINED === '1';
        
        // If VL LM is trained, switch to it as primary
        if (this.vlLmTrained && this.hfClient) {
            this.primaryProvider = 'huggingface';
            console.log('[AI SERVICE] VL LM is trained - switching to Hugging Face as primary provider');
        }
        
        // Conversation history and learning
        this.conversationHistory = new Map();
        this.commandPatterns = new Map();
        this.errorSolutions = new Map();
        
        // Point Generator cache
        this.pointGeneratorCache = new Map();
        
        console.log(`[AI SERVICE] Initialized - Primary: ${this.primaryProvider}, VL LM Available: ${!!this.hfClient}, VL LM Trained: ${this.vlLmTrained}`);
    }
    
    /**
     * Initialize Google Gemini
     */
    initializeGemini() {
        const apiKey = process.env.GEMINI_API_KEY;
        
        if (apiKey && apiKey !== 'your-gemini-api-key-here' && apiKey.trim() !== '') {
            try {
                this.genAI = new GoogleGenerativeAI(apiKey);
                this.geminiModel = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
                this.geminiAvailable = true;
                console.log('[AI SERVICE] Gemini AI initialized successfully');
            } catch (error) {
                console.error('[AI SERVICE] Gemini initialization error:', error);
                this.geminiAvailable = false;
            }
        } else {
            console.log('[AI SERVICE] Gemini API key not configured');
            this.geminiAvailable = false;
        }
    }
    
    /**
     * Initialize Hugging Face Inference
     */
    initializeHuggingFace() {
        const apiKey = process.env.HUGGINGFACE_API_KEY;
        const modelName = process.env.HUGGINGFACE_MODEL || 'microsoft/DialoGPT-medium';
        
        if (apiKey && apiKey.trim() !== '') {
            try {
                this.hfClient = new HfInference(apiKey);
                this.hfModel = modelName;
                this.hfAvailable = true;
                console.log(`[AI SERVICE] Hugging Face initialized with model: ${modelName}`);
            } catch (error) {
                console.error('[AI SERVICE] Hugging Face initialization error:', error);
                this.hfAvailable = false;
            }
        } else {
            console.log('[AI SERVICE] Hugging Face API key not configured');
            this.hfAvailable = false;
        }
    }
    
    /**
     * Process command with AI (uses primary provider, falls back to secondary)
     */
    async processCommandWithAI(userInput, clientInfo, context = {}) {
        try {
            console.log(`[AI SERVICE] Processing command with ${this.primaryProvider}:`, userInput);
            
            // Try primary provider first
            let result;
            if (this.primaryProvider === 'gemini' && this.geminiAvailable) {
                result = await this.processWithGemini(userInput, clientInfo, context);
            } else if (this.primaryProvider === 'huggingface' && this.hfAvailable) {
                result = await this.processWithHuggingFace(userInput, clientInfo, context);
            } else {
                // Fallback to available provider
                if (this.geminiAvailable) {
                    result = await this.processWithGemini(userInput, clientInfo, context);
                } else if (this.hfAvailable) {
                    result = await this.processWithHuggingFace(userInput, clientInfo, context);
                } else {
                    return await this.fallbackProcessing(userInput, clientInfo, context);
                }
            }
            
            // Store conversation history
            const clientId = clientInfo.uuid || 'default';
            const history = this.conversationHistory.get(clientId) || [];
            history.push(
                { role: 'user', content: userInput },
                { role: 'assistant', content: JSON.stringify(result) }
            );
            // Keep last 20 messages
            if (history.length > 40) {
                history.splice(0, history.length - 40);
            }
            this.conversationHistory.set(clientId, history);
            
            return {
                success: true,
                data: {
                    ...result,
                    provider: this.primaryProvider,
                    aiProcessed: true,
                    timestamp: new Date().toISOString()
                }
            };
            
        } catch (error) {
            console.error('[AI SERVICE] Error processing with AI:', error);
            
            // Try fallback provider
            if (this.primaryProvider === 'gemini' && this.hfAvailable) {
                console.log('[AI SERVICE] Falling back to Hugging Face');
                try {
                    const fallbackResult = await this.processWithHuggingFace(userInput, clientInfo, context);
                    return {
                        success: true,
                        data: {
                            ...fallbackResult,
                            provider: 'huggingface',
                            aiProcessed: true,
                            fallback: true,
                            timestamp: new Date().toISOString()
                        }
                    };
                } catch (fallbackError) {
                    console.error('[AI SERVICE] Fallback provider also failed:', fallbackError);
                }
            } else if (this.primaryProvider === 'huggingface' && this.geminiAvailable) {
                console.log('[AI SERVICE] Falling back to Gemini');
                try {
                    const fallbackResult = await this.processWithGemini(userInput, clientInfo, context);
                    return {
                        success: true,
                        data: {
                            ...fallbackResult,
                            provider: 'gemini',
                            aiProcessed: true,
                            fallback: true,
                            timestamp: new Date().toISOString()
                        }
                    };
                } catch (fallbackError) {
                    console.error('[AI SERVICE] Fallback provider also failed:', fallbackError);
                }
            }
            
            // Final fallback to rule-based
            return await this.fallbackProcessing(userInput, clientInfo, context);
        }
    }
    
    /**
     * Process with Gemini AI
     */
    async processWithGemini(userInput, clientInfo, context) {
        if (!this.geminiAvailable) {
            throw new Error('Gemini not available');
        }
        
        const platform = clientInfo.platform || 'unknown';
        const systemInfo = clientInfo.systemInfo || {};
        const clientId = clientInfo.uuid || 'default';
        const history = this.conversationHistory.get(clientId) || [];
        
        const prompt = this.buildPrompt(userInput, clientInfo, context, history);
        
        const result = await this.geminiModel.generateContent(prompt);
        const response = await result.response;
        const aiResponseText = response.text();
        
        // Parse JSON response
        const jsonMatch = aiResponseText.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error('No JSON found in Gemini response');
        }
        
        const aiResponse = JSON.parse(jsonMatch[0]);
        
        // Validate response
        if (!this.validateAIResponse(aiResponse)) {
            throw new Error('Invalid AI response format');
        }
        
        return {
            command: aiResponse.command,
            type: aiResponse.type || 'powershell',
            timeout: aiResponse.timeout || 300,
            explanation: aiResponse.explanation,
            safety_level: aiResponse.safety_level || 'safe',
            alternatives: aiResponse.alternatives || [],
            model: 'gemini-1.5-flash'
        };
    }
    
    /**
     * Process with Hugging Face VL LM
     */
    async processWithHuggingFace(userInput, clientInfo, context) {
        if (!this.hfAvailable) {
            throw new Error('Hugging Face not available');
        }
        
        const platform = clientInfo.platform || 'unknown';
        const systemInfo = clientInfo.systemInfo || {};
        const clientId = clientInfo.uuid || 'default';
        const history = this.conversationHistory.get(clientId) || [];
        
        // Build prompt for Hugging Face
        const prompt = this.buildPrompt(userInput, clientInfo, context, history);
        
        try {
            // Use text generation for command processing
            const response = await this.hfClient.textGeneration({
                model: this.hfModel,
                inputs: prompt,
                parameters: {
                    max_new_tokens: 500,
                    temperature: 0.7,
                    return_full_text: false
                }
            });
            
            const aiResponseText = response.generated_text || '';
            
            // Parse JSON response
            const jsonMatch = aiResponseText.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                // If no JSON, try to extract command from text
                return this.extractCommandFromText(aiResponseText, userInput);
            }
            
            const aiResponse = JSON.parse(jsonMatch[0]);
            
            // Validate response
            if (!this.validateAIResponse(aiResponse)) {
                return this.extractCommandFromText(aiResponseText, userInput);
            }
            
            return {
                command: aiResponse.command,
                type: aiResponse.type || 'powershell',
                timeout: aiResponse.timeout || 300,
                explanation: aiResponse.explanation || aiResponseText,
                safety_level: aiResponse.safety_level || 'safe',
                alternatives: aiResponse.alternatives || [],
                model: this.hfModel
            };
            
        } catch (error) {
            console.error('[AI SERVICE] Hugging Face processing error:', error);
            throw error;
        }
    }
    
    /**
     * Point Generator - Generate command points/waypoints using Hugging Face
     */
    async generatePoints(userInput, clientInfo, context = {}) {
        try {
            console.log('[AI SERVICE] Generating points with Point Generator:', userInput);
            
            // Check cache first
            const cacheKey = `${userInput}_${clientInfo.uuid || 'default'}`;
            if (this.pointGeneratorCache.has(cacheKey)) {
                const cached = this.pointGeneratorCache.get(cacheKey);
                if (Date.now() - cached.timestamp < 3600000) { // 1 hour cache
                    console.log('[AI SERVICE] Returning cached points');
                    return cached.data;
                }
            }
            
            if (!this.hfAvailable) {
                throw new Error('Hugging Face not available for Point Generator');
            }
            
            const pointPrompt = `You are a Point Generator AI for a Command & Control system. Generate a sequence of command execution points (waypoints) for the following task:

Task: "${userInput}"
Platform: ${clientInfo.platform || 'unknown'}
System Info: ${JSON.stringify(clientInfo.systemInfo || {})}

Generate a JSON array of points, where each point represents a step in the command execution:
[
  {
    "step": 1,
    "command": "command_to_execute",
    "type": "powershell|cmd|wmic",
    "description": "what_this_step_does",
    "expected_output": "what_to_expect",
    "timeout": 300,
    "dependencies": []
  }
]

Return ONLY valid JSON array.`;
            
            const response = await this.hfClient.textGeneration({
                model: this.hfModel,
                inputs: pointPrompt,
                parameters: {
                    max_new_tokens: 1000,
                    temperature: 0.5,
                    return_full_text: false
                }
            });
            
            const responseText = response.generated_text || '';
            
            // Parse JSON array
            const jsonMatch = responseText.match(/\[[\s\S]*\]/);
            if (!jsonMatch) {
                throw new Error('No JSON array found in Point Generator response');
            }
            
            const points = JSON.parse(jsonMatch[0]);
            
            // Cache the result
            this.pointGeneratorCache.set(cacheKey, {
                data: points,
                timestamp: Date.now()
            });
            
            // Keep cache size manageable
            if (this.pointGeneratorCache.size > 100) {
                const firstKey = this.pointGeneratorCache.keys().next().value;
                this.pointGeneratorCache.delete(firstKey);
            }
            
            return {
                success: true,
                points: points,
                provider: 'huggingface',
                model: this.hfModel,
                timestamp: new Date().toISOString()
            };
            
        } catch (error) {
            console.error('[AI SERVICE] Point Generator error:', error);
            
            // Fallback to simple point generation
            return {
                success: true,
                points: [{
                    step: 1,
                    command: userInput,
                    type: 'powershell',
                    description: 'Generated fallback command',
                    expected_output: 'Command execution result',
                    timeout: 300,
                    dependencies: []
                }],
                provider: 'fallback',
                error: error.message
            };
        }
    }
    
    /**
     * Build prompt for AI processing
     */
    buildPrompt(userInput, clientInfo, context, history) {
        const platform = clientInfo.platform || 'unknown';
        const systemInfo = clientInfo.systemInfo || {};
        
        const systemPrompt = `You are an expert system administrator AI for a Command & Control (C2) system. Your job is to understand user INTENT and generate reliable commands that NEVER FAIL.

**CORE INTELLIGENCE:**
You must understand PATTERNS, not just specific commands. When a user says "download X and launch it", you should understand this pattern works for ANY software, not just the specific example.

**PATTERN RECOGNITION EXAMPLES:**
- "download X and launch it" → Search official site, download installer, verify, execute
- "install X" → Download from trusted source, run installer silently, verify installation  
- "show me X info" → Use appropriate command (systeminfo, Get-WmiObject, etc.)
- "list X files" → Use dir, Get-ChildItem with proper filters
- "check X status" → Query services, processes, or system state
- "kill X process" → Find process by name/pattern, terminate safely

**Response Format:**
Always respond with a JSON object containing:
{
  "command": "multi_step_powershell_command_with_error_handling",
  "type": "powershell",
  "timeout": 300,
  "explanation": "I'll [action] by [method]. Here's what I'll do: [steps]",
  "safety_level": "safe|moderate|risky",
  "alternatives": ["fallback_method_1", "fallback_method_2"],
  "steps": ["step1", "step2", "step3"]
}

**CRITICAL REQUIREMENTS:**
- Always add comprehensive error handling
- Use PowerShell over CMD when possible
- Add progress indicators for long operations
- Include file verification for downloads
- Provide multiple fallback methods
- Optimize for Windows 11 compatibility
- Make commands that work 100% of the time
- Never generate commands that could harm the system`;

        let prompt = `${systemPrompt}

**USER REQUEST:** "${userInput}"

**TARGET CLIENT DETAILS:**
- Platform: ${platform}
- Computer Name: ${systemInfo.ComputerName || 'Unknown'}
- OS Version: ${systemInfo.OSVersion || 'Unknown'}
- Architecture: ${systemInfo.Is64BitOperatingSystem === 'True' ? '64-bit' : '32-bit'}
- Total Memory: ${systemInfo.TotalPhysicalMemory || 'Unknown'}
- Available Tools: PowerShell, winget, chocolatey, direct downloads

**TASK:** Generate a reliable, multi-step command that will work 100% of the time on this system.

Additional Context: ${JSON.stringify(context)}`;

        // Add recent conversation history
        if (history.length > 0) {
            prompt += '\n\n**RECENT CONVERSATION CONTEXT:**';
            history.slice(-6).forEach(msg => {
                prompt += `\n${msg.role}: ${msg.content}`;
            });
        }

        prompt += '\n\nRespond ONLY with valid JSON in the specified format.';
        
        return prompt;
    }
    
    /**
     * Extract command from text response (fallback)
     */
    extractCommandFromText(text, userInput) {
        // Try to find command-like patterns
        const commandPatterns = [
            /command["\s:]+([^\n"']+)/i,
            /powershell["\s:]+([^\n"']+)/i,
            /```(?:powershell|bash|cmd)?\s*([\s\S]*?)```/i
        ];
        
        for (const pattern of commandPatterns) {
            const match = text.match(pattern);
            if (match && match[1]) {
                return {
                    command: match[1].trim(),
                    type: 'powershell',
                    timeout: 300,
                    explanation: text.substring(0, 200),
                    safety_level: 'safe',
                    alternatives: [],
                    model: this.hfModel
                };
            }
        }
        
        // Ultimate fallback
        return {
            command: `Write-Host "${userInput}"`,
            type: 'powershell',
            timeout: 30,
            explanation: 'Fallback command extraction',
            safety_level: 'safe',
            alternatives: [],
            model: this.hfModel
        };
    }
    
    /**
     * Validate AI response format
     */
    validateAIResponse(response) {
        return response && 
               typeof response.command === 'string' && 
               response.command.length > 0;
    }
    
    /**
     * Fallback processing when AI is unavailable
     */
    async fallbackProcessing(userInput, clientInfo, context) {
        console.log('[AI SERVICE] Using fallback rule-based processing');
        
        const extracted = this.extractCommandInfo(userInput);
        
        return {
            success: true,
            data: {
                command: extracted.command || 'echo "Command not recognized"',
                type: 'powershell',
                timeout: 300,
                explanation: 'Fallback command - AI not available',
                safety_level: 'safe',
                alternatives: [],
                aiProcessed: false,
                model: 'fallback',
                timestamp: new Date().toISOString()
            }
        };
    }
    
    /**
     * Extract command information from natural language (fallback)
     */
    extractCommandInfo(userInput) {
        const input = userInput.toLowerCase();
        
        if (input.includes('system info') || input.includes('computer info')) {
            return {
                command: 'Get-ComputerInfo | Select-Object WindowsProductName, WindowsVersion, TotalPhysicalMemory, CsProcessors'
            };
        }
        
        if (input.includes('memory') || input.includes('ram')) {
            return {
                command: 'Get-WmiObject -Class Win32_PhysicalMemory | Measure-Object -Property Capacity -Sum | Select-Object @{Name="TotalRAM(GB)";Expression={[math]::Round($_.Sum/1GB,2)}}'
            };
        }
        
        if (input.includes('cpu') || input.includes('processor')) {
            return {
                command: 'Get-WmiObject -Class Win32_Processor | Select-Object Name, NumberOfCores, NumberOfLogicalProcessors, MaxClockSpeed'
            };
        }
        
        if (input.includes('list files') || input.includes('show files') || input.includes('dir')) {
            return {
                command: 'Get-ChildItem C:\\ | Select-Object Name, Length, LastWriteTime | Format-Table -AutoSize'
            };
        }
        
        if (input.includes('ping') || input.includes('test connection')) {
            return {
                command: 'Test-NetConnection -ComputerName google.com -Port 80'
            };
        }
        
        return {
            command: 'Get-ComputerInfo | Select-Object WindowsProductName, WindowsVersion, TotalPhysicalMemory'
        };
    }
    
    /**
     * Handle errors with AI-powered solutions
     */
    async handleErrorWithAI(error, originalCommand, clientInfo, retryCount = 0) {
        try {
            console.log('[AI SERVICE] Handling error with AI:', error.message);
            
            const prompt = `You are an AI assistant that helps fix command execution errors. When a command fails, analyze the error and provide a better alternative.

Error: ${error.message || error}
Original Command: ${originalCommand.command || originalCommand}
Client Platform: ${clientInfo.platform || 'unknown'}
Retry Count: ${retryCount}

Provide a JSON response with:
{
  "fixed_command": "improved_command",
  "explanation": "why_this_will_work",
  "changes_made": ["list_of_improvements"]
}`;

            let aiResponse;
            
            // Try primary provider
            if (this.primaryProvider === 'gemini' && this.geminiAvailable) {
                const result = await this.geminiModel.generateContent(prompt);
                const response = await result.response;
                const text = await response.text();
                const jsonMatch = text.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    aiResponse = JSON.parse(jsonMatch[0]);
                }
            } else if (this.primaryProvider === 'huggingface' && this.hfAvailable) {
                const response = await this.hfClient.textGeneration({
                    model: this.hfModel,
                    inputs: prompt,
                    parameters: { max_new_tokens: 300, temperature: 0.7 }
                });
                const jsonMatch = response.generated_text.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    aiResponse = JSON.parse(jsonMatch[0]);
                }
            }
            
            if (aiResponse && aiResponse.fixed_command) {
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
            }
            
            throw new Error('AI error handling failed');
            
        } catch (aiError) {
            console.error('[AI SERVICE] Error in AI error handling:', aiError);
            return {
                success: false,
                error: error.message || error,
                retryCount: retryCount,
                fallback: true
            };
        }
    }
    
    /**
     * Get service status
     */
    getStatus() {
        return {
            gemini: {
                available: this.geminiAvailable,
                model: 'gemini-1.5-flash'
            },
            huggingface: {
                available: this.hfAvailable,
                model: this.hfModel,
                trained: this.vlLmTrained
            },
            primaryProvider: this.primaryProvider,
            useVLLM: this.useVLLM,
            vlLmTrained: this.vlLmTrained
        };
    }
    
    /**
     * Get statistics
     */
    getStatistics() {
        return {
            totalConversations: Array.from(this.conversationHistory.values()).reduce((sum, history) => sum + history.length, 0),
            learnedPatterns: this.commandPatterns.size,
            errorSolutions: this.errorSolutions.size,
            activeClients: this.conversationHistory.size,
            pointGeneratorCacheSize: this.pointGeneratorCache.size,
            primaryProvider: this.primaryProvider,
            timestamp: new Date().toISOString()
        };
    }
}

module.exports = UnifiedAIService;
