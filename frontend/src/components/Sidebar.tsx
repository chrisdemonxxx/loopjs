import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  FiHome, 
  FiUsers, 
  FiSettings, 
  FiMonitor, 
  FiActivity, 
  FiShield, 
  FiDatabase,
  FiX,
  FiChevronDown,
  FiChevronRight,
  FiTerminal,
  FiCalendar,
  FiCpu
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

// Simplified menu items - only essential features
const getMenuItems = (userRole: string): MenuItem[] => [
  {
    id: 'dashboard',
    label: 'Overview',
    icon: <FiHome className="w-5 h-5" />,
    path: '/dashboard'
  },
  {
    id: 'clients',
    label: 'Clients',
    icon: <FiUsers className="w-5 h-5" />,
    path: '/clients'
  },
  {
    id: 'agent',
    label: 'Agent',
    icon: <FiCpu className="w-5 h-5" />,
    path: '/agent'
  },
  {
    id: 'terminal',
    label: 'Terminal',
    icon: <FiTerminal className="w-5 h-5" />,
    path: '/terminal'
  },
  {
    id: 'tasks',
    label: 'Tasks',
    icon: <FiCalendar className="w-5 h-5" />,
    path: '/tasks'
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: <FiSettings className="w-5 h-5" />,
    path: '/settings'
  }
];

const Sidebar: React.FC<SidebarProps> = ({ isOpen, toggleSidebar, activeTab, setActiveTab }) => {
  const location = useLocation();
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const [userRole, setUserRole] = useState<string>('admin');
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  
  // Get user role from localStorage on component mount
  useEffect(() => {
    const role = localStorage.getItem('userRole') || 'admin';
    setUserRole(role);
    setMenuItems(getMenuItems(role));
  }, []);

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

  const renderMenuItem = (item: MenuItem) => {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedItems.includes(item.id);
    const isItemActive = item.path ? isActive(item.path) : false;

    return (
      <div key={item.id} className="mb-2">
        {hasChildren ? (
          <div>
            <button
              onClick={() => toggleExpanded(item.id)}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-lg text-left transition-colors ${
                isItemActive 
                  ? 'bg-primary text-white' 
                  : 'text-bodydark hover:bg-gray-2 dark:hover:bg-meta-4'
              }`}
            >
              <div className="flex items-center space-x-3">
                {item.icon}
                <span className="font-medium">{item.label}</span>
              </div>
              {isExpanded ? (
                <FiChevronDown className="w-4 h-4" />
              ) : (
                <FiChevronRight className="w-4 h-4" />
              )}
            </button>
            
            {isExpanded && (
              <div className="ml-8 mt-2 space-y-1">
                {item.children!.map(child => (
                  <Link
                    key={child.id}
                    to={child.path!}
                    className={`flex items-center space-x-3 px-4 py-2 rounded-lg text-sm transition-colors ${
                      isActive(child.path!)
                        ? 'bg-primary text-white'
                        : 'text-bodydark2 hover:bg-gray-2 dark:hover:bg-meta-4'
                    }`}
                  >
                    {child.icon}
                    <span>{child.label}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        ) : (
          <Link
            to={item.path!}
            className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
              isItemActive 
                ? 'bg-primary text-white' 
                : 'text-bodydark hover:bg-gray-2 dark:hover:bg-meta-4'
            }`}
          >
            {item.icon}
            <span className="font-medium">{item.label}</span>
          </Link>
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
      <div className={`fixed left-0 top-0 z-50 h-full w-64 bg-white dark:bg-boxdark shadow-xl transform transition-all duration-300 ease-in-out lg:relative lg:translate-x-0 ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-stroke dark:border-strokedark">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <FiMonitor className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-xl font-bold text-black dark:text-white">C2 Panel</h2>
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
            <p>© 2024 C2 Panel</p>
            <p>Version 2.0.0</p>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;