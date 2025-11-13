import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Home, 
  Users, 
  Settings, 
  Monitor, 
  Activity, 
  Shield, 
  Database,
  X,
  ChevronDown,
  ChevronRight,
  Terminal,
  Calendar,
  Cpu,
  LayoutDashboard,
  FileText,
  Server,
  Zap
} from 'lucide-react';

interface PremiumSidebarProps {
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
  badge?: string;
  children?: MenuItem[];
}

const getMenuItems = (userRole: string): MenuItem[] => [
  {
    id: 'dashboard',
    label: 'Overview',
    icon: <LayoutDashboard className="w-5 h-5" />,
    path: '/dashboard'
  },
  {
    id: 'clients',
    label: 'Clients',
    icon: <Users className="w-5 h-5" />,
    path: '/clients'
  },
  {
    id: 'agent',
    label: 'Agent',
    icon: <Cpu className="w-5 h-5" />,
    path: '/agent'
  },
  {
    id: 'terminal',
    label: 'Terminal',
    icon: <Terminal className="w-5 h-5" />,
    path: '/terminal'
  },
  {
    id: 'tasks',
    label: 'Tasks',
    icon: <Calendar className="w-5 h-5" />,
    path: '/tasks'
  },
  {
    id: 'logs',
    label: 'Logs',
    icon: <FileText className="w-5 h-5" />,
    path: '/logs'
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: <Settings className="w-5 h-5" />,
    path: '/settings'
  }
];

const PremiumSidebar: React.FC<PremiumSidebarProps> = ({ isOpen, toggleSidebar, activeTab, setActiveTab }) => {
  const location = useLocation();
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const [userRole, setUserRole] = useState<string>('admin');
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  
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
      <div key={item.id} className="mb-1">
        {hasChildren ? (
          <div>
            <button
              onClick={() => toggleExpanded(item.id)}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-left transition-all duration-200 group ${
                isItemActive 
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/25' 
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/50'
              }`}
            >
              <div className="flex items-center space-x-3">
                <div className={`transition-transform duration-200 ${isItemActive ? 'scale-110' : 'group-hover:scale-110'}`}>
                  {item.icon}
                </div>
                <span className="font-medium text-sm">{item.label}</span>
              </div>
              {isExpanded ? (
                <ChevronDown className="w-4 h-4 transition-transform duration-200" />
              ) : (
                <ChevronRight className="w-4 h-4 transition-transform duration-200" />
              )}
            </button>
            
            {isExpanded && (
              <div className="ml-4 mt-2 space-y-1 border-l-2 border-slate-200 dark:border-slate-700 pl-4">
                {item.children!.map(child => (
                  <Link
                    key={child.id}
                    to={child.path!}
                    className={`flex items-center space-x-3 px-4 py-2 rounded-lg text-sm transition-all duration-200 ${
                      isActive(child.path!)
                        ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 font-medium'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/30'
                    }`}
                  >
                    {child.icon}
                    <span>{child.label}</span>
                    {child.badge && (
                      <span className="ml-auto px-2 py-0.5 text-xs bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 rounded-full">
                        {child.badge}
                      </span>
                    )}
                  </Link>
                ))}
              </div>
            )}
          </div>
        ) : (
          <Link
            to={item.path!}
            className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
              isItemActive 
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/25' 
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/50'
            }`}
          >
            <div className={`transition-transform duration-200 ${isItemActive ? 'scale-110' : 'group-hover:scale-110'}`}>
              {item.icon}
            </div>
            <span className="font-medium text-sm flex-1">{item.label}</span>
            {item.badge && (
              <span className={`px-2 py-0.5 text-xs rounded-full ${
                isItemActive 
                  ? 'bg-white/20 text-white' 
                  : 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300'
              }`}>
                {item.badge}
              </span>
            )}
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
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300"
          onClick={toggleSidebar}
        />
      )}
      
      {/* Sidebar */}
      <div className={`fixed left-0 top-0 z-50 h-full w-72 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-r border-slate-200/50 dark:border-slate-700/50 shadow-2xl transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 ${
        isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200/50 dark:border-slate-700/50">
          <Link to="/dashboard" className="flex items-center space-x-3 group">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/25 group-hover:scale-110 transition-transform duration-200">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                LoopJS
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">C2 Panel</p>
            </div>
          </Link>
          <button
            onClick={toggleSidebar}
            className="lg:hidden p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors duration-200"
          >
            <X className="w-5 h-5 text-slate-600 dark:text-slate-400" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-2 h-[calc(100vh-200px)] overflow-y-auto premium-scrollbar">
          {menuItems.map(item => renderMenuItem(item))}
        </nav>

        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-200/50 dark:border-slate-700/50 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">System Online</span>
            </div>
            <Zap className="w-4 h-4 text-indigo-500" />
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-500 text-center">
            © 2024 LoopJS • v2.0.0
          </p>
        </div>
      </div>
    </>
  );
};

export default PremiumSidebar;

