import React, { useState, useEffect } from 'react';
import { Agent } from '../types';
import MapComponent from './MapComponent';

interface DashboardProps {
  tableData: Agent[];
}

const Dashboard: React.FC<DashboardProps> = ({ tableData }) => {
  const [systemStats, setSystemStats] = useState({
    totalClients: 0,
    onlineClients: 0,
    offlineClients: 0,
    totalTasks: 0,
    completedTasks: 0,
    failedTasks: 0
  });

  // Calculate stats from tableData
  useEffect(() => {
    const onlineClients = tableData.filter(client => client.status === 'online').length;
    const offlineClients = tableData.length - onlineClients;
      
      setSystemStats({
        totalClients: tableData.length,
      onlineClients,
      offlineClients,
      totalTasks: 0, // Will be implemented later
      completedTasks: 0,
      failedTasks: 0
    });
  }, [tableData]);

  const StatCard = ({ title, value, icon, color }: { title: string; value: number; icon: string; color: string }) => (
    <div className="bg-white dark:bg-boxdark rounded-lg shadow-sm border border-stroke dark:border-strokedark p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-bodydark2">{title}</p>
          <p className={`text-2xl font-bold ${color}`}>{value}</p>
        </div>
        <div className={`p-3 rounded-full ${color.replace('text-', 'bg-').replace('-600', '-100')}`}>
          <span className="text-2xl">{icon}</span>
        </div>
      </div>
    </div>
  );

  // Mock client locations for the map
  const clientLocations = [
    {
      id: '1',
      name: 'Client-001',
      country: 'United States',
      city: 'New York',
      lat: 40.7128,
      lng: -74.0060,
      status: 'online' as const,
      lastSeen: '2 minutes ago'
    },
    {
      id: '2',
      name: 'Client-002',
      country: 'United Kingdom',
      city: 'London',
      lat: 51.5074,
      lng: -0.1278,
      status: 'online' as const,
      lastSeen: '5 minutes ago'
    },
    {
      id: '3',
      name: 'Client-003',
      country: 'Germany',
      city: 'Berlin',
      lat: 52.5200,
      lng: 13.4050,
      status: 'offline' as const,
      lastSeen: '1 hour ago'
    },
    {
      id: '4',
      name: 'Client-004',
      country: 'Japan',
      city: 'Tokyo',
      lat: 35.6762,
      lng: 139.6503,
      status: 'online' as const,
      lastSeen: '3 minutes ago'
    },
    {
      id: '5',
      name: 'Client-005',
      country: 'Australia',
      city: 'Sydney',
      lat: -33.8688,
      lng: 151.2093,
      status: 'offline' as const,
      lastSeen: '30 minutes ago'
    }
  ];

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
          <StatCard
          title="Total Clients"
          value={systemStats.totalClients}
          icon="🖥️"
          color="text-blue-600"
          />
          <StatCard
          title="Online Clients"
          value={systemStats.onlineClients}
          icon="🟢"
          color="text-green-600"
          />
          <StatCard
          title="Offline Clients"
          value={systemStats.offlineClients}
          icon="🔴"
          color="text-red-600"
          />
          <StatCard
          title="Active Tasks"
          value={systemStats.totalTasks}
          icon="⚡"
          color="text-purple-600"
          />
        </div>

      {/* Client Distribution Map */}
      <MapComponent clients={clientLocations} />

      {/* System Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Client Status Chart */}
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
                {systemStats.onlineClients}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-4 h-4 bg-red-500 rounded-full"></div>
                <span className="text-sm text-bodydark2">Offline</span>
              </div>
              <span className="text-sm font-medium text-black dark:text-white">
                {systemStats.offlineClients}
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div 
                className="bg-green-500 h-2 rounded-full transition-all duration-300"
                style={{ 
                  width: systemStats.totalClients > 0 
                    ? `${(systemStats.onlineClients / systemStats.totalClients) * 100}%` 
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
            <button className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors">
              <div className="text-2xl mb-2">📊</div>
              <div className="text-sm font-medium text-black dark:text-white">System Info</div>
            </button>
            <button className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/40 transition-colors">
              <div className="text-2xl mb-2">📸</div>
              <div className="text-sm font-medium text-black dark:text-white">Screenshot</div>
            </button>
            <button className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/40 transition-colors">
              <div className="text-2xl mb-2">💻</div>
              <div className="text-sm font-medium text-black dark:text-white">Terminal</div>
            </button>
            <button className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg hover:bg-orange-100 dark:hover:bg-orange-900/40 transition-colors">
              <div className="text-2xl mb-2">📁</div>
              <div className="text-sm font-medium text-black dark:text-white">File Manager</div>
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
          {systemStats.onlineClients > 0 ? (
            <div className="flex items-center space-x-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-black dark:text-white">
                {systemStats.onlineClients} client(s) connected and ready
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
};

export default Dashboard;