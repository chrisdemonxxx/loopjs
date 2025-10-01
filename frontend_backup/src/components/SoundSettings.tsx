import { useState, useEffect } from "react";
import { FiVolume2, FiVolumeX, FiSettings, FiSave, FiRotateCcw, FiPlay, FiPause } from "react-icons/fi";
import { useTheme } from "../contexts/ThemeContext";
import { soundService } from "../services/soundService";
import { toastService } from "../services/toastService";

interface SoundSettings {
  enabled: boolean;
  volume: number;
  connectionSounds: boolean;
  disconnectionSounds: boolean;
  errorSounds: boolean;
  customSounds: boolean;
  toastSounds: boolean;
}

export default function SoundSettings() {
  const { mode, setMode } = useTheme();
  const [settings, setSettings] = useState<SoundSettings>({
    enabled: true,
    volume: 70,
    connectionSounds: true,
    disconnectionSounds: true,
    errorSounds: true,
    customSounds: true,
    toastSounds: true,
  });
  const [isTestingSound, setIsTestingSound] = useState<string | null>(null);

  // Load settings from localStorage on component mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('soundSettings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setSettings(parsed);
        // Apply volume to sound service
        soundService.setVolume(parsed.volume / 100);
      } catch (error) {
        console.error('Failed to parse sound settings:', error);
      }
    }
  }, []);

  // Save settings to localStorage whenever settings change
  useEffect(() => {
    localStorage.setItem('soundSettings', JSON.stringify(settings));
    soundService.setVolume(settings.volume / 100);
  }, [settings]);

  const handleSettingChange = (key: keyof SoundSettings, value: boolean | number) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const testSound = async (soundType: string) => {
    if (isTestingSound) return;
    
    setIsTestingSound(soundType);
    try {
      switch (soundType) {
        case 'connection':
          await soundService.playConnectionSound(mode);
          break;
        case 'disconnection':
          await soundService.playDisconnectionSound(mode);
          break;
        case 'error':
          await soundService.playErrorSound(mode);
          break;
        case 'custom':
          await soundService.playCustomSound(mode, 'test');
          break;
        case 'toast':
          toastService.info('Test notification sound', { soundType: 'info' });
          break;
      }
    } catch (error) {
      console.error('Failed to play test sound:', error);
    } finally {
      setTimeout(() => setIsTestingSound(null), 1000);
    }
  };

  const resetToDefaults = () => {
    const defaultSettings: SoundSettings = {
      enabled: true,
      volume: 70,
      connectionSounds: true,
      disconnectionSounds: true,
      errorSounds: true,
      customSounds: true,
      toastSounds: true,
    };
    setSettings(defaultSettings);
    toastService.success('Settings reset to defaults', { soundType: 'info' });
  };

  const saveSettings = () => {
    localStorage.setItem('soundSettings', JSON.stringify(settings));
    toastService.success('Sound settings saved successfully', { soundType: 'info' });
  };

  const themeOptions = [
    { value: 'hacker', label: 'Classic Hacker Terminal', color: 'green' },
    { value: 'matrix', label: 'Matrix Digital Rain', color: 'green' },
    { value: 'cyberpunk', label: 'Cyberpunk 2077', color: 'cyan' },
    { value: 'redteam', label: 'Red Team Operations', color: 'red' },
    { value: 'neon-city', label: 'Neon City', color: 'cyan' },
    { value: 'ghost-protocol', label: 'Ghost Protocol', color: 'gray' },
    { value: 'quantum', label: 'Quantum Realm', color: 'teal' },
    { value: 'neural-net', label: 'Neural Network', color: 'pink' },
    { value: 'dark-web', label: 'Dark Web', color: 'red' },
    { value: 'hologram', label: 'Holographic Display', color: 'blue' },
  ];

  return (
    <div className="bg-gray-900/50 backdrop-blur-xl border border-gray-700 rounded-2xl p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-white flex items-center">
          <FiSettings className="w-6 h-6 mr-2 text-blue-400" />
          Sound & Theme Settings
        </h3>
        <div className="flex space-x-2">
          <button
            onClick={resetToDefaults}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors duration-200 flex items-center text-sm"
          >
            <FiRotateCcw className="w-4 h-4 mr-2" />
            Reset
          </button>
          <button
            onClick={saveSettings}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors duration-200 flex items-center text-sm"
          >
            <FiSave className="w-4 h-4 mr-2" />
            Save
          </button>
        </div>
      </div>

      {/* Theme Selection */}
      <div className="space-y-3">
        <h4 className="text-lg font-semibold text-white">Theme Selection</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {themeOptions.map((theme) => (
            <button
              key={theme.value}
              onClick={() => setMode(theme.value as any)}
              className={`p-3 rounded-lg border-2 transition-all duration-200 text-left ${
                mode === theme.value
                  ? `border-${theme.color}-400 bg-${theme.color}-400/10`
                  : 'border-gray-600 bg-gray-800/50 hover:border-gray-500'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-white font-medium">{theme.label}</span>
                {mode === theme.value && (
                  <div className={`w-3 h-3 bg-${theme.color}-400 rounded-full`}></div>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Master Sound Control */}
      <div className="space-y-3">
        <h4 className="text-lg font-semibold text-white">Master Sound Control</h4>
        <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg">
          <div className="flex items-center">
            {settings.enabled ? (
              <FiVolume2 className="w-5 h-5 text-green-400 mr-3" />
            ) : (
              <FiVolumeX className="w-5 h-5 text-red-400 mr-3" />
            )}
            <span className="text-white font-medium">Enable Sound Notifications</span>
          </div>
          <button
            onClick={() => handleSettingChange('enabled', !settings.enabled)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              settings.enabled ? 'bg-green-600' : 'bg-gray-600'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                settings.enabled ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {/* Volume Control */}
        <div className="p-4 bg-gray-800/50 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <span className="text-white font-medium">Volume Level</span>
            <span className="text-gray-400 text-sm">{settings.volume}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={settings.volume}
            onChange={(e) => handleSettingChange('volume', parseInt(e.target.value))}
            disabled={!settings.enabled}
            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
          />
        </div>
      </div>

      {/* Individual Sound Settings */}
      <div className="space-y-3">
        <h4 className="text-lg font-semibold text-white">Sound Categories</h4>
        <div className="space-y-3">
          {[
            { key: 'connectionSounds', label: 'Connection Sounds', testType: 'connection' },
            { key: 'disconnectionSounds', label: 'Disconnection Sounds', testType: 'disconnection' },
            { key: 'errorSounds', label: 'Error Sounds', testType: 'error' },
            { key: 'customSounds', label: 'Custom Event Sounds', testType: 'custom' },
            { key: 'toastSounds', label: 'Toast Notification Sounds', testType: 'toast' },
          ].map((item) => (
            <div key={item.key} className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg">
              <span className="text-white font-medium">{item.label}</span>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => testSound(item.testType)}
                  disabled={!settings.enabled || !settings[item.key as keyof SoundSettings] || isTestingSound !== null}
                  className="px-3 py-1 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded text-sm transition-colors duration-200 flex items-center"
                >
                  {isTestingSound === item.testType ? (
                    <>
                      <FiPause className="w-3 h-3 mr-1" />
                      Playing...
                    </>
                  ) : (
                    <>
                      <FiPlay className="w-3 h-3 mr-1" />
                      Test
                    </>
                  )}
                </button>
                <button
                  onClick={() => handleSettingChange(item.key as keyof SoundSettings, !settings[item.key as keyof SoundSettings])}
                  disabled={!settings.enabled}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings[item.key as keyof SoundSettings] && settings.enabled ? 'bg-green-600' : 'bg-gray-600'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings[item.key as keyof SoundSettings] && settings.enabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Current Theme Info */}
      <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-600">
        <h4 className="text-lg font-semibold text-white mb-2">Current Theme</h4>
        <div className="flex items-center justify-between">
          <span className="text-gray-300">
            {themeOptions.find(t => t.value === mode)?.label || 'Unknown Theme'}
          </span>
          <div className={`w-4 h-4 bg-${themeOptions.find(t => t.value === mode)?.color || 'gray'}-400 rounded-full`}></div>
        </div>
        <p className="text-gray-400 text-sm mt-2">
          Theme affects login page design and sound characteristics
        </p>
      </div>

      <style jsx="true">{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          box-shadow: 0 0 10px rgba(59, 130, 246, 0.5);
        }
        .slider::-moz-range-thumb {
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          border: none;
          box-shadow: 0 0 10px rgba(59, 130, 246, 0.5);
        }
        .slider:disabled::-webkit-slider-thumb {
          background: #6b7280;
          box-shadow: none;
        }
        .slider:disabled::-moz-range-thumb {
          background: #6b7280;
          box-shadow: none;
        }
      `}</style>
    </div>
  );
}