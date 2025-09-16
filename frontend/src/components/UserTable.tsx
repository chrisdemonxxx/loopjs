import React, { useState, useEffect } from 'react';
import { User, PlatformCapabilities } from '../types';

interface UserTableProps {
  users: User[];
  onViewUser: (user: User) => void;
  onViewTasks: (user: User) => void;
}

// Platform icon mapping
const getPlatformIcon = (operatingSystem: string) => {
  switch (operatingSystem?.toLowerCase()) {
    case 'windows':
      return '🪟';
    case 'linux':
      return '🐧';
    case 'macos':
      return '🍎';
    case 'android':
      return '🤖';
    case 'ios':
      return '📱';
    default:
      return '💻';
  }
};

// Platform color mapping
const getPlatformColor = (operatingSystem: string) => {
  switch (operatingSystem?.toLowerCase()) {
    case 'windows':
      return 'text-blue-400';
    case 'linux':
      return 'text-yellow-400';
    case 'macos':
      return 'text-gray-300';
    case 'android':
      return 'text-green-400';
    case 'ios':
      return 'text-gray-400';
    default:
      return 'text-gray-500';
  }
};

// Status indicator component
const StatusIndicator = ({ status }: { status: string }) => (
  <div className="flex items-center">
    <div 
      className={`w-2 h-2 rounded-full mr-2 ${
        status === 'online' ? 'bg-green-500' : 'bg-red-500'
      }`}
    />
    <span className={status === 'online' ? 'text-green-400' : 'text-red-400'}>
      {status}
    </span>
  </div>
);

// Capability badges component
const CapabilityBadges = ({ capabilities }: { capabilities: User['capabilities'] }) => {
  if (!capabilities) return null;
  
  const totalCapabilities = Object.values(capabilities).flat().length;
  const hasAdvanced = capabilities.evasion?.length > 0 || capabilities.injection?.length > 0;
  
  return (
    <div className="flex flex-wrap gap-1">
      <span className={`px-2 py-1 text-xs rounded ${
        totalCapabilities > 10 ? 'bg-green-900 text-green-300' : 
        totalCapabilities > 5 ? 'bg-yellow-900 text-yellow-300' : 
        'bg-gray-900 text-gray-300'
      }`}>
        {totalCapabilities} caps
      </span>
      {hasAdvanced && (
        <span className="px-2 py-1 text-xs rounded bg-purple-900 text-purple-300">
          Advanced
        </span>
      )}
    </div>
  );
};

// Architecture badge component
const ArchitectureBadge = ({ architecture }: { architecture: string }) => (
  <span className={`px-2 py-1 text-xs rounded ${
    architecture === 'x64' ? 'bg-blue-900 text-blue-300' :
    architecture === 'arm64' ? 'bg-green-900 text-green-300' :
    'bg-gray-900 text-gray-300'
  }`}>
    {architecture || 'unknown'}
  </span>
);

const UserTable: React.FC<UserTableProps> = ({ users, onViewUser, onViewTasks }) => {
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [platformCapabilities, setPlatformCapabilities] = useState<{[key: string]: PlatformCapabilities}>({});

  // Fetch platform capabilities for each user
  useEffect(() => {
    const fetchCapabilities = async () => {
      const capabilities: {[key: string]: PlatformCapabilities} = {};
      
      for (const user of users) {
        try {
          const response = await fetch(`/api/commands/available/${user.uuid}`);
          if (response.ok) {
            capabilities[user.uuid] = await response.json();
          }
        } catch (error) {
          console.error(`Failed to fetch capabilities for ${user.uuid}:`, error);
        }
      }
      
      setPlatformCapabilities(capabilities);
    };

    if (users.length > 0) {
      fetchCapabilities();
    }
  }, [users]);

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

  const handleUserClick = (user: User) => {
    setSelectedUser(selectedUser?.uuid === user.uuid ? null : user);
  };

  return (
    <div className="bg-gray-900 rounded-lg shadow-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left text-gray-300">
          <thead className="text-xs text-gray-400 uppercase bg-gray-800">
            <tr>
              <th scope="col" className="px-6 py-3">Platform</th>
              <th scope="col" className="px-6 py-3">Computer Name</th>
              <th scope="col" className="px-6 py-3">IP Address</th>
              <th scope="col" className="px-6 py-3">Location</th>
              <th scope="col" className="px-6 py-3">Status</th>
              <th scope="col" className="px-6 py-3">Architecture</th>
              <th scope="col" className="px-6 py-3">Capabilities</th>
              <th scope="col" className="px-6 py-3">Last Active</th>
              <th scope="col" className="px-6 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <React.Fragment key={user.uuid}>
                <tr 
                  className={`border-b border-gray-700 hover:bg-gray-800 transition-colors cursor-pointer ${
                    selectedUser?.uuid === user.uuid ? 'bg-gray-800' : ''
                  }`}
                  onClick={() => handleUserClick(user)}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">{getPlatformIcon(user.operatingSystem)}</span>
                      <div>
                        <div className={`font-medium ${getPlatformColor(user.operatingSystem)}`}>
                          {user.operatingSystem || user.platform || 'Unknown'}
                        </div>
                        <div className="text-xs text-gray-500">
                          {user.osVersion || 'Unknown version'}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-white">{user.computerName}</div>
                    {user.hostname && user.hostname !== user.computerName && (
                      <div className="text-xs text-gray-500">{user.hostname}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-gray-300">{user.ipAddress}</td>
                  <td className="px-6 py-4 text-gray-300">{user.country}</td>
                  <td className="px-6 py-4">
                    <StatusIndicator status={user.status} />
                  </td>
                  <td className="px-6 py-4">
                    <ArchitectureBadge architecture={user.architecture} />
                  </td>
                  <td className="px-6 py-4">
                    <CapabilityBadges capabilities={user.capabilities} />
                  </td>
                  <td className="px-6 py-4 text-gray-300">
                    {formatLastActive(user.lastActiveTime)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex space-x-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onViewUser(user);
                        }}
                        className="px-3 py-1 text-xs font-medium text-blue-400 bg-blue-900 rounded hover:bg-blue-800 transition-colors"
                      >
                        View
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onViewTasks(user);
                        }}
                        className="px-3 py-1 text-xs font-medium text-green-400 bg-green-900 rounded hover:bg-green-800 transition-colors"
                      >
                        Tasks
                      </button>
                    </div>
                  </td>
                </tr>
                
                {/* Expanded details row */}
                {selectedUser?.uuid === user.uuid && (
                  <tr className="bg-gray-850 border-b border-gray-700">
                    <td colSpan={9} className="px-6 py-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                        {/* System Information */}
                        <div className="space-y-2">
                          <h4 className="font-semibold text-white">System Information</h4>
                          <div className="space-y-1 text-gray-300">
                            <div>UUID: <span className="text-gray-400 font-mono text-xs">{user.uuid}</span></div>
                            <div>Connections: <span className="text-blue-400">{user.connectionCount || 0}</span></div>
                            {user.systemInfo?.username && (
                              <div>User: <span className="text-green-400">{user.systemInfo.username}</span></div>
                            )}
                            {user.systemInfo?.domain && (
                              <div>Domain: <span className="text-purple-400">{user.systemInfo.domain}</span></div>
                            )}
                            {user.systemInfo?.isAdmin && (
                              <div className="text-red-400">⚠️ Administrator</div>
                            )}
                          </div>
                        </div>

                        {/* Capabilities */}
                        <div className="space-y-2">
                          <h4 className="font-semibold text-white">Capabilities</h4>
                          <div className="space-y-1">
                            {user.capabilities && Object.entries(user.capabilities).map(([category, items]) => (
                              items.length > 0 && (
                                <div key={category} className="text-xs">
                                  <span className="text-gray-400 capitalize">{category}:</span>
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {items.slice(0, 3).map((item, idx) => (
                                      <span key={idx} className="px-1 py-0.5 bg-gray-700 text-gray-300 rounded">
                                        {item}
                                      </span>
                                    ))}
                                    {items.length > 3 && (
                                      <span className="px-1 py-0.5 bg-gray-600 text-gray-400 rounded">
                                        +{items.length - 3}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              )
                            ))}
                          </div>
                        </div>

                        {/* Available Commands */}
                        <div className="space-y-2">
                          <h4 className="font-semibold text-white">Available Commands</h4>
                          <div className="text-xs">
                            {platformCapabilities[user.uuid] ? (
                              <div className="space-y-1">
                                <div className="text-green-400">
                                  {platformCapabilities[user.uuid].availableCommands?.length || 0} commands available
                                </div>
                                <div className="flex flex-wrap gap-1">
                                  {platformCapabilities[user.uuid].availableCommands?.slice(0, 5).map((cmd, idx) => (
                                    <span key={idx} className="px-1 py-0.5 bg-blue-900 text-blue-300 rounded">
                                      {cmd}
                                    </span>
                                  ))}
                                  {(platformCapabilities[user.uuid].availableCommands?.length || 0) > 5 && (
                                    <span className="px-1 py-0.5 bg-gray-600 text-gray-400 rounded">
                                      +{(platformCapabilities[user.uuid].availableCommands?.length || 0) - 5}
                                    </span>
                                  )}
                                </div>
                              </div>
                            ) : (
                              <div className="text-gray-500">Loading commands...</div>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
      
      {users.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No connected clients found
        </div>
      )}
    </div>
  );
};

export default UserTable;
