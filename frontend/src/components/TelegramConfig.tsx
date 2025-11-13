import React, { useState, useEffect } from 'react';
import axios from 'axios';

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

const TelegramConfigComponent: React.FC = () => {
  const [config, setConfig] = useState<TelegramConfig>({
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
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<'success' | 'error' | ''>('');

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');
      const response = await axios.get('/api/telegram/config', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.status === 'success') {
        setConfig(response.data.data);
        setMessage('Configuration loaded successfully');
        setStatus('success');
      }
    } catch (error: any) {
      setMessage(error.response?.data?.message || 'Failed to load configuration');
      setStatus('error');
    } finally {
      setLoading(false);
    }
  };

  const saveConfig = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');
      const response = await axios.post('/api/telegram/config', config, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.status === 'success') {
        setMessage('Configuration saved successfully');
        setStatus('success');
      }
    } catch (error: any) {
      setMessage(error.response?.data?.message || 'Failed to save configuration');
      setStatus('error');
    } finally {
      setLoading(false);
    }
  };

  const testBot = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');
      const response = await axios.post('/api/telegram/test', {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.status === 'success') {
        setMessage('Telegram bot test successful!');
        setStatus('success');
      }
    } catch (error: any) {
      setMessage(error.response?.data?.message || 'Telegram bot test failed');
      setStatus('error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6 text-white">
      <h2 className="text-xl font-bold mb-4">Telegram Configuration</h2>
      
      {message && (
        <div className={`mb-4 p-3 rounded ${
          status === 'success' ? 'bg-green-600' : 'bg-red-600'
        }`}>
          {message}
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Bot Token</label>
          <input
            type="password"
            value={config.botToken}
            onChange={(e) => setConfig({ ...config, botToken: e.target.value })}
            className="w-full p-2 bg-gray-700 rounded border border-gray-600 text-white"
            placeholder="Enter your Telegram bot token"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Chat ID</label>
          <input
            type="text"
            value={config.chatId}
            onChange={(e) => setConfig({ ...config, chatId: e.target.value })}
            className="w-full p-2 bg-gray-700 rounded border border-gray-600 text-white"
            placeholder="Enter your Telegram chat ID"
          />
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="enabled"
            checked={config.enabled}
            onChange={(e) => setConfig({ ...config, enabled: e.target.checked })}
            className="mr-2"
          />
          <label htmlFor="enabled" className="text-sm font-medium">
            Enable Telegram Notifications
          </label>
        </div>

        <div>
          <h3 className="text-lg font-medium mb-2">Notification Settings</h3>
          <div className="space-y-2">
            {Object.entries(config.notifications).map(([key, value]) => (
              <div key={key} className="flex items-center">
                <input
                  type="checkbox"
                  id={key}
                  checked={value}
                  onChange={(e) => setConfig({
                    ...config,
                    notifications: {
                      ...config.notifications,
                      [key]: e.target.checked
                    }
                  })}
                  className="mr-2"
                />
                <label htmlFor={key} className="text-sm">
                  {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                </label>
              </div>
            ))}
          </div>
        </div>

        <div className="flex space-x-4">
          <button
            onClick={saveConfig}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Save Configuration'}
          </button>
          
          <button
            onClick={testBot}
            disabled={loading || !config.botToken}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded disabled:opacity-50"
          >
            {loading ? 'Testing...' : 'Test Bot'}
          </button>
          
          <button
            onClick={loadConfig}
            disabled={loading}
            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Reload'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TelegramConfigComponent;