import React, { useState, useEffect } from 'react';
import { Agent } from '../types';
import toast from 'react-hot-toast';

interface UserTableProps {
  users: Agent[];
  onViewUser: (user: Agent) => void;
  onViewTasks: (user: Agent) => void;
}

const UserTable: React.FC<UserTableProps> = ({ users, onViewUser, onViewTasks }) => {
  const [selectedUser, setSelectedUser] = useState<Agent | null>(null);

  // Separate online and offline users
  const onlineUsers = users.filter(user => user.status === 'online');
  const offlineUsers = users.filter(user => user.status === 'offline');

  const formatLastActive = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const formatUptime = (uptime: number) => {
    const days = Math.floor(uptime / 86400);
    const hours = Math.floor((uptime % 86400) / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);
    
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const getRealIP = (user: Agent) => {
    // For localhost testing, show actual IP if available
    if (user.ipAddress === '127.0.0.1' || user.ipAddress === 'localhost') {
      return user.ip || '127.0.0.1';
    }
    return user.ipAddress;
  };

  const getArchitecture = (user: Agent) => {
    if (user.architecture && user.architecture !== 'unknown') {
      return user.architecture;
    }
    // Try to determine from system info
    if (user.systemInfo?.username) {
      return 'x64'; // Default for Windows
    }
    return 'x64';
  };

  const handleQuickCommand = async (user: Agent, command: string) => {
    try {
      const response = await fetch(`/api/agent/${user.id}/command`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: JSON.stringify({
          command: command,
          type: 'system'
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log(`Command ${command} sent to ${user.computerName}:`, result);
        // Show success notification
        toast.success(`Command ${command} sent successfully to ${user.computerName}`);
      } else {
        console.error('Failed to send command:', response.statusText);
        toast.error(`Failed to send command ${command} to ${user.computerName}`);
      }
    } catch (error) {
      console.error('Failed to send command:', error);
      toast.error(`Error sending command ${command} to ${user.computerName}: ${error.message}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Online Clients - Top Priority */}
      <div className="bg-white dark:bg-boxdark rounded-lg shadow-sm border border-stroke dark:border-strokedark">
        <div className="px-6 py-4 border-b border-stroke dark:border-strokedark">
          <h2 className="text-xl font-semibold text-black dark:text-white">
            🟢 Online Clients ({onlineUsers.length})
          </h2>
        </div>
        
        {onlineUsers.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-300">
              <thead className="text-xs text-gray-400 uppercase bg-gray-800">
                <tr>
                  <th className="px-6 py-3">Computer Name</th>
                  <th className="px-6 py-3">IP Address</th>
                  <th className="px-6 py-3">Architecture</th>
                  <th className="px-6 py-3">Uptime</th>
                  <th className="px-6 py-3">Last Active</th>
                  <th className="px-6 py-3">Quick Actions</th>
                  <th className="px-6 py-3">Details</th>
                </tr>
              </thead>
              <tbody>
                {onlineUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-700 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                        <div>
                          <div className="font-medium text-white">{user.computerName}</div>
                          <div className="text-xs text-gray-400">{user.uuid}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-white">{getRealIP(user)}</td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                        {getArchitecture(user)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-white">
                      {user.systemInfo?.uptime ? formatUptime(user.systemInfo.uptime) : 'Unknown'}
                    </td>
                    <td className="px-6 py-4 text-green-400">{formatLastActive(user.lastActiveTime)}</td>
                    <td className="px-6 py-4">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleQuickCommand(user, 'shutdown')}
                          className="px-3 py-1 text-xs bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
                        >
                          Shutdown
                        </button>
                        <button
                          onClick={() => handleQuickCommand(user, 'restart')}
                          className="px-3 py-1 text-xs bg-orange-600 hover:bg-orange-700 text-white rounded transition-colors"
                        >
                          Restart
                        </button>
                        <button
                          onClick={() => handleQuickCommand(user, 'screenshot')}
                          className="px-3 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
                        >
                          Screenshot
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => onViewUser(user)}
                          className="px-3 py-1 text-xs bg-gray-600 hover:bg-gray-700 text-white rounded transition-colors"
                        >
                          View
                        </button>
                        <button
                          onClick={() => onViewTasks(user)}
                          className="px-3 py-1 text-xs bg-purple-600 hover:bg-purple-700 text-white rounded transition-colors"
                        >
                          Commands
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="px-6 py-8 text-center text-gray-400">
            <div className="text-4xl mb-4">🔍</div>
            <p>No online clients found</p>
            <p className="text-sm mt-2">Start the client to see it appear here</p>
          </div>
        )}
      </div>

      {/* Offline Clients - Collapsible */}
      {offlineUsers.length > 0 && (
        <div className="bg-white dark:bg-boxdark rounded-lg shadow-sm border border-stroke dark:border-strokedark">
          <details className="group">
            <summary className="px-6 py-4 border-b border-stroke dark:border-strokedark cursor-pointer list-none">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-black dark:text-white">
                  🔴 Offline Clients ({offlineUsers.length})
                </h2>
                <div className="transform group-open:rotate-180 transition-transform">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </summary>
            
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-gray-300">
                <thead className="text-xs text-gray-400 uppercase bg-gray-800">
                  <tr>
                    <th className="px-6 py-3">Computer Name</th>
                    <th className="px-6 py-3">IP Address</th>
                    <th className="px-6 py-3">Architecture</th>
                    <th className="px-6 py-3">Last Seen</th>
                    <th className="px-6 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {offlineUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-700 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                          <div>
                            <div className="font-medium text-white">{user.computerName}</div>
                            <div className="text-xs text-gray-400">{user.uuid}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-white">{getRealIP(user)}</td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">
                          {getArchitecture(user)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-red-400">{formatLastActive(user.lastActiveTime)}</td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => onViewUser(user)}
                          className="px-3 py-1 text-xs bg-gray-600 hover:bg-gray-700 text-white rounded transition-colors"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        </div>
      )}
    </div>
  );
};

export default UserTable;