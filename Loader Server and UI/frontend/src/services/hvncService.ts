import axios from 'axios';

interface HvncSessionOptions {
  quality: string;
  mode: string;
}

interface HvncSessionResponse {
  status: string;
  data: {
    sessionId: string;
    connectionUrl?: string;
  };
}

const hvncService = {
  // Start a new HVNC session
  startSession: async (agentId: string, options: HvncSessionOptions): Promise<HvncSessionResponse> => {
    try {
      const response = await axios.post(`/api/agent/${agentId}/hvnc/start`, options);
      return response.data;
    } catch (error) {
      console.error('Error starting HVNC session:', error);
      throw error;
    }
  },

  // Stop an active HVNC session
  stopSession: async (agentId: string, sessionId: string): Promise<any> => {
    try {
      const response = await axios.post(`/api/agent/${agentId}/hvnc/stop`, { sessionId });
      return response.data;
    } catch (error) {
      console.error('Error stopping HVNC session:', error);
      throw error;
    }
  },

  // Get the status of an HVNC session
  getSessionStatus: async (agentId: string, sessionId: string): Promise<any> => {
    try {
      const response = await axios.get(`/api/agent/${agentId}/hvnc/status/${sessionId}`);
      return response.data;
    } catch (error) {
      console.error('Error getting HVNC session status:', error);
      throw error;
    }
  },

  // Send a command to the HVNC session (mouse, keyboard, etc.)
  sendCommand: async (agentId: string, sessionId: string, command: any): Promise<any> => {
    try {
      const response = await axios.post(`/api/agent/${agentId}/hvnc/command`, {
        sessionId,
        ...command
      });
      return response.data;
    } catch (error) {
      console.error('Error sending HVNC command:', error);
      throw error;
    }
  },

  // Take a screenshot of the current HVNC session
  takeScreenshot: async (agentId: string, sessionId: string): Promise<any> => {
    try {
      const response = await axios.post(`/api/agent/${agentId}/hvnc/screenshot`, { sessionId });
      return response.data;
    } catch (error) {
      console.error('Error taking HVNC screenshot:', error);
      throw error;
    }
  }
};

export default hvncService;