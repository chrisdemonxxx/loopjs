import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

class AIService {
  private getAuthHeaders() {
    const token = localStorage.getItem('accessToken');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  }

  /**
   * Process natural language commands with intelligent agent system
   */
  async processNaturalLanguage(userInput: string, clientInfo: any, context: any = {}) {
    try {
      console.log('[AI SERVICE] Processing natural language:', userInput);
      
      const response = await axios.post(`${API_BASE_URL}/api/ai/natural-language`, {
        userInput,
        clientInfo,
        context,
        useIntelligentAgent: true
      }, {
        headers: this.getAuthHeaders()
      });

      console.log('[AI SERVICE] Natural language response:', response.data);
      return response.data;
    } catch (error) {
      console.error('[AI SERVICE] Error processing natural language:', error);
      console.error('[AI SERVICE] Error details:', error.response?.data);
      throw error;
    }
  }

  /**
   * Process a simple command using AI
   */
  async processCommand(category: string, action: string, params: any, clientInfo: any) {
    try {
      console.log('[AI SERVICE] Processing command:', { category, action, params, clientInfo });
      
      // Handle natural language processing differently
      if (category === 'natural_language') {
        const requestBody = {
          category,
          action,
          params,
          clientInfo,
          userInput: params.userInput // Add userInput for natural language
        };
        
        console.log('[AI SERVICE] Sending request to backend:', requestBody);
        
        const response = await axios.post(`${API_BASE_URL}/api/ai/process-command`, requestBody, {
          headers: this.getAuthHeaders()
        });
        
        console.log('[AI SERVICE] Backend response:', response.data);
        return response.data;
      }

      // Regular command processing
      const response = await axios.post(`${API_BASE_URL}/api/ai/process-command`, {
        category,
        action,
        params,
        clientInfo
      }, {
        headers: this.getAuthHeaders()
      });

      return response.data;
    } catch (error) {
      console.error('[AI SERVICE] Error processing command:', error);
      console.error('[AI SERVICE] Error details:', error.response?.data);
      throw error;
    }
  }

  /**
   * Handle command errors with AI retry logic
   */
  async handleError(error: any, originalCommand: any, clientInfo: any, retryCount: number = 0) {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/ai/handle-error`, {
        error,
        originalCommand,
        clientInfo,
        retryCount
      }, {
        headers: this.getAuthHeaders()
      });

      return response.data;
    } catch (error) {
      console.error('[AI SERVICE] Error handling error:', error);
      throw error;
    }
  }

  /**
   * Optimize a command for better performance
   */
  async optimizeCommand(command: any, clientInfo: any) {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/ai/optimize-command`, {
        command,
        clientInfo
      }, {
        headers: this.getAuthHeaders()
      });

      return response.data;
    } catch (error) {
      console.error('[AI SERVICE] Error optimizing command:', error);
      throw error;
    }
  }

  /**
   * Get AI system statistics
   */
  async getStatistics() {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/ai/statistics`, {
        headers: this.getAuthHeaders()
      });

      return response.data;
    } catch (error) {
      console.error('[AI SERVICE] Error getting statistics:', error);
      throw error;
    }
  }

  /**
   * Get available command templates
   */
  async getCommandTemplates() {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/ai/command-templates`, {
        headers: this.getAuthHeaders()
      });

      return response.data;
    } catch (error) {
      console.error('[AI SERVICE] Error getting templates:', error);
      throw error;
    }
  }

  /**
   * Learn from command execution results
   */
  async learnFromResult(commandId: string, success: boolean, error: any, clientInfo: any) {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/ai/learn-from-result`, {
        commandId,
        success,
        error,
        clientInfo
      }, {
        headers: this.getAuthHeaders()
      });

      return response.data;
    } catch (error) {
      console.error('[AI SERVICE] Error learning from result:', error);
      throw error;
    }
  }

  /**
   * Test AI service connection
   */
  async testConnection() {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/ai/statistics`, {
        headers: this.getAuthHeaders(),
        timeout: 5000
      });

      return response.status === 200;
    } catch (error) {
      console.error('[AI SERVICE] Connection test failed:', error);
      return false;
    }
  }
}

export default new AIService();
