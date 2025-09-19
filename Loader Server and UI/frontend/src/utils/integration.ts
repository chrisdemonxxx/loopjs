/**
 * Frontend Integration Layer
 * 
 * This module provides a clear interface for communication between:
 * 1. Frontend and Backend API
 * 2. Frontend and WebSocket connections
 * 
 * By centralizing the integration points, we ensure proper segregation
 * and make future changes easier to implement.
 */

import request from '../axios';
import { API_URL, WS_URL } from '../config';

// Types
export interface Client {
  uuid: string;
  computerName: string;
  ipAddress: string;
  country: string;
  status: string;
  lastActiveTime: string;
  additionalSystemDetails: string;
}

export interface Command {
  id: string;
  clientId: string;
  command: string;
  status: string;
  output?: string;
  createdAt: string;
}

// API Integration
export const apiIntegration = {
  // Client operations
  getClients: async (): Promise<Client[]> => {
    try {
      const response = await request({
        method: 'GET',
        url: '/info/get-user-list'
      });
      
      if (response && response.data && response.data.data) {
        return response.data.data; // Backend returns {status:'success', data:[...]}
      } else {
        console.error('Invalid response format from server:', response);
        return [];
      }
    } catch (error) {
      console.error('Error in getClients:', error);
      throw error; // 向上传递错误，让调用者处理
    }
  },

  // Command operations
  sendCommand: async (clientId: string, command: string): Promise<Command> => {
    const response = await request({
      method: 'POST',
      url: '/commands',
      data: {
        clientId,
        command
      }
    });
    return response.data;
  },

  getCommands: async (clientId?: string): Promise<Command[]> => {
    const url = clientId 
      ? `/commands?clientId=${clientId}` 
      : `/commands`;
    const response = await request({
      method: 'GET',
      url: url
    });
    return response.data;
  }
};

// WebSocket Integration
export const wsIntegration = {
  // Create and manage WebSocket connection
  createConnection: (token: string, onMessage: (data: any) => void): WebSocket => {
    const ws = new WebSocket(WS_URL);
    
    ws.onopen = () => {
      // Authenticate the connection
      const authMessage = {
        type: 'auth',
        token
      };
      console.log('Sending WebSocket auth message with token:', token);
      try {
        const messageString = JSON.stringify(authMessage);
        console.log('Stringified message:', messageString);
        ws.send(messageString);
        console.log('WebSocket message sent successfully');
      } catch (error) {
        console.error('Error sending WebSocket message:', error);
      }
    };
    
    ws.onerror = (error) => {
      console.error('WebSocket connection error:', error);
    };
    
    ws.onclose = (event) => {
      console.log('WebSocket connection closed:', event.code, event.reason);
    };
    
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        onMessage(data);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };
    
    return ws;
  },
  
  // Handle different message types
  handleMessage: (data: any, callbacks: {
    onClientUpdate?: (clients: Client[]) => void;
    onCommandUpdate?: (command: Command) => void;
    onError?: (error: string) => void;
  }) => {
    const { type } = data;
    
    switch (type) {
      case 'client_list_update':
        if (callbacks.onClientUpdate) {
          callbacks.onClientUpdate(data.clients);
        }
        break;
        
      case 'client_status_update':
        if (callbacks.onClientUpdate) {
          callbacks.onClientUpdate([data.client]);
        }
        break;
        
      case 'command_update':
        if (callbacks.onCommandUpdate) {
          callbacks.onCommandUpdate(data.command);
        }
        break;
        
      case 'error':
        if (callbacks.onError) {
          callbacks.onError(data.message);
        }
        break;
        
      default:
        console.log('Unhandled WebSocket message type:', type);
    }
  }
};

export default {
  api: apiIntegration,
  ws: wsIntegration
};