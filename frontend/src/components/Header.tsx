import { ActiveView } from '../App';
import { Bell, Search, User } from 'lucide-react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Badge } from './ui/badge';

interface HeaderProps {
  activeView: ActiveView;
}

export function Header({ activeView }: HeaderProps) {
  const getTitle = () => {
    switch (activeView) {
      case 'overview': return 'Dashboard Overview';
      case 'clients': return 'Client Management';
      case 'terminal': return 'Remote Terminal';
      case 'ai-insights': return 'AI Security Insights';
      case 'tasks': return 'Task Management';
      case 'security': return 'Security Center';
      case 'settings': return 'System Settings';
      default: return 'Dashboard';
    }
  };

  return (
    <header className="bg-slate-900 border-b border-slate-800 px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-slate-100">{getTitle()}</h2>
          <p className="text-slate-500 text-xs mt-0.5">Real-time monitoring and management</p>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative hidden md:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <Input 
              placeholder="Search..."
              className="pl-10 w-64 bg-slate-800 border-slate-700 text-slate-100 placeholder:text-slate-500"
            />
          </div>

          <Button variant="ghost" size="icon" className="relative text-slate-400 hover:text-slate-100">
            <Bell className="h-5 w-5" />
            <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-red-500 text-white text-xs">
              3
            </Badge>
          </Button>

          <div className="flex items-center gap-2 pl-4 border-l border-slate-800">
            <div className="text-right hidden sm:block">
              <p className="text-slate-100 text-sm">Admin</p>
              <p className="text-slate-500 text-xs">Operator</p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
              <User className="h-5 w-5 text-white" />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
