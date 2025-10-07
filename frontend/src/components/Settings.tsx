import React, { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { FiUser, FiUsers, FiShield, FiDatabase, FiTrash2, FiSave, FiEye, FiEyeOff, FiPlus, FiEdit, FiX, FiSettings, FiKey, FiMail, FiPhone } from 'react-icons/fi';

type ThemeMode = 'light' | 'dark' | 'hacker-elite' | 'premium-cyber';

interface User {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'user' | 'viewer';
  status: 'active' | 'inactive';
  createdAt: string;
  lastLogin: string;
}

interface Settings {
  // General Settings
  panelName: string;
  panelIcon: string;
  autoRefresh: boolean;
  refreshInterval: number;
  notifications: boolean;
  
  // Security Settings
  sessionTimeout: number;
  maxLoginAttempts: number;
  twoFactor: boolean;
  passwordPolicy: {
    minLength: number;
    requireSpecial: boolean;
    requireNumbers: boolean;
    requireUppercase: boolean;
  };
  
  // Database Settings
  autoClearLogs: boolean;
  logRetentionDays: number;
  offlineLogs: boolean;
  
  // Telegram Settings
  telegramEnabled: boolean;
  telegramBotToken: string;
  telegramChatId: string;
  
  // Theme Settings
  theme: ThemeMode;
}

const Settings: React.FC = () => {
  const { mode, setMode } = useTheme();
  const [activeTab, setActiveTab] = useState<'appearance' | 'general' | 'security' | 'users' | 'database' | 'telegram'>('appearance');
  const [saved, setSaved] = useState(false);
  const [settings, setSettings] = useState<Settings>({
    panelName: 'C2 Command Panel',
    panelIcon: '🎯',
    autoRefresh: true,
    refreshInterval: 30,
    notifications: true,
    sessionTimeout: 60,
    maxLoginAttempts: 5,
    twoFactor: false,
    passwordPolicy: {
      minLength: 8,
      requireSpecial: true,
      requireNumbers: true,
      requireUppercase: true
    },
    autoClearLogs: true,
    logRetentionDays: 30,
    offlineLogs: true,
    telegramEnabled: false,
    telegramBotToken: '',
    telegramChatId: '',
    theme: mode as ThemeMode
  });

  const [users, setUsers] = useState<User[]>([
    {
      id: '1',
      username: 'admin',
      email: 'admin@c2panel.com',
      role: 'admin',
      status: 'active',
      createdAt: '2024-01-01',
      lastLogin: '2024-09-27'
    }
  ]);

  const [showCreateUser, setShowCreateUser] = useState(false);
  const [newUser, setNewUser] = useState({
    username: '',
    email: '',
    password: '',
    role: 'user' as 'admin' | 'user' | 'viewer'
  });
  const [showPassword, setShowPassword] = useState(false);

  const themes = [
    { value: 'light' as ThemeMode, label: '☀️ Light Premium', desc: 'Clean & minimal design', category: 'Professional' },
    { value: 'dark' as ThemeMode, label: '🌙 Dark Premium', desc: 'Easy on the eyes', category: 'Professional' },
    { value: 'hacker-elite' as ThemeMode, label: '💚 Hacker Elite', desc: 'Matrix rain effects', category: 'Hacker' },
    { value: 'premium-cyber' as ThemeMode, label: '🚀 Premium Cyber', desc: 'Futuristic cyberpunk', category: 'Cyberpunk' }
  ];

  const categories = [...new Set(themes.map(theme => theme.category))];

  useEffect(() => {
    // Load settings from localStorage
    const savedSettings = localStorage.getItem('c2-settings');
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }
  }, []);

  const handleSettingChange = (key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleNestedSettingChange = (parentKey: string, key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [parentKey]: {
        ...prev[parentKey as keyof Settings],
        [key]: value
      }
    }));
  };

  const handleSaveSettings = () => {
    localStorage.setItem('c2-settings', JSON.stringify(settings));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleThemeChange = (themeValue: ThemeMode) => {
    setMode(themeValue);
    handleSettingChange('theme', themeValue);
  };

  const handleCreateUser = async () => {
    if (!newUser.username || !newUser.email || !newUser.password) {
      alert('Please fill in all fields');
      return;
    }

    const user: User = {
      id: Date.now().toString(),
      username: newUser.username,
      email: newUser.email,
      role: newUser.role,
      status: 'active',
      createdAt: new Date().toISOString().split('T')[0],
      lastLogin: 'Never'
    };

    setUsers(prev => [...prev, user]);
    setNewUser({ username: '', email: '', password: '', role: 'user' });
    setShowCreateUser(false);
  };

  const handleDeleteUser = (userId: string) => {
    if (userId === '1') {
      alert('Cannot delete the main admin account');
      return;
    }
    setUsers(prev => prev.filter(user => user.id !== userId));
  };

  const handleClearDatabase = async (type: 'logs' | 'users' | 'all') => {
    if (!confirm(`Are you sure you want to clear ${type}? This action cannot be undone.`)) {
      return;
    }

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      if (type === 'all') {
        setUsers([users[0]]); // Keep admin user
      }
      
      alert(`Successfully cleared ${type}`);
    } catch (error) {
      alert(`Failed to clear ${type}`);
    }
  };

  // Render methods will be added in the next part...
  const renderAppearanceSettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-black dark:text-white mb-4">
          🎨 Panel Customization
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-black dark:text-white mb-2">
              Panel Name
            </label>
            <input
              type="text"
              value={settings.panelName}
              onChange={(e) => handleSettingChange('panelName', e.target.value)}
              className="w-full px-3 py-2 border border-stroke dark:border-strokedark rounded-lg bg-white dark:bg-boxdark text-black dark:text-white"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-black dark:text-white mb-2">
              Panel Icon
            </label>
            <input
              type="text"
              value={settings.panelIcon}
              onChange={(e) => handleSettingChange('panelIcon', e.target.value)}
              className="w-full px-3 py-2 border border-stroke dark:border-strokedark rounded-lg bg-white dark:bg-boxdark text-black dark:text-white"
            />
          </div>
        </div>
      </div>

      {/* Theme Selection */}
      <div>
        <h3 className="text-lg font-semibold text-black dark:text-white mb-4">
          🎭 Theme Selection
        </h3>
        
        {categories.map(category => (
          <div key={category} className="mb-6">
            <h4 className="text-md font-semibold text-black dark:text-white mb-3 flex items-center">
              <span className="mr-2">
                {category === 'Professional' && '💼'}
                {category === 'Hacker' && '💚'}
                {category === 'Futuristic' && '🚀'}
                {category === 'Retro' && '🌅'}
                {category === 'Mysterious' && '🌌'}
                {category === 'Rebellion' && '⚡'}
                {category === 'AI' && '🤖'}
                {category === 'Intense' && '🔥'}
                {category === 'Modern' && '✨'}
              </span>
              {category}
            </h4>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {themes.filter(theme => theme.category === category).map((theme) => (
                <button
                  key={theme.value}
                  onClick={() => handleThemeChange(theme.value)}
                  className={`p-3 rounded-lg border-2 transition-all duration-300 hover:scale-105 ${
                    settings.theme === theme.value
                      ? 'border-primary bg-primary/10 shadow-lg ring-2 ring-primary/20'
                      : 'border-stroke dark:border-strokedark hover:border-primary/50'
                  }`}
                >
                  <div className="text-lg mb-2">{theme.label.split(' ')[1]}</div>
                  <div className="text-xs text-bodydark2">{theme.desc}</div>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {saved && (
        <div className="fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 animate-bounce">
          ✅ Settings saved successfully!
        </div>
      )}
    </div>
  );

  const renderGeneralSettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-black dark:text-white mb-4">
          ⚙️ General Settings
        </h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div>
              <h4 className="font-medium text-black dark:text-white">Auto Refresh</h4>
              <p className="text-sm text-bodydark2">Automatically refresh data</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.autoRefresh}
                onChange={(e) => handleSettingChange('autoRefresh', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 dark:peer-focus:ring-primary/20 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-black dark:text-white mb-2">
              Refresh Interval (seconds)
            </label>
            <select
              value={settings.refreshInterval}
              onChange={(e) => handleSettingChange('refreshInterval', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-stroke dark:border-strokedark rounded-lg bg-white dark:bg-boxdark text-black dark:text-white"
            >
              <option value="5">5 seconds</option>
              <option value="10">10 seconds</option>
              <option value="30">30 seconds</option>
              <option value="60">1 minute</option>
            </select>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div>
              <h4 className="font-medium text-black dark:text-white">Notifications</h4>
              <p className="text-sm text-bodydark2">Enable system notifications</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.notifications}
                onChange={(e) => handleSettingChange('notifications', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 dark:peer-focus:ring-primary/20 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
            </label>
          </div>
        </div>
      </div>
    </div>
  );

  const renderSecuritySettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-black dark:text-white mb-4">
          🔒 Security Settings
        </h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-black dark:text-white mb-2">
              Session Timeout (minutes)
            </label>
            <input
              type="number"
              value={settings.sessionTimeout}
              onChange={(e) => handleSettingChange('sessionTimeout', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-stroke dark:border-strokedark rounded-lg bg-white dark:bg-boxdark text-black dark:text-white"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-black dark:text-white mb-2">
              Max Login Attempts
            </label>
            <input
              type="number"
              value={settings.maxLoginAttempts}
              onChange={(e) => handleSettingChange('maxLoginAttempts', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-stroke dark:border-strokedark rounded-lg bg-white dark:bg-boxdark text-black dark:text-white"
            />
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div>
              <h4 className="font-medium text-black dark:text-white">Two-Factor Authentication</h4>
              <p className="text-sm text-bodydark2">Require 2FA for all users</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.twoFactor}
                onChange={(e) => handleSettingChange('twoFactor', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 dark:peer-focus:ring-primary/20 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
            </label>
          </div>

          {/* Password Policy */}
          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <h4 className="font-medium text-black dark:text-white mb-3">Password Policy</h4>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-black dark:text-white mb-2">
                  Minimum Length
                </label>
                <input
                  type="number"
                  value={settings.passwordPolicy.minLength}
                  onChange={(e) => handleNestedSettingChange('passwordPolicy', 'minLength', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-stroke dark:border-strokedark rounded-lg bg-white dark:bg-boxdark text-black dark:text-white"
                />
              </div>
              
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={settings.passwordPolicy.requireSpecial}
                    onChange={(e) => handleNestedSettingChange('passwordPolicy', 'requireSpecial', e.target.checked)}
                    className="mr-2"
                  />
                  <span className="text-sm text-black dark:text-white">Require special characters</span>
                </label>
                
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={settings.passwordPolicy.requireNumbers}
                    onChange={(e) => handleNestedSettingChange('passwordPolicy', 'requireNumbers', e.target.checked)}
                    className="mr-2"
                  />
                  <span className="text-sm text-black dark:text-white">Require numbers</span>
                </label>
                
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={settings.passwordPolicy.requireUppercase}
                    onChange={(e) => handleNestedSettingChange('passwordPolicy', 'requireUppercase', e.target.checked)}
                    className="mr-2"
                  />
                  <span className="text-sm text-black dark:text-white">Require uppercase letters</span>
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderUserManagement = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-black dark:text-white">
          👥 User Management
        </h3>
        <button
          onClick={() => setShowCreateUser(true)}
          className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors flex items-center"
        >
          <FiPlus className="w-4 h-4 mr-2" />
          Create User
        </button>
      </div>

      {/* Users Table */}
      <div className="bg-white dark:bg-boxdark rounded-lg shadow-sm border border-stroke dark:border-strokedark overflow-hidden">
        <table className="w-full text-sm text-left text-gray-300">
          <thead className="text-xs text-gray-400 uppercase bg-gray-800">
            <tr>
              <th className="px-6 py-3">User</th>
              <th className="px-6 py-3">Role</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3">Last Login</th>
              <th className="px-6 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-gray-700 transition-colors">
                <td className="px-6 py-4">
                  <div>
                    <div className="font-medium text-white">{user.username}</div>
                    <div className="text-xs text-gray-400">{user.email}</div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    user.role === 'admin' ? 'bg-red-100 text-red-800' :
                    user.role === 'user' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {user.role}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    user.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {user.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-white">{user.lastLogin}</td>
                <td className="px-6 py-4">
                  <div className="flex space-x-2">
                    <button className="text-blue-400 hover:text-blue-300">
                      <FiEdit className="w-4 h-4" />
                    </button>
                    {user.id !== '1' && (
                      <button 
                        onClick={() => handleDeleteUser(user.id)}
                        className="text-red-400 hover:text-red-300"
                      >
                        <FiX className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Create User Modal */}
      {showCreateUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-boxdark rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-black dark:text-white mb-4">
              Create New User
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-black dark:text-white mb-2">
                  Username
                </label>
                <input
                  type="text"
                  value={newUser.username}
                  onChange={(e) => setNewUser(prev => ({ ...prev, username: e.target.value }))}
                  className="w-full px-3 py-2 border border-stroke dark:border-strokedark rounded-lg bg-white dark:bg-boxdark text-black dark:text-white"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-black dark:text-white mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-3 py-2 border border-stroke dark:border-strokedark rounded-lg bg-white dark:bg-boxdark text-black dark:text-white"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-black dark:text-white mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={newUser.password}
                    onChange={(e) => setNewUser(prev => ({ ...prev, password: e.target.value }))}
                    className="w-full px-3 py-2 pr-10 border border-stroke dark:border-strokedark rounded-lg bg-white dark:bg-boxdark text-black dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showPassword ? (
                      <FiEyeOff className="h-4 w-4 text-bodydark2" />
                    ) : (
                      <FiEye className="h-4 w-4 text-bodydark2" />
                    )}
                  </button>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-black dark:text-white mb-2">
                  Role
                </label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser(prev => ({ ...prev, role: e.target.value as 'admin' | 'user' | 'viewer' }))}
                  className="w-full px-3 py-2 border border-stroke dark:border-strokedark rounded-lg bg-white dark:bg-boxdark text-black dark:text-white"
                >
                  <option value="user">User</option>
                  <option value="viewer">Viewer</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowCreateUser(false)}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateUser}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
              >
                Create User
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderDatabaseSettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-black dark:text-white mb-4">
          🗄️ Database Management
        </h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div>
              <h4 className="font-medium text-black dark:text-white">Auto Clear Logs</h4>
              <p className="text-sm text-bodydark2">Automatically clear old logs</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.autoClearLogs}
                onChange={(e) => handleSettingChange('autoClearLogs', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 dark:peer-focus:ring-primary/20 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-black dark:text-white mb-2">
              Log Retention (days)
            </label>
            <input
              type="number"
              value={settings.logRetentionDays}
              onChange={(e) => handleSettingChange('logRetentionDays', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-stroke dark:border-strokedark rounded-lg bg-white dark:bg-boxdark text-black dark:text-white"
            />
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div>
              <h4 className="font-medium text-black dark:text-white">Offline Logs</h4>
              <p className="text-sm text-bodydark2">Store logs when offline</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.offlineLogs}
                onChange={(e) => handleSettingChange('offlineLogs', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 dark:peer-focus:ring-primary/20 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
            </label>
          </div>

          {/* Database Actions */}
          <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
            <h4 className="font-medium text-red-800 dark:text-red-400 mb-3">Danger Zone</h4>
            <div className="space-y-2">
              <button
                onClick={() => handleClearDatabase('logs')}
                className="w-full px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors flex items-center justify-center"
              >
                <FiTrash2 className="w-4 h-4 mr-2" />
                Clear All Logs
              </button>
              <button
                onClick={() => handleClearDatabase('users')}
                className="w-full px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center justify-center"
              >
                <FiUsers className="w-4 h-4 mr-2" />
                Clear All Users (Except Admin)
              </button>
              <button
                onClick={() => handleClearDatabase('all')}
                className="w-full px-4 py-2 bg-red-700 text-white rounded-lg hover:bg-red-800 transition-colors flex items-center justify-center"
              >
                <FiDatabase className="w-4 h-4 mr-2" />
                Clear Entire Database
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderTelegramSettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-black dark:text-white mb-4">
          📱 Telegram Integration
        </h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div>
              <h4 className="font-medium text-black dark:text-white">Enable Telegram</h4>
              <p className="text-sm text-bodydark2">Send notifications via Telegram</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.telegramEnabled}
                onChange={(e) => handleSettingChange('telegramEnabled', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 dark:peer-focus:ring-primary/20 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
            </label>
          </div>

          {settings.telegramEnabled && (
            <>
              <div>
                <label className="block text-sm font-medium text-black dark:text-white mb-2">
                  Bot Token
                </label>
                <input
                  type="password"
                  value={settings.telegramBotToken}
                  onChange={(e) => handleSettingChange('telegramBotToken', e.target.value)}
                  placeholder="123456789:ABCdefGHIjklMNOpqrsTUVwxyz"
                  className="w-full px-3 py-2 border border-stroke dark:border-strokedark rounded-lg bg-white dark:bg-boxdark text-black dark:text-white"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-black dark:text-white mb-2">
                  Chat ID
                </label>
                <input
                  type="text"
                  value={settings.telegramChatId}
                  onChange={(e) => handleSettingChange('telegramChatId', e.target.value)}
                  placeholder="-1001234567890"
                  className="w-full px-3 py-2 border border-stroke dark:border-strokedark rounded-lg bg-white dark:bg-boxdark text-black dark:text-white"
                />
              </div>

              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <h4 className="font-medium text-blue-800 dark:text-blue-400 mb-2">Setup Instructions</h4>
                <ol className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                  <li>1. Create a bot with @BotFather on Telegram</li>
                  <li>2. Get your bot token from BotFather</li>
                  <li>3. Add your bot to a group or start a chat</li>
                  <li>4. Get your chat ID using @userinfobot</li>
                </ol>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-boxdark rounded-lg shadow-sm border border-stroke dark:border-strokedark p-6">
        <h1 className="text-2xl font-bold text-black dark:text-white mb-2">
          ⚙️ Advanced Settings
        </h1>
        <p className="text-bodydark2">
          Configure your C2 panel with comprehensive settings and user management
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white dark:bg-boxdark rounded-lg shadow-sm border border-stroke dark:border-strokedark">
        <div className="border-b border-stroke dark:border-strokedark">
          <nav className="flex space-x-8 px-6 overflow-x-auto">
            {[
              { id: 'appearance', label: '🎨 Appearance', icon: '🎨' },
              { id: 'general', label: '⚙️ General', icon: '⚙️' },
              { id: 'security', label: '🔒 Security', icon: '🔒' },
              { id: 'users', label: '👥 Users', icon: '👥' },
              { id: 'database', label: '🗄️ Database', icon: '🗄️' },
              { id: 'telegram', label: '📱 Telegram', icon: '📱' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-primary text-primary'
                    : 'border-transparent text-bodydark2 hover:text-black dark:hover:text-white hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'appearance' && renderAppearanceSettings()}
          {activeTab === 'general' && renderGeneralSettings()}
          {activeTab === 'security' && renderSecuritySettings()}
          {activeTab === 'users' && renderUserManagement()}
          {activeTab === 'database' && renderDatabaseSettings()}
          {activeTab === 'telegram' && renderTelegramSettings()}
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button 
          onClick={handleSaveSettings}
          className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors flex items-center"
        >
          <FiSave className="w-4 h-4 mr-2" />
          Save All Settings
        </button>
      </div>
    </div>
  );
};

export default Settings;