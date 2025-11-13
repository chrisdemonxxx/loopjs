import { api } from './api';

export interface HvncSessionConfig {
  quality?: 'high' | 'medium' | 'low';
  fps?: number;
}

export interface HvncCommand {
  command: string;
  params?: Record<string, any>;
}

export interface HvncSession {
  sessionId: string;
  status: 'starting' | 'active' | 'stopping' | 'stopped' | 'error';
  quality?: 'low' | 'medium' | 'high';
  fps?: number;
  screenInfo?: {
    width: number;
    height: number;
    colorDepth: number;
    dpi: number;
  };
  startedAt?: string;
  endedAt?: string;
  error?: string;
}

class HvncService {
  /**
   * Start HVNC session
   */
  async startSession(agentId: string, config: HvncSessionConfig = {}): Promise<{ status: string; sessionId: string }> {
    return api.post(`/agent/${agentId}/hvnc/start`, config);
  }

  /**
   * Stop HVNC session
   */
  async stopSession(agentId: string): Promise<{ status: string }> {
    return api.post(`/agent/${agentId}/hvnc/stop`);
  }

  /**
   * Get HVNC session status
   */
  async getSessionStatus(agentId: string, sessionId?: string): Promise<{ status: string; hvncSession: HvncSession }> {
    const url = sessionId
      ? `/agent/${agentId}/hvnc/status/${sessionId}`
      : `/agent/${agentId}/hvnc/status`;
    return api.get(url);
  }

  /**
   * Send HVNC command
   */
  async sendCommand(agentId: string, command: HvncCommand): Promise<{ status: string }> {
    return api.post(`/agent/${agentId}/hvnc/command`, command);
  }

  /**
   * Take screenshot
   */
  async takeScreenshot(agentId: string): Promise<{ status: string; screenshot: string }> {
    return api.post(`/agent/${agentId}/hvnc/screenshot`);
  }
}

export const hvncService = new HvncService();
export default hvncService;
