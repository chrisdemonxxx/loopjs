import { useEffect, useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import request from './axios';
import { WS_URL } from './config';
import { useClientStore } from './store';
import TasksModal from './components/TasksModal';
import TransferModal from './TransferModal';
import LoginPage from './pages/LoginPage';
import Header from './components/Header';
import UserTable from './components/UserTable';
import { User } from './types';
import toast, { Toaster } from 'react-hot-toast';
import ClientDetailPage from './pages/ClientDetailPage';

const MainPage = () => {
  const { clients, fetchClients } = useClientStore();
  const [isLoading, setIsLoading] = useState(true);
  const [modalStatus, setModalStatus] = useState(false);
  const [tasksModalStatus, setTasksModalStatus] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

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

  useEffect(() => {
    const loadClients = async () => {
      setIsLoading(true);
      await fetchClients();
      setIsLoading(false);
    };
    loadClients();
  }, [fetchClients]);

  return (
    <>
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
      {isLoading ? (
        <div className="flex justify-center items-center h-full">
          <p>Loading...</p>
        </div>
      ) : (
        <UserTable
          users={clients}
          onActionClick={handleActionClicked}
          onTasksClick={handleTasksClicked}
        />
      )}
    </>
  );
};

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(
    localStorage.getItem('isAuthenticated') === 'true'
  );
  const { fetchClients } = useClientStore();

  const initWebSocket = () => {
    const ws = new WebSocket(WS_URL);

    ws.onopen = () => {
      console.log('Connected to WebSocket');
    };

    ws.onmessage = (event) => {
      if (event.data === 'reload') {
        fetchClients();
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

  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated');
    setIsAuthenticated(false);
  };

  useEffect(() => {
    if (isAuthenticated) {
      initWebSocket();
    }
  }, [isAuthenticated, fetchClients]);

  if (!isAuthenticated) {
    return <LoginPage onLogin={() => setIsAuthenticated(true)} />;
  }

  return (
    <>
      <Toaster />
      <div className="dark:bg-boxdark-2 dark:text-bodydark">
        <div className="flex h-screen overflow-hidden">
          <div className="relative flex flex-1 flex-col overflow-y-auto overflow-x-hidden">
            <main>
              <div className="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
                <div className="flex flex-col gap-10">
                  <Header onLogout={handleLogout} />
                  <Routes>
                    <Route path="/" element={<MainPage />} />
                    <Route path="/clients/:uuid" element={<ClientDetailPage />} />
                  </Routes>
                </div>
              </div>
            </main>
          </div>
        </div>
      </div>
    </>
  );
}
