import { useEffect, useState } from 'react';
import { FiSettings, FiVolume2, FiVolumeX, FiRotateCcw, FiSave, FiPlay } from 'react-icons/fi';
import { soundService } from '../services/soundService';
import { toastService } from '../services/toastService';

interface SoundSettingsState {
  enabled: boolean;
  volume: number;
  connection: boolean;
  disconnection: boolean;
  errors: boolean;
  custom: boolean;
}

const DEFAULT_SETTINGS: SoundSettingsState = {
  enabled: true,
  volume: 70,
  connection: true,
  disconnection: true,
  errors: true,
  custom: true
};

const SoundSettings: React.FC = () => {
  const [settings, setSettings] = useState<SoundSettingsState>(DEFAULT_SETTINGS);
  const [testing, setTesting] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('soundSettings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as SoundSettingsState;
        setSettings(parsed);
        soundService.setVolume(parsed.volume / 100);
        soundService.setSoundEnabled(parsed.enabled);
      } catch (error) {
        console.warn('Unable to restore sound settings:', error);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('soundSettings', JSON.stringify(settings));
    soundService.setVolume(settings.volume / 100);
    soundService.setSoundEnabled(settings.enabled);
  }, [settings]);

  const handleToggle = (key: keyof SoundSettingsState) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleVolume = (value: number) => {
    setSettings((prev) => ({ ...prev, volume: value }));
  };

  const testSound = async (type: string) => {
    if (testing || !settings.enabled) return;

    setTesting(type);
    const theme = localStorage.getItem('theme-mode') || 'dark';
    soundService.setTheme(theme);

    try {
      switch (type) {
        case 'connection':
          if (settings.connection) await soundService.playConnectionSound();
          break;
        case 'disconnection':
          if (settings.disconnection) await soundService.playDisconnectionSound();
          break;
        case 'errors':
          if (settings.errors) await soundService.playErrorSound();
          break;
        case 'custom':
          if (settings.custom) await soundService.playCustomSound();
          break;
        default:
          break;
      }
    } catch (error) {
      console.warn('Failed to play test sound:', error);
    } finally {
      setTimeout(() => setTesting(null), 800);
    }
  };

  const reset = () => {
    setSettings(DEFAULT_SETTINGS);
    toastService.info('Sound settings restored to default', { soundType: 'info' });
  };

  const save = () => {
    localStorage.setItem('soundSettings', JSON.stringify(settings));
    toastService.success('Sound settings saved', { soundType: 'success' });
  };

  return (
    <>
      <div className="bg-gray-900/60 border border-gray-700 rounded-2xl p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold text-white flex items-center gap-2">
            <FiSettings className="text-blue-400" />
            Sound Settings
          </h3>
          <div className="flex gap-2">
            <button
              onClick={reset}
              className="px-4 py-2 text-sm rounded-lg bg-gray-700 hover:bg-gray-600 text-white flex items-center gap-2 transition-colors"
            >
              <FiRotateCcw />
              Reset
            </button>
            <button
              onClick={save}
              className="px-4 py-2 text-sm rounded-lg bg-primary hover:bg-primary/90 text-white flex items-center gap-2 transition-colors"
            >
              <FiSave />
              Save
            </button>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between bg-gray-800/50 rounded-lg p-4">
            <div className="flex items-center gap-3">
              {settings.enabled ? (
                <FiVolume2 className="text-green-400" />
              ) : (
                <FiVolumeX className="text-red-400" />
              )}
              <span className="text-white font-medium">Enable Notification Sounds</span>
            </div>
            <button
              onClick={() => handleToggle('enabled')}
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

          <div className="bg-gray-800/50 rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-white font-medium">Volume</span>
              <span className="text-sm text-gray-400">{settings.volume}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={settings.volume}
              onChange={(event) => handleVolume(Number(event.target.value))}
              disabled={!settings.enabled}
              className="w-full h-2 bg-gray-700 rounded-lg cursor-pointer accent-primary slider"
            />
          </div>
        </div>

        <div className="space-y-3">
          {[
            { key: 'connection' as const, label: 'Connection sounds' },
            { key: 'disconnection' as const, label: 'Disconnection sounds' },
            { key: 'errors' as const, label: 'Error alerts' },
            { key: 'custom' as const, label: 'Custom triggers' }
          ].map(({ key, label }) => (
            <div key={key} className="bg-gray-800/50 rounded-lg p-4 flex items-center justify-between">
              <div>
                <p className="text-white font-medium">{label}</p>
                <p className="text-xs text-gray-400">Toggle playback for this category</p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => testSound(key)}
                  disabled={!settings.enabled || !settings[key] || Boolean(testing)}
                  className="px-3 py-1 text-xs rounded bg-blue-600 hover:bg-blue-500 disabled:bg-gray-600 text-white flex items-center gap-2 transition-colors"
                >
                  <FiPlay className="w-3 h-3" />
                  {testing === key ? 'Testing…' : 'Test'}
                </button>
                <button
                  onClick={() => handleToggle(key)}
                  disabled={!settings.enabled}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings[key] && settings.enabled ? 'bg-green-600' : 'bg-gray-600'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings[key] && settings.enabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
      <style>{`
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
        .slider:disabled::-webkit-slider-thumb,
        .slider:disabled::-moz-range-thumb {
          background: #6b7280;
          box-shadow: none;
        }
      `}</style>
    </>
  );
};

export default SoundSettings;
