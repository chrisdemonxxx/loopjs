import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import Dashboard from './Dashboard';
import UserTable from './UserTable';
import UserManagement from './UserManagement';
import SystemMonitoring from './SystemMonitoring';
import TaskManagement from './TaskManagement';
import AuditLogs from './AuditLogs';
import SettingsPage from './SettingsPage';
import Settings from './Settings';
import LoadingSpinner from './LoadingSpinner';

interface LayoutProps {
  children: React.ReactNode;
  onLogout: () => void;
}

const Layout: React.FC<LayoutProps> = ({ children, onLogout }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isLoading, setIsLoading] = useState(false);

  // Mock data for tables
  const tableData = [
    { id: 1, name: 'John Doe', email: 'john@example.com', role: 'Admin', status: 'Active', lastLogin: '2024-01-15' },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com', role: 'User', status: 'Active', lastLogin: '2024-01-14' },
    { id: 3, name: 'Bob Johnson', email: 'bob@example.com', role: 'Moderator', status: 'Inactive', lastLogin: '2024-01-10' }
  ];

  const onActionClicked = (action: string, user: any) => {
    console.log('Action clicked:', action, user);
  };

  const onTasksClicked = (user: any) => {
    console.log('Tasks clicked for user:', user);
  };

  // Update active tab based on current route
  useEffect(() => {
    const path = location.pathname.substring(1) || 'dashboard';
    setActiveTab(path);
  }, [location]);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      <Sidebar 
        isOpen={sidebarOpen} 
        toggleSidebar={toggleSidebar}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          onLogout={onLogout} 
          onToggleSidebar={toggleSidebar}
          isSidebarOpen={sidebarOpen}
        />

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 animate-fade-in-up">
          <div className="max-w-7xl mx-auto w-full">
            <Routes>
               <Route path="/dashboard" element={<Dashboard />} />
               <Route 
                 path="/clients" 
                 element={
                   isLoading ? (
                     <div className="flex justify-center items-center h-64 animate-fade-in-up">
                       <LoadingSpinner size="lg" />
                     </div>
                   ) : (
                     <UserTable
                       users={tableData}
                       onActionClick={onActionClicked}
                       onTasksClick={onTasksClicked}
                     />
                   )
                 }
               />
               <Route path="/monitoring" element={<SystemMonitoring tableData={tableData} />} />
               <Route path="/tasks" element={<TaskManagement />} />
               <Route 
                 path="/user-list" 
                 element={
                   <UserTable 
                     users={tableData} 
                     onActionClick={onActionClicked} 
                     onTasksClick={onTasksClicked} 
                   />
                 } 
               />
               <Route path="/roles" element={<UserManagement />} />
               <Route path="/audit" element={<AuditLogs />} />
               <Route path="/settings" element={<Settings />} />
               <Route path="/general" element={<Settings />} />
               <Route path="/security" element={<Settings />} />
               <Route path="/appearance" element={<Settings />} />
               <Route path="/" element={<Navigate to="/dashboard" replace />} />
             </Routes>
          </div>
        </main>

        {/* Status Bar */}
        <footer className="bg-white dark:bg-boxdark border-t border-stroke dark:border-strokedark px-6 py-2">
          <div className="flex items-center justify-between text-xs text-bodydark2">
            <div className="flex items-center space-x-4">
              <span>Status: Online</span>
              <span className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-success rounded-full"></div>
                <span>All systems operational</span>
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <span>Last updated: {new Date().toLocaleTimeString()}</span>
              <span>Version 2.0.0</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Layout;