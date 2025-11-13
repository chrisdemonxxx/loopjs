import { ActiveView } from '../App';
import { LayoutDashboard, Users, Terminal, Brain, ListChecks, Shield, Settings, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './ui/button';

interface SidebarProps {
  activeView: ActiveView;
  setActiveView: (view: ActiveView) => void;
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
}

export function Sidebar({ activeView, setActiveView, collapsed, setCollapsed }: SidebarProps) {
  const menuItems = [
    { id: 'overview' as ActiveView, icon: LayoutDashboard, label: 'Overview' },
    { id: 'clients' as ActiveView, icon: Users, label: 'Clients' },
    { id: 'terminal' as ActiveView, icon: Terminal, label: 'Terminal' },
    { id: 'ai-insights' as ActiveView, icon: Brain, label: 'AI Insights' },
    { id: 'tasks' as ActiveView, icon: ListChecks, label: 'Tasks' },
    { id: 'security' as ActiveView, icon: Shield, label: 'Security' },
    { id: 'settings' as ActiveView, icon: Settings, label: 'Settings' },
  ];

  return (
    <div className={`bg-slate-900 border-r border-slate-800 flex flex-col transition-all duration-300 ${collapsed ? 'w-16' : 'w-64'}`}>
      <div className="p-4 border-b border-slate-800 flex items-center justify-between">
        {!collapsed && (
          <div>
            <h1 className="text-cyan-400 tracking-wider">C2 PANEL</h1>
            <p className="text-slate-500 text-xs mt-1">Command & Control</p>
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className="text-slate-400 hover:text-slate-100 hover:bg-slate-800"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                isActive 
                  ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' 
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/50'
              }`}
              title={collapsed ? item.label : undefined}
            >
              <Icon className="h-5 w-5 flex-shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </button>
          );
        })}
      </nav>

      <div className={`p-4 border-t border-slate-800 ${collapsed ? 'hidden' : 'block'}`}>
        <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700">
          <div className="flex items-center gap-2 mb-2">
            <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-green-400 text-xs">OPERATIONAL</span>
          </div>
          <p className="text-slate-400 text-xs">System Status: Active</p>
        </div>
      </div>
    </div>
  );
}
