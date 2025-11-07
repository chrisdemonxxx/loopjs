import React, { useMemo, useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import SoundSettings from './SoundSettings';
import toast from 'react-hot-toast';
import request from '../axios';

interface SettingsPageProps {
  activeTab?: 'general' | 'appearance' | 'notifications';
}

interface GeneralSettings {
  siteName: string;
  adminEmail: string;
  autoRefresh: boolean;
  refreshInterval: number;
}

const AVAILABLE_THEMES = [
  { value: 'light', label: 'Light Premium', description: 'Bright UI with soft shadows' },
  { value: 'dark', label: 'Dark Premium', description: 'Accessible low-light experience' },
  { value: 'hacker-elite', label: 'Hacker Elite', description: 'Matrix-inspired terminal theme' },
  { value: 'premium-cyber', label: 'Premium Cyber', description: 'Futuristic gradients and glow' }
];

const SettingsPage: React.FC<SettingsPageProps> = ({ activeTab = 'general' }) => {
  const { mode, setMode } = useTheme();
  const [tab, setTab] = useState<typeof activeTab>(activeTab);
  const [isSaving, setIsSaving] = useState(false);
  const [settings, setSettings] = useState<GeneralSettings>({
    siteName: 'LoopJS Command & Control',
    adminEmail: 'admin@loopjs.com',
    autoRefresh: true,
    refreshInterval: 30
  });

  const themeDescription = useMemo(
    () => AVAILABLE_THEMES.find((theme) => theme.value === mode)?.description ?? '',
    [mode]
  );

  const handleGeneralChange = <K extends keyof GeneralSettings>(key: K, value: GeneralSettings[K]) => {
    setSettings((previous) => ({ ...previous, [key]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await request({
        url: '/settings',
        method: 'POST',
        data: {
          ...settings,
          theme: mode
        }
      });
      toast.success('Settings saved successfully');
    } catch (error) {
      console.error(error);
      toast.error('Unable to save settings right now');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-boxdark rounded-lg border border-stroke dark:border-strokedark p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-black dark:text-white mb-1">Control Panel Settings</h1>
          <p className="text-sm text-bodydark2">
            Fine-tune the operator experience and manage workspace defaults.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSettings((previous) => ({ ...previous, autoRefresh: !previous.autoRefresh }))}
            className="px-4 py-2 rounded-lg border border-stroke dark:border-strokedark text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            {settings.autoRefresh ? 'Disable Auto Refresh' : 'Enable Auto Refresh'}
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            {isSaving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-boxdark rounded-lg border border-stroke dark:border-strokedark">
        <div className="flex border-b border-stroke dark:border-strokedark text-sm font-medium">
          {[
            { id: 'general', label: 'General' },
            { id: 'appearance', label: 'Appearance' },
            { id: 'notifications', label: 'Notifications & Audio' }
          ].map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setTab(id as typeof tab)}
              className={`flex-1 px-4 py-3 text-center transition-colors ${
                tab === id ? 'text-primary border-b-2 border-primary' : 'text-bodydark2 hover:text-primary'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="p-6 space-y-6">
          {tab === 'general' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-black dark:text-white">Site Name</label>
                <input
                  type="text"
                  value={settings.siteName}
                  onChange={(event) => handleGeneralChange('siteName', event.target.value)}
                  className="w-full px-3 py-2 border border-stroke dark:border-strokedark rounded-lg bg-white dark:bg-form-input text-black dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-black dark:text-white">Administrator Email</label>
                <input
                  type="email"
                  value={settings.adminEmail}
                  onChange={(event) => handleGeneralChange('adminEmail', event.target.value)}
                  className="w-full px-3 py-2 border border-stroke dark:border-strokedark rounded-lg bg-white dark:bg-form-input text-black dark:text-white"
                />
              </div>
              <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                <div>
                  <p className="text-sm font-medium text-black dark:text-white">Auto Refresh</p>
                  <p className="text-xs text-bodydark2">
                    Refresh client and task data in the background every {settings.refreshInterval} seconds.
                  </p>
                </div>
                <input
                  type="number"
                  min={10}
                  max={300}
                  className="w-24 px-2 py-1 border border-stroke dark:border-strokedark rounded bg-white dark:bg-form-input text-black dark:text-white"
                  value={settings.refreshInterval}
                  onChange={(event) => handleGeneralChange('refreshInterval', Number(event.target.value))}
                  disabled={!settings.autoRefresh}
                />
              </div>
            </div>
          )}

          {tab === 'appearance' && (
            <div className="space-y-4">
              <p className="text-sm text-bodydark2">
                Choose a theme preset to instantly update typography, colors, and effects across the operator
                interface.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {AVAILABLE_THEMES.map((theme) => (
                  <button
                    key={theme.value}
                    onClick={() => setMode(theme.value as typeof mode)}
                    className={`border rounded-lg p-4 text-left transition-colors ${
                      mode === theme.value
                        ? 'border-primary bg-primary/10'
                        : 'border-stroke dark:border-strokedark hover:border-primary/60'
                    }`}
                  >
                    <p className="text-sm font-semibold text-black dark:text-white">{theme.label}</p>
                    <p className="text-xs text-bodydark2 mt-1">{theme.description}</p>
                  </button>
                ))}
              </div>
              <div className="text-xs text-bodydark2">
                Active theme: <span className="font-semibold text-black dark:text-white">{mode}</span> —{' '}
                {themeDescription}
              </div>
            </div>
          )}

          {tab === 'notifications' && (
            <div className="space-y-4">
              <p className="text-sm text-bodydark2">
                Control toast behaviour, audio cues, and escalation thresholds for operator notifications.
              </p>
              <SoundSettings />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
