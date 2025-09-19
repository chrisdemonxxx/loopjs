import React, { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import {
  FiBell,
  FiSearch,
  FiUser,
  FiSettings,
  FiLogOut,
  FiMenu,
  FiX,
  FiMoon,
  FiSun,
  FiMonitor,
  FiTerminal,
  FiZap,
  FiEye,
  FiShield
} from 'react-icons/fi';

interface HeaderProps {
  onLogout: () => void;
  onToggleSidebar?: () => void;
  isSidebarOpen?: boolean;
}

const Header: React.FC<HeaderProps> = ({ onLogout, onToggleSidebar, isSidebarOpen }) => {
  const { mode, isDark, toggleMode } = useTheme();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  return (
    <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {/* Mobile menu button */}
          {onToggleSidebar && (
            <button
              onClick={onToggleSidebar}
              className="md:hidden p-2 text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-primary hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all duration-200 ease-in-out hover-scale focus-ring"
            >
              {isSidebarOpen ? <FiX className="w-5 h-5" /> : <FiMenu className="w-5 h-5" />}
            </button>
          )}
          
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
            Windows System Management
          </h1>
        </div>

        <div className="flex items-center space-x-2">
          {/* Search Bar */}
          <div className="hidden md:flex items-center flex-1 max-w-md mx-4">
            <div className="relative w-full">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              />
            </div>
          </div>

          {/* Theme Toggle */}
          <button
            onClick={toggleMode}
            className="p-2 text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-primary hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all duration-200 ease-in-out hover-scale focus-ring"
            title={`Current: ${mode === 'system' ? `System (${isDark ? 'Dark' : 'Light'})` : mode.charAt(0).toUpperCase() + mode.slice(1)}`}
          >
            {mode === 'light' && <FiSun className="w-5 h-5" />}
            {mode === 'dark' && <FiMoon className="w-5 h-5" />}
            {mode === 'system' && <FiMonitor className="w-5 h-5" />}
            {mode === 'hacker' && <FiTerminal className="w-5 h-5" />}
            {mode === 'matrix' && <FiZap className="w-5 h-5" />}
            {mode === 'cyberpunk' && <FiEye className="w-5 h-5" />}
            {mode === 'redteam' && <FiShield className="w-5 h-5" />}
          </button>

          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => setIsNotificationOpen(!isNotificationOpen)}
              className="p-2 text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-primary hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all duration-200 ease-in-out hover-scale focus-ring relative"
            >
              <FiBell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
          </div>

          {/* Profile Menu */}
          <div className="relative">
            <button
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="p-2 text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-primary hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all duration-200 ease-in-out hover-scale focus-ring"
            >
              <FiUser className="w-5 h-5" />
            </button>
            
            {isProfileOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50 animate-scale-in">
                <button className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2">
                  <FiSettings className="w-4 h-4" />
                  <span>Settings</span>
                </button>
                <button 
                  onClick={onLogout}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200 ease-in-out focus-ring flex items-center space-x-2"
                >
                  <FiLogOut className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
