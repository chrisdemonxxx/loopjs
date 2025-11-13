import React from 'react';
import { motion } from 'framer-motion';
import { 
  LayoutDashboard, 
  Users, 
  Terminal, 
  CheckSquare, 
  Settings, 
  FileText, 
  Brain,
  Shield,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface SidebarProps {
  onClose: () => void;
}

const navigationItems = [
  {
    name: 'Overview',
    href: '#overview',
    icon: LayoutDashboard,
    current: true,
  },
  {
    name: 'Clients',
    href: '#clients',
    icon: Users,
    current: false,
  },
  {
    name: 'Terminal',
    href: '#terminal',
    icon: Terminal,
    current: false,
  },
  {
    name: 'Tasks',
    href: '#tasks',
    icon: CheckSquare,
    current: false,
  },
  {
    name: 'AI Insights',
    href: '#ai',
    icon: Brain,
    current: false,
  },
  {
    name: 'Audit Logs',
    href: '#logs',
    icon: FileText,
    current: false,
  },
  {
    name: 'Settings',
    href: '#settings',
    icon: Settings,
    current: false,
  },
];

const Sidebar: React.FC<SidebarProps> = ({ onClose }) => {
  return (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="flex h-16 items-center justify-between px-6 border-b border-slate-700/50">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 glass-purple rounded-lg flex items-center justify-center">
            <Shield className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">LoopJS</h1>
            <p className="text-xs text-slate-400">C2 Panel</p>
          </div>
        </div>
        
        {/* Close button for mobile */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="lg:hidden text-slate-400 hover:text-white hover:bg-slate-700/50"
        >
          <X className="h-5 w-5" />
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-2">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          return (
            <motion.a
              key={item.name}
              href={item.href}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={cn(
                'group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200',
                item.current
                  ? 'glass-purple text-white shadow-lg'
                  : 'text-slate-300 hover:text-white hover:glass-dark hover:glass-hover-dark'
              )}
            >
              <Icon
                className={cn(
                  'mr-3 h-5 w-5 flex-shrink-0 transition-colors',
                  item.current ? 'text-purple-300' : 'text-slate-400 group-hover:text-slate-300'
                )}
              />
              {item.name}
            </motion.a>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-slate-700/50">
        <div className="glass-dark rounded-lg p-3">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
              <span className="text-xs font-bold text-white">A</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">Admin User</p>
              <p className="text-xs text-slate-400 truncate">admin@loopjs.com</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
