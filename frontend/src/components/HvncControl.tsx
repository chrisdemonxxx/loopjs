import { useEffect, useRef, useState } from 'react';
import { Monitor, Maximize2, Camera, Settings, Power, Wifi, WifiOff, Download, Copy, X, Activity } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { useTheme } from '../contexts/ThemeContext';

interface HvncControlProps {
  agentId: string;
  platform: string;
  onClose: () => void;
}

interface ScreenInfo {
  width: number;
  height: number;
}

export default function HvncControl({ agentId, platform, onClose }: HvncControlProps) {
  const { colors } = useTheme();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [sessionId, setSessionId] = useState<string>('');
  const [quality, setQuality] = useState<'high' | 'medium' | 'low'>('medium');
  const [fps, setFps] = useState(30);
  const [screenInfo, setScreenInfo] = useState<ScreenInfo>({ width: 1920, height: 1080 });
  const [showSettings, setShowSettings] = useState(false);

  // WebSocket connection
  useEffect(() => {
    const connectWebSocket = () => {
      console.log('HVNC: Simulating WebSocket connection (backend not available)');
      
      setTimeout(() => {
        setIsConnected(true);
        const sessionId = `hvnc-${Date.now()}`;
        setSessionId(sessionId);
        console.log('HVNC: Simulated connection established', sessionId);
        setScreenInfo({ width: 1920, height: 1080 });
      }, 1000);
    };

    connectWebSocket();

    return () => {
      console.log('HVNC: Cleaning up connection');
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [agentId]);

  // Initialize canvas with demo screen
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !isConnected) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = screenInfo.width;
    canvas.height = screenInfo.height;

    // Draw demo desktop
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, '#1e293b');
    gradient.addColorStop(1, '#0f172a');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw grid pattern
    ctx.strokeStyle = 'rgba(100, 200, 255, 0.05)';
    ctx.lineWidth = 1;
    for (let x = 0; x < canvas.width; x += 50) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += 50) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    // Draw demo desktop icons
    const drawIcon = (x: number, y: number, text: string) => {
      // Icon background
      const iconGradient = ctx.createLinearGradient(x, y, x + 60, y + 60);
      iconGradient.addColorStop(0, colors.primary + '40');
      iconGradient.addColorStop(1, colors.primaryDark + '20');
      ctx.fillStyle = iconGradient;
      ctx.fillRect(x, y, 60, 60);
      
      // Icon border
      ctx.strokeStyle = colors.primary + '80';
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, 60, 60);

      // Icon text
      ctx.fillStyle = '#fff';
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(text, x + 30, y + 80);
    };

    drawIcon(50, 50, 'Documents');
    drawIcon(150, 50, 'Browser');
    drawIcon(250, 50, 'Terminal');
    drawIcon(50, 150, 'Settings');
    drawIcon(150, 150, 'Files');

    // Draw taskbar
    ctx.fillStyle = 'rgba(15, 23, 42, 0.95)';
    ctx.fillRect(0, canvas.height - 50, canvas.width, 50);
    ctx.strokeStyle = colors.primary + '60';
    ctx.lineWidth = 1;
    ctx.strokeRect(0, canvas.height - 50, canvas.width, 50);

    // Draw "Windows Remote Desktop" text
    ctx.fillStyle = colors.primary;
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`${platform} Remote Desktop`, 20, canvas.height - 22);

    // Draw time
    const time = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    ctx.fillStyle = '#94a3b8';
    ctx.font = '14px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(time, canvas.width - 20, canvas.height - 22);

  }, [isConnected, screenInfo, platform, colors]);

  // Fullscreen toggle
  const toggleFullscreen = async () => {
    const container = containerRef.current;
    if (!container) return;

    try {
      if (!isFullscreen) {
        await container.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch (error) {
      console.log('Fullscreen not supported or denied:', error);
      setIsFullscreen(!isFullscreen);
    }
  };

  // Screenshot
  const takeScreenshot = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    canvas.toBlob((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `hvnc-${agentId}-${Date.now()}.png`;
        a.click();
        URL.revokeObjectURL(url);
      }
    });
  };

  // Disconnect
  const handleDisconnect = () => {
    if (wsRef.current) {
      wsRef.current.close();
    }
    setIsConnected(false);
    onClose();
  };

  return (
    <div ref={containerRef} className="flex flex-col h-full w-full overflow-hidden">
      {/* Compact Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b" style={{
        background: `linear-gradient(to right, ${colors.cardGradientFrom}, ${colors.cardGradientTo})`,
        borderColor: colors.border
      }}>
        {/* Left: Title & Status */}
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg" style={{
            backgroundColor: `${colors.primary}20`,
            border: `1px solid ${colors.primary}40`
          }}>
            <Monitor className="h-4 w-4" style={{ color: colors.primary }} />
          </div>
          <div>
            <h3 className="text-sm text-slate-100 flex items-center gap-2">
              HVNC Remote Control
              <Badge 
                variant="outline" 
                className={`text-xs px-2 py-0 ${isConnected ? 'bg-green-500/20 text-green-400 border-green-500/40' : 'bg-red-500/20 text-red-400 border-red-500/40'}`}
              >
                {isConnected ? (
                  <><Wifi className="h-3 w-3 mr-1" /> Connected</>
                ) : (
                  <><WifiOff className="h-3 w-3 mr-1" /> Connecting...</>
                )}
              </Badge>
            </h3>
            <p className="text-xs text-slate-400">{platform}</p>
          </div>
        </div>

        {/* Right: Quality & Actions */}
        <div className="flex items-center gap-2">
          <Select value={quality} onValueChange={(v: any) => setQuality(v)}>
            <SelectTrigger className="h-8 w-28 text-xs border-slate-600 bg-slate-800/50 text-slate-200">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-600">
              <SelectItem value="high" className="text-slate-200">High</SelectItem>
              <SelectItem value="medium" className="text-slate-200">Medium</SelectItem>
              <SelectItem value="low" className="text-slate-200">Low</SelectItem>
            </SelectContent>
          </Select>

          <Button
            size="sm"
            variant="ghost"
            onClick={takeScreenshot}
            className="h-8 px-2 hover:bg-slate-700/50"
            title="Screenshot"
          >
            <Camera className="h-4 w-4 text-slate-300" />
          </Button>

          <Button
            size="sm"
            variant="ghost"
            onClick={toggleFullscreen}
            className="h-8 px-2 hover:bg-slate-700/50"
            title="Fullscreen"
          >
            <Maximize2 className="h-4 w-4 text-slate-300" />
          </Button>

          <Button
            size="sm"
            variant="ghost"
            onClick={() => setShowSettings(!showSettings)}
            className="h-8 px-2 hover:bg-slate-700/50"
            title="Settings"
          >
            <Settings className="h-4 w-4 text-slate-300" />
          </Button>

          <div className="w-px h-6 bg-slate-600 mx-1" />

          <Button
            size="sm"
            variant="ghost"
            onClick={handleDisconnect}
            className="h-8 px-2 hover:bg-red-500/20 text-red-400 hover:text-red-300"
            title="Disconnect"
          >
            <Power className="h-4 w-4" />
          </Button>

          <Button
            size="sm"
            variant="ghost"
            onClick={onClose}
            className="h-8 px-2 hover:bg-slate-700/50"
            title="Close"
          >
            <X className="h-4 w-4 text-slate-300" />
          </Button>
        </div>
      </div>

      {/* Main Screen Area */}
      <div className="flex-1 flex items-center justify-center p-4 overflow-auto" style={{
        background: `linear-gradient(135deg, ${colors.bgGradientFrom}, ${colors.bgGradientTo})`
      }}>
        {!isConnected ? (
          <div className="text-center">
            <div className="mb-4 relative">
              <div className="w-16 h-16 mx-auto rounded-full animate-spin" style={{
                background: `linear-gradient(to right, ${colors.primary}, transparent)`,
                border: `2px solid ${colors.border}`
              }} />
              <Monitor className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 h-8 w-8" style={{
                color: colors.primary
              }} />
            </div>
            <p className="text-slate-300 mb-1">Establishing Connection</p>
            <p className="text-xs text-slate-500">Connecting to {agentId}</p>
          </div>
        ) : (
          <div className="relative w-full h-full flex items-center justify-center">
            <canvas
              ref={canvasRef}
              className="max-w-full max-h-full rounded-lg shadow-2xl cursor-crosshair"
              style={{
                border: `1px solid ${colors.border}`,
                boxShadow: `0 20px 60px ${colors.glowColor}`
              }}
            />
          </div>
        )}
      </div>

      {/* Settings Panel (Slide-in) */}
      {showSettings && (
        <div className="absolute right-0 top-14 bottom-0 w-80 backdrop-blur-xl border-l overflow-auto z-50 animate-in slide-in-from-right duration-300"
          style={{
            background: `linear-gradient(to bottom, ${colors.cardGradientFrom}f5, ${colors.cardGradientTo}f5)`,
            borderColor: colors.border
          }}>
          <div className="p-4 space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-slate-200">Settings</h4>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowSettings(false)}
                className="h-7 w-7 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-slate-400 mb-2 block">Session ID</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={sessionId}
                    readOnly
                    className="flex-1 px-3 py-2 text-xs rounded-lg border bg-slate-900/50 text-slate-300 border-slate-600"
                  />
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => navigator.clipboard.writeText(sessionId)}
                    className="h-8 w-8 p-0"
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400 mb-2 block">Resolution</label>
                <div className="px-3 py-2 text-xs rounded-lg border bg-slate-900/50 text-slate-300 border-slate-600">
                  {screenInfo.width} × {screenInfo.height}
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400 mb-2 block">FPS: {fps}</label>
                <input
                  type="range"
                  min="10"
                  max="60"
                  value={fps}
                  onChange={(e) => setFps(Number(e.target.value))}
                  className="w-full"
                  style={{
                    accentColor: colors.primary
                  }}
                />
              </div>

              <div className="pt-3 border-t" style={{ borderColor: colors.border }}>
                <Button
                  onClick={takeScreenshot}
                  className="w-full text-white"
                  style={{
                    background: `linear-gradient(to right, ${colors.primary}, ${colors.primaryDark})`
                  }}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download Screenshot
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer Status Bar */}
      <div className="flex items-center justify-between px-4 py-1.5 text-xs border-t" style={{
        background: colors.cardGradientFrom,
        borderColor: colors.border
      }}>
        <div className="flex items-center gap-4 text-slate-400">
          <span>Resolution: {screenInfo.width} × {screenInfo.height}</span>
          <span>•</span>
          <span>FPS: {fps}</span>
          <span>•</span>
          <span>Session: {sessionId.slice(0, 12)}...</span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={takeScreenshot}
            className="h-6 px-2 text-xs hover:bg-slate-700/50"
            style={{ color: colors.primary }}
          >
            <Download className="h-3 w-3 mr-1" />
            Sync Clipboard
          </Button>
        </div>
      </div>
    </div>
  );
}