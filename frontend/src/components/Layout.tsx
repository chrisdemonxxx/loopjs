import React, { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import Dashboard from './Dashboard';
import UserTable from './UserTable';
import UserManagement from './UserManagement';
import SystemMonitoring from './SystemMonitoring';
import TaskManagement from './TaskManagement';
import AuditLogs from './AuditLogs';
import Settings from './Settings';
import AgentSection from './AgentSection';
import LoadingSpinner from './LoadingSpinner';
import CommandInterface from './CommandInterface';

interface LayoutProps {
  tableData: any[];
  isLoading: boolean;
  onActionClicked: (user: any) => void;
  onTasksClicked: (user: any) => void;
  onLogout: () => void;
}

const Layout: React.FC<LayoutProps> = ({ 
  tableData, 
  isLoading, 
  onActionClicked, 
  onTasksClicked, 
  onLogout 
}) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);

  const handleViewUser = (user: any) => {
    setSelectedUser(user);
    onActionClicked(user);
  };

  const handleViewTasks = (user: any) => {
    onTasksClicked(user);
  };

  const handleExecuteCommand = async (command: string, args?: string[]) => {
    if (!selectedUser) return;
    
    try {
      const response = await fetch('/api/commands/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clientId: selectedUser.id,
          command,
          args: args || []
        }),
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Command executed:', result);
        // You might want to show a success message or update the UI
      } else {
        console.error('Failed to execute command');
      }
    } catch (error) {
      console.error('Error executing command:', error);
    }
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
        <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          onLogout={onLogout} 
          onToggleSidebar={toggleSidebar}
          isSidebarOpen={isSidebarOpen}
        />

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 animate-fade-in-up">
          <div className="max-w-7xl mx-auto w-full">
            <Routes>
               <Route path="/dashboard" element={<Dashboard tableData={tableData} />} />
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
                       onViewUser={handleViewUser}
                       onViewTasks={handleViewTasks}
                     />
                   )
                 }
               />
               <Route path="/monitoring" element={<SystemMonitoring tableData={tableData} />} />
               <Route path="/tasks" element={<TaskManagement />} />
               <Route path="/agent" element={<AgentSection />} />
               <Route 
                 path="/user-list" 
                 element={
                   <UserTable 
                     users={tableData} 
                     onViewUser={handleViewUser} 
                     onViewTasks={handleViewTasks} 
                   />
                 } 
               />
               <Route path="/roles" element={<UserManagement />} />
               <Route path="/audit" element={<AuditLogs />} />
                <Route
                  path="/commands"
                  element={
                    <CommandInterface
                      selectedAgent={selectedUser}
                      onExecuteCommand={handleExecuteCommand}
                    />
                  }
                />
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