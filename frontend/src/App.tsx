import React, { useState, useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { ThemeProvider } from './contexts/ThemeContext';
import request from './axios';
import { WS_URL } from './config';
import LoginPage from './pages/LoginPage';
import Router from './components/Router';
import TransferModal from './TransferModal';
import TasksModal from './components/TasksModal';
import { User } from './types';
import toast from 'react-hot-toast';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(
    localStorage.getItem('isAuthenticated') === 'true'
  );
  const [tableData, setTableData] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [modalStatus, setModalStatus] = useState(false);
  const [tasksModalStatus, setTasksModalStatus] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const initWebSocket = () => {
    const ws = new WebSocket(WS_URL);

    ws.onopen = () => {
      console.log('Connected to WebSocket');
      // Identify as web client
      ws.send(JSON.stringify({ type: 'web_client' }));
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        switch (data.type) {
          case 'client_list_update':
            setTableData(data.clients || []);
            break;
          case 'client_status_update':
            setTableData(prevData => {
              const updatedData = prevData.map(client => 
                client.uuid === data.client.uuid ? data.client : client
              );
              // Add new client if not exists
              if (!prevData.find(client => client.uuid === data.client.uuid)) {
                updatedData.push(data.client);
              }
              return updatedData;
            });
            toast.success(`Client ${data.client.hostname} is now ${data.client.status}`);
            break;
          case 'task_executed':
            toast.info(`Task executed on client ${data.clientUuid}`);
            break;
          case 'task_completed':
            toast.success(`Task completed with output`);
            break;
          default:
            // Legacy support for 'reload' message
            if (event.data === 'reload') {
              getUserList();
            }
        }
      } catch (error) {
        // Handle non-JSON messages (legacy support)
        if (event.data === 'reload') {
          getUserList();
        }
      }
    };

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
      const response = await request({
        url: '/info/get-user-list',
        method: 'GET',
      });
      setTableData(response.data.data || []);
    } catch (error) {
      toast.error('Failed to fetch user list.');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleActionClicked = (user: User) => {
    setSelectedUser(user);
    setModalStatus(true);
  };

  const handleTasksClicked = (user: User) => {
    setSelectedUser(user);
    setTasksModalStatus(true);
  };

  const handleProcess = async (user: User, commandKey: string) => {
    try {
      await request({
        url: 'command/send-script-to-client',
        method: 'POST',
        data: {
          uuid: user.uuid,
          commandKey,
        },
      });
      toast.success(`Task sent to ${user.computerName}`);
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

  if (!isAuthenticated) {
    return <LoginPage onLogin={() => setIsAuthenticated(true)} />;
  }

  return (
    <ThemeProvider>
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
      <Router
        isAuthenticated={isAuthenticated}
        tableData={tableData}
        isLoading={isLoading}
        onActionClicked={handleActionClicked}
        onTasksClicked={handleTasksClicked}
        onLogout={handleLogout}
        onLogin={handleLogin}
      />
    </ThemeProvider>
   );
}
