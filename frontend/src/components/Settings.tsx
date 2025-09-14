import React, { useState } from 'react';
import { useTheme, colorSchemes } from '../contexts/ThemeContext';
import {
  FiSettings,
  FiUser,
  FiShield,
  FiMonitor,
  FiBell,
  FiGlobe,
  FiSave,
  FiRefreshCw,
  FiMoon,
  FiSun,
  FiEye,
  FiEyeOff,
  FiCheck,
  FiX
} from 'react-icons/fi';

interface SettingsProps {
  // Add any props if needed
}

const Settings: React.FC<SettingsProps> = () => {
  const { mode, colorScheme, isDark, setMode, setColorScheme, toggleMode } = useTheme();
  const [activeSection, setActiveSection] = useState('general');
  const [notifications, setNotifications] = useState({
    email: true,
    push: false,
    sms: false,
    desktop: true
  });
  const [security, setSecurity] = useState({
    twoFactor: false,
    sessionTimeout: '30',
    passwordExpiry: '90'
  });
  const [showPassword, setShowPassword] = useState(false);
  const [profile, setProfile] = useState({
    name: 'John Doe',
    email: 'john.doe@example.com',
    role: 'Administrator',
    timezone: 'UTC-5',
    language: 'English'
  });

  const sections = [
    { id: 'general', label: 'General', icon: FiSettings },
    { id: 'profile', label: 'Profile', icon: FiUser },
    { id: 'security', label: 'Security', icon: FiShield },
    { id: 'notifications', label: 'Notifications', icon: FiBell },
    { id: 'appearance', label: 'Appearance', icon: FiMonitor },
    { id: 'system', label: 'System', icon: FiGlobe }
  ];

  const handleSave = () => {
    // Implement save functionality
    console.log('Settings saved');
  };

  const renderGeneralSettings = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Application Name
          </label>
          <input
            type="text"
            defaultValue="LoopJS Admin Panel"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Default Language
          </label>
          <select className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white">
            <option>English</option>
            <option>Spanish</option>
            <option>French</option>
            <option>German</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Timezone
          </label>
          <select className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white">
            <option>UTC-5 (Eastern)</option>
            <option>UTC-6 (Central)</option>
            <option>UTC-7 (Mountain)</option>
            <option>UTC-8 (Pacific)</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Date Format
          </label>
          <select className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white">
            <option>MM/DD/YYYY</option>
            <option>DD/MM/YYYY</option>
            <option>YYYY-MM-DD</option>
          </select>
        </div>
      </div>
    </div>
  );

  const renderProfileSettings = () => (
    <div className="space-y-6">
      <div className="flex items-center space-x-6">
        <div className="w-24 h-24 bg-primary rounded-full flex items-center justify-center text-white text-2xl font-bold">
          {profile.name.split(' ').map(n => n[0]).join('')}
        </div>
        <div>
          <button className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors">
            Change Avatar
          </button>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            JPG, PNG or GIF. Max size 2MB.
          </p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Full Name
          </label>
          <input
            type="text"
            value={profile.name}
            onChange={(e) => setProfile({...profile, name: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Email Address
          </label>
          <input
            type="email"
            value={profile.email}
            onChange={(e) => setProfile({...profile, email: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Role
          </label>
          <input
            type="text"
            value={profile.role}
            disabled
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-600 text-gray-500 dark:text-gray-400"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Phone Number
          </label>
          <input
            type="tel"
            placeholder="+1 (555) 123-4567"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
          />
        </div>
      </div>
    </div>
  );

  const renderSecuritySettings = () => (
    <div className="space-y-6">
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
        <div className="flex items-center">
          <FiShield className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mr-2" />
          <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
            Security Recommendations
          </h3>
        </div>
        <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
          Enable two-factor authentication and use a strong password for better security.
        </p>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium text-gray-900 dark:text-white">
              Two-Factor Authentication
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Add an extra layer of security to your account
            </p>
          </div>
          <button
            onClick={() => setSecurity({...security, twoFactor: !security.twoFactor})}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              security.twoFactor ? 'bg-primary' : 'bg-gray-200 dark:bg-gray-700'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                security.twoFactor ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Session Timeout (minutes)
          </label>
          <select 
            value={security.sessionTimeout}
            onChange={(e) => setSecurity({...security, sessionTimeout: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
          >
            <option value="15">15 minutes</option>
            <option value="30">30 minutes</option>
            <option value="60">1 hour</option>
            <option value="120">2 hours</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Password Expiry (days)
          </label>
          <select 
            value={security.passwordExpiry}
            onChange={(e) => setSecurity({...security, passwordExpiry: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
          >
            <option value="30">30 days</option>
            <option value="60">60 days</option>
            <option value="90">90 days</option>
            <option value="never">Never</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Change Password
          </label>
          <div className="space-y-3">
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Current password"
                className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                {showPassword ? (
                  <FiEyeOff className="w-4 h-4 text-gray-400" />
                ) : (
                  <FiEye className="w-4 h-4 text-gray-400" />
                )}
              </button>
            </div>
            <input
              type="password"
              placeholder="New password"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
            />
            <input
              type="password"
              placeholder="Confirm new password"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderNotificationSettings = () => (
    <div className="space-y-6">
      <div className="space-y-4">
        {Object.entries(notifications).map(([key, value]) => (
          <div key={key} className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-900 dark:text-white capitalize">
                {key} Notifications
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Receive notifications via {key}
              </p>
            </div>
            <button
              onClick={() => setNotifications({...notifications, [key]: !value})}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                value ? 'bg-primary' : 'bg-gray-200 dark:bg-gray-700'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  value ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        ))}
      </div>

      <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Notification Types
        </h3>
        <div className="space-y-3">
          {[
            'System alerts and warnings',
            'User activity notifications',
            'Security alerts',
            'Maintenance notifications',
            'Performance reports'
          ].map((type, index) => (
            <div key={index} className="flex items-center">
              <input
                type="checkbox"
                defaultChecked
                className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
              />
              <label className="ml-3 text-sm text-gray-700 dark:text-gray-300">
                {type}
              </label>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderAppearanceSettings = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Theme Mode
        </label>
        <div className="grid grid-cols-3 gap-3">
          {[
            { value: 'light', label: 'Light', icon: FiSun },
            { value: 'dark', label: 'Dark', icon: FiMoon },
            { value: 'system', label: 'System', icon: FiMonitor }
          ].map((themeMode) => {
            const Icon = themeMode.icon;
            return (
              <button
                key={themeMode.value}
                onClick={() => setMode(themeMode.value as any)}
                className={`p-3 border rounded-lg transition-all duration-200 flex flex-col items-center space-y-2 ${
                  mode === themeMode.value
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-gray-300 dark:border-gray-600 hover:border-primary/50'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-sm font-medium">{themeMode.label}</span>
              </button>
            );
          })}
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
          Current: {mode === 'system' ? `System (${isDark ? 'Dark' : 'Light'})` : mode.charAt(0).toUpperCase() + mode.slice(1)}
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Color Scheme
        </label>
        <div className="grid grid-cols-5 gap-3">
          {Object.entries(colorSchemes).map(([key, colors]) => (
            <button
              key={key}
              onClick={() => setColorScheme(key as any)}
              className={`relative w-12 h-12 rounded-full shadow-lg hover:scale-110 transition-all duration-200 border-4 ${
                colorScheme === key
                  ? 'border-white dark:border-gray-800 ring-2 ring-offset-2 ring-primary'
                  : 'border-white dark:border-gray-700'
              }`}
              style={{ backgroundColor: colors.primary }}
              title={key.charAt(0).toUpperCase() + key.slice(1)}
            >
              {colorScheme === key && (
                <FiCheck className="absolute inset-0 m-auto w-5 h-5 text-white" />
              )}
            </button>
          ))}
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
          Selected: {colorScheme.charAt(0).toUpperCase() + colorScheme.slice(1)}
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Sidebar Style
        </label>
        <div className="grid grid-cols-2 gap-3">
          <button className="p-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:border-primary transition-colors">
            <div className="text-sm font-medium text-gray-900 dark:text-white">Expanded</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Always show labels</div>
          </button>
          <button className="p-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:border-primary transition-colors">
            <div className="text-sm font-medium text-gray-900 dark:text-white">Collapsed</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Icons only</div>
          </button>
        </div>
      </div>
    </div>
  );

  const renderSystemSettings = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
            System Status
          </h3>
          <div className="flex items-center text-green-600 dark:text-green-400">
            <FiCheck className="w-4 h-4 mr-2" />
            <span className="text-sm">All systems operational</span>
          </div>
        </div>
        
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
            Last Backup
          </h3>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            2 hours ago
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <button className="w-full flex items-center justify-between p-4 border border-gray-300 dark:border-gray-600 rounded-lg hover:border-primary transition-colors">
          <div className="flex items-center">
            <FiRefreshCw className="w-5 h-5 text-gray-400 mr-3" />
            <div className="text-left">
              <div className="text-sm font-medium text-gray-900 dark:text-white">Clear Cache</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Clear application cache and temporary files</div>
            </div>
          </div>
        </button>

        <button className="w-full flex items-center justify-between p-4 border border-gray-300 dark:border-gray-600 rounded-lg hover:border-primary transition-colors">
          <div className="flex items-center">
            <FiSave className="w-5 h-5 text-gray-400 mr-3" />
            <div className="text-left">
              <div className="text-sm font-medium text-gray-900 dark:text-white">Export Settings</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Download current configuration</div>
            </div>
          </div>
        </button>

        <button className="w-full flex items-center justify-between p-4 border border-red-300 dark:border-red-600 rounded-lg hover:border-red-500 transition-colors text-red-600 dark:text-red-400">
          <div className="flex items-center">
            <FiX className="w-5 h-5 mr-3" />
            <div className="text-left">
              <div className="text-sm font-medium">Reset to Defaults</div>
              <div className="text-xs opacity-75">Reset all settings to default values</div>
            </div>
          </div>
        </button>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeSection) {
      case 'general':
        return renderGeneralSettings();
      case 'profile':
        return renderProfileSettings();
      case 'security':
        return renderSecuritySettings();
      case 'notifications':
        return renderNotificationSettings();
      case 'appearance':
        return renderAppearanceSettings();
      case 'system':
        return renderSystemSettings();
      default:
        return renderGeneralSettings();
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Manage your application preferences and configuration
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar */}
        <div className="lg:w-64 flex-shrink-0">
          <div className="bg-white dark:bg-boxdark rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="p-4">
              <nav className="space-y-1">
                {sections.map((section) => {
                  const Icon = section.icon;
                  return (
                    <button
                      key={section.id}
                      onClick={() => setActiveSection(section.id)}
                      className={`w-full flex items-center px-3 py-2 text-left rounded-lg transition-colors ${
                        activeSection === section.id
                          ? 'bg-primary text-white'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                    >
                      <Icon className="w-5 h-5 mr-3" />
                      <span className="font-medium">{section.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          <div className="bg-white dark:bg-boxdark rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white capitalize">
                  {activeSection} Settings
                </h2>
                <button
                  onClick={handleSave}
                  className="flex items-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                >
                  <FiSave className="w-4 h-4 mr-2" />
                  Save Changes
                </button>
              </div>
              
              {renderContent()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;