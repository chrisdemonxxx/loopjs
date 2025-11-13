import { api } from './api';

export interface AgentBuild {
  _id: string;
  agentId: string;
  name: string;
  version: string;
  description?: string;
  config: any;
  status: 'queued' | 'generating' | 'compiling' | 'packaging' | 'ready' | 'error';
  progress: number;
  createdBy: string;

  filePaths?: {
    exe?: string;
    msi?: string;
    zip?: string;
    cpp?: string;
    logs?: string;
  };

  metadata?: {
    serviceName?: string;
    features?: string[];
    securityFeatures?: string[];
    junkCodeLines?: number;
  };

  errorMessage?: string;
  startedAt?: string;
  completedAt?: string;
  fileSize?: number;
  downloadCount?: number;
  testResults?: any;

  createdAt: string;
  updatedAt: string;
}

export interface AgentTemplate {
  _id: string;
  name: string;
  description?: string;
  config: any;
  createdBy: string;
  isPublic: boolean;
  usageCount: number;
  lastUsedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BuildConfig {
  name: string;
  config: any;
  description?: string;
}

export interface TemplateConfig {
  name: string;
  config: any;
  description?: string;
}

export interface BuildStats {
  total: number;
  ready: number;
  failed: number;
  inProgress: number;
}

export interface StorageStats {
  totalSize: number;
  buildCount: number;
  avgSize: number;
}

class BuildService {
  /**
   * Get all builds
   */
  async getBuilds(): Promise<{ status: string; builds: AgentBuild[] }> {
    return api.get('/agent/builds');
  }

  /**
   * Create new build
   */
  async createBuild(buildConfig: BuildConfig): Promise<{ status: string; buildId: string; build: AgentBuild }> {
    return api.post('/agent/builds', buildConfig);
  }

  /**
   * Get build details
   */
  async getBuild(buildId: string): Promise<{ status: string; build: AgentBuild }> {
    return api.get(`/agent/builds/${buildId}`);
  }

  /**
   * Delete build
   */
  async deleteBuild(buildId: string): Promise<{ status: string }> {
    return api.delete(`/agent/builds/${buildId}`);
  }

  /**
   * Download build
   */
  async downloadBuild(buildId: string): Promise<Blob> {
    const response = await fetch(`${import.meta.env.VITE_API_URL || '/api'}/agent/builds/${buildId}/download`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
      },
    });

    if (!response.ok) {
      throw new Error('Download failed');
    }

    return response.blob();
  }

  /**
   * Get build logs
   */
  async getBuildLogs(buildId: string): Promise<{ status: string; logs: string[] }> {
    return api.get(`/agent/builds/${buildId}/logs`);
  }

  /**
   * Test build
   */
  async testBuild(buildId: string): Promise<{ status: string; results: any }> {
    return api.post(`/agent/builds/${buildId}/test`);
  }

  /**
   * Get test results
   */
  async getTestResults(buildId: string): Promise<{ status: string; results: any }> {
    return api.get(`/agent/builds/${buildId}/test-results`);
  }

  /**
   * Archive build
   */
  async archiveBuild(buildId: string): Promise<{ status: string }> {
    return api.post(`/agent/builds/${buildId}/archive`);
  }

  /**
   * Rebuild agent
   */
  async rebuildAgent(buildId: string): Promise<{ status: string; buildId: string }> {
    return api.post(`/agent/builds/${buildId}/rebuild`);
  }

  /**
   * Get build version history
   */
  async getBuildVersions(buildId: string): Promise<{ status: string; versions: any[] }> {
    return api.get(`/agent/builds/${buildId}/versions`);
  }

  /**
   * Get storage statistics
   */
  async getStorageStats(): Promise<{ status: string; stats: StorageStats }> {
    return api.get('/agent/storage/stats');
  }

  /**
   * Get build analytics
   */
  async getBuildAnalytics(): Promise<{ status: string; analytics: any }> {
    return api.get('/agent/analytics/builds');
  }

  // Template Management

  /**
   * Get all templates
   */
  async getTemplates(): Promise<{ status: string; templates: AgentTemplate[] }> {
    return api.get('/agent/templates');
  }

  /**
   * Create template
   */
  async createTemplate(templateConfig: TemplateConfig): Promise<{ status: string; templateId: string }> {
    return api.post('/agent/templates', templateConfig);
  }

  /**
   * Get template
   */
  async getTemplate(templateId: string): Promise<{ status: string; template: AgentTemplate }> {
    return api.get(`/agent/templates/${templateId}`);
  }

  /**
   * Update template
   */
  async updateTemplate(templateId: string, data: Partial<TemplateConfig>): Promise<{ status: string; template: AgentTemplate }> {
    return api.put(`/agent/templates/${templateId}`, data);
  }

  /**
   * Delete template
   */
  async deleteTemplate(templateId: string): Promise<{ status: string }> {
    return api.delete(`/agent/templates/${templateId}`);
  }

  /**
   * Use template to create build
   */
  async useTemplate(templateId: string): Promise<{ status: string; build: AgentBuild }> {
    return api.post(`/agent/templates/${templateId}/use`);
  }

  /**
   * Get template analytics
   */
  async getTemplateAnalytics(): Promise<{ status: string; analytics: any }> {
    return api.get('/agent/analytics/templates');
  }
}

export const buildService = new BuildService();
export default buildService;
