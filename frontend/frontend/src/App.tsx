import { useEffect, useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import request from './axios';
import { WS_URL } from './config';
import TasksModal from './components/TasksModal';
import TransferModal from './TransferModal';
import LoginPage from './pages/LoginPage';
import Header from './components/Header';
import UserTable from './components/UserTable';
import TerminalPage from './pages/TerminalPage';
import { User } from './types';
import toast, { Toaster } from 'react-hot-toast';

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
    };

    ws.onmessage = (event) => {
      if (event.data === 'reload') {
        getUserList();
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket Error:', error);
      toast.error('WebSocket connection error.');
    };

    ws.onclose = () => {
      console.log('Disconnected from WebSocket');
    };
  };

  const getUserList = async () => {
    try {
      setIsLoading(true);
      const info = await request({
        url: 'info/get-user-list',
        method: 'GET',
      });
      setTableData(info.data.data);
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

  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated');
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
    <>
      <Toaster />
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
      <div className="dark:bg-boxdark-2 dark:text-bodydark">
        <div className="flex h-screen overflow-hidden">
          <div className="relative flex flex-1 flex-col overflow-y-auto overflow-x-hidden">
            <Header onLogout={handleLogout} />
            <main>
              <div className="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
                <Routes>
                  <Route
                    path="/"
                    element={
                      isLoading ? (
                        <div className="flex justify-center items-center h-full">
                          <p>Loading...</p>
                        </div>
                      ) : (
                        <UserTable
                          users={tableData}
                          onActionClick={handleActionClicked}
                          onTasksClick={handleTasksClicked}
                        />
                      )
                    }
                  />
                  <Route path="/terminal/:uuid" element={<TerminalPage />} />
                </Routes>
              </div>
            </main>
          </div>
        </div>
      </div>
    </>
  );
}
