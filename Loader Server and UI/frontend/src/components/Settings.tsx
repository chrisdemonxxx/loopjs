import React, { useState } from 'react';
import TelegramConfigComponent from './TelegramConfig';
import { useTheme } from '../contexts/ThemeContext';

type ThemeMode = 'light' | 'dark' | 'system' | 'hacker' | 'matrix' | 'cyberpunk' | 'redteam';
type ColorScheme = 'blue' | 'green' | 'purple' | 'red' | 'orange' | 'neon' | 'terminal' | 'blood';

interface SettingsProps {
  // Props can be added here for actual backend integration
}

interface User {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'operator' | 'viewer';
  lastLogin: Date;
  isActive: boolean;
  createdAt: Date;
}

interface TelegramConfig {
  botToken: string;
  chatId: string;
  enabled: boolean;
  notifications: {
    newConnection: boolean;
    disconnection: boolean;
    taskCompletion: boolean;
    systemAlerts: boolean;
  };
}

const Settings: React.FC<SettingsProps> = () => {
  const [activeTab, setActiveTab] = useState<'users' | 'telegram' | 'system'>('users');
  const { mode, setMode, colorScheme, setColorScheme } = useTheme();
  const [users, setUsers] = useState<User[]>([
    {
      id: '1',
      username: 'admin',
      email: 'admin@redteam.local',
      role: 'admin',
      lastLogin: new Date(Date.now() - 3600000),
      isActive: true,
      createdAt: new Date(Date.now() - 86400000 * 30)
    },
    {
      id: '2',
      username: 'operator1',
      email: 'op1@redteam.local',
      role: 'operator',
      lastLogin: new Date(Date.now() - 7200000),
      isActive: true,
      createdAt: new Date(Date.now() - 86400000 * 15)
    },
    {
      id: '3',
      username: 'viewer1',
      email: 'viewer@redteam.local',
      role: 'viewer',
      lastLogin: new Date(Date.now() - 86400000),
      isActive: false,
      createdAt: new Date(Date.now() - 86400000 * 7)
    }
  ]);

  const [telegramConfig, setTelegramConfig] = useState<TelegramConfig>({
    botToken: '',
    chatId: '',
    enabled: false,
    notifications: {
      newConnection: true,
      disconnection: true,
      taskCompletion: false,
      systemAlerts: true
    }
  });

  const [newUser, setNewUser] = useState({
    username: '',
    email: '',
    role: 'viewer' as 'admin' | 'operator' | 'viewer'
  });

  const handleAddUser = () => {
    if (newUser.username && newUser.email) {
      const user: User = {
        id: Date.now().toString(),
        username: newUser.username,
        email: newUser.email,
        role: newUser.role,
        lastLogin: new Date(),
        isActive: true,
        createdAt: new Date()
      };
      setUsers([...users, user]);
      setNewUser({ username: '', email: '', role: 'viewer' });
    }
  };

  const handleDeleteUser = (userId: string) => {
    setUsers(users.filter(user => user.id !== userId));
  };

  const handleToggleUserStatus = (userId: string) => {
    setUsers(users.map(user => 
      user.id === userId ? { ...user, isActive: !user.isActive } : user
    ));
  };

  const handleUpdateUserRole = (userId: string, newRole: 'admin' | 'operator' | 'viewer') => {
    setUsers(users.map(user => 
      user.id === userId ? { ...user, role: newRole } : user
    ));
  };

  const handleTelegramConfigChange = (config: TelegramConfig) => {
    setTelegramConfig(config);
  };

  const tabs = [
    { id: 'users', label: '👥 USER MANAGEMENT', icon: '👥' },
    { id: 'telegram', label: '📱 TELEGRAM BOT', icon: '📱' },
    { id: 'system', label: '⚙️ SYSTEM CONFIG', icon: '⚙️' }
  ];

  const handleThemeToggle = (newTheme: ThemeMode) => {
    setMode(newTheme);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-black/40 border border-red-500/20 rounded-lg p-6 backdrop-blur-sm">
        <h2 className="text-2xl font-bold text-red-400 mb-2 flex items-center">
          ⚙️ SYSTEM SETTINGS
        </h2>
        <p className="text-gray-400">Configure system parameters and user access</p>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-black/20 p-1 rounded-lg border border-red-500/20">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as 'users' | 'telegram' | 'system')}
            className={`flex-1 py-3 px-4 rounded-md font-medium transition-all duration-200 ${
              activeTab === tab.id
                ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <span className="mr-2">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="min-h-[600px]">
        {activeTab === 'users' && (
          <div className="space-y-6">
            {/* Add New User */}
            <div className="bg-black/40 border border-red-500/20 rounded-lg p-6 backdrop-blur-sm">
              <h3 className="text-xl font-bold text-red-400 mb-4">Add New User</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <input
                  type="text"
                  placeholder="Username"
                  value={newUser.username}
                  onChange={(e) => setNewUser({...newUser, username: e.target.value})}
                  className="bg-gray-800/50 border border-red-500/20 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:border-red-500 focus:outline-none"
                />
                <input
                  type="email"
                  placeholder="Email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                  className="bg-gray-800/50 border border-red-500/20 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:border-red-500 focus:outline-none"
                />
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({...newUser, role: e.target.value as 'admin' | 'operator' | 'viewer'})}
                  className="bg-gray-800/50 border border-red-500/20 rounded-lg px-4 py-2 text-white focus:border-red-500 focus:outline-none"
                >
                  <option value="viewer">Viewer</option>
                  <option value="operator">Operator</option>
                  <option value="admin">Admin</option>
                </select>
                <button
                  onClick={handleAddUser}
                  className="bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-400 px-6 py-2 rounded-lg font-medium transition-all duration-200"
                >
                  Add User
                </button>
              </div>
            </div>

            {/* Users List */}
            <div className="bg-black/40 border border-red-500/20 rounded-lg backdrop-blur-sm overflow-hidden">
              <div className="p-6 border-b border-red-500/20">
                <h3 className="text-xl font-bold text-red-400">Current Users</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-red-500/10">
                    <tr>
                      <th className="text-left p-4 text-red-400 font-semibold">Username</th>
                      <th className="text-left p-4 text-red-400 font-semibold">Email</th>
                      <th className="text-left p-4 text-red-400 font-semibold">Role</th>
                      <th className="text-left p-4 text-red-400 font-semibold">Status</th>
                      <th className="text-left p-4 text-red-400 font-semibold">Last Login</th>
                      <th className="text-left p-4 text-red-400 font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user.id} className="border-b border-red-500/10 hover:bg-red-500/5">
                        <td className="p-4 text-white font-medium">{user.username}</td>
                        <td className="p-4 text-gray-300">{user.email}</td>
                        <td className="p-4">
                          <select
                            value={user.role}
                            onChange={(e) => handleUpdateUserRole(user.id, e.target.value as 'admin' | 'operator' | 'viewer')}
                            className="bg-gray-800/50 border border-red-500/20 rounded px-2 py-1 text-white text-sm focus:border-red-500 focus:outline-none"
                          >
                            <option value="viewer">Viewer</option>
                            <option value="operator">Operator</option>
                            <option value="admin">Admin</option>
                          </select>
                        </td>
                        <td className="p-4">
                          <button
                            onClick={() => handleToggleUserStatus(user.id)}
                            className={`px-3 py-1 rounded-full text-xs font-medium ${
                              user.isActive
                                ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                                : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                            }`}
                          >
                            {user.isActive ? 'Active' : 'Inactive'}
                          </button>
                        </td>
                        <td className="p-4 text-gray-300 text-sm">
                          {user.lastLogin.toLocaleString()}
                        </td>
                        <td className="p-4">
                          <button
                            onClick={() => handleDeleteUser(user.id)}
                            className="text-red-400 hover:text-red-300 text-sm font-medium"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'telegram' && (
          <div className="space-y-6">
            <TelegramConfigComponent 
              config={telegramConfig}
              onConfigChange={handleTelegramConfigChange}
            />
          </div>
        )}

        {activeTab === 'system' && (
          <div className="space-y-6">
            {/* Theme Settings */}
            <div className="bg-black/40 border border-red-500/20 rounded-lg p-6 backdrop-blur-sm">
              <h3 className="text-xl font-bold text-red-400 mb-4">Theme Configuration</h3>
              
              <div className="space-y-6">
                <div className="bg-gray-800/50 border border-red-500/20 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <label className="block text-white font-semibold mb-1">Theme Mode</label>
                      <p className="text-gray-400 text-sm">Choose your preferred theme</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {[
                      { value: 'light' as ThemeMode, label: '☀️ Light', color: 'bg-white' },
                      { value: 'dark' as ThemeMode, label: '🌙 Dark', color: 'bg-gray-800' },
                      { value: 'system' as ThemeMode, label: '⚙️ System', color: 'bg-blue-900' },
                      { value: 'hacker' as ThemeMode, label: '💚 Hacker', color: 'bg-green-900' },
                      { value: 'matrix' as ThemeMode, label: '🔋 Matrix', color: 'bg-black' },
                      { value: 'cyberpunk' as ThemeMode, label: '🌆 Cyberpunk', color: 'bg-purple-900' },
                      { value: 'redteam' as ThemeMode, label: '🔴 Red Team', color: 'bg-red-900' },
                      { value: 'neon-city' as ThemeMode, label: '🏙️ Neon City', color: 'bg-pink-900' },
                      { value: 'ghost-protocol' as ThemeMode, label: '👻 Ghost Protocol', color: 'bg-gray-700' },
                      { value: 'quantum' as ThemeMode, label: '⚛️ Quantum', color: 'bg-indigo-900' },
                      { value: 'neural-net' as ThemeMode, label: '🧠 Neural Net', color: 'bg-teal-900' },
                      { value: 'dark-web' as ThemeMode, label: '🕸️ Dark Web', color: 'bg-gray-900' },
                      { value: 'glass' as ThemeMode, label: '🔮 Glass', color: 'bg-cyan-900' },
                      { value: 'hologram' as ThemeMode, label: '🌈 Hologram', color: 'bg-yellow-900' }
                    ].map((themeOption) => (
                      <button
                        key={themeOption.value}
                        onClick={() => handleThemeToggle(themeOption.value)}
                        className={`p-3 rounded-lg border-2 transition-all duration-200 ${
                          mode === themeOption.value
                            ? 'border-red-500 bg-red-500/20 text-red-400'
                            : 'border-gray-600 hover:border-gray-500 text-gray-300 hover:text-white'
                        }`}
                      >
                        <div className={`w-6 h-6 rounded-full ${themeOption.color} mx-auto mb-2`}></div>
                        <div className="text-sm font-medium">{themeOption.label}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <h4 className="text-red-400 font-semibold">Server Settings</h4>
                
                <div>
                  <label className="block text-white font-semibold mb-2">Server Port</label>
                  <input
                    type="number"
                    defaultValue="3000"
                    className="bg-gray-800/50 border border-red-500/20 rounded-lg px-4 py-2 text-white focus:border-red-500 focus:outline-none w-full max-w-xs"
                  />
                </div>

                <div>
                  <label className="block text-white font-semibold mb-2">Max Connections</label>
                  <input
                    type="number"
                    defaultValue="100"
                    className="bg-gray-800/50 border border-red-500/20 rounded-lg px-4 py-2 text-white focus:border-red-500 focus:outline-none w-full max-w-xs"
                  />
                </div>

                <div>
                  <label className="block text-white font-semibold mb-2">Session Timeout (minutes)</label>
                  <input
                    type="number"
                    defaultValue="30"
                    className="bg-gray-800/50 border border-red-500/20 rounded-lg px-4 py-2 text-white focus:border-red-500 focus:outline-none w-full max-w-xs"
                  />
                </div>

                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="enableLogging"
                    defaultChecked
                    className="w-4 h-4 text-red-500 bg-gray-800 border-red-500/20 rounded focus:ring-red-500"
                  />
                  <label htmlFor="enableLogging" className="text-white font-medium">
                    Enable Detailed Logging
                  </label>
                </div>

                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="enableSSL"
                    className="w-4 h-4 text-red-500 bg-gray-800 border-red-500/20 rounded focus:ring-red-500"
                  />
                  <label htmlFor="enableSSL" className="text-white font-medium">
                    Enable SSL/TLS
                  </label>
                </div>

                <button className="bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-400 px-6 py-2 rounded-lg font-medium transition-all duration-200">
                  Save Configuration
                </button>
              </div>
            </div>

            {/* Security Settings */}
            <div className="bg-black/40 border border-red-500/20 rounded-lg p-6 backdrop-blur-sm">
              <h3 className="text-xl font-bold text-red-400 mb-4">Security Configuration</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-white font-semibold mb-2">API Rate Limit (requests/minute)</label>
                  <input
                    type="number"
                    defaultValue="60"
                    className="bg-gray-800/50 border border-red-500/20 rounded-lg px-4 py-2 text-white focus:border-red-500 focus:outline-none w-full max-w-xs"
                  />
                </div>

                <div>
                  <label className="block text-white font-semibold mb-2">Failed Login Attempts Limit</label>
                  <input
                    type="number"
                    defaultValue="5"
                    className="bg-gray-800/50 border border-red-500/20 rounded-lg px-4 py-2 text-white focus:border-red-500 focus:outline-none w-full max-w-xs"
                  />
                </div>

                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="enableTwoFactor"
                    className="w-4 h-4 text-red-500 bg-gray-800 border-red-500/20 rounded focus:ring-red-500"
                  />
                  <label htmlFor="enableTwoFactor" className="text-white font-medium">
                    Enable Two-Factor Authentication
                  </label>
                </div>

                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="enableIPWhitelist"
                    className="w-4 h-4 text-red-500 bg-gray-800 border-red-500/20 rounded focus:ring-red-500"
                  />
                  <label htmlFor="enableIPWhitelist" className="text-white font-medium">
                    Enable IP Whitelist
                  </label>
                </div>

                <button className="bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-400 px-6 py-2 rounded-lg font-medium transition-all duration-200">
                  Update Security Settings
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Settings;