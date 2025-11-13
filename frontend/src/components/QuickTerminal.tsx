import { useState, useRef, useEffect } from 'react';
import { Terminal, Send, X, Trash2, Minimize2 } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { useTheme } from '../contexts/ThemeContext';

interface QuickTerminalProps {
  client: {
    id: string;
    computerName: string;
    platform: string;
  };
  onClose: () => void;
}

interface TerminalLine {
  type: 'command' | 'output' | 'error' | 'info';
  content: string;
  timestamp: Date;
}

export default function QuickTerminal({ client, onClose }: QuickTerminalProps) {
  const { colors } = useTheme();
  const [command, setCommand] = useState('');
  const [lines, setLines] = useState<TerminalLine[]>([
    { type: 'info', content: `Connected to ${client.computerName}`, timestamp: new Date() },
    { type: 'info', content: 'Type "help" for available commands', timestamp: new Date() },
  ]);
  const terminalEndRef = useRef<HTMLDivElement>(null);
  const [isMinimized, setIsMinimized] = useState(false);

  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [lines]);

  const handleCommand = () => {
    const cmd = command.trim();
    if (!cmd) return;

    setLines(prev => [...prev, { type: 'command', content: cmd, timestamp: new Date() }]);

    let response = '';
    if (cmd.toLowerCase() === 'help') {
      response = `Available commands:
  help - Show this help message
  sysinfo - System information
  whoami - Current user
  dir - List directory
  clear - Clear terminal`;
    } else if (cmd.toLowerCase() === 'sysinfo') {
      response = `System: ${client.platform}
Hostname: ${client.computerName}
Uptime: 2d 5h 32m`;
    } else if (cmd.toLowerCase() === 'whoami') {
      response = `${client.platform === 'Windows' ? 'SYSTEM\\Administrator' : 'root'}`;
    } else if (cmd.toLowerCase() === 'dir' || cmd.toLowerCase() === 'ls') {
      response = `Documents/
Downloads/
Pictures/
Videos/`;
    } else if (cmd.toLowerCase() === 'clear') {
      setLines([{ type: 'info', content: 'Terminal cleared', timestamp: new Date() }]);
      setCommand('');
      return;
    } else {
      response = `Command executed: ${cmd}`;
    }

    setTimeout(() => {
      setLines(prev => [...prev, { type: 'output', content: response, timestamp: new Date() }]);
    }, 300);

    setCommand('');
  };

  const getLineColor = (type: TerminalLine['type']) => {
    switch (type) {
      case 'command': return 'text-cyan-400';
      case 'output': return 'text-slate-300';
      case 'error': return 'text-red-400';
      case 'info': return 'text-green-400';
      default: return 'text-slate-400';
    }
  };

  if (isMinimized) {
    return (
      <div 
        className="fixed bottom-4 right-4 z-50 backdrop-blur-xl rounded-lg border cursor-pointer animate-in slide-in-from-bottom-4"
        style={{
          background: `linear-gradient(to right, ${colors.cardGradientFrom}f5, ${colors.cardGradientTo}f5)`,
          border: `1px solid ${colors.border}`,
          boxShadow: `0 8px 32px ${colors.glowColor}`
        }}
        onClick={() => setIsMinimized(false)}
      >
        <div className="px-4 py-2 flex items-center gap-2">
          <Terminal className="h-4 w-4" style={{ color: colors.primary }} />
          <span className="text-sm text-slate-200">{client.computerName}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-[600px] h-[400px] backdrop-blur-xl rounded-lg border flex flex-col overflow-hidden animate-in slide-in-from-bottom-4"
      style={{
        background: `linear-gradient(to bottom right, ${colors.cardGradientFrom}f5, ${colors.cardGradientTo}f5)`,
        border: `1px solid ${colors.border}`,
        boxShadow: `0 20px 60px ${colors.glowColor}`
      }}>
      
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b" style={{ borderColor: colors.border }}>
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded" style={{
            backgroundColor: `${colors.primary}20`,
            border: `1px solid ${colors.primary}40`
          }}>
            <Terminal className="h-4 w-4" style={{ color: colors.primary }} />
          </div>
          <div>
            <h3 className="text-sm text-slate-100">Quick Terminal</h3>
            <p className="text-xs text-slate-400">{client.computerName}</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setIsMinimized(true)}
            className="h-7 w-7 p-0 hover:bg-slate-700/50"
          >
            <Minimize2 className="h-3 w-3 text-slate-400" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setLines([{ type: 'info', content: 'Terminal cleared', timestamp: new Date() }])}
            className="h-7 w-7 p-0 hover:bg-slate-700/50"
          >
            <Trash2 className="h-3 w-3 text-slate-400" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={onClose}
            className="h-7 w-7 p-0 hover:bg-red-500/20 text-red-400"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Terminal Output */}
      <div className="flex-1 overflow-y-auto p-3 font-mono text-xs bg-slate-950/50">
        {lines.map((line, index) => (
          <div key={index} className="mb-1">
            <span className="text-slate-500 mr-2">[{line.timestamp.toLocaleTimeString()}]</span>
            <span className={getLineColor(line.type)}>
              {line.type === 'command' ? '> ' : ''}{line.content}
            </span>
          </div>
        ))}
        <div ref={terminalEndRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t flex gap-2" style={{ borderColor: colors.border }}>
        <Input
          value={command}
          onChange={(e) => setCommand(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleCommand()}
          placeholder="Enter command..."
          className="flex-1 h-8 text-xs border-slate-600 bg-slate-900/50 font-mono text-slate-200 placeholder:text-slate-500"
        />
        <Button
          size="sm"
          onClick={handleCommand}
          className="h-8 px-3 text-white text-xs"
          style={{
            background: `linear-gradient(to right, ${colors.primary}, ${colors.primaryDark})`
          }}
        >
          <Send className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}
