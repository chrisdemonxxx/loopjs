import { api } from './api';

export interface Agent {
  uuid: string;
  computerName: string;
  ipAddress: string;
  hostname: string;
  platform: string;
  operatingSystem: 'windows' | 'linux' | 'macos' | 'android' | 'ios';
  osVersion?: string;
  architecture?: 'x86' | 'x64' | 'arm' | 'arm64';
  status: 'online' | 'offline';
  lastSeen: string;
  lastHeartbeat?: string;
  firstSeen?: string;

  geoLocation?: {
    country?: string;
    countryCode?: string;
    region?: string;
    city?: string;
    latitude?: number;
    longitude?: number;
    timezone?: string;
    isp?: string;
  };

  systemInfo?: {
    username?: string;
    domain?: string;
    isAdmin?: boolean;
    antivirus?: string[];
    uptime?: number;
    memory?: { total: number; available: number };
    disk?: { total: number; free: number };
    cpuInfo?: { model: string; cores: number; speed: number };
    systemMetrics?: {
      cpuUsage?: number;
      memoryUsage?: number;
      diskUsage?: number;
    };
  };

  capabilities?: {
    persistence?: string[];
    injection?: string[];
    evasion?: string[];
    commands?: string[];
    features?: string[];
  };

  hvncSession?: {
    sessionId: string;
    status: 'starting' | 'active' | 'stopping' | 'stopped' | 'error';
    quality: 'low' | 'medium' | 'high';
    fps?: number;
  };
}

export interface Task {
  taskId: string;
  agentUuid: string;
  command: string;
  params?: any;
  queue: {
    state: 'pending' | 'sent' | 'ack' | 'completed' | 'failed';
    reason?: string;
    attempts?: number;
    lastAttemptAt?: string;
    priority?: number;
  };
  createdBy?: string;
  sentAt?: string;
  ackAt?: string;
  completedAt?: string;
  executionTimeMs?: number;
  output?: string;
  errorMessage?: string;
  platform?: string;
  status: 'pending' | 'executed' | 'failed' | 'cancelled';
  createdAt: string;
  updatedAt: string;
}

export interface CommandResponse {
  status: string;
  taskId: string;
  message?: string;
}

export interface TaskStats {
  total: number;
  pending: number;
  executed: number;
  failed: number;
  cancelled: number;
  avgExecutionTime?: number;
}

class AgentService {
  /**
   * Get all agents
   */
  async getAgents(): Promise<{ status: string; data: { agents: Agent[]; total: number } }> {
    return api.get('/agent');
  }

  /**
   * Get agent status
   */
  async getAgentStatus(agentId: string): Promise<{ status: string; agent: Agent }> {
    return api.get(`/agent/${agentId}/status`);
  }

  /**
   * Send command to agent
   */
  async sendCommand(agentId: string, command: string, params?: any): Promise<CommandResponse> {
    return api.post(`/agent/${agentId}/command`, { command, params });
  }

  /**
   * Capture screenshot
   */
  async captureScreenshot(agentId: string): Promise<{ status: string; screenshot: string }> {
    return api.post(`/agent/${agentId}/screenshot`);
  }

  /**
   * Get all tasks
   */
  async getTasks(): Promise<{ status: string; tasks: Task[] }> {
    return api.get('/task');
  }

  /**
   * Get task statistics
   */
  async getTaskStats(): Promise<{ status: string; stats: TaskStats }> {
    return api.get('/task/stats');
  }

  /**
   * Get specific task
   */
  async getTask(taskId: string): Promise<{ status: string; task: Task }> {
    return api.get(`/task/${taskId}`);
  }

  /**
   * Retry failed task
   */
  async retryTask(taskId: string): Promise<{ status: string; task: Task }> {
    return api.post(`/task/${taskId}/retry`);
  }

  /**
   * Cancel task
   */
  async cancelTask(taskId: string): Promise<{ status: string }> {
    return api.post(`/task/${taskId}/cancel`);
  }

  /**
   * Get client task history
   */
  async getClientHistory(agentUuid: string): Promise<{ status: string; history: Task[] }> {
    return api.get(`/task/client/${agentUuid}/history`);
  }

  /**
   * Send command via command API
   */
  async sendScriptToClient(commandKey: string, uuid: string, command?: string): Promise<CommandResponse> {
    return api.post('/command/send-script-to-client', { commandKey, uuid, command });
  }

  /**
   * Get available commands for client
   */
  async getAvailableCommands(uuid: string): Promise<{ status: string; commands: string[] }> {
    return api.get(`/command/available/${uuid}`);
  }

  /**
   * Get tasks for specific client
   */
  async getClientTasks(uuid: string): Promise<{ status: string; tasks: Task[] }> {
    return api.get(`/command/tasks/${uuid}`);
  }

  /**
   * Validate command
   */
  async validateCommand(command: string, uuid: string): Promise<{ status: string; valid: boolean; errors?: string[] }> {
    return api.post('/command/validate', { command, uuid });
  }

  /**
   * Get client metrics
   */
  async getClientMetrics(agentUuid: string): Promise<{ status: string; metrics: any }> {
    return api.get(`/metrics/client/${agentUuid}`);
  }

  /**
   * Get system metrics
   */
  async getSystemMetrics(): Promise<{ status: string; metrics: any }> {
    return api.get('/metrics/system');
  }
}

export const agentService = new AgentService();
export default agentService;
