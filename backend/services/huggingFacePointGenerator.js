const { HfInference } = require('@huggingface/inference');

/**
 * Hugging Face Point Generator Service
 * Generates command execution strategies (points) using Hugging Face inference
 */
class HuggingFacePointGenerator {
    constructor() {
        // Initialize Hugging Face client
        const apiKey = process.env.HUGGINGFACE_API_KEY;
        this.hf = apiKey ? new HfInference(apiKey) : null;
        
        // Model configuration - using a fast, capable model for command generation
        this.model = process.env.HF_POINT_GENERATOR_MODEL || 'microsoft/DialoGPT-medium';
        this.isAvailable = !!apiKey && apiKey !== 'your-huggingface-api-key-here';
        
        console.log('[HF POINT GENERATOR] Initialized:', {
            available: this.isAvailable,
            model: this.model,
            hasApiKey: !!apiKey
        });
        
        // Strategy cache for faster responses
        this.strategyCache = new Map();
    }

    /**
     * Generate execution points/strategies for a command
     * @param {string} userInput - Natural language command input
     * @param {object} clientInfo - Client information (platform, system info)
     * @param {object} context - Additional context
     * @returns {Promise<object>} Generated strategies/points
     */
    async generatePoints(userInput, clientInfo, context = {}) {
        try {
            if (!this.isAvailable) {
                console.log('[HF POINT GENERATOR] Hugging Face not available, using fallback');
                return this.fallbackPointGeneration(userInput, clientInfo, context);
            }

            // Check cache first
            const cacheKey = `${userInput}_${clientInfo.platform}`;
            if (this.strategyCache.has(cacheKey)) {
                console.log('[HF POINT GENERATOR] Using cached strategy');
                return this.strategyCache.get(cacheKey);
            }

            // Build prompt for strategy generation
            const prompt = this.buildStrategyPrompt(userInput, clientInfo, context);

            // Use text generation for strategy creation
            const response = await this.hf.textGeneration({
                model: this.model,
                inputs: prompt,
                parameters: {
                    max_new_tokens: 500,
                    temperature: 0.7,
                    top_p: 0.9,
                    return_full_text: false
                }
            });

            // Parse response into structured strategies
            const strategies = this.parseStrategyResponse(response.generated_text, userInput, clientInfo);

            // Cache the result
            this.strategyCache.set(cacheKey, strategies);
            
            // Limit cache size
            if (this.strategyCache.size > 100) {
                const firstKey = this.strategyCache.keys().next().value;
                this.strategyCache.delete(firstKey);
            }

            console.log('[HF POINT GENERATOR] Generated strategies:', strategies.strategies.length);
            return strategies;

        } catch (error) {
            console.error('[HF POINT GENERATOR] Error generating points:', error);
            return this.fallbackPointGeneration(userInput, clientInfo, context);
        }
    }

    /**
     * Build prompt for strategy generation
     */
    buildStrategyPrompt(userInput, clientInfo, context) {
        const platform = clientInfo.platform || 'unknown';
        const systemInfo = clientInfo.systemInfo || {};

        return `You are an expert system administrator AI. Generate execution strategies (points) for the following command request.

USER REQUEST: "${userInput}"

TARGET SYSTEM:
- Platform: ${platform}
- OS: ${systemInfo.OSVersion || 'Unknown'}
- Architecture: ${systemInfo.Is64BitOperatingSystem === 'True' ? '64-bit' : '32-bit'}

Generate 2-4 execution strategies in JSON format:
{
  "strategies": [
    {
      "id": "strategy_1",
      "name": "Strategy name",
      "description": "What this strategy does",
      "priority": 1,
      "command": "actual_command_to_execute",
      "type": "powershell|cmd|wmic",
      "timeout": 300,
      "successRate": 85,
      "estimatedTime": 30,
      "tools": ["tool1", "tool2"],
      "steps": ["step1", "step2"]
    }
  ],
  "recommendedStrategy": "strategy_1",
  "complexity": "low|medium|high",
  "confidence": 85
}

Respond ONLY with valid JSON.`;
    }

    /**
     * Parse Hugging Face response into structured strategies
     */
    parseStrategyResponse(responseText, userInput, clientInfo) {
        try {
            // Extract JSON from response
            const jsonMatch = responseText.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0]);
                
                // Validate and structure response
                return {
                    success: true,
                    strategies: parsed.strategies || [],
                    recommendedStrategy: parsed.recommendedStrategy || parsed.strategies?.[0]?.id,
                    complexity: parsed.complexity || 'medium',
                    confidence: parsed.confidence || 75,
                    provider: 'huggingface',
                    model: this.model,
                    timestamp: new Date().toISOString()
                };
            }
        } catch (error) {
            console.error('[HF POINT GENERATOR] Error parsing response:', error);
        }

        // Fallback if parsing fails
        return this.fallbackPointGeneration(userInput, clientInfo);
    }

    /**
     * Fallback point generation when HF is unavailable
     */
    fallbackPointGeneration(userInput, clientInfo, context = {}) {
        const input = userInput.toLowerCase();
        const platform = clientInfo.platform || 'windows';

        // Generate simple fallback strategies
        const strategies = [];

        // Strategy 1: Direct command
        strategies.push({
            id: 'strategy_1',
            name: 'Direct Execution',
            description: 'Execute command directly',
            priority: 1,
            command: this.extractCommand(userInput, platform),
            type: platform === 'windows' ? 'powershell' : 'bash',
            timeout: 300,
            successRate: 70,
            estimatedTime: 10,
            tools: [platform === 'windows' ? 'PowerShell' : 'Bash'],
            steps: ['Execute command', 'Capture output']
        });

        // Strategy 2: With error handling
        strategies.push({
            id: 'strategy_2',
            name: 'Error-Handled Execution',
            description: 'Execute with comprehensive error handling',
            priority: 2,
            command: this.wrapWithErrorHandling(this.extractCommand(userInput, platform), platform),
            type: platform === 'windows' ? 'powershell' : 'bash',
            timeout: 300,
            successRate: 85,
            estimatedTime: 15,
            tools: [platform === 'windows' ? 'PowerShell' : 'Bash'],
            steps: ['Validate input', 'Execute command', 'Handle errors', 'Return result']
        });

        return {
            success: true,
            strategies,
            recommendedStrategy: 'strategy_2',
            complexity: 'low',
            confidence: 70,
            provider: 'fallback',
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Extract command from user input
     */
    extractCommand(userInput, platform) {
        const input = userInput.toLowerCase();

        if (input.includes('system info') || input.includes('computer info')) {
            return platform === 'windows' 
                ? 'Get-ComputerInfo | Select-Object WindowsProductName, WindowsVersion, TotalPhysicalMemory'
                : 'uname -a && free -h && df -h';
        }

        if (input.includes('list') && input.includes('process')) {
            return platform === 'windows'
                ? 'Get-Process | Select-Object Name, Id, CPU, WorkingSet'
                : 'ps aux';
        }

        if (input.includes('download')) {
            const urlMatch = userInput.match(/https?:\/\/[^\s]+/);
            if (urlMatch) {
                return platform === 'windows'
                    ? `Invoke-WebRequest -Uri "${urlMatch[0]}" -OutFile "$env:TEMP\\downloaded_file.exe"`
                    : `wget "${urlMatch[0]}" -O /tmp/downloaded_file`;
            }
        }

        // Default
        return platform === 'windows'
            ? `Write-Host "${userInput}"`
            : `echo "${userInput}"`;
    }

    /**
     * Wrap command with error handling
     */
    wrapWithErrorHandling(command, platform) {
        if (platform === 'windows') {
            return `try { ${command} } catch { Write-Error "Error: $_"; exit 1 }`;
        } else {
            return `(${command}) || { echo "Error executing command"; exit 1; }`;
        }
    }

    /**
     * Test Hugging Face connection
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
            console.error('[HF POINT GENERATOR] Connection test failed:', error);
            return false;
        }
    }

    /**
     * Get service statistics
     */
    getStatistics() {
        return {
            available: this.isAvailable,
            model: this.model,
            cacheSize: this.strategyCache.size,
            provider: 'huggingface',
            timestamp: new Date().toISOString()
        };
    }
}

module.exports = HuggingFacePointGenerator;
