import request from '../axios';

export interface HvncSessionOptions {
  quality: string;
  mode: string;
  fps?: number;
}

export interface HvncSessionResponse {
  status: string;
  message?: string;
  data: {
    sessionId: string;
    agentId: string;
    status: string;
    quality?: string;
    fps?: number;
  };
}

export interface HvncStopResponse {
  status: string;
  message?: string;
  data: {
    sessionId: string;
    agentId: string;
    status: string;
  };
}

const hvncService = {
  async startSession(agentId: string, options: HvncSessionOptions): Promise<HvncSessionResponse> {
    const response = await request({
      url: `/agent/${agentId}/hvnc/start`,
      method: 'POST',
      data: options,
    });

    return response.data;
  },

  async stopSession(agentId: string, sessionId: string): Promise<HvncStopResponse> {
    const response = await request({
      url: `/agent/${agentId}/hvnc/stop`,
      method: 'POST',
      data: { sessionId },
    });

    return response.data;
  },
};

export default hvncService;