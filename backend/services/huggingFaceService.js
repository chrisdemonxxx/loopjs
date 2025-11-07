const { HfInference } = require('@huggingface/inference');

/**
 * Hugging Face Inference Service for Point Generator
 * Generates command execution points/coordinates using Hugging Face models
 */
class HuggingFaceService {
    constructor() {
        this.hf = null;
        this.isAvailable = false;
        this.modelName = process.env.HF_MODEL_NAME || 'microsoft/DialoGPT-medium';
        this.pointGeneratorModel = process.env.HF_POINT_GENERATOR_MODEL || 'gpt2';
        
        // Initialize Hugging Face client
        const apiKey = process.env.HUGGINGFACE_API_KEY;
        if (apiKey && apiKey !== 'your-huggingface-api-key-here') {
            this.hf = new HfInference(apiKey);
            this.isAvailable = true;
            console.log('[HUGGINGFACE] Hugging Face service initialized successfully');
            console.log('[HUGGINGFACE] Model:', this.modelName);
            console.log('[HUGGINGFACE] Point Generator Model:', this.pointGeneratorModel);
        } else {
            console.log('[HUGGINGFACE] Hugging Face API key not configured, using fallback mode');
            this.isAvailable = false;
        }
    }

    /**
     * Generate command execution points using Hugging Face inference
     * Point Generator: Converts natural language to structured command execution points
     */
    async generatePoints(userInput, clientInfo, context = {}) {
        try {
            if (!this.isAvailable) {
                console.log('[HUGGINGFACE] Hugging Face not available, falling back');
                return await this.fallbackPointGeneration(userInput, clientInfo, context);
            }

            const platform = clientInfo.platform || 'unknown';
            const systemInfo = clientInfo.systemInfo || {};

            // Build prompt for point generation
            const prompt = this.buildPointGeneratorPrompt(userInput, clientInfo, context);

            console.log('[HUGGINGFACE] Generating points with model:', this.pointGeneratorModel);
            
            // Use text generation for point generation
            const response = await this.hf.textGeneration({
                model: this.pointGeneratorModel,
                inputs: prompt,
                parameters: {
                    max_new_tokens: 500,
                    temperature: 0.7,
                    top_p: 0.9,
                    return_full_text: false
                }
            });

            const generatedText = response.generated_text || '';
            console.log('[HUGGINGFACE] Generated text:', generatedText);

            // Parse points from generated text
            const points = this.parsePoints(generatedText, userInput, clientInfo);

            return {
                success: true,
                points: points,
                model: this.pointGeneratorModel,
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            console.error('[HUGGINGFACE] Error generating points:', error);
            return await this.fallbackPointGeneration(userInput, clientInfo, context);
        }
    }

    /**
     * Build prompt for point generator
     */
    buildPointGeneratorPrompt(userInput, clientInfo, context) {
        const platform = clientInfo.platform || 'unknown';
        
        return `Generate command execution points for the following request:

User Request: "${userInput}"
Platform: ${platform}
Context: ${JSON.stringify(context)}

Generate structured execution points in JSON format:
{
  "points": [
    {"step": 1, "action": "action_description", "command": "command_to_execute", "type": "powershell|cmd|bash"},
    {"step": 2, "action": "action_description", "command": "command_to_execute", "type": "powershell|cmd|bash"}
  ],
  "explanation": "overall_explanation"
}

Points:`;
    }

    /**
     * Parse points from generated text
     */
    parsePoints(generatedText, userInput, clientInfo) {
        try {
            // Try to extract JSON from generated text
            const jsonMatch = generatedText.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0]);
                if (parsed.points && Array.isArray(parsed.points)) {
                    return parsed.points;
                }
            }
        } catch (error) {
            console.error('[HUGGINGFACE] Error parsing points:', error);
        }

        // Fallback: Generate simple points from user input
        return this.generateSimplePoints(userInput, clientInfo);
    }

    /**
     * Generate simple points as fallback
     */
    generateSimplePoints(userInput, clientInfo) {
        const platform = clientInfo.platform || 'windows';
        const input = userInput.toLowerCase();
        
        const points = [];
        
        if (input.includes('download') || input.includes('install')) {
            points.push({
                step: 1,
                action: 'Download file',
                command: platform === 'windows' 
                    ? 'Invoke-WebRequest -Uri "URL_HERE" -OutFile "$env:TEMP\\file.exe"'
                    : 'wget -O /tmp/file "URL_HERE"',
                type: platform === 'windows' ? 'powershell' : 'bash'
            });
            points.push({
                step: 2,
                action: 'Execute file',
                command: platform === 'windows'
                    ? 'Start-Process -FilePath "$env:TEMP\\file.exe"'
                    : 'chmod +x /tmp/file && /tmp/file',
                type: platform === 'windows' ? 'powershell' : 'bash'
            });
        } else if (input.includes('system info') || input.includes('computer info')) {
            points.push({
                step: 1,
                action: 'Get system information',
                command: platform === 'windows'
                    ? 'Get-ComputerInfo | Select-Object WindowsProductName, WindowsVersion, TotalPhysicalMemory'
                    : 'uname -a && free -h && df -h',
                type: platform === 'windows' ? 'powershell' : 'bash'
            });
        } else {
            points.push({
                step: 1,
                action: 'Execute command',
                command: userInput,
                type: platform === 'windows' ? 'powershell' : 'bash'
            });
        }

        return points;
    }

    /**
     * Fallback point generation
     */
    async fallbackPointGeneration(userInput, clientInfo, context) {
        console.log('[HUGGINGFACE] Using fallback point generation');
        const points = this.generateSimplePoints(userInput, clientInfo);
        
        return {
            success: true,
            points: points,
            model: 'fallback',
            timestamp: new Date().toISOString()
        };
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
                model: 'gpt2',
                inputs: 'Test',
                parameters: {
                    max_new_tokens: 10
                }
            });

            return !!response.generated_text;
        } catch (error) {
            console.error('[HUGGINGFACE] Connection test failed:', error);
            return false;
        }
    }
}

module.exports = HuggingFaceService;
