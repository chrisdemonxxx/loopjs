const fs = require('fs');
const OllamaCommandOrchestrator = require('./ollamaCommandOrchestrator');
const OllamaPowerShellGenerator = require('./ollamaPowerShellGenerator');
const OllamaCommandParser = require('./ollamaCommandParser');
const OllamaCommandValidator = require('./ollamaCommandValidator');
const CommandQueueManager = require('./commandQueueManager');
const ResultAggregator = require('./resultAggregator');
const OllamaPrompts = require('../prompts/ollamaPrompts');
const IntelligentCommandAnalyzer = require('./intelligentCommandAnalyzer');
const StrategyPlanner = require('./strategyPlanner');
const SmartExecutionOrchestrator = require('./smartExecutionOrchestrator');
const ErrorAnalyzer = require('./errorAnalyzer');
const WebFetchService = require('./webFetchService');
const BrowserAutomationService = require('./browserAutomationService');
const SystemStateAnalyzer = require('./systemStateAnalyzer');

/**
 * Enhanced Ollama AI Command Processor
 * Advanced local AI processing with multi-command handling, script generation, and intelligent orchestration
 */
class OllamaAICommandProcessor {
    constructor() {
        // Support both local and cloud Ollama APIs
        this.localAPI = process.env.OLLAMA_API_URL || 'http://localhost:11434/api/generate';
        this.cloudAPI = 'http://192.168.0.116:5000/api/generate';
        this.cloudAPIKey = 'demo_key_123';
        this.useCloudAPI = process.env.OLLAMA_USE_CLOUD === 'true';
        this.ollamaAPI = this.useCloudAPI ? this.cloudAPI : this.localAPI;
        
        this.isAvailable = false;
        this.conversationHistory = new Map();
        this.availableModels = new Map();
        
        // Model configuration based on OLLAMA_ANALYSIS.md findings and cloud API models
        this.modelConfig = {
            // Local models
            'qwen2.5-coder:1.5b': {
                tier: 1,
                score: 7.1,
                avgTime: 700,
                specialties: ['file_ops', 'network', 'download'],
                timeout: 30000,
                description: 'Best overall performer - 7.1/10, 700ms',
                api: 'local'
            },
            'kali-specialist:latest': {
                tier: 2,
                score: 6.9,
                avgTime: 1097,
                specialties: ['workflow'],
                timeout: 30000,
                description: 'Workflow expert - 9.1/10 for complex tasks',
                api: 'local'
            },
            'threat-watch:latest': {
                tier: 2,
                score: 6.6,
                avgTime: 922,
                specialties: ['pentest', 'security'],
                timeout: 30000,
                description: 'Pentest expert - 7.7/10 for security operations',
                api: 'local'
            },
            'devops-master:latest': {
                tier: 2,
                score: 6.3,
                avgTime: 586,
                specialties: ['download'],
                timeout: 30000,
                description: 'Download expert - 7.7/10 for file operations',
                api: 'local'
            },
            
            // Cloud API models (45+ available)
            'llama3.2:3b': {
                tier: 3,
                score: 7.5,
                avgTime: 200,
                specialties: ['simple', 'fast'],
                timeout: 10000,
                description: 'Cloud: Fastest model - 200ms, excellent for simple tasks',
                api: 'cloud'
            },
            'qwen2.5:7b': {
                tier: 1,
                score: 8.2,
                avgTime: 800,
                specialties: ['security', 'workflow', 'reasoning'],
                timeout: 30000,
                description: 'Cloud: Advanced reasoning - 8.2/10, excellent for complex tasks',
                api: 'cloud'
            },
            'codellama:7b': {
                tier: 1,
                score: 8.5,
                avgTime: 600,
                specialties: ['coding', 'scripting'],
                timeout: 20000,
                description: 'Cloud: Code generation expert - 8.5/10, perfect for PowerShell',
                api: 'cloud'
            },
            'deepseek-coder:33b-instruct': {
                tier: 1,
                score: 9.1,
                avgTime: 2000,
                specialties: ['complex', 'coding', 'advanced'],
                timeout: 60000,
                description: 'Cloud: Large coding model - 9.1/10, best for complex scripting',
                api: 'cloud'
            },
            'mistral:7b': {
                tier: 2,
                score: 7.8,
                avgTime: 500,
                specialties: ['general', 'balanced'],
                timeout: 20000,
                description: 'Cloud: Balanced model - 7.8/10, good for general tasks',
                api: 'cloud'
            },
            'phi3:3.8b': {
                tier: 3,
                score: 7.2,
                avgTime: 300,
                specialties: ['simple', 'efficient'],
                timeout: 15000,
                description: 'Cloud: Efficient model - 7.2/10, 300ms response time',
                api: 'cloud'
            }
        };
        
        // Prioritize cloud models for better performance
        this.primaryModel = this.useCloudAPI ? 'codellama:7b' : 'qwen2.5-coder:1.5b';
        this.fallbackModels = this.useCloudAPI ? 
            ['llama3.2:3b', 'qwen2.5:7b', 'mistral:7b', 'phi3:3.8b'] : 
            ['kali-specialist:latest', 'threat-watch:latest', 'qwen2.5:7b'];
        
        // Initialize advanced components
        this.orchestrator = new OllamaCommandOrchestrator();
        this.scriptGenerator = new OllamaPowerShellGenerator();
        this.commandParser = new OllamaCommandParser();
        this.commandValidator = new OllamaCommandValidator();
        this.queueManager = new CommandQueueManager();
        this.resultAggregator = new ResultAggregator();
        this.prompts = new OllamaPrompts();
        
        // Advanced features configuration
        this.advancedFeatures = {
            multiCommand: process.env.OLLAMA_ENABLE_MULTI_COMMAND !== 'false',
            scriptGeneration: process.env.OLLAMA_ENABLE_SCRIPT_GENERATION !== 'false',
            validation: process.env.OLLAMA_ENABLE_VALIDATION !== 'false',
            learning: process.env.OLLAMA_ENABLE_LEARNING !== 'false',
            streaming: process.env.OLLAMA_ENABLE_STREAMING !== 'false'
        };
        
        // Performance tracking
        this.performanceMetrics = new Map();
        this.learningData = new Map();
        
        // Initialize intelligent agent components
        this.intelligentAnalyzer = new IntelligentCommandAnalyzer();
        this.strategyPlanner = new StrategyPlanner();
        this.executionOrchestrator = new SmartExecutionOrchestrator();
        this.errorAnalyzer = new ErrorAnalyzer();
        this.webFetchService = new WebFetchService();
        this.browserAutomationService = new BrowserAutomationService();
        this.systemStateAnalyzer = new SystemStateAnalyzer();
        
        // Initialize connection
        this.initializeConnection();
    }

    /**
     * Initialize connection to Ollama
     */
    async initializeConnection() {
        try {
            await this.testConnection();
            await this.checkAvailableModels();
            console.log('[OLLAMA AI] Initialized successfully');
        } catch (error) {
            console.log('[OLLAMA AI] Initialization failed:', error.message);
            this.isAvailable = false;
        }
    }

    /**
     * Test connection to Ollama server
     */
    async testConnection() {
        try {
            const response = await fetch('http://localhost:11434/api/tags', {
                method: 'GET',
                timeout: 5000
            });
            
            if (response.ok) {
                this.isAvailable = true;
                return true;
            } else {
                this.isAvailable = false;
                return false;
            }
        } catch (error) {
            console.log('[OLLAMA AI] Connection test failed:', error.message);
            this.isAvailable = false;
            return false;
        }
    }

    /**
     * Check available models
     */
    async checkAvailableModels() {
        try {
            const response = await fetch('http://localhost:11434/api/tags', {
                method: 'GET',
                timeout: 5000
            });
            
            if (response.ok) {
                const data = await response.json();
                this.availableModels.clear();
                
                if (data.models && data.models.length > 0) {
                    data.models.forEach(model => {
                        this.availableModels.set(model.name, {
                            name: model.name,
                            size: model.size,
                            modified_at: model.modified_at,
                            config: this.modelConfig[model.name] || {
                                tier: 3,
                                score: 5.0,
                                avgTime: 2000,
                                specialties: ['general'],
                                timeout: 30000,
                                description: 'Unknown model'
                            }
                        });
                    });
                    
                    console.log(`[OLLAMA AI] Found ${data.models.length} available models`);
                } else {
                    console.log('[OLLAMA AI] No models available - need to pull models');
                }
            }
        } catch (error) {
            console.log('[OLLAMA AI] Failed to check available models:', error.message);
        }
    }

    /**
     * Dynamic model selection based on task complexity and type
     */
    selectModel(taskComplexity, taskType, userInput = '') {
        // Check if we have available models
        if (this.availableModels.size === 0) {
            console.log('[OLLAMA AI] No models available, using primary model');
            return this.primaryModel;
        }

        // Get available model names
        const availableModelNames = Array.from(this.availableModels.keys());
        
        // Priority-based selection with cloud API support
        const priorities = [
            // Coding/Scripting tasks - use best coding model
            { condition: taskType === 'coding' || userInput.includes('script') || userInput.includes('code'), 
              model: this.useCloudAPI ? 'codellama:7b' : 'qwen2.5-coder:1.5b' },
            
            // Workflow tasks - use workflow specialist
            { condition: taskType === 'workflow' || userInput.includes('workflow') || userInput.includes('multi-step'), 
              model: this.useCloudAPI ? 'qwen2.5:7b' : 'kali-specialist:latest' },
            
            // Security/Pentest tasks - use security specialist
            { condition: taskType === 'security' || taskType === 'pentest' || 
                        userInput.includes('security') || userInput.includes('pentest') || 
                        userInput.includes('scan') || userInput.includes('enum'), 
              model: this.useCloudAPI ? 'qwen2.5:7b' : 'threat-watch:latest' },
            
            // Download tasks - use download specialist
            { condition: taskType === 'download' || userInput.includes('download') || 
                        userInput.includes('install'), 
              model: this.useCloudAPI ? 'mistral:7b' : 'devops-master:latest' },
            
            // Simple tasks - use fastest model
            { condition: taskComplexity === 'simple' || userInput.length < 50, 
              model: this.useCloudAPI ? 'llama3.2:3b' : 'qwen2.5-coder:1.5b' },
            
            // Complex tasks - use best overall performer
            { condition: taskComplexity === 'complex' || userInput.length > 200, 
              model: this.useCloudAPI ? 'deepseek-coder:33b-instruct' : 'qwen2.5-coder:1.5b' },
            
            // Default - use primary model
            { condition: true, model: this.primaryModel }
        ];

        // Find first matching priority that has the model available
        for (const priority of priorities) {
            if (priority.condition && availableModelNames.includes(priority.model)) {
                console.log(`[OLLAMA AI] Selected model: ${priority.model} for ${taskType || 'general'} task`);
                return priority.model;
            }
        }

        // Fallback to any available model
        const fallbackModel = availableModelNames.find(name => 
            this.fallbackModels.includes(name)
        ) || availableModelNames[0] || this.primaryModel;
        
        console.log(`[OLLAMA AI] Using fallback model: ${fallbackModel}`);
        return fallbackModel;
    }

    /**
     * Process command using Ollama AI
     */
    async processCommandWithAI(userInput, clientInfo, context = {}) {
        try {
            console.log('[OLLAMA AI] Processing command with Ollama:', userInput);
            
            if (!this.isAvailable) {
                console.log('[OLLAMA AI] Ollama not available, falling back to rule-based processing');
                return await this.fallbackProcessing(userInput, clientInfo, context);
            }

            // Determine task complexity and type
            const taskComplexity = this.determineTaskComplexity(userInput);
            const taskType = this.determineTaskType(userInput, context);
            
            // Select appropriate model
            const selectedModel = this.selectModel(taskComplexity, taskType, userInput);
            
            // Get conversation history for this client
            const clientId = clientInfo.uuid || 'default';
            const history = this.conversationHistory.get(clientId) || [];
            
            // Build system prompt (now async to include system state)
            const systemPrompt = await this.buildSystemPrompt(clientInfo, context, userInput);
            
            // Build user prompt
            const userPrompt = this.buildUserPrompt(userInput, clientInfo, context);
            
            // Prepare messages for Ollama
            const messages = [
                {
                    role: 'system',
                    content: systemPrompt
                },
                ...history.slice(-5), // Last 5 messages for context
                {
                    role: 'user',
                    content: userPrompt
                }
            ];

            // Get model configuration
            const modelConfig = this.modelConfig[selectedModel] || this.modelConfig[this.primaryModel];
            
            console.log(`[OLLAMA AI] Using model: ${selectedModel} (${modelConfig.description})`);
            
            // Call Ollama API
            const startTime = Date.now();
            
            // Convert messages to prompt format for compatibility
            const prompt = messages.map(msg => {
                if (msg.role === 'system') {
                    return `System: ${msg.content}\n\n`;
                } else if (msg.role === 'user') {
                    return `User: ${msg.content}\n\n`;
                } else if (msg.role === 'assistant') {
                    return `Assistant: ${msg.content}\n\n`;
                }
                return '';
            }).join('') + 'Assistant:';
            
            // Prepare headers based on API type
            const headers = { 'Content-Type': 'application/json' };
            if (this.useCloudAPI) {
                headers['X-API-Key'] = this.cloudAPIKey;
            }
            
            const response = await fetch(this.ollamaAPI, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify({
                    model: selectedModel,
                    prompt: prompt,
                    stream: false,
                    options: {
                        temperature: 0.3, // Lower = more deterministic
                        top_p: 0.9,
                        timeout: modelConfig.timeout
                    }
                })
            });
            
            const endTime = Date.now();
            const responseTime = endTime - startTime;
            
            if (!response.ok) {
                throw new Error(`Ollama API error: ${response.status} ${response.statusText}`);
            }
            
            const data = await response.json();
            const aiResponse = data.message?.content || data.response || '';
            
            console.log(`[OLLAMA AI] Response received in ${responseTime}ms`);
            console.log(`[OLLAMA AI] Raw AI response:`, aiResponse);
            
            // Store conversation history
            history.push(
                { role: 'user', content: userInput },
                { role: 'assistant', content: aiResponse }
            );
            this.conversationHistory.set(clientId, history.slice(-20)); // Keep last 20 messages
            
            // Parse AI response
            const parsedResponse = this.parseAIResponse(aiResponse, userInput, clientInfo);
            
            return {
                success: true,
                data: {
                    ...parsedResponse,
                    aiType: 'ollama',
                    model: selectedModel,
                    responseTime: responseTime,
                    modelConfig: modelConfig
                }
            };
            
        } catch (error) {
            console.error('[OLLAMA AI] Error processing command:', error);
            
            // Try fallback model if available
            if (this.availableModels.size > 1) {
                console.log('[OLLAMA AI] Trying fallback model...');
                try {
                    const fallbackModel = this.fallbackModels.find(model => 
                        this.availableModels.has(model)
                    );
                    
                    if (fallbackModel) {
                        return await this.processCommandWithAI(userInput, clientInfo, {
                            ...context,
                            forceModel: fallbackModel
                        });
                    }
                } catch (fallbackError) {
                    console.log('[OLLAMA AI] Fallback model also failed:', fallbackError.message);
                }
            }
            
            // Final fallback to rule-based processing
            return await this.fallbackProcessing(userInput, clientInfo, context);
        }
    }

    /**
     * Determine task complexity based on user input
     */
    determineTaskComplexity(userInput) {
        const input = userInput.toLowerCase();
        
        // Simple tasks
        if (input.length < 50 || 
            /^(list|show|get|check|ping|dir|ls)$/i.test(input.trim())) {
            return 'simple';
        }
        
        // Complex tasks
        if (input.length > 200 || 
            input.includes('workflow') || 
            input.includes('multi-step') || 
            input.includes('then') || 
            input.includes('and then') ||
            (input.match(/and/g) || []).length > 2) {
            return 'complex';
        }
        
        return 'moderate';
    }

    /**
     * Determine task type based on user input and context
     */
    determineTaskType(userInput, context) {
        const input = userInput.toLowerCase();
        const category = context.category || '';
        
        if (category === 'workflow' || input.includes('workflow') || input.includes('multi-step')) {
            return 'workflow';
        }
        
        if (category === 'security' || category === 'pentest' || 
            input.includes('security') || input.includes('pentest') || 
            input.includes('scan') || input.includes('enum') || 
            input.includes('vulnerability') || input.includes('exploit')) {
            return 'security';
        }
        
        if (category === 'download' || input.includes('download') || 
            input.includes('install') || input.includes('get') || 
            input.includes('fetch')) {
            return 'download';
        }
        
        if (input.includes('file') || input.includes('folder') || 
            input.includes('directory') || input.includes('copy') || 
            input.includes('move') || input.includes('delete')) {
            return 'file_ops';
        }
        
        if (input.includes('network') || input.includes('ping') || 
            input.includes('port') || input.includes('connection')) {
            return 'network';
        }
        
        return 'general';
    }

    /**
     * Build system prompt for Ollama
     */
    async buildSystemPrompt(clientInfo, context, userInput = '') {
        const platform = clientInfo.platform || 'Windows';
        const isWindows = platform.includes('Windows') || platform.includes('Win32');
        
        // Get system state analysis
        let systemStateInfo = '';
        try {
            const systemState = await this.systemStateAnalyzer.analyzeSystemState(clientInfo, userInput);
            systemStateInfo = this.systemStateAnalyzer.formatStateForPrompt(systemState);
        } catch (error) {
            console.log('[OLLAMA] System state analysis failed, using defaults');
            systemStateInfo = '\nSYSTEM STATE: Analysis unavailable, using defaults\n';
        }
        
        return `You are an expert Windows system administrator for a Command & Control (C2) panel system. Your role is to translate user requests into precise, executable commands.

CONTEXT:
- Target Platform: ${platform}
- Client UUID: ${clientInfo.uuid || 'unknown'}
- Task Category: ${context.category || 'general'}
- Execution Environment: Batch/CMD (NOT PowerShell)

${systemStateInfo}

RESPONSE FORMAT:
Return a JSON object with the following structure:
{
  "command": "Batch/CMD command to execute",
  "type": "batch",
  "category": "command_category",
  "action": "action_name",
  "timeout": 30,
  "explanation": "Brief explanation of what the command does",
  "safety_notes": "Any safety considerations or warnings"
}

REQUIREMENTS:
1. Generate ONLY executable Batch/CMD commands (NOT PowerShell)
2. NO PowerShell syntax (# comments, Write-Host, Get-*, etc.)
3. Use standard Windows commands: ping, dir, copy, del, etc.
4. For complex operations, use cmd.exe /c "command"
5. Include error handling where possible
6. Use proper Batch syntax and commands
7. Consider Windows security and execution policies
8. Provide clear, step-by-step commands for complex tasks
9. Include safety measures for potentially dangerous operations
10. IMPORTANT: If software needs to be downloaded/installed, generate commands to:
    a) First search for and download the installer
    b) Then verify the download succeeded
    c) Finally execute the installer
    d) Do NOT try to execute software that doesn't exist yet

EXAMPLES:
- Network operations: ping google.com, nslookup google.com
- File operations: dir, copy, del, mkdir, rmdir
- System info: systeminfo, wmic computersystem get model
- Process management: tasklist, taskkill, start

IMPORTANT: Do NOT use PowerShell syntax like # comments, Write-Host, or Get-* cmdlets. Use only Batch/CMD commands.`;
    }

    /**
     * Build user prompt for Ollama
     */
    buildUserPrompt(userInput, clientInfo, context) {
        const platform = clientInfo.platform || 'Windows';
        
        return `User Request: "${userInput}"

Target System: ${platform}
Task Context: ${context.category || 'general'} - ${context.action || 'execute'}
Execution Environment: Batch/CMD (NOT PowerShell)

Please generate the appropriate Batch/CMD command(s) to fulfill this request. Use only standard Windows commands like ping, dir, copy, del, etc. Do NOT use PowerShell syntax like # comments, Write-Host, or Get-* cmdlets.`;
    }

    /**
     * Parse AI response from Ollama
     */
    parseAIResponse(aiResponse, userInput, clientInfo) {
        try {
            // Try to parse as JSON first - handle markdown-wrapped JSON and multiple JSON blocks
            let jsonMatches = [];
            
            // First try to find JSON in markdown code blocks
            const codeBlockMatches = aiResponse.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/gi);
            if (codeBlockMatches) {
                for (const match of codeBlockMatches) {
                    const jsonContent = match.replace(/```(?:json)?\s*\n?/gi, '').replace(/\n?```/gi, '').trim();
                    const jsonInCode = jsonContent.match(/\{[\s\S]*?\}/g);
                    if (jsonInCode) {
                        jsonMatches.push(...jsonInCode);
                    }
                }
            }
            
            // If no JSON found in code blocks, try direct JSON matching
            if (jsonMatches.length === 0) {
                jsonMatches = aiResponse.match(/\{[\s\S]*?\}/g) || [];
            }
            
            if (jsonMatches.length > 0) {
                // Use the first valid JSON block
                for (const jsonMatch of jsonMatches) {
                    try {
                        const parsed = JSON.parse(jsonMatch);
                        if (parsed.command) {
                            return {
                                optimizedCommand: {
                                    command: parsed.command,
                                    type: parsed.type || 'batch',
                                    category: parsed.category || 'natural_language',
                                    action: parsed.action || 'execute',
                                    timeout: parsed.timeout || 30
                                },
                                explanation: parsed.explanation || 'AI processed command',
                                safetyNotes: parsed.safety_notes || '',
                                originalInput: userInput
                            };
                        }
                    } catch (e) {
                        // Continue to next JSON block
                        continue;
                    }
                }
            }
        } catch (error) {
            console.log('[OLLAMA AI] Failed to parse JSON response, using text parsing');
        }
        
        // Fallback: parse as plain text
        const lines = aiResponse.split('\n').filter(line => line.trim());
        let command = '';
        let explanation = '';
        
        // Look for batch commands in markdown code blocks first
        const codeBlockMatch = aiResponse.match(/```(?:batch|cmd|shell)?\s*\n?([\s\S]*?)\n?```/i);
        if (codeBlockMatch) {
            command = codeBlockMatch[1].trim();
        } else {
            // Look for batch commands in regular lines
            for (const line of lines) {
                if (line.includes('ping') || line.includes('dir') || 
                    line.includes('copy') || line.includes('del') || 
                    line.includes('mkdir') || line.includes('rmdir') ||
                    line.includes('tasklist') || line.includes('taskkill') ||
                    line.includes('systeminfo') || line.includes('wmic') ||
                    line.includes('nslookup') || line.includes('ipconfig')) {
                    command = line.trim();
                    break;
                }
            }
            
            // If no command found, use the first non-empty line
            if (!command && lines.length > 0) {
                command = lines[0].trim();
            }
        }
        
        // Extract explanation from remaining lines
        const explanationLines = lines.filter(line => 
            !line.includes('ping') && 
            !line.includes('dir') && 
            !line.includes('copy') && 
            !line.includes('del') && 
            !line.includes('mkdir') && 
            !line.includes('rmdir') &&
            !line.includes('tasklist') && 
            !line.includes('taskkill') &&
            !line.includes('systeminfo') && 
            !line.includes('wmic') &&
            !line.includes('nslookup') && 
            !line.includes('ipconfig')
        );
        
        if (explanationLines.length > 0) {
            explanation = explanationLines.join(' ').trim();
        }
        
        return {
            optimizedCommand: {
                command: command || aiResponse.trim(),
                type: 'batch',
                category: 'natural_language',
                action: 'execute',
                timeout: 30
            },
            explanation: explanation || 'AI processed command',
            originalInput: userInput
        };
    }

    /**
     * Fallback processing when Ollama is not available
     */
    async fallbackProcessing(userInput, clientInfo, context) {
        console.log('[OLLAMA AI] Using fallback processing');
        
        // Import the rule-based AI processor
        const AICommandProcessor = require('./aiCommandProcessor');
        const aiProcessor = new AICommandProcessor();
        
        try {
            const result = await aiProcessor.processCommand(
                { category: 'natural_language', action: 'process', userInput },
                clientInfo
            );
            
            return {
                success: true,
                data: {
                    ...result,
                    aiType: 'rule-based-fallback',
                    explanation: 'Processed using rule-based AI (Ollama unavailable)'
                }
            };
        } catch (error) {
            console.error('[OLLAMA AI] Fallback processing failed:', error);
            return {
                success: false,
                error: error.message,
                data: {
                    optimizedCommand: {
                        command: `Write-Host "Error: ${error.message}"`,
                        type: 'powershell',
                        category: 'error',
                        action: 'display_error',
                        timeout: 5
                    },
                    explanation: 'Error occurred during command processing',
                    aiType: 'error'
                }
            };
        }
    }

    /**
     * Get AI statistics
     */
    getAIStatistics() {
        return {
            provider: 'ollama',
            available: this.isAvailable,
            modelsAvailable: this.availableModels.size,
            primaryModel: this.primaryModel,
            fallbackModels: this.fallbackModels,
            conversationHistory: this.conversationHistory.size,
            modelConfig: Object.keys(this.modelConfig).length,
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Test AI connection
     */
    async testAIConnection() {
        return await this.testConnection();
    }

    // ===========================================
    // ADVANCED FEATURES
    // ===========================================

    /**
     * Process complex multi-step commands
     */
    async processComplexCommand(userInput, clientInfo, context = {}) {
        try {
            console.log('[OLLAMA AI] Processing complex command:', userInput);
            
            if (!this.advancedFeatures.multiCommand) {
                return await this.processCommandWithAI(userInput, clientInfo, context);
            }

            // Parse the complex input
            const parseResult = await this.commandParser.parseComplexInput(userInput, clientInfo, context, this);
            if (!parseResult.success) {
                throw new Error('Failed to parse complex input: ' + parseResult.error);
            }

            // Create command queue
            const queueId = `complex_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            const queueResult = await this.orchestrator.parseComplexCommand(userInput, clientInfo, context, this);
            
            if (!queueResult.success) {
                throw new Error('Failed to create command queue: ' + queueResult.error);
            }

            // Generate PowerShell script
            const scriptResult = await this.orchestrator.generateSequentialScript(queueResult.chainId, {}, this);
            
            if (!scriptResult.success) {
                throw new Error('Failed to generate script: ' + scriptResult.error);
            }

            // Validate the generated script
            if (this.advancedFeatures.validation) {
                const validationResult = await this.commandValidator.validateCommand(scriptResult.script, context);
                if (!validationResult.success) {
                    console.warn('[OLLAMA AI] Script validation failed:', validationResult.error);
                }
            }

            return {
                success: true,
                data: {
                    type: 'complex_command',
                    queueId: queueResult.chainId,
                    script: scriptResult.script,
                    steps: scriptResult.steps,
                    executionOrder: scriptResult.executionOrder,
                    estimatedDuration: scriptResult.estimatedDuration,
                    dependencies: scriptResult.dependencies,
                    validation: this.advancedFeatures.validation ? validationResult.validation : null,
                    aiModel: 'ollama_complex',
                    aiExplanation: `Generated complex multi-step script with ${scriptResult.steps.length} steps`
                }
            };

        } catch (error) {
            console.error('[OLLAMA AI] Error processing complex command:', error);
            return {
                success: false,
                error: error.message,
                data: {
                    type: 'error',
                    aiModel: 'ollama_error',
                    aiExplanation: 'Failed to process complex command'
                }
            };
        }
    }

    /**
     * Generate PowerShell script from template
     */
    async generateScriptFromTemplate(templateName, parameters, options = {}) {
        try {
            console.log('[OLLAMA AI] Generating script from template:', templateName);
            
            if (!this.advancedFeatures.scriptGeneration) {
                throw new Error('Script generation is disabled');
            }

            const scriptResult = await this.scriptGenerator.generateFromTemplate(templateName, parameters, options, this);
            
            if (!scriptResult.success) {
                throw new Error('Failed to generate script: ' + scriptResult.error);
            }

            // Validate the generated script
            if (this.advancedFeatures.validation) {
                const validationResult = await this.commandValidator.validateCommand(scriptResult.script, options);
                if (!validationResult.success) {
                    console.warn('[OLLAMA AI] Script validation failed:', validationResult.error);
                }
            }

            return {
                success: true,
                data: {
                    type: 'script_template',
                    scriptId: scriptResult.scriptId,
                    script: scriptResult.script,
                    template: templateName,
                    parameters: parameters,
                    metadata: scriptResult.metadata,
                    validation: this.advancedFeatures.validation ? validationResult.validation : null,
                    aiModel: 'ollama_script_generator',
                    aiExplanation: `Generated PowerShell script from template: ${templateName}`
                }
            };

        } catch (error) {
            console.error('[OLLAMA AI] Error generating script from template:', error);
            return {
                success: false,
                error: error.message,
                data: {
                    type: 'error',
                    aiModel: 'ollama_error',
                    aiExplanation: 'Failed to generate script from template'
                }
            };
        }
    }

    /**
     * Execute command queue
     */
    async executeCommandQueue(queueId, clientInfo) {
        try {
            console.log('[OLLAMA AI] Executing command queue:', queueId);
            
            const executionResult = await this.queueManager.executeQueue(queueId, clientInfo);
            
            if (executionResult.success) {
                // Aggregate results for analysis
                await this.resultAggregator.collectResults(queueId, executionResult.results, {
                    clientInfo: clientInfo,
                    executionType: 'queue'
                });
            }

            return executionResult;

        } catch (error) {
            console.error('[OLLAMA AI] Error executing command queue:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Get specialized prompt for task type
     */
    getSpecializedPrompt(taskType, context = {}) {
        return this.prompts.getPrompt(taskType, context);
    }

    /**
     * Process command with specialized prompt
     */
    async processWithSpecializedPrompt(userInput, taskType, clientInfo, context = {}) {
        try {
            console.log('[OLLAMA AI] Processing with specialized prompt:', taskType);
            
            const specializedPrompt = this.getSpecializedPrompt(taskType, {
                clientInfo: clientInfo,
                userInput: userInput,
                ...context
            });

            const selectedModel = this.selectModel(taskType, 'complex', 'normal');
            if (!selectedModel) {
                throw new Error('No suitable model found for task type: ' + taskType);
            }

            const messages = [
                {
                    role: 'system',
                    content: specializedPrompt
                },
                {
                    role: 'user',
                    content: userInput
                }
            ];

            const response = await this.callOllamaAPI(selectedModel, messages, context);
            
            return {
                success: true,
                data: {
                    command: response,
                    type: 'powershell',
                    category: taskType,
                    action: 'execute',
                    aiModel: selectedModel,
                    aiExplanation: `Generated using specialized ${taskType} prompt with ${selectedModel}`,
                    prompt: specializedPrompt
                }
            };

        } catch (error) {
            console.error('[OLLAMA AI] Error processing with specialized prompt:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Validate command before execution
     */
    async validateCommand(command, context = {}) {
        try {
            if (!this.advancedFeatures.validation) {
                return { success: true, validation: { overall: { canExecute: true } } };
            }

            const validationResult = await this.commandValidator.validateCommand(command, context);
            return validationResult;

        } catch (error) {
            console.error('[OLLAMA AI] Error validating command:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Learn from command execution results
     */
    async learnFromExecution(command, result, executionTime, context = {}) {
        try {
            if (!this.advancedFeatures.learning) {
                return { success: true };
            }

            const learningKey = `${command.substring(0, 50)}_${context.category || 'general'}`;
            const learningData = {
                command: command,
                result: result,
                executionTime: executionTime,
                context: context,
                timestamp: new Date().toISOString(),
                success: result.success || false
            };

            this.learningData.set(learningKey, learningData);
            
            // Update performance metrics
            this.updatePerformanceMetrics(command, result, executionTime, context);

            return { success: true };

        } catch (error) {
            console.error('[OLLAMA AI] Error learning from execution:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Update performance metrics
     */
    updatePerformanceMetrics(command, result, executionTime, context) {
        const category = (context && context.category) ? context.category : 'general';
        const model = (context && context.aiModel) ? context.aiModel : 'unknown';
        
        if (!this.performanceMetrics.has(category)) {
            this.performanceMetrics.set(category, new Map());
        }
        
        const categoryMetrics = this.performanceMetrics.get(category);
        if (!categoryMetrics.has(model)) {
            categoryMetrics.set(model, {
                totalExecutions: 0,
                successfulExecutions: 0,
                totalExecutionTime: 0,
                averageExecutionTime: 0,
                successRate: 0,
                lastUpdated: new Date().toISOString()
            });
        }
        
        const modelMetrics = categoryMetrics.get(model);
        modelMetrics.totalExecutions++;
        if (result && result.success) {
            modelMetrics.successfulExecutions++;
        }
        modelMetrics.totalExecutionTime += (executionTime || 0);
        modelMetrics.averageExecutionTime = modelMetrics.totalExecutionTime / modelMetrics.totalExecutions;
        modelMetrics.successRate = (modelMetrics.successfulExecutions / modelMetrics.totalExecutions) * 100;
        modelMetrics.lastUpdated = new Date().toISOString();
    }

    /**
     * Get advanced statistics
     */
    getAdvancedStatistics() {
        return {
            basic: this.getAIStatistics(),
            orchestrator: this.orchestrator.getStatistics(),
            scriptGenerator: this.scriptGenerator.getStatistics(),
            commandParser: this.commandParser.getStatistics(),
            commandValidator: this.commandValidator.getStatistics(),
            queueManager: this.queueManager.getStatistics(),
            resultAggregator: this.resultAggregator.getStatistics(),
            prompts: this.prompts.getStatistics(),
            performanceMetrics: Object.fromEntries(this.performanceMetrics),
            learningData: {
                totalEntries: this.learningData.size,
                categories: Array.from(new Set(Array.from(this.learningData.values()).map(d => d.context.category))),
                averageExecutionTime: this.calculateAverageExecutionTime(),
                successRate: this.calculateOverallSuccessRate()
            },
            advancedFeatures: this.advancedFeatures,
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Calculate average execution time from learning data
     */
    calculateAverageExecutionTime() {
        const entries = Array.from(this.learningData.values());
        if (entries.length === 0) return 0;
        
        const totalTime = entries.reduce((sum, entry) => sum + entry.executionTime, 0);
        return totalTime / entries.length;
    }

    /**
     * Calculate overall success rate from learning data
     */
    calculateOverallSuccessRate() {
        const entries = Array.from(this.learningData.values());
        if (entries.length === 0) return 0;
        
        const successfulEntries = entries.filter(entry => entry.success).length;
        return (successfulEntries / entries.length) * 100;
    }

    /**
     * Get available templates
     */
    getAvailableTemplates() {
        return this.scriptGenerator.scriptTemplates;
    }

    /**
     * Get queue status
     */
    getQueueStatus(queueId) {
        return this.queueManager.getQueueStatus(queueId);
    }

    /**
     * Get all queues
     */
    getAllQueues() {
        return this.queueManager.getAllQueues();
    }

    /**
     * Get aggregated results
     */
    getAggregatedResults(executionId) {
        return this.resultAggregator.getAggregatedResult(executionId);
    }

    // ========================================
    // INTELLIGENT AGENT METHODS
    // ========================================

    /**
     * Analyze command intent using intelligent analyzer
     * @param {string} userInput - User's command input
     * @param {object} clientInfo - Client information
     * @returns {object} Analysis result
     */
    async analyzeCommandIntent(userInput, clientInfo = {}) {
        try {
            console.log(`[OLLAMA AI] Analyzing command intent: ${userInput}`);
            const analysis = await this.intelligentAnalyzer.analyze(userInput, clientInfo);
            
            // Store analysis for learning
            this.learningData.set(`analysis_${Date.now()}`, {
                input: userInput,
                analysis: analysis,
                timestamp: new Date()
            });
            
            return analysis;
        } catch (error) {
            console.error('[OLLAMA AI] Intent analysis failed:', error);
            return this.intelligentAnalyzer.getDefaultAnalysis(userInput, clientInfo);
        }
    }

    /**
     * Generate fallback strategies based on intent analysis
     * @param {object} analysis - Command analysis result
     * @returns {Array} Array of strategies
     */
    async generateFallbackStrategies(analysis) {
        try {
            console.log(`[OLLAMA AI] Generating strategies for intent: ${analysis.intent}`);
            const strategies = await this.strategyPlanner.generateStrategies(analysis);
            
            // Store strategies for learning
            this.learningData.set(`strategies_${Date.now()}`, {
                analysis: analysis,
                strategies: strategies,
                timestamp: new Date()
            });
            
            return strategies;
        } catch (error) {
            console.error('[OLLAMA AI] Strategy generation failed:', error);
            return this.strategyPlanner.getDefaultStrategies(analysis);
        }
    }

    /**
     * Research solution using AI and web resources
     * @param {string} problem - Problem description
     * @param {Array} failedAttempts - Previous failed attempts
     * @returns {object} Research result
     */
    async researchSolution(problem, failedAttempts = []) {
        try {
            console.log(`[OLLAMA AI] Researching solution for: ${problem}`);
            
            // Use AI to analyze the problem
            const aiAnalysis = await this.processCommandWithAI(
                `Research and find solutions for: ${problem}. Previous attempts failed: ${failedAttempts.join(', ')}`
            );
            
            // Use web fetch to search for solutions
            const searchQuery = `${problem} solution download install`;
            const webResults = await this.webFetchService.searchForDownloadUrls(searchQuery);
            
            // Use browser automation to find more solutions
            let browserResults = null;
            try {
                const initResult = await this.browserAutomationService.initialize();
                if (initResult.success) {
                    const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`;
                    const navResult = await this.browserAutomationService.navigateToUrl(searchUrl);
                    
                    if (navResult.success) {
                        const linksResult = await this.browserAutomationService.extractDownloadLinks();
                        browserResults = linksResult;
                    }
                }
            } catch (error) {
                console.log(`[OLLAMA AI] Browser research failed: ${error.message}`);
            }
            
            const researchResult = {
                success: true,
                aiAnalysis: aiAnalysis,
                webResults: webResults,
                browserResults: browserResults,
                timestamp: new Date(),
                problem: problem,
                failedAttempts: failedAttempts
            };
            
            // Store research for learning
            this.learningData.set(`research_${Date.now()}`, researchResult);
            
            return researchResult;
        } catch (error) {
            console.error('[OLLAMA AI] Research failed:', error);
            return {
                success: false,
                error: error.message,
                problem: problem,
                failedAttempts: failedAttempts
            };
        }
    }

    /**
     * Adapt strategy based on error context
     * @param {object} currentStrategy - Current strategy
     * @param {object} errorContext - Error analysis context
     * @returns {object} Adapted strategy
     */
    async adaptStrategy(currentStrategy, errorContext) {
        try {
            console.log(`[OLLAMA AI] Adapting strategy based on error: ${errorContext.category}`);
            
            // Use strategy planner to adapt the strategy
            const adaptedStrategy = this.strategyPlanner.adaptStrategy(currentStrategy, errorContext);
            
            // Use AI to suggest improvements
            const aiSuggestion = await this.processCommandWithAI(
                `Improve this strategy based on error: ${JSON.stringify(errorContext)}. Strategy: ${JSON.stringify(currentStrategy)}`
            );
            
            // Apply AI suggestions if available
            if (aiSuggestion.success && aiSuggestion.command) {
                try {
                    const suggestion = JSON.parse(aiSuggestion.command);
                    if (suggestion.improvements) {
                        adaptedStrategy.aiImprovements = suggestion.improvements;
                    }
                } catch (parseError) {
                    console.log('[OLLAMA AI] Could not parse AI suggestion');
                }
            }
            
            // Store adaptation for learning
            this.learningData.set(`adaptation_${Date.now()}`, {
                originalStrategy: currentStrategy,
                errorContext: errorContext,
                adaptedStrategy: adaptedStrategy,
                timestamp: new Date()
            });
            
            return adaptedStrategy;
        } catch (error) {
            console.error('[OLLAMA AI] Strategy adaptation failed:', error);
            return currentStrategy; // Return original strategy if adaptation fails
        }
    }

    /**
     * Execute command with intelligent fallback
     * @param {string} userInput - User command
     * @param {object} clientInfo - Client information
     * @returns {object} Execution result
     */
    async executeWithIntelligentFallback(userInput, clientInfo = {}) {
        try {
            console.log(`[OLLAMA AI] Executing with intelligent fallback: ${userInput}`);
            
            // Check if multi-stage processing is needed
            if (this.requiresMultiStageProcessing(userInput)) {
                console.log('[OLLAMA AI] Using multi-stage processing pipeline');
                return await this.processWithMultiStage(userInput, clientInfo);
            }
            
            // Step 1: Analyze command intent
            const analysis = await this.analyzeCommandIntent(userInput, clientInfo);
            
            // Step 2: Generate fallback strategies
            const strategies = await this.generateFallbackStrategies(analysis);
            
            // Step 3: Execute with fallback
            const result = await this.executionOrchestrator.executeWithFallback(
                userInput,
                strategies,
                clientInfo
            );
            
            // Step 4: Learn from execution
            this.learnFromExecution(userInput, analysis, strategies, result);
            
            return {
                success: result.success,
                analysis: analysis,
                strategies: strategies,
                execution: result,
                message: result.success ? 
                    `Successfully executed using ${result.strategy}` : 
                    'All strategies failed'
            };
        } catch (error) {
            console.error('[OLLAMA AI] Intelligent execution failed:', error);
            return {
                success: false,
                error: error.message,
                message: 'Intelligent execution failed'
            };
        }
    }
    
    /**
     * Check if command requires multi-stage processing
     */
    requiresMultiStageProcessing(userInput) {
        const input = userInput.toLowerCase();
        return (
            (input.includes('download') && input.includes('run')) ||
            (input.includes('install') && input.includes('run')) ||
            (input.includes('download') && input.includes('install')) ||
            (input.includes('get') && input.includes('install'))
        );
    }
    
    /**
     * Process command with multi-stage pipeline
     * Stage 1: Context Analysis - Check system state
     * Stage 2: Resource Discovery - Find/download required resources
     * Stage 3: Execution - Run the actual command
     */
    async processWithMultiStage(userInput, clientInfo) {
        try {
            console.log('[OLLAMA AI] Starting multi-stage processing');
            
            const stages = {
                contextAnalysis: null,
                resourceDiscovery: null,
                execution: null
            };
            
            // Stage 1: Context Analysis
            console.log('[OLLAMA AI] Stage 1: Context Analysis');
            const systemState = await this.systemStateAnalyzer.analyzeSystemState(clientInfo, userInput);
            const analysis = await this.analyzeCommandIntent(userInput, clientInfo);
            
            stages.contextAnalysis = {
                systemState: systemState,
                analysis: analysis,
                timestamp: new Date()
            };
            
            // Check if software is already installed
            if (systemState.software.installed && systemState.software.path) {
                console.log(`[OLLAMA AI] Software already installed at: ${systemState.software.path}`);
                
                // Skip to execution stage
                const executeCommand = `start "" "${systemState.software.path}"`;
                
                stages.execution = {
                    success: true,
                    command: executeCommand,
                    skippedDiscovery: true,
                    reason: 'Software already installed'
                };
                
                return {
                    success: true,
                    stages: stages,
                    command: executeCommand,
                    multiStage: true
                };
            }
            
            // Stage 2: Resource Discovery
            console.log('[OLLAMA AI] Stage 2: Resource Discovery');
            const softwareName = systemState.software.requested;
            
            if (!softwareName) {
                return {
                    success: false,
                    error: 'Could not determine software name from user input',
                    stages: stages
                };
            }
            
            // Search for download URLs
            const searchResult = await this.executionOrchestrator.webSearchService.searchForSoftware(softwareName, 'windows');
            
            if (!searchResult.success || searchResult.urls.length === 0) {
                return {
                    success: false,
                    error: 'Could not find download URLs for software',
                    stages: stages,
                    searchResult: searchResult
                };
            }
            
            console.log(`[OLLAMA AI] Found ${searchResult.urls.length} download URLs`);
            
            stages.resourceDiscovery = {
                searchResult: searchResult,
                timestamp: new Date()
            };
            
            // Stage 3: Execution - Generate command to download and run
            console.log('[OLLAMA AI] Stage 3: Execution Planning');
            
            const bestUrl = searchResult.urls[0];
            const downloadDir = systemState.resources.downloadDirectory || 'C:\\Temp';
            const fileName = `${softwareName}_installer.exe`;
            const filePath = `${downloadDir}\\${fileName}`;
            
            // Generate download and execute command
            const executeCommand = `curl -L "${bestUrl.url}" -o "${filePath}" && start "" "${filePath}"`;
            
            stages.execution = {
                success: true,
                command: executeCommand,
                downloadUrl: bestUrl.url,
                filePath: filePath,
                timestamp: new Date()
            };
            
            console.log('[OLLAMA AI] Multi-stage processing complete');
            
            return {
                success: true,
                stages: stages,
                command: executeCommand,
                multiStage: true,
                message: `Will download from ${bestUrl.url} and execute installer`
            };
            
        } catch (error) {
            console.error('[OLLAMA AI] Multi-stage processing failed:', error);
            return {
                success: false,
                error: error.message,
                multiStage: true
            };
        }
    }

    /**
     * Learn from execution results
     * @param {string} userInput - Original user input
     * @param {object} analysis - Command analysis
     * @param {Array} strategies - Strategies used
     * @param {object} result - Execution result
     */
    learnFromExecution(userInput, analysis, strategies, result) {
        try {
            const learningEntry = {
                timestamp: new Date(),
                userInput: userInput,
                analysis: analysis,
                strategies: strategies,
                result: result,
                success: result.success,
                strategyUsed: result.strategy,
                duration: result.duration
            };
            
            // Store in learning data
            this.learningData.set(`execution_${Date.now()}`, learningEntry);
            
            // Update performance metrics
            this.updatePerformanceMetrics(analysis.intent, result.success, result.duration);
            
            // Update error analyzer if failed
            if (!result.success && result.error) {
                this.errorAnalyzer.updateErrorResolution(userInput, 'failure', result.strategy);
            }
            
            console.log(`[OLLAMA AI] Learned from execution: ${result.success ? 'success' : 'failure'}`);
        } catch (error) {
            console.error('[OLLAMA AI] Learning failed:', error);
        }
    }

    /**
     * Get intelligent agent statistics
     * @returns {object} Statistics
     */
    getIntelligentAgentStatistics() {
        try {
            const stats = {
                totalExecutions: this.learningData.size,
                successfulExecutions: 0,
                failedExecutions: 0,
                averageExecutionTime: 0,
                intentDistribution: {},
                strategyPerformance: {},
                errorCategories: {},
                learningInsights: []
            };
            
            let totalTime = 0;
            const executions = Array.from(this.learningData.values())
                .filter(entry => entry.result);
            
            for (const execution of executions) {
                if (execution.success) {
                    stats.successfulExecutions++;
                } else {
                    stats.failedExecutions++;
                }
                
                totalTime += execution.duration || 0;
                
                // Intent distribution
                const intent = execution.analysis?.intent || 'unknown';
                stats.intentDistribution[intent] = (stats.intentDistribution[intent] || 0) + 1;
                
                // Strategy performance
                const strategy = execution.strategyUsed || 'unknown';
                if (!stats.strategyPerformance[strategy]) {
                    stats.strategyPerformance[strategy] = { successes: 0, failures: 0 };
                }
                if (execution.success) {
                    stats.strategyPerformance[strategy].successes++;
                } else {
                    stats.strategyPerformance[strategy].failures++;
                }
            }
            
            stats.averageExecutionTime = executions.length > 0 ? totalTime / executions.length : 0;
            
            // Get error analyzer statistics
            const errorStats = this.errorAnalyzer.getLearningStatistics();
            stats.errorCategories = errorStats.categories;
            
            // Get execution orchestrator statistics
            const orchestratorStats = this.executionOrchestrator.getExecutionStatistics();
            stats.orchestratorStats = orchestratorStats;
            
            return stats;
        } catch (error) {
            console.error('[OLLAMA AI] Statistics generation failed:', error);
            return {
                error: error.message,
                totalExecutions: this.learningData.size
            };
        }
    }

    /**
     * Clean up intelligent agent resources
     */
    async cleanupIntelligentAgent() {
        try {
            await this.executionOrchestrator.cleanup();
            console.log('[OLLAMA AI] Intelligent agent cleanup completed');
        } catch (error) {
            console.error('[OLLAMA AI] Cleanup failed:', error);
        }
    }
}

module.exports = OllamaAICommandProcessor;
