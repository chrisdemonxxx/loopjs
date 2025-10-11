import React, { useState } from 'react';
import { Agent } from '../types';
import toast from 'react-hot-toast';
import aiService from '../services/aiService';
import CommandOutputTerminal from './CommandOutputTerminal';

interface AdvancedTerminalProps {
  selectedAgent: Agent | null;
  onSelectAgent?: (agent: Agent | null) => void;
  agents: Agent[];
  onCommandSent: (command: any) => void;
  commandHistory: any[];
  setCommandHistory: (history: any[]) => void;
}

interface PowerCommand {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  command: string;
  timeout?: number;
}

const AdvancedTerminal: React.FC<AdvancedTerminalProps> = ({
  selectedAgent,
  onSelectAgent,
  agents,
  onCommandSent,
  commandHistory,
  setCommandHistory
}) => {
  const [isExecuting, setIsExecuting] = useState<string | null>(null);

  const powerCommands: PowerCommand[] = [
    // System Information Commands
    {
      id: 'system-info',
      name: 'System Information',
      description: 'Get comprehensive system details',
      category: 'System',
      icon: '💻',
      command: 'systeminfo',
      timeout: 30
    },
    {
      id: 'computer-info',
      name: 'Computer Information',
      description: 'Get computer system details',
      category: 'System',
      icon: '🖥️',
      command: 'powershell -Command "Get-WmiObject -Class Win32_ComputerSystem | Select-Object Name,Manufacturer,Model,SystemType,TotalPhysicalMemory | Format-Table -AutoSize"',
      timeout: 30
    },
    {
      id: 'memory-info',
      name: 'Memory Information',
      description: 'Show system memory details',
      category: 'System',
      icon: '🧠',
      command: 'powershell -Command "Get-WmiObject -Class Win32_PhysicalMemory | Select-Object Capacity,Speed,Manufacturer,PartNumber | Format-Table -AutoSize"',
      timeout: 30
    },
    {
      id: 'cpu-info',
      name: 'CPU Information',
      description: 'Get detailed CPU information',
      category: 'System',
      icon: '⚙️',
      command: 'wmic cpu get name,numberofcores,numberoflogicalprocessors',
      timeout: 20
    },
    {
      id: 'process-list',
      name: 'Process List',
      description: 'List all running processes',
      category: 'System',
      icon: '📋',
      command: 'tasklist',
      timeout: 20
    },
    {
      id: 'services-status',
      name: 'Services Status',
      description: 'Check Windows services status',
      category: 'System',
      icon: '🔧',
      command: 'sc query',
      timeout: 25
    },
    {
      id: 'system-uptime',
      name: 'System Uptime',
      description: 'Show system uptime and boot time',
      category: 'System',
      icon: '⏰',
      command: 'systeminfo | findstr "System Boot Time"',
      timeout: 15
    },

    // Network Commands
    {
      id: 'network-connections',
      name: 'Network Connections',
      description: 'Show active network connections',
      category: 'Network',
      icon: '🌐',
      command: 'netstat -an',
      timeout: 15
    },
    {
      id: 'arp-table',
      name: 'ARP Table',
      description: 'Display ARP cache table',
      category: 'Network',
      icon: '🔗',
      command: 'arp -a',
      timeout: 10
    },
    {
      id: 'dns-cache',
      name: 'DNS Cache',
      description: 'Show DNS resolver cache',
      category: 'Network',
      icon: '🌍',
      command: 'ipconfig /displaydns',
      timeout: 15
    },
    {
      id: 'network-config',
      name: 'Network Configuration',
      description: 'Show network adapter configuration',
      category: 'Network',
      icon: '📡',
      command: 'ipconfig /all',
      timeout: 20
    },
    {
      id: 'routing-table',
      name: 'Routing Table',
      description: 'Display routing table',
      category: 'Network',
      icon: '🛣️',
      command: 'route print',
      timeout: 15
    },
    {
      id: 'ping-test',
      name: 'Ping Test',
      description: 'Test network connectivity',
      category: 'Network',
      icon: '📶',
      command: 'ping google.com -n 4',
      timeout: 20
    },
    {
      id: 'port-scan',
      name: 'Port Scan',
      description: 'Scan for open ports',
      category: 'Network',
      icon: '🔍',
      command: 'powershell -Command "Test-NetConnection -ComputerName google.com -Port 80"',
      timeout: 30
    },
    {
      id: 'network-info',
      name: 'Network Info',
      description: 'Get detailed network information',
      category: 'Network',
      icon: '📊',
      command: 'powershell -Command "Get-NetIPConfiguration | Format-Table -AutoSize"',
      timeout: 30
    },

    // Storage Commands
    {
      id: 'disk-usage',
      name: 'Disk Usage',
      description: 'Show disk space usage',
      category: 'Storage',
      icon: '💾',
      command: 'wmic logicaldisk get size,freespace,caption',
      timeout: 20
    },
    {
      id: 'directory-listing',
      name: 'Directory Listing',
      description: 'List files in current directory',
      category: 'Storage',
      icon: '📁',
      command: 'dir',
      timeout: 10
    },
    {
      id: 'disk-info',
      name: 'Disk Information',
      description: 'Get detailed disk information',
      category: 'Storage',
      icon: '💿',
      command: 'wmic diskdrive get model,size,interfacetype',
      timeout: 20
    },
    {
      id: 'file-search',
      name: 'File Search',
      description: 'Search for files by name',
      category: 'Storage',
      icon: '🔍',
      command: 'dir /s /b *.txt | findstr /i "test"',
      timeout: 30
    },

    // Security Commands
    {
      id: 'user-accounts',
      name: 'User Accounts',
      description: 'List system user accounts',
      category: 'Security',
      icon: '👤',
      command: 'net user',
      timeout: 15
    },
    {
      id: 'user-groups',
      name: 'User Groups',
      description: 'Show user group memberships',
      category: 'Security',
      icon: '👥',
      command: 'net localgroup',
      timeout: 15
    },
    {
      id: 'registry-query',
      name: 'Registry Query',
      description: 'Query Windows registry',
      category: 'Security',
      icon: '🔐',
      command: 'reg query HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion',
      timeout: 20
    },
    {
      id: 'firewall-status',
      name: 'Firewall Status',
      description: 'Check Windows Firewall status',
      category: 'Security',
      icon: '🛡️',
      command: 'netsh advfirewall show allprofiles state',
      timeout: 15
    },
    {
      id: 'installed-programs',
      name: 'Installed Programs',
      description: 'List installed software',
      category: 'Security',
      icon: '📦',
      command: 'wmic product get name,version,vendor',
      timeout: 30
    },
    {
      id: 'security-policy',
      name: 'Security Policy',
      description: 'Check security policies',
      category: 'Security',
      icon: '🔒',
      command: 'powershell -Command "Get-LocalSecurityPolicy"',
      timeout: 25
    },

    // Advanced Operations
    {
      id: 'wmi-query',
      name: 'WMI Query',
      description: 'Execute WMI system query',
      category: 'Advanced',
      icon: '🔍',
      command: 'wmic process get name,processid,commandline',
      timeout: 25
    },
    {
      id: 'powershell-exec',
      name: 'PowerShell Execution',
      description: 'Execute PowerShell command',
      category: 'Advanced',
      icon: '⚡',
      command: 'powershell -Command "Get-Process | Select-Object Name,CPU,WorkingSet | Sort-Object CPU -Descending | Select-Object -First 10"',
      timeout: 30
    },
    {
      id: 'file-download',
      name: 'File Download',
      description: 'Download file from URL',
      category: 'Advanced',
      icon: '⬇️',
      command: 'powershell -Command "Invoke-WebRequest -Uri \'https://www.google.com\' -OutFile \'C:\\temp\\google.html\'"',
      timeout: 60
    },
    {
      id: 'event-logs',
      name: 'Event Logs',
      description: 'View system event logs',
      category: 'Advanced',
      icon: '📋',
      command: 'wevtutil qe System /c:10 /rd:true /f:text',
      timeout: 25
    },
    {
      id: 'performance-monitor',
      name: 'Performance Monitor',
      description: 'Monitor system performance',
      category: 'Advanced',
      icon: '📊',
      command: 'powershell -Command "Get-Counter \\Processor(_Total)\\% Processor Time"',
      timeout: 20
    },
    {
      id: 'system-restore',
      name: 'System Restore Points',
      description: 'List system restore points',
      category: 'Advanced',
      icon: '🔄',
      command: 'powershell -Command "Get-ComputerRestorePoint"',
      timeout: 25
    },
    {
      id: 'restart-service',
      name: 'Restart Service',
      description: 'Restart a Windows service',
      category: 'Advanced',
      icon: '🔄',
      command: 'powershell -Command "Restart-Service -Name \'Spooler\' -Force"',
      timeout: 60
    },
    {
      id: 'environment-vars',
      name: 'Environment Variables',
      description: 'Show system environment variables',
      category: 'Advanced',
      icon: '🌍',
      command: 'set',
      timeout: 15
    },
    {
      id: 'system-drivers',
      name: 'System Drivers',
      description: 'List installed drivers',
      category: 'Advanced',
      icon: '🔧',
      command: 'driverquery',
      timeout: 20
    },
    {
      id: 'scheduled-tasks',
      name: 'Scheduled Tasks',
      description: 'List scheduled tasks',
      category: 'Advanced',
      icon: '⏰',
      command: 'schtasks /query /fo table',
      timeout: 25
    }
  ];

  const categories = [...new Set(powerCommands.map(cmd => cmd.category))];

  const handlePowerCommand = async (command: PowerCommand) => {
    if (!selectedAgent) {
      toast.error('No agent selected');
      return;
    }

    setIsExecuting(command.id);
    
    try {
      // Add to execution history
      const executionId = `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const historyEntry = {
        id: executionId,
        timestamp: new Date(),
        command: command,
        status: 'processing',
        output: '',
        agent: selectedAgent.uuid
      };
      
      setCommandHistory(prev => [historyEntry, ...prev]);

      console.log('[ADVANCED TERMINAL] Executing power command:', command.name);
      console.log('[ADVANCED TERMINAL] Original command:', command.command);

      // Enhanced AI optimization with retry mechanism
      let aiResult = null;
      let retryCount = 0;
      const maxRetries = 3;

      while (retryCount < maxRetries && !aiResult) {
        try {
          console.log(`[ADVANCED TERMINAL] AI optimization attempt ${retryCount + 1}/${maxRetries}`);
          
          aiResult = await aiService.processCommand(
            'power_command',
            'optimize',
            { 
              originalCommand: command.command,
              commandName: command.name,
              commandType: command.category,
              timeout: command.timeout || 30
            },
            selectedAgent
          );
          
          if (aiResult && aiResult.success) {
            console.log('[ADVANCED TERMINAL] AI optimization successful');
            break;
          } else {
            console.warn(`[ADVANCED TERMINAL] AI optimization attempt ${retryCount + 1} returned unsuccessful result`);
            retryCount++;
          }
        } catch (error) {
          console.warn(`[ADVANCED TERMINAL] AI attempt ${retryCount + 1} failed:`, error.message);
          retryCount++;
          
          if (retryCount < maxRetries) {
            console.log(`[ADVANCED TERMINAL] Retrying AI optimization in 1 second...`);
            await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second before retry
          }
        }
      }

      if (aiResult && aiResult.success && aiResult.data.optimizedCommand) {
        const optimizedCommand = aiResult.data.optimizedCommand;
        
        // Update history with AI-optimized command
        setCommandHistory(prev => 
          prev.map(entry => 
            entry.id === executionId 
              ? { 
                  ...entry, 
                  status: 'optimized',
                  aiCommand: optimizedCommand.command,
                  aiExplanation: aiResult.data.explanation || 'AI optimized command',
                  aiSafetyLevel: aiResult.data.safetyLevel || 'Safe',
                  retryCount: retryCount
                }
              : entry
          )
        );

        // Send the optimized command
        const commandToSend = {
          id: executionId,
          command: optimizedCommand.command,
          type: optimizedCommand.type || 'cmd',
          timeout: optimizedCommand.timeout || command.timeout || 30,
          category: optimizedCommand.category || command.category,
          action: optimizedCommand.action || 'execute'
        };

        console.log('[ADVANCED TERMINAL] Sending AI-optimized command:', commandToSend);
        
        onCommandSent(commandToSend);
        
        toast.success(`✨ AI-optimized ${command.name} sent! (${retryCount + 1} attempts)`);
      } else {
        // Fallback to original command if AI fails after all retries
        console.warn('[ADVANCED TERMINAL] AI optimization failed after all retries, using original command');
        
        const commandToSend = {
          id: executionId,
          command: command.command,
          type: 'cmd',
          timeout: command.timeout || 30,
          category: command.category,
          action: 'execute'
        };

        onCommandSent(commandToSend);
        toast.success(`⚡ ${command.name} command sent! (fallback after ${maxRetries} AI attempts)`);
        
        // Update history with fallback
        setCommandHistory(prev => 
          prev.map(entry => 
            entry.id === executionId 
              ? { 
                  ...entry, 
                  status: 'fallback',
                  aiCommand: command.command,
                  aiExplanation: 'Used original command after AI optimization failed',
                  aiSafetyLevel: 'Safe',
                  retryCount: maxRetries
                }
              : entry
          )
        );
      }

    } catch (error) {
      console.error('[ADVANCED TERMINAL] Error executing power command:', error);
      toast.error(`❌ Failed to execute ${command.name}: ${error.message}`);
      
      // Update history with error
      setCommandHistory(prev => 
        prev.map(entry => 
          entry.id === executionId 
            ? { ...entry, status: 'error', output: error.message }
            : entry
        )
      );
    } finally {
      setIsExecuting(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Clean Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-4 rounded-lg">
        <h3 className="text-xl font-bold flex items-center gap-2">
          <span className="text-2xl">🚀</span>
          Advanced Power Commands
        </h3>
        <p className="text-purple-100 text-sm mt-1">
          AI-optimized commands with automatic error handling
        </p>
        {selectedAgent && (
          <div className="mt-2 text-xs">
            <span className="bg-white/20 px-2 py-1 rounded">Target: {selectedAgent.computerName}</span>
          </div>
        )}
      </div>

      {/* Client Selector */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
          Target Client:
        </label>
        <select
          value={selectedAgent?.uuid || ''}
          onChange={(e) => {
            const agent = agents.find(a => a.uuid === e.target.value);
            onSelectAgent?.(agent || null);
          }}
          className="premium-input w-full"
        >
          <option value="">Select a client...</option>
          {agents.map(agent => (
            <option key={agent.uuid} value={agent.uuid}>
              {agent.computerName} ({agent.ipAddress})
            </option>
          ))}
        </select>
      </div>

      {/* Command Categories */}
      <div className="space-y-4">
        {categories.map(category => (
          <div key={category} className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <span className="text-xl">
                {category === 'System' ? '💻' : 
                 category === 'Network' ? '🌐' : 
                 category === 'Storage' ? '💾' : 
                 category === 'Security' ? '🔐' : 
                 '⚡'}
              </span>
              {category}
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {powerCommands
                .filter(cmd => cmd.category === category)
                .map(command => (
                  <button
                    key={command.id}
                    onClick={() => handlePowerCommand(command)}
                    disabled={!selectedAgent || isExecuting === command.id}
                    className={`p-3 rounded-lg border transition-all duration-200 text-left ${
                      isExecuting === command.id
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : selectedAgent
                        ? 'border-gray-200 dark:border-gray-700 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-700 opacity-50 cursor-not-allowed'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <span className="text-lg">{command.icon}</span>
                      <div className="flex-1">
                        <h5 className="font-medium text-gray-900 dark:text-white text-sm">
                          {command.name}
                        </h5>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                          {command.description}
                        </p>
                      </div>
                    </div>
                    
                    {isExecuting === command.id && (
                      <div className="mt-2 flex items-center gap-2 text-blue-600 dark:text-blue-400">
                        <div className="animate-spin w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                        <span className="text-xs">AI optimizing...</span>
                      </div>
                    )}
                  </button>
                ))}
            </div>
          </div>
        ))}
      </div>

      {/* Terminal Output */}
      <CommandOutputTerminal
        commandHistory={commandHistory}
        className="mt-4"
      />
    </div>
  );
};

export default AdvancedTerminal;