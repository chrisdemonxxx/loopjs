import React, { useState, useEffect } from 'react';
import { Agent } from '../types';
import UserTable from '../components/UserTable';
import WorldMap from '../components/WorldMap';
import Terminal from '../components/Terminal';
import TaskScheduler from '../components/TaskScheduler';
import Settings from '../components/Settings';
import { StatsSection } from '../components/StatsSection';

interface DashboardPageProps {
  tableData: Agent[];
  isLoading: boolean;
  onActionClicked: (agent: Agent) => void;
  onTasksClicked: (agent: Agent) => void;
  onLogout: () => void;
}

const DashboardPage: React.FC<DashboardPageProps> = ({ 
  tableData, 
  isLoading, 
  onActionClicked, 
  onTasksClicked, 
  onLogout 
}) => {
  const [activeTab, setActiveTab] = useState('overview');

  // Mock data for demonstration when no real agents are available
  const mockAgents: Agent[] = [
    {
      id: 'mock-1',
      name: 'DESKTOP-ABC123',
      computerName: 'DESKTOP-ABC123',
      hostname: 'desktop-abc123.local',
      ip: '192.168.1.100',
      ipAddress: '192.168.1.100',
      platform: 'windows',
      operatingSystem: 'windows',
      osVersion: 'Windows 11 Pro',
      architecture: 'x64',
      status: 'online' as const,
      lastSeen: new Date().toISOString(),
      lastActiveTime: new Date().toISOString(),
      version: '2.1.0',
      country: 'United States',
      capabilities: {
        persistence: ['registry', 'startup'],
        injection: ['dll', 'process'],
        evasion: ['sandbox', 'av'],
        commands: ['shell', 'powershell'],
        features: ['hvnc', 'keylogger']
      },
      features: {
        hvnc: true,
        keylogger: true,
        screenCapture: true,
        fileManager: true,
        processManager: true
      },
      geoLocation: {
        country: 'United States',
        region: 'CA',
        city: 'Los Angeles',
        latitude: 34.0522,
        longitude: -118.2437,
        timezone: 'America/Los_Angeles',
        isp: 'Comcast Cable',
        organization: 'Comcast Cable Communications'
      }
    },
    {
      id: 'mock-2',
      name: 'LAPTOP-XYZ789',
      computerName: 'LAPTOP-XYZ789',
      hostname: 'laptop-xyz789.local',
      ip: '10.0.0.50',
      ipAddress: '10.0.0.50',
      platform: 'windows',
      operatingSystem: 'windows',
      osVersion: 'Windows 10 Home',
      architecture: 'x64',
      status: 'offline' as const,
      lastSeen: new Date(Date.now() - 300000).toISOString(),
      lastActiveTime: new Date(Date.now() - 300000).toISOString(),
      version: '2.0.5',
      country: 'Germany',
      capabilities: {
        persistence: ['registry'],
        injection: ['dll'],
        evasion: ['sandbox'],
        commands: ['shell'],
        features: ['keylogger']
      },
      features: {
        hvnc: false,
        keylogger: true,
        screenCapture: false,
        fileManager: true,
        processManager: false
      },
      geoLocation: {
        country: 'Germany',
        region: 'BY',
        city: 'Munich',
        latitude: 48.1351,
        longitude: 11.5820,
        timezone: 'Europe/Berlin',
        isp: 'Deutsche Telekom AG',
        organization: 'Deutsche Telekom AG'
      }
    },
    {
      id: 'mock-3',
      name: 'WORKSTATION-DEF456',
      computerName: 'WORKSTATION-DEF456',
      hostname: 'workstation-def456.local',
      ip: '172.16.0.25',
      ipAddress: '172.16.0.25',
      platform: 'windows',
      operatingSystem: 'windows',
      osVersion: 'Windows 11 Enterprise',
      architecture: 'x64',
      status: 'online' as const,
      lastSeen: new Date().toISOString(),
      lastActiveTime: new Date().toISOString(),
      version: '2.1.2',
      country: 'Japan',
      capabilities: {
        persistence: ['registry', 'startup', 'service'],
        injection: ['dll', 'process', 'thread'],
        evasion: ['sandbox', 'av', 'vm'],
        commands: ['shell', 'powershell', 'cmd'],
        features: ['hvnc', 'keylogger', 'screenshot']
      },
      features: {
        hvnc: true,
        keylogger: true,
        screenCapture: true,
        fileManager: true,
        processManager: true
      },
      geoLocation: {
        country: 'Japan',
        region: '13',
        city: 'Tokyo',
        latitude: 35.6762,
        longitude: 139.6503,
        timezone: 'Asia/Tokyo',
        isp: 'NTT Communications',
        organization: 'NTT Communications Corporation'
      }
    }
  ];

  // Use mock data if no real data is available
  const displayData = tableData.length > 0 ? tableData : mockAgents;

  const tabs = [
    { id: 'overview', name: 'Overview', icon: '🎯' },
    { id: 'map', name: 'World Map', icon: '🌍' },
    { id: 'terminal', name: 'Terminal', icon: '💻' },
    { id: 'scheduler', name: 'Tasks', icon: '⚡' },
    { id: 'settings', name: 'Settings', icon: '⚙️' }
  ];

  const onlineAgents = displayData.filter(agent => agent.status === 'online');
  const offlineAgents = displayData.filter(agent => agent.status === 'offline');

  // Get top 5 countries by agent count
  const countryStats = displayData.reduce((acc, agent) => {
    const country = agent.country || 'Unknown';
    acc[country] = (acc[country] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const topCountries = Object.entries(countryStats)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5);

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-black/40 border border-red-500/20 rounded-lg p-6 backdrop-blur-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-red-300 text-sm">TOTAL BOTS</p>
                    <p className="text-3xl font-bold text-white">{displayData.length}</p>
                  </div>
                  <div className="text-red-500 text-2xl">🤖</div>
                </div>
              </div>
              <div className="bg-black/40 border border-green-500/20 rounded-lg p-6 backdrop-blur-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-300 text-sm">ONLINE</p>
                    <p className="text-3xl font-bold text-white">{onlineAgents.length}</p>
                  </div>
                  <div className="text-green-500 text-2xl">🟢</div>
                </div>
              </div>
              <div className="bg-black/40 border border-yellow-500/20 rounded-lg p-6 backdrop-blur-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-yellow-300 text-sm">OFFLINE</p>
                    <p className="text-3xl font-bold text-white">{offlineAgents.length}</p>
                  </div>
                  <div className="text-yellow-500 text-2xl">🔴</div>
                </div>
              </div>
              <div className="bg-black/40 border border-blue-500/20 rounded-lg p-6 backdrop-blur-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-300 text-sm">COUNTRIES</p>
                    <p className="text-3xl font-bold text-white">{Object.keys(countryStats).length}</p>
                  </div>
                  <div className="text-blue-500 text-2xl">🌍</div>
                </div>
              </div>
            </div>

            {/* StatsSection with detailed statistics */}
            <div className="bg-black/20 border border-red-500/10 rounded-lg p-6 backdrop-blur-sm">
              <h2 className="text-xl font-bold text-red-400 mb-6 flex items-center">
                <span className="mr-2">📊</span>DETAILED STATISTICS
              </h2>
              <StatsSection 
                agents={displayData}
                onlineCount={onlineAgents.length}
                offlineCount={offlineAgents.length}
                topCountries={topCountries}
              />
            </div>

            {/* Large Interactive WorldMap */}
            <div className="bg-black/40 border border-red-500/20 rounded-lg backdrop-blur-sm">
              <div className="px-6 py-4 border-b border-red-500/20">
                <h2 className="text-xl font-bold text-red-400 flex items-center">
                  <span className="mr-2">🗺️</span>GLOBAL BOTNET MAP
                </h2>
                <p className="text-gray-400 text-sm mt-1">Interactive world map showing bot locations</p>
              </div>
              <div className="p-6">
                <div className="h-96 rounded-lg overflow-hidden border border-red-500/10">
                  <WorldMap agents={displayData} />
                </div>
              </div>
            </div>

            {/* Top Countries */}
            <div className="bg-black/40 border border-red-500/20 rounded-lg p-6 backdrop-blur-sm">
              <h3 className="text-red-400 font-bold text-lg mb-4 flex items-center">
                <span className="mr-2">🏆</span>TOP INFECTED COUNTRIES
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                {topCountries.map(([country, count], index) => (
                  <div key={country} className="bg-red-900/20 border border-red-500/30 rounded p-3 text-center">
                    <div className="text-red-400 font-bold text-lg">#{index + 1}</div>
                    <div className="text-white font-medium">{country}</div>
                    <div className="text-red-300 text-sm">{count} bots</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Live Connections with WorldMap Preview */}
            <div className="bg-black/40 border border-red-500/20 rounded-lg backdrop-blur-sm">
              <div className="px-6 py-4 border-b border-red-500/20">
                <h2 className="text-xl font-bold text-red-400 flex items-center">
                  <span className="mr-2">💀</span>LIVE CONNECTIONS
                  {/* Small WorldMap Preview - Made Larger and More Visible */}
                  <div className="ml-4 w-24 h-16 bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700 border-2 border-blue-400/50 rounded-lg overflow-hidden relative shadow-lg shadow-blue-500/20">
                    {/* Grid overlay */}
                    <div className="absolute inset-0 opacity-30">
                      <div className="grid grid-cols-6 grid-rows-4 h-full">
                        {Array.from({ length: 24 }).map((_, i) => (
                          <div key={i} className="border border-blue-400/30"></div>
                        ))}
                      </div>
                    </div>
                    {/* Animated dots */}
                    <div className="absolute inset-0">
                      {Array.from({ length: 8 }).map((_, i) => (
                        <div
                          key={i}
                          className="absolute w-1.5 h-1.5 bg-blue-300 rounded-full animate-pulse shadow-sm shadow-blue-400"
                          style={{
                            left: `${15 + (i * 10)}%`,
                            top: `${25 + (i % 3) * 20}%`,
                            animationDelay: `${i * 0.4}s`
                          }}
                        />
                      ))}
                    </div>
                    {/* Ping indicator */}
                    <div className="absolute top-1 right-1 w-2 h-2 bg-green-400 rounded-full animate-ping shadow-sm shadow-green-400"></div>
                    {/* MAP label */}
                    <div className="absolute bottom-0 left-0 right-0 text-center text-xs text-blue-200 font-bold bg-blue-900/50 py-0.5">
                      MAP
                    </div>
                  </div>
                </h2>
                <p className="text-gray-400 text-sm mt-1">Command and control your botnet</p>
              </div>
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
                  <span className="ml-3 text-red-400">Scanning for targets...</span>
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
      case 'map':
        return <WorldMap agents={displayData} />;
      case 'terminal':
        return <Terminal agents={onlineAgents} />;
      case 'scheduler':
        return <TaskScheduler agents={tableData} />;
      case 'settings':
        return <Settings />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-red-950/20 to-black text-white">
      {/* Animated Background */}
      <div className="fixed inset-0 opacity-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,0,0,0.1),transparent_50%)]"></div>
        <div className="absolute inset-0 bg-[conic-gradient(from_0deg_at_50%_50%,transparent_0deg,rgba(255,0,0,0.05)_60deg,transparent_120deg)]"></div>
      </div>

      {/* Header */}
      <div className="relative bg-black/60 border-b border-red-500/30 px-6 py-4 backdrop-blur-sm">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <div className="text-3xl">💀</div>
            <div>
              <h1 className="text-2xl font-bold text-red-400 tracking-wider">LOOPJS C2</h1>
              <p className="text-red-300 text-sm">Command & Control Panel</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 bg-red-900/30 px-3 py-1 rounded border border-red-500/30">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              <span className="text-red-300 text-sm">OPERATIONAL</span>
            </div>
            <button
              onClick={onLogout}
              className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 px-4 py-2 rounded-lg text-white font-medium transition-all duration-200 border border-red-500/50 shadow-lg shadow-red-500/20"
            >
              DISCONNECT
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="relative bg-black/40 border-b border-red-500/20 px-6 backdrop-blur-sm">
        <div className="flex space-x-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-3 font-medium transition-all duration-200 border-b-2 ${
                activeTab === tab.id
                  ? 'text-red-400 border-red-500 bg-red-900/20'
                  : 'text-gray-400 border-transparent hover:text-red-300 hover:border-red-500/50'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.name}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="relative container mx-auto p-6">
        {renderTabContent()}
      </div>
    </div>
  );
};

export default DashboardPage;