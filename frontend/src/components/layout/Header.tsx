import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Menu, 
  Bell, 
  Search, 
  Wifi, 
  WifiOff, 
  Loader2,
  AlertCircle,
  User,
  LogOut,
  Settings,
  Moon,
  Sun
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useTheme } from '@/contexts/ThemeContext';
import { cn } from '@/lib/utils';

interface HeaderProps {
  onMenuClick: () => void;
  onLogout: () => void;
  wsConnectionStatus?: 'disconnected' | 'connecting' | 'connected' | 'error';
}

const Header: React.FC<HeaderProps> = ({ 
  onMenuClick, 
  onLogout, 
  wsConnectionStatus 
}) => {
  const { mode, toggleMode } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');

  const getConnectionStatus = () => {
    switch (wsConnectionStatus) {
      case 'connected':
        return { icon: Wifi, color: 'text-green-400', bg: 'bg-green-500/20', label: 'Connected' };
      case 'connecting':
        return { icon: Loader2, color: 'text-yellow-400', bg: 'bg-yellow-500/20', label: 'Connecting' };
      case 'error':
        return { icon: AlertCircle, color: 'text-red-400', bg: 'bg-red-500/20', label: 'Error' };
      default:
        return { icon: WifiOff, color: 'text-slate-400', bg: 'bg-slate-500/20', label: 'Disconnected' };
    }
  };

  const connectionStatus = getConnectionStatus();
  const StatusIcon = connectionStatus.icon;

  return (
    <header className="sticky top-0 z-30 glass-dark border-b border-slate-700/50 backdrop-blur-xl">
      <div className="flex h-16 items-center justify-between px-6">
        {/* Left side */}
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={onMenuClick}
            className="lg:hidden text-slate-400 hover:text-white hover:bg-slate-700/50"
          >
            <Menu className="h-5 w-5" />
          </Button>

          {/* Search */}
          <div className="hidden md:block relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search clients, commands..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-80 glass-dark border-slate-600/50 text-white placeholder:text-slate-400 focus:border-purple-400/50 focus:ring-purple-400/20"
            />
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center space-x-4">
          {/* Connection Status */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="flex items-center space-x-2"
          >
            <div className={cn(
              'flex items-center space-x-2 px-3 py-1.5 rounded-full glass-transition',
              connectionStatus.bg
            )}>
              <StatusIcon className={cn(
                'h-4 w-4',
                connectionStatus.color,
                wsConnectionStatus === 'connecting' && 'animate-spin'
              )} />
              <span className={cn('text-sm font-medium', connectionStatus.color)}>
                {connectionStatus.label}
              </span>
            </div>
          </motion.div>

          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleMode}
            className="text-slate-400 hover:text-white hover:bg-slate-700/50"
          >
            {mode === 'dark' ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
          </Button>

          {/* Notifications */}
          <Button
            variant="ghost"
            size="sm"
            className="relative text-slate-400 hover:text-white hover:bg-slate-700/50"
          >
            <Bell className="h-5 w-5" />
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
            >
              3
            </Badge>
          </Button>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="relative h-8 w-8 rounded-full glass-dark hover:glass-hover-dark"
              >
                <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-xs font-bold text-white">A</span>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 glass-dark border-slate-700/50" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none text-white">Admin User</p>
                  <p className="text-xs leading-none text-slate-400">admin@loopjs.com</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-slate-700/50" />
              <DropdownMenuItem className="text-slate-300 hover:text-white hover:bg-slate-700/50">
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="text-slate-300 hover:text-white hover:bg-slate-700/50">
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-slate-700/50" />
              <DropdownMenuItem 
                className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                onClick={onLogout}
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};

export default Header;
