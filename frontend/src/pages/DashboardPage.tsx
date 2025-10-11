import React, { useState, useEffect } from 'react';
import { Agent } from '../types';
import UserTable from '../components/UserTable';
import Terminal, { TerminalRef } from '../components/Terminal';
import EnhancedTerminal from '../components/EnhancedTerminal';
import TaskScheduler from '../components/TaskScheduler';
import Settings from '../components/Settings';
import AgentSection from '../components/AgentSection';
import LogsPage from './LogsPage';
import AIInsightsPanel from '../components/AIInsightsPanel';
import ClientCard from '../components/ClientCard';
import ProfileDropdown from '../components/ProfileDropdown';
import { useTheme } from '../contexts/ThemeContext';

interface DashboardPageProps {
  tableData: Agent[];
  isLoading: boolean;
  onActionClicked: (agent: Agent) => void;
  onTasksClicked: (agent: Agent) => void;
  onLogout: () => void;
  onSendCommand: (agentId: string, command: string, correlationId: string) => void;  // Update signature
  onRegisterPending: (taskId: string, agentId: string, historyId: string) => void;
  terminalRef: React.RefObject<TerminalRef>;
  naturalLanguageHistory: any[];
  setNaturalLanguageHistory: React.Dispatch<React.SetStateAction<any[]>>;
  wsConnectionStatus?: 'disconnected' | 'connecting' | 'connected' | 'error';
  learningStats?: any;
}

const DashboardPage: React.FC<DashboardPageProps> = ({ 
  tableData, 
  isLoading, 
  onActionClicked, 
  onTasksClicked, 
  onLogout,
  onSendCommand,
  onRegisterPending,
  terminalRef,
  naturalLanguageHistory,
  setNaturalLanguageHistory,
  wsConnectionStatus,
  learningStats
}) => {
  const { mode } = useTheme();
  const [activeTab, setActiveTab] = useState('overview');
  const [taskStats, setTaskStats] = useState({
    total: 0,
    pending: 0,
    sent: 0,
    completed: 0,
    failed: 0,
    successRate: 0,
    avgExecutionTimeMs: 0
  });
  const [showOfflineClients, setShowOfflineClients] = useState(false);
  const [selectedTerminalAgent, setSelectedTerminalAgent] = useState<Agent | null>(null);

  // Calculate stats from real data
  const onlineAgents = tableData.filter(agent => agent.status === 'online');
  const offlineAgents = tableData.filter(agent => agent.status === 'offline');

  // Update selectedTerminalAgent when onlineAgents changes
  useEffect(() => {
    if (onlineAgents.length > 0 && !selectedTerminalAgent) {
      setSelectedTerminalAgent(onlineAgents[0]);
    } else if (onlineAgents.length === 0) {
      setSelectedTerminalAgent(null);
    }
  }, [onlineAgents, selectedTerminalAgent]);

  // Fetch task stats
  const fetchTaskStats = async () => {
    try {
      const response = await fetch('/api/task/stats', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setTaskStats(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch task stats:', error);
    }
  };

  // Fetch stats on component mount
  useEffect(() => {
    fetchTaskStats();
  }, []);

  // Handle client actions
  const handleClientAction = (action: string, client: Agent) => {
    console.log(`Client action: ${action} for ${client.computerName}`);
    
    switch (action) {
      case 'reboot':
        onSendCommand(client.uuid, 'shutdown /r /t 0', `reboot_${Date.now()}`);
        break;
      case 'screenshot':
        onSendCommand(client.uuid, 'screenshot', `screenshot_${Date.now()}`);
        break;
      case 'system-info':
        onSendCommand(client.uuid, 'systeminfo', `systeminfo_${Date.now()}`);
        break;
      case 'custom-command':
        // This would open a modal for custom command input
        const command = prompt('Enter custom command:');
        if (command) {
          onSendCommand(client.uuid, command, `custom_${Date.now()}`);
        }
        break;
      default:
        console.log('Unknown action:', action);
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-8">
            {/* Header */}
            <div className="premium-card p-8">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h1 className="text-3xl font-bold mb-2" style={{color: 'var(--text-primary)'}}>
                    🎯 Command & Control Dashboard
                  </h1>
                  <p style={{color: 'var(--text-secondary)'}}>
                    Monitor and control your connected clients in real-time
                  </p>
                </div>
                <div className="text-sm" style={{color: 'var(--text-tertiary)'}}>
                  Theme: {mode}
                </div>
              </div>
            </div>

            {/* Stats Overview */}
            <div className="premium-stats-grid">
              <div className="premium-stat-card">
                <div className="premium-stat-value">{tableData.length}</div>
                <div className="premium-stat-label">Total Clients</div>
              </div>
              
              <div className="premium-stat-card">
                <div className="premium-stat-value text-green-600">{onlineAgents.length}</div>
                <div className="premium-stat-label">Online Clients</div>
              </div>
              
              <div className="premium-stat-card">
                <div className="premium-stat-value text-yellow-600">{taskStats.pending}</div>
                <div className="premium-stat-label">Pending Tasks</div>
              </div>
              
              <div className="premium-stat-card">
                <div className="premium-stat-value text-purple-600">{taskStats.successRate.toFixed(1)}%</div>
                <div className="premium-stat-label">Success Rate</div>
              </div>
            </div>

            {/* Online Clients */}
            <div className="premium-card p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold" style={{color: 'var(--text-primary)'}}>
                  🟢 Online Clients ({onlineAgents.length})
                </h2>
                {offlineAgents.length > 0 && (
                  <button
                    onClick={() => setShowOfflineClients(!showOfflineClients)}
                    className="premium-button text-sm"
                  >
                    {showOfflineClients ? 'Hide' : 'Show'} Offline ({offlineAgents.length})
                  </button>
                )}
              </div>
              
              {onlineAgents.length > 0 ? (
                <div className="premium-client-grid">
                  {onlineAgents.map((client) => (
                    <ClientCard
                      key={client.uuid}
                      client={client}
                      onAction={handleClientAction}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">🔍</div>
                  <h3 className="text-lg font-medium mb-2" style={{color: 'var(--text-primary)'}}>
                    No Online Clients
                  </h3>
                  <p style={{color: 'var(--text-secondary)'}}>
                    Start the client application to see it appear here
                  </p>
                </div>
              )}
            </div>

            {/* Offline Clients */}
            {showOfflineClients && offlineAgents.length > 0 && (
              <div className="premium-card p-6">
                <h2 className="text-xl font-semibold mb-6" style={{color: 'var(--text-primary)'}}>
                  🔴 Offline Clients ({offlineAgents.length})
                </h2>
                
                <div className="premium-client-grid">
                  {offlineAgents.map((client) => (
                    <div key={client.uuid} className="premium-client-card opacity-75">
                      <div className="premium-client-header">
                        <div className="flex items-center gap-3">
                          <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                          <div>
                            <h3 className="premium-client-name">{client.computerName}</h3>
                            <p className="text-sm text-gray-500 font-mono">{client.uuid}</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="premium-client-info">
                        <div className="premium-client-info-item">
                          <span className="text-sm text-gray-500">Last Seen:</span>
                          <span className="text-sm text-red-400">
                            {new Date(client.lastActiveTime).toLocaleString()}
                          </span>
                        </div>
                        <div className="premium-client-info-item">
                          <span className="text-sm text-gray-500">IP:</span>
                          <span className="text-sm text-gray-400">{client.ipAddress}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );

      case 'clients':
        return (
          <div className="space-y-6">
            <div className="bg-white dark:bg-boxdark rounded-lg shadow-sm border border-stroke dark:border-strokedark p-6">
              <h2 className="text-xl font-semibold text-black dark:text-white mb-4">Connected Clients</h2>
              {isLoading ? (
                <div className="flex justify-center items-center h-64">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : (
                <UserTable 
                  users={tableData} 
                  onViewUser={onActionClicked}
                  onViewTasks={onTasksClicked} 
                />
              )}
            </div>
          </div>
        );

      case 'terminal':
        return (
          <div className="space-y-6">
            {/* Enhanced Terminal Component */}
            <EnhancedTerminal
              selectedAgent={selectedTerminalAgent}
              onSelectAgent={setSelectedTerminalAgent}
              onCommandSent={(command) => {
                console.log('Enhanced terminal command sent:', command);
                const agent = command.targetUuid || selectedTerminalAgent?.uuid;
                if (agent && command.command) {
                  onSendCommand(agent, command.command, command.id || command.correlationId);
                }
              }}
              terminalRef={terminalRef}
              naturalLanguageHistory={naturalLanguageHistory}
              setNaturalLanguageHistory={setNaturalLanguageHistory}
              agents={onlineAgents}
            />
          </div>
        );
      
      case 'logs':
        return <LogsPage />;
      
      case 'tasks':
        return <TaskScheduler agents={tableData} />;
      
      case 'settings':
        return <Settings />;
      
      case 'agent':
        return <AgentSection />;
      
      case 'ai-insights':
        return (
          <div className="h-screen">
            <AIInsightsPanel 
              commandHistory={naturalLanguageHistory}
              learningStats={learningStats}
            />
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className={`min-h-screen theme-${mode}`}>
      {/* Header */}
      <div className="premium-card m-6 mb-0">
        <div className="flex items-center justify-between h-16 px-6">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">💀</span>
              </div>
              <div>
                <h1 className="text-xl font-bold" style={{color: 'var(--text-primary)'}}>C2 Panel</h1>
                <p className="text-xs" style={{color: 'var(--text-secondary)'}}>Command & Control Panel</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm" style={{color: 'var(--text-secondary)'}}>OPERATIONAL</span>
            </div>
            <ProfileDropdown onLogout={onLogout} />
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="premium-card mx-6 mb-6">
        <nav className="flex space-x-8 px-6">
          {[
            { id: 'overview', label: 'Overview', icon: '📊' },
            { id: 'clients', label: 'Clients', icon: '👥' },
            { id: 'agent', label: 'Agent', icon: '🤖' },
            { id: 'terminal', label: 'AI Terminal', icon: '💻' },
            ...(localStorage.getItem('userRole') === 'admin' ? [{ id: 'ai-insights', label: 'AI Insights', icon: '🧠' }] : []),
            { id: 'logs', label: 'Logs', icon: '📝' },
            { id: 'tasks', label: 'Tasks', icon: '📋' },
            { id: 'settings', label: 'Settings', icon: '⚙️' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? 'border-indigo-500'
                  : 'border-transparent hover:border-gray-300'
              }`}
              style={{
                color: activeTab === tab.id ? 'var(--premium-primary)' : 'var(--text-secondary)'
              }}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Main Content */}
      <div className="px-6 pb-8">
        {renderTabContent()}
      </div>
    </div>
  );
};

export default DashboardPage;