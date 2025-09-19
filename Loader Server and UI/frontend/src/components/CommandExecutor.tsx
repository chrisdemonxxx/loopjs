import React, { useState, useEffect, useRef } from 'react';
import { FiTerminal, FiX, FiSend, FiClock, FiCheck, FiAlertCircle } from 'react-icons/fi';

interface CommandExecutorProps {
  agent: Agent;
  isOpen: boolean;
  onClose: () => void;
}

interface CommandHistory {
  id: string;
  command: string;
  timestamp: Date;
  status: 'pending' | 'running' | 'completed' | 'failed';
  output?: string;
  duration?: number;
}

interface PlatformCommand {
  name: string;
  command: string;
  description: string;
  category: 'system' | 'network' | 'file' | 'process' | 'security';
  platforms: ('windows' | 'mac' | 'android')[];
}

const PLATFORM_COMMANDS: PlatformCommand[] = [
  // System Commands
  {
    name: 'System Info',
    command: 'systeminfo',
    description: 'Get detailed system information',
    category: 'system',
    platforms: ['windows']
  },
  {
    name: 'System Info (Mac)',
    command: 'system_profiler SPSoftwareDataType',
    description: 'Get system information on macOS',
    category: 'system',
    platforms: ['mac']
  },
  {
    name: 'Device Info (Android)',
    command: 'getprop',
    description: 'Get device properties on Android',
    category: 'system',
    platforms: ['android']
  },
  {
    name: 'Running Processes',
    command: 'tasklist',
    description: 'List all running processes',
    category: 'process',
    platforms: ['windows']
  },
  {
    name: 'Running Processes (Mac)',
    command: 'ps aux',
    description: 'List all running processes on macOS',
    category: 'process',
    platforms: ['mac']
  },
  {
    name: 'Running Processes (Android)',
    command: 'ps',
    description: 'List running processes on Android',
    category: 'process',
    platforms: ['android']
  },
  // Network Commands
  {
    name: 'Network Config',
    command: 'ipconfig /all',
    description: 'Show network configuration',
    category: 'network',
    platforms: ['windows']
  },
  {
    name: 'Network Config (Mac)',
    command: 'ifconfig',
    description: 'Show network interfaces on macOS',
    category: 'network',
    platforms: ['mac']
  },
  {
    name: 'Network Config (Android)',
    command: 'ip addr show',
    description: 'Show network configuration on Android',
    category: 'network',
    platforms: ['android']
  },
  // File Commands
  {
    name: 'List Directory',
    command: 'dir',
    description: 'List directory contents',
    category: 'file',
    platforms: ['windows']
  },
  {
    name: 'List Directory (Unix)',
    command: 'ls -la',
    description: 'List directory contents with details',
    category: 'file',
    platforms: ['mac', 'android']
  },
  {
    name: 'Current Directory',
    command: 'pwd',
    description: 'Show current working directory',
    category: 'file',
    platforms: ['mac', 'android']
  },
  {
    name: 'Current Directory (Windows)',
    command: 'cd',
    description: 'Show current directory',
    category: 'file',
    platforms: ['windows']
  }
];

const CommandExecutor: React.FC<CommandExecutorProps> = ({ agent, isOpen, onClose }) => {
  const { addNotification } = useNotification();
  const [command, setCommand] = useState('');
  const [commandHistory, setCommandHistory] = useState<CommandHistory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isExecuting, setIsExecuting] = useState(false);
  const terminalRef = useRef<HTMLDivElement>(null);

  // Filter commands based on agent platform
  const availableCommands = PLATFORM_COMMANDS.filter(cmd => 
    cmd.platforms.includes(agent.platform)
  );

  const filteredCommands = selectedCategory === 'all' 
    ? availableCommands 
    : availableCommands.filter(cmd => cmd.category === selectedCategory);

  const categories = ['all', ...Array.from(new Set(availableCommands.map(cmd => cmd.category)))];

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [commandHistory]);

  const executeCommand = async (cmdToExecute: string = command) => {
    if (!cmdToExecute.trim()) {
      addNotification('Please enter a command', 'warning');
      return;
    }

    const commandId = Date.now().toString();
    const newCommand: CommandHistory = {
      id: commandId,
      command: cmdToExecute,
      timestamp: new Date(),
      status: 'pending'
    };

    setCommandHistory(prev => [...prev, newCommand]);
    setIsExecuting(true);
    setCommand('');

    try {
      // Update command status to running
      setCommandHistory(prev => 
        prev.map(cmd => 
          cmd.id === commandId 
            ? { ...cmd, status: 'running' }
            : cmd
        )
      );

      const startTime = Date.now();
      const response = await agentService.sendCommand(agent.id, {
        command: cmdToExecute,
        params: {}
      });

      const duration = Date.now() - startTime;

      // Simulate command execution result (in real implementation, this would come from WebSocket)
      setTimeout(() => {
        setCommandHistory(prev => 
          prev.map(cmd => 
            cmd.id === commandId 
              ? { 
                  ...cmd, 
                  status: 'completed',
                  output: `Command executed successfully on ${agent.platform} agent.\nCommand ID: ${response.data.commandId}\nStatus: ${response.data.status}`,
                  duration
                }
              : cmd
          )
        );
        setIsExecuting(false);
      }, 1000 + Math.random() * 2000); // Simulate variable execution time

      addNotification(`Command sent to ${agent.name}`, 'success');
    } catch (error) {
      const duration = Date.now() - Date.now();
      setCommandHistory(prev => 
        prev.map(cmd => 
          cmd.id === commandId 
            ? { 
                ...cmd, 
                status: 'failed',
                output: `Error executing command: ${error instanceof Error ? error.message : 'Unknown error'}`,
                duration
              }
            : cmd
        )
      );
      setIsExecuting(false);
      addNotification('Failed to execute command', 'error');
    }
  };

  const clearHistory = () => {
    setCommandHistory([]);
  };

  const copyOutput = (output: string) => {
    navigator.clipboard.writeText(output);
    addNotification('Output copied to clipboard', 'success');
  };

  const downloadHistory = () => {
    const historyText = commandHistory.map(cmd => 
      `[${cmd.timestamp.toLocaleString()}] ${cmd.command}\n${cmd.output || 'No output'}\n${'='.repeat(50)}\n`
    ).join('\n');
    
    const blob = new Blob([historyText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `command-history-${agent.name}-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getPlatformIcon = () => {
    switch (agent.platform) {
      case 'windows':
        return <FiMonitor className="w-4 h-4" />;
      case 'mac':
        return <FiMonitor className="w-4 h-4" />;
      case 'android':
        return <FiSmartphone className="w-4 h-4" />;
      default:
        return <FiCommand className="w-4 h-4" />;
    }
  };

  const getStatusIcon = (status: CommandHistory['status']) => {
    switch (status) {
      case 'pending':
        return <FiClock className="w-4 h-4 text-warning" />;
      case 'running':
        return <FiLoader className="w-4 h-4 text-primary animate-spin" />;
      case 'completed':
        return <FiCheck className="w-4 h-4 text-success" />;
      case 'failed':
        return <FiX className="w-4 h-4 text-danger" />;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-boxdark rounded-lg shadow-xl w-full max-w-6xl h-5/6 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-stroke dark:border-strokedark">
          <div className="flex items-center space-x-3">
            <FiTerminal className="w-6 h-6 text-primary" />
            <div>
              <h2 className="text-lg font-semibold text-black dark:text-white">
                Command Executor
              </h2>
              <div className="flex items-center space-x-2 text-sm text-bodydark2">
                {getPlatformIcon()}
                <span>{agent.name} ({agent.platform})</span>
                <span className={`px-2 py-1 rounded text-xs ${
                  agent.status === 'Online' 
                    ? 'bg-success/10 text-success' 
                    : 'bg-danger/10 text-danger'
                }`}>
                  {agent.status}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={downloadHistory}
              className="p-2 text-bodydark2 hover:text-primary transition-colors"
              title="Download History"
            >
              <FiDownload className="w-4 h-4" />
            </button>
            <button
              onClick={clearHistory}
              className="p-2 text-bodydark2 hover:text-danger transition-colors"
              title="Clear History"
            >
              <FiTrash2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-bodydark2 hover:text-danger transition-colors"
            >
              <FiX className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Command Sidebar */}
          <div className="w-80 border-r border-stroke dark:border-strokedark p-4 overflow-y-auto">
            <h3 className="text-sm font-semibold text-black dark:text-white mb-3">
              Quick Commands
            </h3>
            
            {/* Category Filter */}
            <div className="mb-4">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full p-2 border border-stroke dark:border-strokedark rounded bg-white dark:bg-boxdark text-black dark:text-white text-sm"
              >
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            {/* Command List */}
            <div className="space-y-2">
              {filteredCommands.map((cmd, index) => (
                <div
                  key={index}
                  className="p-3 border border-stroke dark:border-strokedark rounded hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors"
                  onClick={() => setCommand(cmd.command)}
                >
                  <div className="font-medium text-sm text-black dark:text-white mb-1">
                    {cmd.name}
                  </div>
                  <div className="text-xs text-bodydark2 mb-2">
                    {cmd.description}
                  </div>
                  <code className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                    {cmd.command}
                  </code>
                </div>
              ))}
            </div>
          </div>

          {/* Terminal Area */}
          <div className="flex-1 flex flex-col">
            {/* Command History */}
            <div 
              ref={terminalRef}
              className="flex-1 p-4 bg-gray-900 text-green-400 font-mono text-sm overflow-y-auto"
            >
              {commandHistory.length === 0 ? (
                <div className="text-gray-500 text-center py-8">
                  No commands executed yet. Enter a command below or select from the sidebar.
                </div>
              ) : (
                commandHistory.map((cmd) => (
                  <div key={cmd.id} className="mb-4">
                    <div className="flex items-center space-x-2 mb-1">
                      {getStatusIcon(cmd.status)}
                      <span className="text-blue-400">
                        [{cmd.timestamp.toLocaleTimeString()}]
                      </span>
                      <span className="text-yellow-400">$</span>
                      <span>{cmd.command}</span>
                      {cmd.duration && (
                        <span className="text-gray-500 text-xs">
                          ({cmd.duration}ms)
                        </span>
                      )}
                      {cmd.output && (
                        <button
                          onClick={() => copyOutput(cmd.output!)}
                          className="ml-auto p-1 text-gray-500 hover:text-white transition-colors"
                          title="Copy Output"
                        >
                          <FiCopy className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                    {cmd.output && (
                      <div className="ml-6 text-gray-300 whitespace-pre-wrap">
                        {cmd.output}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Command Input */}
            <div className="p-4 border-t border-stroke dark:border-strokedark">
              <div className="flex space-x-2">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={command}
                    onChange={(e) => setCommand(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && !isExecuting && executeCommand()}
                    placeholder={`Enter command for ${agent.platform} agent...`}
                    className="w-full p-3 border border-stroke dark:border-strokedark rounded bg-white dark:bg-boxdark text-black dark:text-white font-mono"
                    disabled={isExecuting}
                  />
                </div>
                <button
                  onClick={() => executeCommand()}
                  disabled={isExecuting || !command.trim()}
                  className="px-6 py-3 bg-primary text-white rounded hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 transition-colors"
                >
                  {isExecuting ? (
                    <>
                      <FiSquare className="w-4 h-4" />
                      <span>Running...</span>
                    </>
                  ) : (
                    <>
                      <FiPlay className="w-4 h-4" />
                      <span>Execute</span>
                    </>
                  )}
                </button>
              </div>
              <div className="mt-2 text-xs text-bodydark2">
                Press Enter to execute • Agent status: {agent.status}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommandExecutor;