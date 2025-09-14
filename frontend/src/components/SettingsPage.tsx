import React, { useState, useEffect } from 'react';
import { 
  FiSettings, 
  FiShield, 
  FiMonitor, 
  FiUser, 
  FiMail, 
  FiBell, 
  FiLock,
  FiSave,
  FiRefreshCw,
  FiCheck
} from 'react-icons/fi';

interface SettingsPageProps {
  activeTab: string;
}

interface SettingsSectionProps {
  title: string;
  description: string;
  children: React.ReactNode;
}

const SettingsSection: React.FC<SettingsSectionProps> = ({ title, description, children }) => {
  return (
    <div className="bg-white dark:bg-boxdark rounded-lg shadow-sm border border-stroke dark:border-strokedark p-6 mb-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-black dark:text-white mb-2">{title}</h3>
        <p className="text-sm text-bodydark2">{description}</p>
      </div>
      {children}
    </div>
  );
};

const SettingsPage: React.FC<SettingsPageProps> = ({ activeTab }) => {
  const [settings, setSettings] = useState({
    // General Settings
    siteName: 'LoopJS Management Panel',
    adminEmail: 'admin@loopjs.com',
    timezone: 'UTC',
    language: 'en',
    autoRefresh: true,
    refreshInterval: 30,
    
    // Security Settings
    sessionTimeout: 60,
    maxLoginAttempts: 5,
    requireStrongPasswords: true,
    enableTwoFactor: false,
    allowRemoteAccess: true,
    
    // Appearance Settings
    theme: 'system',
    primaryColor: '#3C50E0',
    sidebarCollapsed: false,
    showNotifications: true,
    compactMode: false
  });

  const [saved, setSaved] = useState(false);

  const handleSettingChange = (key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    // Save settings to localStorage or API
    localStorage.setItem('panelSettings', JSON.stringify(settings));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleReset = () => {
    // Reset to default settings
    const defaultSettings = {
      siteName: 'LoopJS Management Panel',
      adminEmail: 'admin@loopjs.com',
      timezone: 'UTC',
      language: 'en',
      autoRefresh: true,
      refreshInterval: 30,
      sessionTimeout: 60,
      maxLoginAttempts: 5,
      requireStrongPasswords: true,
      enableTwoFactor: false,
      allowRemoteAccess: true,
      theme: 'system',
      primaryColor: '#3C50E0',
      sidebarCollapsed: false,
      showNotifications: true,
      compactMode: false
    };
    setSettings(defaultSettings);
  };

  // Load settings from localStorage on component mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('panelSettings');
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }
  }, []);

  const renderGeneralSettings = () => (
    <div className="space-y-6">
      <SettingsSection
        title="Basic Configuration"
        description="Configure basic system settings and preferences"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-black dark:text-white mb-2">
              Site Name
            </label>
            <input
              type="text"
              value={settings.siteName}
              onChange={(e) => handleSettingChange('siteName', e.target.value)}
              className="w-full px-3 py-2 border border-stroke dark:border-strokedark rounded-lg bg-white dark:bg-form-input text-black dark:text-white focus:border-primary focus:outline-none"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-black dark:text-white mb-2">
              Admin Email
            </label>
            <input
              type="email"
              value={settings.adminEmail}
              onChange={(e) => handleSettingChange('adminEmail', e.target.value)}
              className="w-full px-3 py-2 border border-stroke dark:border-strokedark rounded-lg bg-white dark:bg-form-input text-black dark:text-white focus:border-primary focus:outline-none"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-black dark:text-white mb-2">
              Timezone
            </label>
            <select
              value={settings.timezone}
              onChange={(e) => handleSettingChange('timezone', e.target.value)}
              className="w-full px-3 py-2 border border-stroke dark:border-strokedark rounded-lg bg-white dark:bg-form-input text-black dark:text-white focus:border-primary focus:outline-none"
            >
              <option value="UTC">UTC</option>
              <option value="America/New_York">Eastern Time</option>
              <option value="America/Chicago">Central Time</option>
              <option value="America/Denver">Mountain Time</option>
              <option value="America/Los_Angeles">Pacific Time</option>
              <option value="Europe/London">London</option>
              <option value="Europe/Paris">Paris</option>
              <option value="Asia/Tokyo">Tokyo</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-black dark:text-white mb-2">
              Language
            </label>
            <select
              value={settings.language}
              onChange={(e) => handleSettingChange('language', e.target.value)}
              className="w-full px-3 py-2 border border-stroke dark:border-strokedark rounded-lg bg-white dark:bg-form-input text-black dark:text-white focus:border-primary focus:outline-none"
            >
              <option value="en">English</option>
              <option value="es">Spanish</option>
              <option value="fr">French</option>
              <option value="de">German</option>
              <option value="zh">Chinese</option>
              <option value="ja">Japanese</option>
            </select>
          </div>
        </div>
      </SettingsSection>

      <SettingsSection
        title="System Behavior"
        description="Configure how the system behaves and updates"
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium text-black dark:text-white">Auto Refresh</h4>
              <p className="text-xs text-bodydark2">Automatically refresh data at regular intervals</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.autoRefresh}
                onChange={(e) => handleSettingChange('autoRefresh', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/25 dark:peer-focus:ring-primary/25 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
            </label>
          </div>
          
          {settings.autoRefresh && (
            <div>
              <label className="block text-sm font-medium text-black dark:text-white mb-2">
                Refresh Interval (seconds)
              </label>
              <input
                type="number"
                min="10"
                max="300"
                value={settings.refreshInterval}
                onChange={(e) => handleSettingChange('refreshInterval', parseInt(e.target.value))}
                className="w-32 px-3 py-2 border border-stroke dark:border-strokedark rounded-lg bg-white dark:bg-form-input text-black dark:text-white focus:border-primary focus:outline-none"
              />
            </div>
          )}
        </div>
      </SettingsSection>
    </div>
  );

  const renderSecuritySettings = () => (
    <div className="space-y-6">
      <SettingsSection
        title="Authentication & Access"
        description="Configure security settings and access controls"
      >
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-black dark:text-white mb-2">
                Session Timeout (minutes)
              </label>
              <input
                type="number"
                min="5"
                max="480"
                value={settings.sessionTimeout}
                onChange={(e) => handleSettingChange('sessionTimeout', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-stroke dark:border-strokedark rounded-lg bg-white dark:bg-form-input text-black dark:text-white focus:border-primary focus:outline-none"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-black dark:text-white mb-2">
                Max Login Attempts
              </label>
              <input
                type="number"
                min="3"
                max="10"
                value={settings.maxLoginAttempts}
                onChange={(e) => handleSettingChange('maxLoginAttempts', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-stroke dark:border-strokedark rounded-lg bg-white dark:bg-form-input text-black dark:text-white focus:border-primary focus:outline-none"
              />
            </div>
          </div>
          
          <div className="space-y-4">
            {[
              {
                key: 'requireStrongPasswords',
                title: 'Require Strong Passwords',
                description: 'Enforce password complexity requirements'
              },
              {
                key: 'enableTwoFactor',
                title: 'Two-Factor Authentication',
                description: 'Enable 2FA for additional security'
              },
              {
                key: 'allowRemoteAccess',
                title: 'Allow Remote Access',
                description: 'Allow access from external networks'
              }
            ].map((setting) => (
              <div key={setting.key} className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-black dark:text-white">{setting.title}</h4>
                  <p className="text-xs text-bodydark2">{setting.description}</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings[setting.key as keyof typeof settings] as boolean}
                    onChange={(e) => handleSettingChange(setting.key, e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/25 dark:peer-focus:ring-primary/25 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
                </label>
              </div>
            ))}
          </div>
        </div>
      </SettingsSection>
    </div>
  );

  const renderAppearanceSettings = () => (
    <div className="space-y-6">
      <SettingsSection
        title="Theme & Display"
        description="Customize the appearance and layout of the panel"
      >
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-black dark:text-white mb-3">
              Theme Preference
            </label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { value: 'light', label: 'Light', icon: '☀️' },
                { value: 'dark', label: 'Dark', icon: '🌙' },
                { value: 'system', label: 'System', icon: '💻' }
              ].map((theme) => (
                <button
                  key={theme.value}
                  onClick={() => handleSettingChange('theme', theme.value)}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    settings.theme === theme.value
                      ? 'border-primary bg-primary/10'
                      : 'border-stroke dark:border-strokedark hover:border-primary/50'
                  }`}
                >
                  <div className="text-2xl mb-2">{theme.icon}</div>
                  <div className="text-sm font-medium text-black dark:text-white">{theme.label}</div>
                </button>
              ))}
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-black dark:text-white mb-3">
              Primary Color
            </label>
            <div className="grid grid-cols-6 gap-3">
              {[
                '#3C50E0', '#10B981', '#F59E0B', '#EF4444', 
                '#8B5CF6', '#06B6D4', '#EC4899', '#84CC16'
              ].map((color) => (
                <button
                  key={color}
                  onClick={() => handleSettingChange('primaryColor', color)}
                  className={`w-12 h-12 rounded-lg border-2 transition-all ${
                    settings.primaryColor === color
                      ? 'border-white shadow-lg scale-110'
                      : 'border-transparent hover:scale-105'
                  }`}
                  style={{ backgroundColor: color }}
                >
                  {settings.primaryColor === color && (
                    <FiCheck className="w-6 h-6 text-white mx-auto" />
                  )}
                </button>
              ))}
            </div>
          </div>
          
          <div className="space-y-4">
            {[
              {
                key: 'sidebarCollapsed',
                title: 'Collapsed Sidebar',
                description: 'Start with sidebar collapsed by default'
              },
              {
                key: 'showNotifications',
                title: 'Show Notifications',
                description: 'Display system notifications and alerts'
              },
              {
                key: 'compactMode',
                title: 'Compact Mode',
                description: 'Use smaller spacing and components'
              }
            ].map((setting) => (
              <div key={setting.key} className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-black dark:text-white">{setting.title}</h4>
                  <p className="text-xs text-bodydark2">{setting.description}</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings[setting.key as keyof typeof settings] as boolean}
                    onChange={(e) => handleSettingChange(setting.key, e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/25 dark:peer-focus:ring-primary/25 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
                </label>
              </div>
            ))}
          </div>
        </div>
      </SettingsSection>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'general':
        return renderGeneralSettings();
      case 'security':
        return renderSecuritySettings();
      case 'appearance':
        return renderAppearanceSettings();
      default:
        return renderGeneralSettings();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-boxdark rounded-lg shadow-sm border border-stroke dark:border-strokedark p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-black dark:text-white mb-2">Settings</h2>
            <p className="text-bodydark2">Configure your system preferences and security settings</p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={handleReset}
              className="flex items-center space-x-2 px-4 py-2 border border-stroke dark:border-strokedark rounded-lg hover:bg-gray-2 dark:hover:bg-meta-4 transition-colors"
            >
              <FiRefreshCw className="w-4 h-4" />
              <span>Reset</span>
            </button>
            <button
              onClick={handleSave}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all ${
                saved 
                  ? 'bg-success text-white' 
                  : 'bg-primary text-white hover:bg-primary/90'
              }`}
            >
              {saved ? <FiCheck className="w-4 h-4" /> : <FiSave className="w-4 h-4" />}
              <span>{saved ? 'Saved!' : 'Save Changes'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Settings Content */}
      {renderContent()}
    </div>
  );
};

export default SettingsPage;