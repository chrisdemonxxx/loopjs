import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  FiHome, 
  FiUsers, 
  FiSettings, 
  FiMonitor, 
  FiActivity, 
  FiShield, 
  FiDatabase,
  FiMenu,
  FiX,
  FiChevronDown,
  FiChevronRight
} from 'react-icons/fi';

interface SidebarProps {
  isOpen: boolean;
  toggleSidebar: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

interface MenuItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  path?: string;
  children?: MenuItem[];
}

const menuItems: MenuItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: <FiHome className="w-5 h-5" />,
    path: '/dashboard'
  },
  {
    id: 'systems',
    label: 'System Management',
    icon: <FiMonitor className="w-5 h-5" />,
    children: [
      { id: 'clients', label: 'Connected Clients', icon: <FiUsers className="w-4 h-4" />, path: '/clients' },
      { id: 'monitoring', label: 'System Monitoring', icon: <FiActivity className="w-4 h-4" />, path: '/monitoring' },
      { id: 'tasks', label: 'Task Management', icon: <FiDatabase className="w-4 h-4" />, path: '/tasks' }
    ]
  },
  {
    id: 'users',
    label: 'User Management',
    icon: <FiUsers className="w-5 h-5" />,
    children: [
      { id: 'user-list', label: 'All Users', icon: <FiUsers className="w-4 h-4" />, path: '/user-list' },
      { id: 'roles', label: 'Roles & Permissions', icon: <FiShield className="w-4 h-4" />, path: '/roles' },
      { id: 'audit', label: 'Audit Logs', icon: <FiDatabase className="w-4 h-4" />, path: '/audit' }
    ]
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: <FiSettings className="w-5 h-5" />,
    children: [
      { id: 'general', label: 'General Settings', icon: <FiSettings className="w-4 h-4" />, path: '/general' },
      { id: 'security', label: 'Security', icon: <FiShield className="w-4 h-4" />, path: '/security' },
      { id: 'appearance', label: 'Appearance', icon: <FiMonitor className="w-4 h-4" />, path: '/appearance' }
    ]
  }
];

const Sidebar: React.FC<SidebarProps> = ({ isOpen, toggleSidebar, activeTab, setActiveTab }) => {
  const location = useLocation();
  const [expandedItems, setExpandedItems] = useState<string[]>(['systems']);

  const toggleExpanded = (itemId: string) => {
    setExpandedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const renderMenuItem = (item: MenuItem, level: number = 0) => {
    const isExpanded = expandedItems.includes(item.id);
    const isActiveTab = activeTab === item.id;
    const hasChildren = item.children && item.children.length > 0;

    return (
      <div key={item.id} className="mb-1">
        {hasChildren ? (
          <button
            onClick={() => toggleExpanded(item.id)}
            className={`w-full flex items-center justify-between px-4 py-3 text-left rounded-lg transition-all duration-200 ease-in-out hover-scale focus-ring group ${
              isExpanded 
                ? 'bg-gray-2 dark:bg-meta-4 text-primary shadow-md' 
                : 'text-bodydark hover:bg-gray-2 dark:hover:bg-meta-4 hover:text-black dark:hover:text-white'
            } ${level > 0 ? 'ml-4 text-sm' : ''}`}
          >
            <div className="flex items-center space-x-3">
              <span className={`transition-colors duration-200 ${
                isExpanded ? 'text-primary' : 'text-bodydark2 group-hover:text-primary'
              }`}>
                {item.icon}
              </span>
              <span className="font-medium">{item.label}</span>
            </div>
            <span className="transition-transform duration-200">
              {isExpanded ? <FiChevronDown className="w-4 h-4" /> : <FiChevronRight className="w-4 h-4" />}
            </span>
          </button>
        ) : (
          <Link
            to={item.path!}
            onClick={() => setActiveTab(item.id)}
            className={`w-full flex items-center justify-between px-4 py-3 text-left rounded-lg transition-all duration-200 ease-in-out hover-scale focus-ring group ${
              isActive(item.path!) 
                ? 'bg-primary text-white shadow-lg' 
                : 'text-bodydark hover:bg-gray-2 dark:hover:bg-meta-4 hover:text-black dark:hover:text-white'
            } ${level > 0 ? 'ml-4 text-sm' : ''}`}
          >
            <div className="flex items-center space-x-3">
              <span className={`transition-colors duration-200 ${
                isActive(item.path!) ? 'text-white' : 'text-bodydark2 group-hover:text-primary'
              }`}>
                {item.icon}
              </span>
              <span className="font-medium">{item.label}</span>
            </div>
          </Link>
        )}
        
        {hasChildren && isExpanded && (
          <div className="mt-1 space-y-1">
            {item.children?.map(child => (
              <div key={child.id} className="mb-1">
                <Link
                  to={child.path!}
                  onClick={() => setActiveTab(child.id)}
                  className={`w-full flex items-center px-4 py-2 text-left text-sm rounded-lg transition-all duration-200 ease-in-out hover-scale focus-ring group ml-4 ${
                    isActive(child.path!) 
                      ? 'bg-primary/10 text-primary border-l-2 border-primary shadow-md' 
                      : 'text-bodydark2 hover:bg-gray-2 dark:hover:bg-meta-4 hover:text-primary'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <span className={`transition-colors duration-200 ${
                      isActive(child.path!) ? 'text-primary' : 'text-bodydark2 group-hover:text-primary'
                    }`}>
                      {child.icon}
                    </span>
                    <span className="font-medium">{child.label}</span>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden animate-fade-in-up"
          onClick={toggleSidebar}
        />
      )}
      
      {/* Sidebar */}
      <div className={`fixed left-0 top-0 z-50 h-full w-72 bg-white dark:bg-boxdark shadow-xl transform transition-all duration-300 ease-in-out lg:relative lg:translate-x-0 ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-stroke dark:border-strokedark">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <FiMonitor className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-xl font-bold text-black dark:text-white">LoopJS</h2>
          </div>
          <button
            onClick={toggleSidebar}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-2 dark:hover:bg-meta-4 transition-colors"
          >
            <FiX className="w-5 h-5 text-bodydark" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-2 h-full overflow-y-auto">
          {menuItems.map(item => renderMenuItem(item))}
        </nav>

        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-stroke dark:border-strokedark">
          <div className="text-xs text-bodydark2 text-center">
            <p>© 2024 LoopJS Panel</p>
            <p>Version 2.0.0</p>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;