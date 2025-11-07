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
      
      // Try the new AI endpoint first
      const response = await axios.post(`${API_BASE_URL}/api/ai/process-command`, {
        userInput,
        clientInfo,
        context
      }, {
        headers: this.getAuthHeaders(),
        timeout: 30000 // 30 second timeout for AI processing
      });

      console.log('[AI SERVICE] AI response:', response.data);
      
      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.error || 'AI processing failed');
      }
    } catch (error) {
      console.error('[AI SERVICE] Error processing natural language:', error);
      
      // Fallback to simple command generation
      console.log('[AI SERVICE] Falling back to simple command generation');
      return this.generateFallbackCommand(userInput, clientInfo);
    }
  }

  /**
   * Generate fallback command when AI is unavailable
   */
  private generateFallbackCommand(userInput: string, clientInfo: any) {
    const input = userInput.toLowerCase();
    
    // Simple pattern matching for common requests
    if (input.includes('download') && input.includes('putty')) {
      return {
        command: `$software='PuTTY'; $downloadPath='$env:TEMP\\putty.exe'; try { Write-Host 'Downloading PuTTY...'; Invoke-WebRequest -Uri 'https://the.earth.li/~sgtatham/putty/latest/w64/putty.exe' -OutFile $downloadPath -UseBasicParsing; Write-Host 'Download complete, launching...'; Start-Process -FilePath $downloadPath; Write-Host 'PuTTY launched successfully!' } catch { Write-Host "Error: $_"; Write-Host 'Trying alternative method...'; winget install PuTTY.PuTTY }`,
        type: 'powershell',
        timeout: 300,
        explanation: 'I\'ll download PuTTY from the official site and launch it. If that fails, I\'ll use Windows Package Manager.',
        safety_level: 'safe',
        alternatives: ['winget install PuTTY.PuTTY'],
        steps: ['Download PuTTY installer', 'Launch PuTTY', 'Fallback to winget if needed']
      };
    }
    
    if (input.includes('system info') || input.includes('computer info')) {
      return {
        command: 'Get-ComputerInfo | Select-Object WindowsProductName, WindowsVersion, TotalPhysicalMemory, CsProcessors, CsSystemType',
        type: 'powershell',
        timeout: 60,
        explanation: 'I\'ll show you detailed system information including OS, memory, and processor details.',
        safety_level: 'safe',
        alternatives: ['systeminfo'],
        steps: ['Query system information', 'Display formatted results']
      };
    }
    
    if (input.includes('list') && input.includes('process')) {
      return {
        command: 'Get-Process | Select-Object Name, Id, CPU, WorkingSet | Sort-Object CPU -Descending | Format-Table -AutoSize',
        type: 'powershell',
        timeout: 60,
        explanation: 'I\'ll list all running processes sorted by CPU usage.',
        safety_level: 'safe',
        alternatives: ['tasklist'],
        steps: ['Query running processes', 'Sort by CPU usage', 'Display results']
      };
    }
    
    // Generic fallback
    return {
      command: `Write-Host "I understand you want to: ${userInput}"; Write-Host "However, AI processing is currently unavailable. Please try a more specific command or contact support."`,
      type: 'powershell',
      timeout: 30,
      explanation: 'AI processing is unavailable. Please try a more specific command.',
      safety_level: 'safe',
      alternatives: [],
      steps: ['Display user request', 'Inform about AI unavailability']
    };
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
   * Generate command execution points using Hugging Face Point Generator
   */
  async generatePoints(userInput: string, clientInfo: any, context: any = {}) {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/ai/generate-points`, {
        userInput,
        clientInfo,
        context
      }, {
        headers: this.getAuthHeaders()
      });

      return response.data;
    } catch (error) {
      console.error('[AI SERVICE] Error generating points:', error);
      throw error;
    }
  }

  /**
   * Switch to VL LM as primary provider (admin only)
   */
  async switchToVLLM() {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/ai/switch-to-vllm`, {}, {
        headers: this.getAuthHeaders()
      });

      return response.data;
    } catch (error) {
      console.error('[AI SERVICE] Error switching to VL LM:', error);
      throw error;
    }
  }

  /**
   * Test all AI services
   */
  async testAllServices() {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/ai/test-all`, {}, {
        headers: this.getAuthHeaders()
      });

      return response.data;
    } catch (error) {
      console.error('[AI SERVICE] Error testing services:', error);
      throw error;
    }
  }

  /**
   * Test AI service connection
   */
  async testConnection() {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/ai/status`, {
        headers: this.getAuthHeaders(),
        timeout: 5000
      });

      // Handle new unified status format
      if (response.data.success) {
        const providers = response.data.providers || {};
        return providers.gemini?.available || providers.vllm?.available || false;
      }
      return false;
    } catch (error) {
      console.error('[AI SERVICE] Connection test failed:', error);
      return false;
    }
  }

  /**
   * Get AI service status
   */
  async getStatus() {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/ai/status`, {
        headers: this.getAuthHeaders()
      });

      return response.data;
    } catch (error) {
      console.error('[AI SERVICE] Error getting status:', error);
      throw error;
    }
  }
}

export default new AIService();
