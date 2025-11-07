const { HfInference } = require('@huggingface/inference');

/**
 * Hugging Face Inference Service
 * Provides access to Hugging Face models for various AI tasks
 */
class HuggingFaceService {
    constructor() {
        const apiKey = process.env.HUGGINGFACE_API_KEY;
        
        if (apiKey && apiKey !== 'your-huggingface-api-key-here') {
            this.hf = new HfInference(apiKey);
            this.isAvailable = true;
            console.log('[HUGGINGFACE] Service initialized successfully');
        } else {
            this.hf = null;
            this.isAvailable = false;
            console.log('[HUGGINGFACE] API key not configured, service unavailable');
        }
    }

    /**
     * Generate points/coordinates using Hugging Face models
     * This is the Point Generator functionality
     */
    async generatePoints(prompt, context = {}) {
        try {
            if (!this.isAvailable) {
                throw new Error('Hugging Face API key not configured');
            }

            // Use a text generation model for point generation
            // You can replace with a specific model trained for coordinate/point generation
            const model = process.env.HF_POINT_GENERATOR_MODEL || 'mistralai/Mistral-7B-Instruct-v0.2';
            
            console.log('[HUGGINGFACE] Generating points with model:', model);
            
            const response = await this.hf.textGeneration({
                model: model,
                inputs: this.buildPointGenerationPrompt(prompt, context),
                parameters: {
                    max_new_tokens: 500,
                    temperature: 0.7,
                    return_full_text: false
                }
            });

            const generatedText = response.generated_text || '';
            const points = this.parsePointsFromResponse(generatedText);
            
            return {
                success: true,
                points: points,
                rawResponse: generatedText,
                model: model,
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            console.error('[HUGGINGFACE] Error generating points:', error);
            throw error;
        }
    }

    /**
     * Build prompt for point generation
     */
    buildPointGenerationPrompt(prompt, context) {
        return `You are a Point Generator AI. Generate coordinates/points based on the user's request.

User Request: ${prompt}
Context: ${JSON.stringify(context)}

Generate a JSON array of points with the following format:
[
  {"x": number, "y": number, "z": number (optional), "label": "string (optional)"},
  ...
]

Respond ONLY with valid JSON array.`;
    }

    /**
     * Parse points from AI response
     */
    parsePointsFromResponse(response) {
        try {
            // Try to extract JSON from response
            const jsonMatch = response.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
            
            // Fallback: try parsing entire response
            return JSON.parse(response);
        } catch (error) {
            console.error('[HUGGINGFACE] Error parsing points:', error);
            // Return default points if parsing fails
            return [
                { x: 0, y: 0, label: 'default' }
            ];
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
            
            // Simple test with a small model
            const response = await this.hf.textGeneration({
                model: 'gpt2',
                inputs: 'test',
                parameters: {
                    max_new_tokens: 5
                }
            });
            
            return !!response;
        } catch (error) {
            console.error('[HUGGINGFACE] Connection test failed:', error);
            return false;
        }
    }
}

module.exports = HuggingFaceService;
