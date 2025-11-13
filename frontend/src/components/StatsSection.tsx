import React from 'react';
import { 
  Users, 
  Activity, 
  Wifi, 
  Globe, 
  Monitor, 
  Shield,
  Clock,
  MapPin,
  Smartphone
} from 'lucide-react';
import { Agent } from '../types';

interface StatsSectionProps {
  agents: Agent[];
}

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  subtitle?: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color, subtitle }) => (
  <div className="bg-white dark:bg-boxdark rounded-lg shadow-sm border border-stroke dark:border-strokedark p-4">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
        <p className="text-2xl font-bold text-black dark:text-white mt-1">{value}</p>
        {subtitle && (
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">{subtitle}</p>
        )}
      </div>
      <div className={`p-3 rounded-lg ${color}`}>
        {icon}
      </div>
    </div>
  </div>
);

export const StatsSection: React.FC<StatsSectionProps> = ({ agents }) => {
  // Calculate basic stats
  const onlineAgents = agents.filter(agent => agent.status === 'online').length;
  const offlineAgents = agents.filter(agent => agent.status === 'offline').length;
  
  // OS Distribution
  const osStats = agents.reduce((acc, agent) => {
    const os = agent.systemInfo?.os?.name || 'Unknown';
    acc[os] = (acc[os] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const topOS = Object.entries(osStats)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 3);

  // Location Distribution
  const locationStats = agents.reduce((acc, agent) => {
    const location = agent.geolocation?.city || agent.geolocation?.country || 'Unknown';
    acc[location] = (acc[location] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const topLocations = Object.entries(locationStats)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 3);

  // Network Carriers
  const carrierStats = agents.reduce((acc, agent) => {
    const carrier = agent.networkInfo?.carrier || 'Unknown';
    acc[carrier] = (acc[carrier] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const topCarriers = Object.entries(carrierStats)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 3);

  // Antivirus Distribution
  const antivirusStats = agents.reduce((acc, agent) => {
    const antivirus = agent.systemInfo?.antivirus || 'None/Unknown';
    acc[antivirus] = (acc[antivirus] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const topAntivirus = Object.entries(antivirusStats)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 3);

  // Highest uptime
  const highestUptime = agents.reduce((max, agent) => {
    const uptime = agent.systemInfo?.uptime || 0;
    return uptime > max ? uptime : max;
  }, 0);

  const formatUptime = (seconds: number): string => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const uniqueLocations = new Set(agents.map(agent => 
    agent.geolocation?.city || agent.geolocation?.country
  ).filter(Boolean)).size;

  const uniqueOS = Object.keys(osStats).length;

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Clients"
          value={agents.length}
          icon={<Users className="w-6 h-6 text-white" />}
          color="bg-blue-500"
        />
        <StatCard
          title="Online"
          value={onlineAgents}
          icon={<Activity className="w-6 h-6 text-white" />}
          color="bg-green-500"
          subtitle={`${Math.round((onlineAgents / agents.length) * 100)}% active`}
        />
        <StatCard
          title="Offline"
          value={offlineAgents}
          icon={<Wifi className="w-6 h-6 text-white" />}
          color="bg-red-500"
          subtitle={`${Math.round((offlineAgents / agents.length) * 100)}% inactive`}
        />
        <StatCard
          title="Locations"
          value={uniqueLocations}
          icon={<MapPin className="w-6 h-6 text-white" />}
          color="bg-purple-500"
          subtitle={`${uniqueOS} OS types`}
        />
      </div>

      {/* Detailed Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Top Operating Systems */}
        <div className="bg-white dark:bg-boxdark rounded-lg shadow-sm border border-stroke dark:border-strokedark p-4">
          <div className="flex items-center mb-4">
            <Monitor className="w-5 h-5 text-blue-500 mr-2" />
            <h3 className="text-lg font-semibold text-black dark:text-white">Top Operating Systems</h3>
          </div>
          <div className="space-y-3">
            {topOS.map(([os, count], index) => (
              <div key={os} className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className={`w-3 h-3 rounded-full mr-3 ${
                    index === 0 ? 'bg-blue-500' : 
                    index === 1 ? 'bg-green-500' : 'bg-yellow-500'
                  }`} />
                  <span className="text-sm text-black dark:text-white">{os}</span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-semibold text-black dark:text-white">{count}</span>
                  <span className="text-xs text-gray-500 ml-1">
                    ({Math.round((count / agents.length) * 100)}%)
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Locations */}
        <div className="bg-white dark:bg-boxdark rounded-lg shadow-sm border border-stroke dark:border-strokedark p-4">
          <div className="flex items-center mb-4">
            <Globe className="w-5 h-5 text-green-500 mr-2" />
            <h3 className="text-lg font-semibold text-black dark:text-white">Top Locations</h3>
          </div>
          <div className="space-y-3">
            {topLocations.map(([location, count], index) => (
              <div key={location} className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className={`w-3 h-3 rounded-full mr-3 ${
                    index === 0 ? 'bg-green-500' : 
                    index === 1 ? 'bg-blue-500' : 'bg-purple-500'
                  }`} />
                  <span className="text-sm text-black dark:text-white">{location}</span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-semibold text-black dark:text-white">{count}</span>
                  <span className="text-xs text-gray-500 ml-1">
                    ({Math.round((count / agents.length) * 100)}%)
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Carriers */}
        <div className="bg-white dark:bg-boxdark rounded-lg shadow-sm border border-stroke dark:border-strokedark p-4">
          <div className="flex items-center mb-4">
            <FiSmartphone className="w-5 h-5 text-purple-500 mr-2" />
            <h3 className="text-lg font-semibold text-black dark:text-white">Top Carriers</h3>
          </div>
          <div className="space-y-3">
            {topCarriers.map(([carrier, count], index) => (
              <div key={carrier} className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className={`w-3 h-3 rounded-full mr-3 ${
                    index === 0 ? 'bg-purple-500' : 
                    index === 1 ? 'bg-pink-500' : 'bg-indigo-500'
                  }`} />
                  <span className="text-sm text-black dark:text-white">{carrier}</span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-semibold text-black dark:text-white">{count}</span>
                  <span className="text-xs text-gray-500 ml-1">
                    ({Math.round((count / agents.length) * 100)}%)
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Antivirus */}
        <div className="bg-white dark:bg-boxdark rounded-lg shadow-sm border border-stroke dark:border-strokedark p-4">
          <div className="flex items-center mb-4">
            <FiShield className="w-5 h-5 text-red-500 mr-2" />
            <h3 className="text-lg font-semibold text-black dark:text-white">Antivirus Distribution</h3>
          </div>
          <div className="space-y-3">
            {topAntivirus.map(([antivirus, count], index) => (
              <div key={antivirus} className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className={`w-3 h-3 rounded-full mr-3 ${
                    index === 0 ? 'bg-red-500' : 
                    index === 1 ? 'bg-orange-500' : 'bg-yellow-500'
                  }`} />
                  <span className="text-sm text-black dark:text-white">{antivirus}</span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-semibold text-black dark:text-white">{count}</span>
                  <span className="text-xs text-gray-500 ml-1">
                    ({Math.round((count / agents.length) * 100)}%)
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Uptime Stats */}
        <div className="bg-white dark:bg-boxdark rounded-lg shadow-sm border border-stroke dark:border-strokedark p-4">
          <div className="flex items-center mb-4">
            <FiClock className="w-5 h-5 text-yellow-500 mr-2" />
            <h3 className="text-lg font-semibold text-black dark:text-white">Uptime Stats</h3>
          </div>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Highest Uptime</p>
              <p className="text-xl font-bold text-black dark:text-white">
                {formatUptime(highestUptime)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Average Uptime</p>
              <p className="text-lg font-semibold text-black dark:text-white">
                {formatUptime(
                  agents.reduce((sum, agent) => sum + (agent.systemInfo?.uptime || 0), 0) / agents.length
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Connection Quality */}
        <div className="bg-white dark:bg-boxdark rounded-lg shadow-sm border border-stroke dark:border-strokedark p-4">
          <div className="flex items-center mb-4">
            <Activity className="w-5 h-5 text-indigo-500 mr-2" />
            <h3 className="text-lg font-semibold text-black dark:text-white">Connection Quality</h3>
          </div>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Online Rate</p>
              <p className="text-xl font-bold text-green-500">
                {Math.round((onlineAgents / agents.length) * 100)}%
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Global Coverage</p>
              <p className="text-lg font-semibold text-black dark:text-white">
                {uniqueLocations} locations
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};