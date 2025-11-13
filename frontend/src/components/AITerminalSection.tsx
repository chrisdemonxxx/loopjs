import { useState, useRef, useEffect } from 'react';
import { Terminal as TerminalIcon, MessageSquare, Command, Trash2, Send, Zap, Cpu, Key, Link2, CheckCircle, XCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { useTheme } from '../contexts/ThemeContext';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { soundManager } from '../utils/sounds';

interface TerminalEntry {
  id: number;
  type: 'input' | 'output' | 'error' | 'success' | 'ai';
  content: string;
  timestamp: string;
}

export default function AITerminalSection() {
  const { colors } = useTheme();
  const [mode, setMode] = useState<'chat' | 'commands'>('chat');
  const [command, setCommand] = useState('');
  const [selectedClient, setSelectedClient] = useState('');
  const [aiProvider, setAiProvider] = useState<'openai' | 'anthropic' | 'custom'>('openai');
  const [apiKey, setApiKey] = useState('');
  const [customEndpoint, setCustomEndpoint] = useState('');
  const [isAIConnected, setIsAIConnected] = useState(false);
  const [showApiSetup, setShowApiSetup] = useState(false);
  const [entries, setEntries] = useState<TerminalEntry[]>([
    { id: 1, type: 'success', content: 'AI Terminal initialized successfully', timestamp: new Date().toLocaleTimeString() },
    { id: 2, type: 'output', content: 'Configure AI provider to enable AI-powered command execution...', timestamp: new Date().toLocaleTimeString() },
  ]);
  const terminalRef = useRef<HTMLDivElement>(null);

  const clients = [
    { id: '1', name: 'DESKTOP-WK8X' },
    { id: '2', name: 'CLIENT-PC' },
    { id: '3', name: 'SERVER-01' },
    { id: '4', name: 'WORKSTATION-A' },
  ];

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [entries]);

  const handleConnectAI = () => {
    if (!apiKey.trim()) {
      setEntries(prev => [...prev, {
        id: Date.now(),
        type: 'error',
        content: 'Error: API key is required',
        timestamp: new Date().toLocaleTimeString()
      }]);
      return;
    }

    setEntries(prev => [...prev, {
      id: Date.now(),
      type: 'output',
      content: `Connecting to ${aiProvider.toUpperCase()} AI service...`,
      timestamp: new Date().toLocaleTimeString()
    }]);

    setTimeout(() => {
      setIsAIConnected(true);
      setShowApiSetup(false);
      setEntries(prev => [...prev, {
        id: Date.now() + 1,
        type: 'success',
        content: `Successfully connected to ${aiProvider.toUpperCase()} AI`,
        timestamp: new Date().toLocaleTimeString()
      }]);
    }, 1500);
  };

  const handleDisconnectAI = () => {
    setIsAIConnected(false);
    setApiKey('');
    setCustomEndpoint('');
    setEntries(prev => [...prev, {
      id: Date.now(),
      type: 'output',
      content: 'AI service disconnected',
      timestamp: new Date().toLocaleTimeString()
    }]);
  };

  const handleSendCommand = () => {
    if (!command.trim()) return;

    soundManager.playCommandExecute();
    const timestamp = new Date().toLocaleTimeString();
    
    // Add user input
    setEntries(prev => [...prev, {
      id: Date.now(),
      type: 'input',
      content: `> ${command}`,
      timestamp
    }]);

    // Simulate AI processing
    if (mode === 'chat' && isAIConnected) {
      setTimeout(() => {
        setEntries(prev => [...prev, {
          id: Date.now() + 1,
          type: 'ai',
          content: `AI: Processing command "${command}"... Converting to system command.`,
          timestamp: new Date().toLocaleTimeString()
        }]);

        setTimeout(() => {
          soundManager.playSuccess();
          setEntries(prev => [...prev, {
            id: Date.now() + 2,
            type: 'success',
            content: `Command executed successfully on ${selectedClient || 'local'}`,
            timestamp: new Date().toLocaleTimeString()
          }]);
        }, 1000);
      }, 500);
    } else {
      setTimeout(() => {
        soundManager.playSuccess();
        setEntries(prev => [...prev, {
          id: Date.now() + 1,
          type: 'success',
          content: `Command executed on ${selectedClient || 'local'}`,
          timestamp: new Date().toLocaleTimeString()
        }]);
      }, 800);
    }

    setCommand('');
  };

  const handleClearLogs = () => {
    setEntries([{
      id: Date.now(),
      type: 'success',
      content: 'Terminal cleared',
      timestamp: new Date().toLocaleTimeString()
    }]);
  };

  const getEntryColor = (type: string) => {
    switch (type) {
      case 'input':
        return 'text-blue-400';
      case 'output':
        return 'text-slate-300';
      case 'error':
        return 'text-red-400';
      case 'success':
        return 'text-green-400';
      case 'ai':
        return 'text-purple-400';
      default:
        return 'text-slate-400';
    }
  };

  return (
    <div className="space-y-6">
      <Card className="backdrop-blur-2xl" style={{
        background: `linear-gradient(to bottom right, ${colors.cardGradientFrom}90, ${colors.cardGradientTo}90)`,
        border: `1px solid ${colors.border}`,
        boxShadow: `0 8px 32px 0 ${colors.glowColor}, inset 0 1px 1px 0 rgba(255, 255, 255, 0.05)`
      }}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-lg p-3" style={{
                backgroundColor: `${colors.primary}20`,
                border: `1px solid ${colors.primary}40`
              }}>
                <TerminalIcon className="h-6 w-6" style={{ color: colors.primary }} />
              </div>
              <div>
                <CardTitle className="text-slate-100">AI Terminal</CardTitle>
                <p className="text-sm text-slate-400">Execute commands with AI assistance</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className={`${
                  isAIConnected
                    ? 'border-green-500/50 bg-green-500/10 text-green-400'
                    : 'border-red-500/50 bg-red-500/10 text-red-400'
                }`}
              >
                <Zap className="mr-1 h-3 w-3" />
                {isAIConnected ? 'AI Connected' : 'AI Disconnected'}
              </Badge>

              {/* AI Setup Dialog */}
              <Dialog open={showApiSetup} onOpenChange={setShowApiSetup}>
                <DialogTrigger asChild>
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-2"
                    style={{
                      borderColor: colors.border,
                      background: `${colors.cardGradientFrom}80`,
                      color: colors.primary
                    }}
                  >
                    <Cpu className="h-4 w-4" />
                    {isAIConnected ? 'AI Settings' : 'Connect AI'}
                  </Button>
                </DialogTrigger>
                <DialogContent className="backdrop-blur-2xl border-0" style={{
                  background: `linear-gradient(to bottom right, ${colors.cardGradientFrom}f5, ${colors.cardGradientTo}f5)`,
                  boxShadow: `0 20px 60px ${colors.glowColor}`
                }}>
                  <DialogHeader>
                    <DialogTitle className="text-slate-100 flex items-center gap-2">
                      <Cpu className="h-5 w-5" style={{ color: colors.primary }} />
                      AI Provider Configuration
                    </DialogTitle>
                    <DialogDescription className="text-slate-400">
                      Connect your AI service to enable intelligent command execution
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="space-y-4 py-4">
                    {/* AI Provider Select */}
                    <div className="space-y-2">
                      <label className="text-sm text-slate-300">AI Provider</label>
                      <Select value={aiProvider} onValueChange={(v: any) => setAiProvider(v)}>
                        <SelectTrigger className="w-full border-slate-600 bg-slate-900/50 text-slate-200">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="border-slate-700 bg-slate-800">
                          <SelectItem value="openai" className="text-slate-200">
                            <div className="flex items-center gap-2">
                              <Cpu className="h-4 w-4" />
                              OpenAI (GPT-4, GPT-3.5)
                            </div>
                          </SelectItem>
                          <SelectItem value="anthropic" className="text-slate-200">
                            <div className="flex items-center gap-2">
                              <Cpu className="h-4 w-4" />
                              Anthropic (Claude)
                            </div>
                          </SelectItem>
                          <SelectItem value="custom" className="text-slate-200">
                            <div className="flex items-center gap-2">
                              <Cpu className="h-4 w-4" />
                              Custom Endpoint
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* API Key Input */}
                    <div className="space-y-2">
                      <label className="text-sm text-slate-300 flex items-center gap-2">
                        <Key className="h-4 w-4" />
                        API Key
                      </label>
                      <Input
                        type="password"
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        placeholder="sk-..."
                        className="border-slate-600 bg-slate-900/50 font-mono text-slate-200 placeholder:text-slate-500"
                      />
                    </div>

                    {/* Custom Endpoint (if custom provider) */}
                    {aiProvider === 'custom' && (
                      <div className="space-y-2">
                        <label className="text-sm text-slate-300 flex items-center gap-2">
                          <Link2 className="h-4 w-4" />
                          API Endpoint
                        </label>
                        <Input
                          value={customEndpoint}
                          onChange={(e) => setCustomEndpoint(e.target.value)}
                          placeholder="https://api.example.com/v1/chat"
                          className="border-slate-600 bg-slate-900/50 font-mono text-slate-200 placeholder:text-slate-500"
                        />
                      </div>
                    )}

                    {/* Documentation Links */}
                    <div className="rounded-lg p-3" style={{
                      backgroundColor: `${colors.primary}10`,
                      border: `1px solid ${colors.border}`
                    }}>
                      <p className="text-xs text-slate-400 mb-2">API Documentation:</p>
                      <div className="space-y-1">
                        {aiProvider === 'openai' && (
                          <a
                            href="https://platform.openai.com/docs/api-reference"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs flex items-center gap-1 hover:underline"
                            style={{ color: colors.primary }}
                          >
                            <Link2 className="h-3 w-3" />
                            OpenAI API Documentation
                          </a>
                        )}
                        {aiProvider === 'anthropic' && (
                          <a
                            href="https://docs.anthropic.com/claude/reference"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs flex items-center gap-1 hover:underline"
                            style={{ color: colors.primary }}
                          >
                            <Link2 className="h-3 w-3" />
                            Anthropic API Documentation
                          </a>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 pt-2">
                      {!isAIConnected ? (
                        <Button
                          onClick={handleConnectAI}
                          className="flex-1 text-white gap-2"
                          style={{
                            background: `linear-gradient(to right, ${colors.primary}, ${colors.primaryDark})`
                          }}
                        >
                          <CheckCircle className="h-4 w-4" />
                          Connect AI
                        </Button>
                      ) : (
                        <Button
                          onClick={handleDisconnectAI}
                          variant="outline"
                          className="flex-1 gap-2 border-red-500/50 bg-red-500/10 text-red-400 hover:bg-red-500/20"
                        >
                          <XCircle className="h-4 w-4" />
                          Disconnect AI
                        </Button>
                      )}
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Controls */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Mode Selection */}
            <div className="flex gap-2">
              <Button
                variant={mode === 'chat' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setMode('chat')}
                className={mode === 'chat' 
                  ? 'text-white' 
                  : 'border-slate-600 bg-slate-900/50 text-slate-300'}
                style={mode === 'chat' ? {
                  background: `linear-gradient(to right, ${colors.primary}, ${colors.primaryDark})`
                } : {}}
              >
                <MessageSquare className="mr-2 h-4 w-4" />
                Chat Mode
              </Button>
              <Button
                variant={mode === 'commands' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setMode('commands')}
                className={mode === 'commands' 
                  ? 'text-white' 
                  : 'border-slate-600 bg-slate-900/50 text-slate-300'}
                style={mode === 'commands' ? {
                  background: `linear-gradient(to right, ${colors.primary}, ${colors.primaryDark})`
                } : {}}
              >
                <Command className="mr-2 h-4 w-4" />
                Commands Mode
              </Button>
            </div>

            {/* Target Client */}
            <Select value={selectedClient} onValueChange={setSelectedClient}>
              <SelectTrigger className="w-[200px] border-slate-600 bg-slate-900/50 text-slate-200">
                <SelectValue placeholder="Select target client" />
              </SelectTrigger>
              <SelectContent className="border-slate-700 bg-slate-800">
                <SelectItem value="local">Local Machine</SelectItem>
                {clients.map(client => (
                  <SelectItem key={client.id} value={client.name} className="text-slate-200">
                    {client.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Clear Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearLogs}
              className="ml-auto gap-2 border-slate-600 bg-slate-900/50 text-slate-300 hover:bg-slate-700"
            >
              <Trash2 className="h-4 w-4" />
              Clear Logs
            </Button>
          </div>

          {/* Terminal Output */}
          <div
            ref={terminalRef}
            className="h-[500px] overflow-y-auto rounded-lg border border-slate-700 bg-slate-950 p-4 font-mono text-sm"
          >
            {entries.map((entry) => (
              <div key={entry.id} className="mb-2">
                <span className="text-slate-500 text-xs mr-2">[{entry.timestamp}]</span>
                <span className={getEntryColor(entry.type)}>{entry.content}</span>
              </div>
            ))}
            <div className="flex items-center">
              <span className="text-green-400 mr-2 animate-pulse">{'>'}_</span>
              <span className="text-slate-500">|</span>
            </div>
          </div>

          {/* Terminal Input */}
          <div className="flex gap-2">
            <Input
              value={command}
              onChange={(e) => setCommand(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSendCommand();
                } else if (e.key.length === 1) {
                  soundManager.playKeystroke();
                }
              }}
              placeholder={mode === 'chat' ? 'Ask AI to execute a command...' : 'Enter command...'}
              className="flex-1 border-slate-600 bg-slate-900/50 font-mono text-slate-200 placeholder:text-slate-500"
            />
            <Button
              onClick={handleSendCommand}
              className="gap-2 text-white"
              style={{
                background: `linear-gradient(to right, ${colors.primary}, ${colors.primaryDark})`
              }}
            >
              <Send className="h-4 w-4" />
              Send
            </Button>
          </div>

          {/* Command Suggestions */}
          {mode === 'chat' && (
            <div className="flex flex-wrap gap-2">
              <span className="text-xs text-slate-500">Quick suggestions:</span>
              {['Get system info', 'List running processes', 'Check network connections', 'Take screenshot'].map((suggestion) => (
                <Button
                  key={suggestion}
                  variant="outline"
                  size="sm"
                  onClick={() => setCommand(suggestion)}
                  className="text-xs border-slate-600 bg-slate-900/30 text-slate-400 hover:bg-slate-700 hover:text-slate-200"
                >
                  {suggestion}
                </Button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}