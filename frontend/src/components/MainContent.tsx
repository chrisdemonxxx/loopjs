import React from 'react';
import Dashboard from './Dashboard';
import UserTable from './UserTable';
import TasksModal from './TasksModal';
import SettingsPage from './SettingsPage';
import UserManagement from './UserManagement';
import SystemMonitoring from './SystemMonitoring';
import AuditLogs from './AuditLogs';
import TaskManagement from './TaskManagement';

interface MainContentProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  tableData: any[];
  onActionClicked: (action: string, user: any) => void;
  onTasksClicked: (user: any) => void;
}

const MainContent: React.FC<MainContentProps> = ({ 
  activeTab, 
  setActiveTab, 
  tableData, 
  onActionClicked, 
  onTasksClicked 
}) => {
  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard tableData={tableData} activeTab={activeTab} />;
      
      case 'clients':
        return (
          <div className="space-y-6">
            <div className="bg-white dark:bg-boxdark rounded-lg shadow-sm border border-stroke dark:border-strokedark p-6">
              <h2 className="text-xl font-semibold text-black dark:text-white mb-4">Connected Clients</h2>
              <UserTable 
                data={tableData} 
                onActionClicked={onActionClicked} 
                onTasksClicked={onTasksClicked} 
              />
            </div>
          </div>
        );
      
      case 'monitoring':
        return <SystemMonitoring tableData={tableData} />;
      
      case 'tasks':
        return <TaskManagement />;
      
      case 'user-list':
        return <UserManagement />;
      
      case 'roles':
        return (
          <div className="space-y-6">
            <div className="bg-white dark:bg-boxdark rounded-lg shadow-sm border border-stroke dark:border-strokedark p-6">
              <h2 className="text-xl font-semibold text-black dark:text-white mb-4">Roles & Permissions</h2>
              <div className="text-center py-12">
                <p className="text-bodydark2 mb-4">Role management system coming soon...</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
                  {[
                    { name: 'Administrator', users: 2, color: 'bg-danger' },
                    { name: 'Operator', users: 5, color: 'bg-warning' },
                    { name: 'Viewer', users: 12, color: 'bg-success' }
                  ].map((role, index) => (
                    <div key={index} className="bg-gray-2 dark:bg-meta-4 rounded-lg p-4">
                      <div className={`w-12 h-12 ${role.color} rounded-lg flex items-center justify-center mx-auto mb-3`}>
                        <span className="text-white font-bold">{role.name[0]}</span>
                      </div>
                      <h3 className="font-semibold text-black dark:text-white text-center">{role.name}</h3>
                      <p className="text-sm text-bodydark2 text-center">{role.users} users</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );
      
      case 'audit':
        return <AuditLogs />;
      
      case 'general':
      case 'security':
      case 'appearance':
        return <SettingsPage activeTab={activeTab} />;
      
      default:
        return <Dashboard tableData={tableData} activeTab={activeTab} />;
    }
  };

  return (
    <div className="min-h-full">
      {renderContent()}
    </div>
  );
};

export default MainContent;