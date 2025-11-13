import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Terminal, Send, Trash2, Download } from 'lucide-react';

interface TerminalLine {
  type: 'command' | 'output' | 'error' | 'info';
  content: string;
  timestamp: Date;
}

export function TerminalPanel() {
  const [selectedClient, setSelectedClient] = useState('DESKTOP-5X2A');
  const [command, setCommand] = useState('');
  const [lines, setLines] = useState<TerminalLine[]>([
    { type: 'info', content: 'C2 Terminal v2.0 - Connected to DESKTOP-5X2A', timestamp: new Date() },
    { type: 'info', content: 'Type "help" for available commands', timestamp: new Date() },
  ]);
  const terminalEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [lines]);

  const executeCommand = (cmd: string) => {
    if (!cmd.trim()) return;

    // Add command to terminal
    setLines(prev => [...prev, { type: 'command', content: cmd, timestamp: new Date() }]);

    // Simulate command execution
    setTimeout(() => {
      let response = '';
      
      if (cmd.toLowerCase() === 'help') {
        response = `Available commands:
  help - Display this help message
  sysinfo - Display system information
  ps - List running processes
  netstat - Show network connections
  dir - List directory contents
  whoami - Display current user
  clear - Clear terminal`;
      } else if (cmd.toLowerCase() === 'sysinfo') {
        response = `System Information:
  OS: Windows 11 Pro
  CPU: Intel Core i7-12700K @ 3.60GHz
  RAM: 32GB DDR4
  Disk: 1TB NVMe SSD
  Uptime: 5 days, 3 hours`;
      } else if (cmd.toLowerCase() === 'ps') {
        response = `PID    Name                CPU%   Memory
  1234   explorer.exe        2.3%   145MB
  5678   chrome.exe          8.5%   892MB
  9012   vscode.exe          4.2%   534MB
  3456   system             0.8%   89MB`;
      } else if (cmd.toLowerCase() === 'whoami') {
        response = `${selectedClient}\\john.doe`;
      } else if (cmd.toLowerCase() === 'netstat') {
        response = `Active Connections:
  TCP  192.168.1.105:443  ESTABLISHED
  TCP  192.168.1.105:80   ESTABLISHED
  UDP  0.0.0.0:53         *:*`;
      } else if (cmd.toLowerCase() === 'dir' || cmd.toLowerCase() === 'ls') {
        response = `Directory of C:\\Users\\john.doe
  Desktop/
  Documents/
  Downloads/
  Pictures/
  Videos/
  AppData/`;
      } else if (cmd.toLowerCase() === 'clear') {
        setLines([{ type: 'info', content: 'Terminal cleared', timestamp: new Date() }]);
        setCommand('');
        return;
      } else {
        setLines(prev => [...prev, { 
          type: 'error', 
          content: `Command not recognized: ${cmd}. Type "help" for available commands.`, 
          timestamp: new Date() 
        }]);
        setCommand('');
        return;
      }

      setLines(prev => [...prev, { type: 'output', content: response, timestamp: new Date() }]);
    }, 300);

    setCommand('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeCommand(command);
  };

  const clearTerminal = () => {
    setLines([{ type: 'info', content: 'Terminal cleared', timestamp: new Date() }]);
  };

  const getLineColor = (type: TerminalLine['type']) => {
    switch (type) {
      case 'command': return 'text-cyan-400';
      case 'output': return 'text-slate-300';
      case 'error': return 'text-red-400';
      case 'info': return 'text-green-400';
      default: return 'text-slate-300';
    }
  };

  return (
    <div className="p-6">
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Terminal className="h-5 w-5 text-cyan-500" />
              <CardTitle className="text-slate-100">Remote Terminal</CardTitle>
            </div>
            
            <div className="flex items-center gap-3">
              <Select value={selectedClient} onValueChange={setSelectedClient}>
                <SelectTrigger className="w-48 bg-slate-800 border-slate-700 text-slate-100">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="DESKTOP-5X2A">DESKTOP-5X2A</SelectItem>
                  <SelectItem value="WORKSTATION-42">WORKSTATION-42</SelectItem>
                  <SelectItem value="CLIENT-03">CLIENT-03</SelectItem>
                  <SelectItem value="SERVER-MAIN">SERVER-MAIN</SelectItem>
                </SelectContent>
              </Select>
              
              <Button 
                variant="outline" 
                size="icon"
                onClick={clearTerminal}
                className="border-slate-700 text-slate-400 hover:text-slate-100"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
              
              <Button 
                variant="outline" 
                size="icon"
                className="border-slate-700 text-slate-400 hover:text-slate-100"
              >
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="bg-black rounded-lg p-4 font-mono text-sm h-[600px] flex flex-col">
            <div className="flex-1 overflow-y-auto mb-4 space-y-1">
              {lines.map((line, i) => (
                <div key={i} className="flex gap-2">
                  {line.type === 'command' && (
                    <span className="text-cyan-500 select-none">{'>'}</span>
                  )}
                  <pre className={`whitespace-pre-wrap break-words ${getLineColor(line.type)}`}>
                    {line.content}
                  </pre>
                </div>
              ))}
              <div ref={terminalEndRef} />
            </div>
            
            <form onSubmit={handleSubmit} className="flex items-center gap-2 border-t border-slate-800 pt-4">
              <span className="text-cyan-500">{'>'}</span>
              <Input
                value={command}
                onChange={(e) => setCommand(e.target.value)}
                placeholder="Enter command..."
                className="flex-1 bg-transparent border-none text-slate-100 focus-visible:ring-0 focus-visible:ring-offset-0 font-mono"
                autoFocus
              />
              <Button 
                type="submit"
                size="icon"
                className="bg-cyan-500 hover:bg-cyan-600 text-white"
              >
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
