import React, { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import SoundSettings from './SoundSettings';
import request from '../axios';
import toast from 'react-hot-toast';
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
  FiCheck,
  FiTerminal,
  FiEye,
  FiZap,
  FiCpu,
  FiWifi,
  FiCode,
  FiTarget,
  FiActivity,
  FiTrash2,
  FiDatabase,
  FiAlertTriangle
} from 'react-icons/fi';
import { 
  SiMatrix, 
  SiHackerrank, 
  SiGhost, 
  SiQuantum,
  SiNeural,
  SiVoid,
  SiGlass,
  SiCyber,
  SiNeon
} from 'react-icons/si';
import HackerTeamCard from './HackerTeamCard';
import '../styles/hacker-themes.css';
import { request } from '../axiosInstance'; // Added import for request
import { toast } from 'react-toastify'; // Added import for toast

// CSS-in-JS styles for hacker themes
const hackerThemeStyles = `
  .hacker-teams-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 20px;
    margin-top: 20px;
    padding: 10px;
  }

  @media (max-width: 768px) {
    .hacker-teams-grid {
      grid-template-columns: 1fr;
      gap: 15px;
    }
  }

  .matrix-rain {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: repeating-linear-gradient(
      90deg,
      transparent,
      transparent 2px,
      rgba(0, 255, 65, 0.03) 2px,
      rgba(0, 255, 65, 0.03) 4px
    );
    animation: matrix-scroll 2s linear infinite;
  }

  @keyframes matrix-scroll {
    0% { transform: translateY(-100%); }
    100% { transform: translateY(100%); }
  }

  .neural-network-animation {
    position: relative;
  }

  .neural-network-animation::before,
  .neural-network-animation::after {
    content: '';
    position: absolute;
    width: 2px;
    height: 2px;
    background: currentColor;
    border-radius: 50%;
    animation: neural-pulse 1.5s ease-in-out infinite;
  }

  .neural-network-animation::before {
    top: -5px;
    left: -5px;
    animation-delay: 0.2s;
  }

  .neural-network-animation::after {
    bottom: -5px;
    right: -5px;
    animation-delay: 0.4s;
  }

  @keyframes neural-pulse {
    0%, 100% { opacity: 0.3; transform: scale(0.8); }
    50% { opacity: 1; transform: scale(1.2); }
  }

  .quantum-particles {
    display: flex;
    gap: 4px;
  }

  .stealth-indicator {
    display: flex;
    flex-direction: column;
    gap: 1px;
  }

  .hacker-teams-title {
    font-size: 1.3rem;
    font-weight: bold;
    color: #00ffff;
    margin-bottom: 20px;
    display: flex;
    align-items: center;
    gap: 10px;
    text-shadow: 0 0 10px rgba(0, 255, 255, 0.5);
    font-family: 'Orbitron', monospace;
  }

  .hacker-teams-section {
    margin-top: 30px;
    padding: 20px;
    border-radius: 12px;
    background: linear-gradient(135deg, rgba(0, 0, 0, 0.3), rgba(0, 20, 40, 0.2));
    border: 1px solid rgba(0, 255, 255, 0.2);
    backdrop-filter: blur(10px);
  }
`;

// Inject styles
if (typeof document !== 'undefined') {
  const styleElement = document.createElement('style');
  styleElement.textContent = hackerThemeStyles;
  document.head.appendChild(styleElement);
}

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
  const { mode, setMode, colorScheme, setColorScheme } = useTheme();
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
    theme: mode,
    primaryColor: '#3C50E0',
    sidebarCollapsed: false,
    showNotifications: true,
    compactMode: false
  });

  const handleClearDatabase = async (table: string) => {
    if (!confirm(`Are you sure you want to clear all ${table} data? This action cannot be undone.`)) {
      return;
    }
    
    setClearing(table);
    
    try {
      const response = await request({
        url: '/admin/clear-database',
        method: 'POST',
        data: { type: table }
      });
      
      if (response.data.success) {
        toast.success(`Successfully cleared ${table} data`);
      } else {
        toast.error(`Failed to clear ${table} data`);
      }
    } catch (error) {
      toast.error(`Failed to clear ${table} data: ${error.message}`);
    } finally {
      setClearing(null);
    }
  }

  const [saved, setSaved] = useState(false);
  const [clearing, setClearing] = useState<string | null>(null);

  const handleSettingChange = (key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    try {
      // Save to backend first
      const response = await request({
        url: '/api/settings',
        method: 'POST',
        data: { settings }
      });

      if (response.data.success) {
        // Also save to localStorage as backup
        localStorage.setItem('panelSettings', JSON.stringify(settings));
        setSaved(true);
        toast.success('Settings saved successfully');
        setTimeout(() => setSaved(false), 2000);
      } else {
        throw new Error('Failed to save settings to server');
      }
    } catch (error) {
      console.error('Failed to save settings:', error);
      // Fallback to localStorage only
      localStorage.setItem('panelSettings', JSON.stringify(settings));
      setSaved(true);
      toast.warning('Settings saved locally only');
      setTimeout(() => setSaved(false), 2000);
    }
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

  // Load settings from backend first, then localStorage
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const response = await request({
          url: '/api/settings',
          method: 'GET'
        });

        if (response.data.success && response.data.settings) {
          setSettings(response.data.settings);
        } else {
          // Fallback to localStorage
          const savedSettings = localStorage.getItem('panelSettings');
          if (savedSettings) {
            setSettings(JSON.parse(savedSettings));
          }
        }
      } catch (error) {
        console.error('Failed to load settings from server:', error);
        // Fallback to localStorage
        const savedSettings = localStorage.getItem('panelSettings');
        if (savedSettings) {
          setSettings(JSON.parse(savedSettings));
        }
      }
    };

    loadSettings();
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
                { value: 'light' as ThemeMode, label: 'Light', icon: '☀️' },
                { value: 'dark' as ThemeMode, label: 'Dark', icon: '🌙' },
                { value: 'system' as ThemeMode, label: 'System', icon: '💻' }
              ].map((theme) => (
                <button
                  key={theme.value}
                  onClick={() => {
                    setMode(theme.value);
                    handleSettingChange('theme', theme.value);
                  }}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    mode === theme.value
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
          
          <div className="hacker-teams-section">
            <label className="block text-sm font-medium text-black dark:text-white mb-4 hacker-teams-title">
              🔥 Advanced Hacker Teams
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 hacker-teams-grid">
              
              {/* Glass Morphism Team */}
              <button
                onClick={() => {
                  setMode('hacker');
                  setColorScheme('neon');
                  handleSettingChange('theme', 'hacker');
                }}
                className={`group relative p-6 rounded-2xl border-2 transition-all duration-500 overflow-hidden ${
                  mode === 'hacker' && colorScheme === 'neon'
                    ? 'border-cyan-400 shadow-2xl shadow-cyan-400/25'
                    : 'border-gray-300/30 hover:border-cyan-400/50'
                }`}
                style={{
                  background: colorScheme === 'glass' 
                    ? 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)'
                    : 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
                  backdropFilter: 'blur(20px)',
                  WebkitBackdropFilter: 'blur(20px)'
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-400/10 to-blue-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-3">
                    <FiEye className="w-8 h-8 text-cyan-400" />
                    <div className="w-3 h-3 bg-cyan-400 rounded-full animate-pulse"></div>
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">Glass Morphism</h3>
                  <p className="text-sm text-gray-300 mb-3">Transparent blur effects with modern aesthetics</p>
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-1 bg-cyan-400/20 text-cyan-300 text-xs rounded-full">Modern</span>
                    <span className="px-2 py-1 bg-blue-400/20 text-blue-300 text-xs rounded-full">Elegant</span>
                  </div>
                </div>
                {colorScheme === 'glass' && (
                  <div className="absolute top-2 right-2">
                    <FiCheck className="w-5 h-5 text-cyan-400" />
                  </div>
                )}
              </button>

              {/* Matrix Digital Rain Team */}
              <button
                onClick={() => {
                  setColorScheme('matrix');
                  handleSettingChange('theme', 'matrix');
                }}
                className={`group relative p-6 rounded-2xl border-2 transition-all duration-500 overflow-hidden ${
                  colorScheme === 'matrix'
                    ? 'border-green-400 shadow-2xl shadow-green-400/25'
                    : 'border-gray-300/30 hover:border-green-400/50'
                }`}
                style={{
                  background: colorScheme === 'matrix'
                    ? 'linear-gradient(135deg, #001100 0%, #003300 50%, #000000 100%)'
                    : 'linear-gradient(135deg, #001100 0%, #002200 100%)'
                }}
              >
                <div className="absolute inset-0 opacity-20">
                  <div className="matrix-rain"></div>
                </div>
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-3">
                    <FiTerminal className="w-8 h-8 text-green-400" />
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-ping"></div>
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-ping" style={{animationDelay: '0.2s'}}></div>
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-ping" style={{animationDelay: '0.4s'}}></div>
                    </div>
                  </div>
                  <h3 className="text-lg font-bold text-green-400 mb-2 font-mono">MATRIX</h3>
                  <p className="text-sm text-green-300 mb-3 font-mono">Digital rain cascade effect</p>
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-1 bg-green-400/20 text-green-300 text-xs rounded-full font-mono">CLASSIC</span>
                    <span className="px-2 py-1 bg-green-400/20 text-green-300 text-xs rounded-full font-mono">ICONIC</span>
                  </div>
                </div>
                {colorScheme === 'matrix' && (
                  <div className="absolute top-2 right-2">
                    <FiCheck className="w-5 h-5 text-green-400" />
                  </div>
                )}
              </button>

              {/* Cyberpunk Neon Team */}
              <button
                onClick={() => {
                  setColorScheme('cyberpunk');
                  handleSettingChange('theme', 'cyberpunk');
                }}
                className={`group relative p-6 rounded-2xl border-2 transition-all duration-500 overflow-hidden ${
                  colorScheme === 'cyberpunk'
                    ? 'border-pink-400 shadow-2xl shadow-pink-400/25'
                    : 'border-gray-300/30 hover:border-pink-400/50'
                }`}
                style={{
                  background: colorScheme === 'cyberpunk'
                    ? 'linear-gradient(135deg, #0a0a0a 0%, #1a0a1a 50%, #2a0a2a 100%)'
                    : 'linear-gradient(135deg, #0a0a0a 0%, #1a0a1a 100%)'
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-pink-500/10 via-purple-500/10 to-cyan-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-3">
                    <FiZap className="w-8 h-8 text-pink-400" />
                    <div className="w-4 h-4 bg-gradient-to-r from-pink-400 to-cyan-400 rounded-full animate-spin"></div>
                  </div>
                  <h3 className="text-lg font-bold bg-gradient-to-r from-pink-400 to-cyan-400 bg-clip-text text-transparent mb-2">CYBERPUNK</h3>
                  <p className="text-sm text-purple-300 mb-3">Neon city vibes with electric aesthetics</p>
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-1 bg-pink-400/20 text-pink-300 text-xs rounded-full">NEON</span>
                    <span className="px-2 py-1 bg-cyan-400/20 text-cyan-300 text-xs rounded-full">ELECTRIC</span>
                  </div>
                </div>
                {colorScheme === 'cyberpunk' && (
                  <div className="absolute top-2 right-2">
                    <FiCheck className="w-5 h-5 text-pink-400" />
                  </div>
                )}
              </button>

              {/* Red Team Penetration Testing */}
              <button
                onClick={() => {
                  setColorScheme('terminal');
                  handleSettingChange('theme', 'redteam');
                }}
                className={`group relative p-6 rounded-2xl border-2 transition-all duration-500 overflow-hidden ${
                  colorScheme === 'terminal'
                    ? 'border-red-400 shadow-2xl shadow-red-400/25'
                    : 'border-gray-300/30 hover:border-red-400/50'
                }`}
                style={{
                  background: colorScheme === 'terminal'
                    ? 'linear-gradient(135deg, #1a0000 0%, #330000 50%, #000000 100%)'
                    : 'linear-gradient(135deg, #1a0000 0%, #220000 100%)'
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 to-orange-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-3">
                    <FiTarget className="w-8 h-8 text-red-400" />
                    <div className="flex space-x-1">
                      <div className="w-2 h-6 bg-red-400 animate-pulse"></div>
                      <div className="w-2 h-4 bg-red-400 animate-pulse" style={{animationDelay: '0.1s'}}></div>
                      <div className="w-2 h-5 bg-red-400 animate-pulse" style={{animationDelay: '0.2s'}}></div>
                    </div>
                  </div>
                  <h3 className="text-lg font-bold text-red-400 mb-2">RED TEAM</h3>
                  <p className="text-sm text-red-300 mb-3">Penetration testing & offensive security</p>
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-1 bg-red-400/20 text-red-300 text-xs rounded-full">PENTEST</span>
                    <span className="px-2 py-1 bg-orange-400/20 text-orange-300 text-xs rounded-full">ATTACK</span>
                  </div>
                </div>
                {colorScheme === 'terminal' && (
                  <div className="absolute top-2 right-2">
                    <FiCheck className="w-5 h-5 text-red-400" />
                  </div>
                )}
              </button>

              {/* Blue Team Defense */}
              <button
                onClick={() => {
                  setColorScheme('blue');
                  handleSettingChange('theme', 'blueteam');
                }}
                className={`group relative p-6 rounded-2xl border-2 transition-all duration-500 overflow-hidden ${
                  colorScheme === 'blue'
                    ? 'border-blue-400 shadow-2xl shadow-blue-400/25'
                    : 'border-gray-300/30 hover:border-blue-400/50'
                }`}
                style={{
                  background: colorScheme === 'blue'
                    ? 'linear-gradient(135deg, #000a1a 0%, #001133 50%, #000000 100%)'
                    : 'linear-gradient(135deg, #000a1a 0%, #001122 100%)'
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-indigo-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-3">
                    <FiShield className="w-8 h-8 text-blue-400" />
                    <div className="relative">
                      <div className="w-4 h-4 bg-blue-400 rounded-full animate-ping"></div>
                      <div className="absolute inset-0 w-4 h-4 bg-blue-400 rounded-full"></div>
                    </div>
                  </div>
                  <h3 className="text-lg font-bold text-blue-400 mb-2">BLUE TEAM</h3>
                  <p className="text-sm text-blue-300 mb-3">Defensive security & monitoring</p>
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-1 bg-blue-400/20 text-blue-300 text-xs rounded-full">DEFENSE</span>
                    <span className="px-2 py-1 bg-indigo-400/20 text-indigo-300 text-xs rounded-full">MONITOR</span>
                  </div>
                </div>
                {colorScheme === 'blue' && (
                  <div className="absolute top-2 right-2">
                    <FiCheck className="w-5 h-5 text-blue-400" />
                  </div>
                )}
              </button>

              {/* Purple Team Hybrid */}
              <button
                onClick={() => handleSettingChange('theme', 'purpleteam')}
                className={`group relative p-6 rounded-2xl border-2 transition-all duration-500 overflow-hidden ${
                  settings.theme === 'purpleteam'
                    ? 'border-purple-400 shadow-2xl shadow-purple-400/25'
                    : 'border-gray-300/30 hover:border-purple-400/50'
                }`}
                style={{
                  background: settings.theme === 'purpleteam'
                    ? 'linear-gradient(135deg, #1a001a 0%, #330033 50%, #000000 100%)'
                    : 'linear-gradient(135deg, #1a001a 0%, #220022 100%)'
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-3">
                    <FiActivity className="w-8 h-8 text-purple-400" />
                    <div className="flex items-center space-x-1">
                      <div className="w-2 h-2 bg-red-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                    </div>
                  </div>
                  <h3 className="text-lg font-bold text-purple-400 mb-2">PURPLE TEAM</h3>
                  <p className="text-sm text-purple-300 mb-3">Hybrid offensive & defensive operations</p>
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-1 bg-purple-400/20 text-purple-300 text-xs rounded-full">HYBRID</span>
                    <span className="px-2 py-1 bg-pink-400/20 text-pink-300 text-xs rounded-full">UNIFIED</span>
                  </div>
                </div>
                {settings.theme === 'purpleteam' && (
                  <div className="absolute top-2 right-2">
                    <FiCheck className="w-5 h-5 text-purple-400" />
                  </div>
                )}
              </button>

              {/* Neural Network AI */}
              <button
                onClick={() => handleSettingChange('theme', 'neural')}
                className={`group relative p-6 rounded-2xl border-2 transition-all duration-500 overflow-hidden ${
                  settings.theme === 'neural'
                    ? 'border-emerald-400 shadow-2xl shadow-emerald-400/25'
                    : 'border-gray-300/30 hover:border-emerald-400/50'
                }`}
                style={{
                  background: settings.theme === 'neural'
                    ? 'linear-gradient(135deg, #001a0a 0%, #003320 50%, #000000 100%)'
                    : 'linear-gradient(135deg, #001a0a 0%, #002210 100%)'
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-3">
                    <FiCpu className="w-8 h-8 text-emerald-400" />
                    <div className="neural-network-animation">
                      <div className="w-3 h-3 bg-emerald-400 rounded-full animate-pulse"></div>
                    </div>
                  </div>
                  <h3 className="text-lg font-bold text-emerald-400 mb-2">NEURAL NET</h3>
                  <p className="text-sm text-emerald-300 mb-3">AI-powered security intelligence</p>
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-1 bg-emerald-400/20 text-emerald-300 text-xs rounded-full">AI</span>
                    <span className="px-2 py-1 bg-teal-400/20 text-teal-300 text-xs rounded-full">SMART</span>
                  </div>
                </div>
                {settings.theme === 'neural' && (
                  <div className="absolute top-2 right-2">
                    <FiCheck className="w-5 h-5 text-emerald-400" />
                  </div>
                )}
              </button>

              {/* Quantum Computing */}
              <button
                onClick={() => handleSettingChange('theme', 'quantum')}
                className={`group relative p-6 rounded-2xl border-2 transition-all duration-500 overflow-hidden ${
                  settings.theme === 'quantum'
                    ? 'border-violet-400 shadow-2xl shadow-violet-400/25'
                    : 'border-gray-300/30 hover:border-violet-400/50'
                }`}
                style={{
                  background: settings.theme === 'quantum'
                    ? 'linear-gradient(135deg, #0a0a1a 0%, #1a1a33 50%, #000000 100%)'
                    : 'linear-gradient(135deg, #0a0a1a 0%, #111122 100%)'
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-violet-500/10 to-indigo-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-3">
                    <FiCode className="w-8 h-8 text-violet-400" />
                    <div className="quantum-particles">
                      <div className="w-2 h-2 bg-violet-400 rounded-full animate-ping"></div>
                      <div className="w-2 h-2 bg-indigo-400 rounded-full animate-ping" style={{animationDelay: '0.3s'}}></div>
                    </div>
                  </div>
                  <h3 className="text-lg font-bold text-violet-400 mb-2">QUANTUM</h3>
                  <p className="text-sm text-violet-300 mb-3">Next-gen quantum computing interface</p>
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-1 bg-violet-400/20 text-violet-300 text-xs rounded-full">QUANTUM</span>
                    <span className="px-2 py-1 bg-indigo-400/20 text-indigo-300 text-xs rounded-full">FUTURE</span>
                  </div>
                </div>
                {settings.theme === 'quantum' && (
                  <div className="absolute top-2 right-2">
                    <FiCheck className="w-5 h-5 text-violet-400" />
                  </div>
                )}
              </button>

              {/* Stealth Mode */}
              <button
                onClick={() => handleSettingChange('theme', 'stealth')}
                className={`group relative p-6 rounded-2xl border-2 transition-all duration-500 overflow-hidden ${
                  settings.theme === 'stealth'
                    ? 'border-gray-400 shadow-2xl shadow-gray-400/25'
                    : 'border-gray-300/30 hover:border-gray-400/50'
                }`}
                style={{
                  background: settings.theme === 'stealth'
                    ? 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, #000000 100%)'
                    : 'linear-gradient(135deg, #0a0a0a 0%, #111111 100%)'
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-gray-500/5 to-gray-700/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-3">
                    <FiWifi className="w-8 h-8 text-gray-400" />
                    <div className="stealth-indicator opacity-50">
                      <div className="w-3 h-1 bg-gray-400 animate-pulse"></div>
                    </div>
                  </div>
                  <h3 className="text-lg font-bold text-gray-400 mb-2">STEALTH</h3>
                  <p className="text-sm text-gray-300 mb-3">Minimal footprint & covert operations</p>
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-1 bg-gray-400/20 text-gray-300 text-xs rounded-full">COVERT</span>
                    <span className="px-2 py-1 bg-gray-500/20 text-gray-400 text-xs rounded-full">MINIMAL</span>
                  </div>
                </div>
                {settings.theme === 'stealth' && (
                  <div className="absolute top-2 right-2">
                    <FiCheck className="w-5 h-5 text-gray-400" />
                  </div>
                )}
              </button>

            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-black dark:text-white mb-3">
              Primary Color
            </label>
            <div className="grid grid-cols-8 gap-3">
              {[
                { color: '#3C50E0', name: 'Blue' },
                { color: '#10B981', name: 'Green' }, 
                { color: '#F59E0B', name: 'Amber' },
                { color: '#EF4444', name: 'Red' },
                { color: '#8B5CF6', name: 'Purple' }, 
                { color: '#06B6D4', name: 'Cyan' },
                { color: '#EC4899', name: 'Pink' }, 
                { color: '#84CC16', name: 'Lime' },
                { color: '#00FF41', name: 'Neon' },
                { color: '#00FFFF', name: 'Terminal' },
                { color: '#FF0040', name: 'Blood' },
                { color: '#FF6600', name: 'Orange' }
              ].map((colorItem) => (
                <button
                  key={colorItem.color}
                  onClick={() => handleSettingChange('primaryColor', colorItem.color)}
                  className={`w-12 h-12 rounded-lg border-2 transition-all ${
                    settings.primaryColor === colorItem.color
                      ? 'border-white shadow-lg scale-110'
                      : 'border-transparent hover:scale-105'
                  }`}
                  style={{ backgroundColor: colorItem.color }}
                  title={colorItem.name}
                >
                  {settings.primaryColor === colorItem.color && (
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

  const renderDatabaseSettings = () => (
    <div className="space-y-6">
      <SettingsSection
        title="Database Management"
        description="Clear database tables and manage stored data"
      >
        <div className="space-y-4">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="flex items-center mb-3">
              <FiAlertTriangle className="w-5 h-5 text-red-500 mr-2" />
              <h4 className="text-sm font-medium text-red-800 dark:text-red-200">
                Danger Zone
              </h4>
            </div>
            <p className="text-sm text-red-700 dark:text-red-300 mb-4">
              These actions will permanently delete data and cannot be undone. Please proceed with caution.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={() => handleClearDatabase('users')}
                disabled={clearing === 'users'}
                className="flex items-center justify-center space-x-2 px-4 py-3 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white rounded-lg transition-colors"
              >
                {clearing === 'users' ? (
                  <FiRefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <FiTrash2 className="w-4 h-4" />
                )}
                <span>Clear All Users</span>
              </button>
              
              <button
                onClick={() => handleClearDatabase('clients')}
                disabled={clearing === 'clients'}
                className="flex items-center justify-center space-x-2 px-4 py-3 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white rounded-lg transition-colors"
              >
                {clearing === 'clients' ? (
                  <FiRefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <FiTrash2 className="w-4 h-4" />
                )}
                <span>Clear All Clients</span>
              </button>
              
              <button
                onClick={() => handleClearDatabase('tasks')}
                disabled={clearing === 'tasks'}
                className="flex items-center justify-center space-x-2 px-4 py-3 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white rounded-lg transition-colors"
              >
                {clearing === 'tasks' ? (
                  <FiRefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <FiTrash2 className="w-4 h-4" />
                )}
                <span>Clear All Tasks</span>
              </button>
              
              <button
                onClick={() => handleClearDatabase('all')}
                disabled={clearing === 'all'}
                className="flex items-center justify-center space-x-2 px-4 py-3 bg-red-800 hover:bg-red-900 disabled:bg-red-600 text-white rounded-lg transition-colors"
              >
                {clearing === 'all' ? (
                  <FiRefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <FiDatabase className="w-4 h-4" />
                )}
                <span>Clear All Data</span>
              </button>
            </div>
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
      case 'database':
        return renderDatabaseSettings();
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