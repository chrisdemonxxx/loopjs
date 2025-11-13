import { BarChart3, Users, Bot, Terminal, Brain, FileText, ListTodo, Settings } from 'lucide-react';
import { TabType } from '../App';

interface NavigationProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
}

const tabs = [
  { id: 'overview' as TabType, label: 'Overview', icon: BarChart3 },
  { id: 'clients' as TabType, label: 'Clients', icon: Users },
  { id: 'agent' as TabType, label: 'Agent', icon: Bot },
  { id: 'terminal' as TabType, label: 'AI Terminal', icon: Terminal },
  { id: 'insights' as TabType, label: 'AI Insights', icon: Brain },
  { id: 'logs' as TabType, label: 'Logs', icon: FileText },
  { id: 'tasks' as TabType, label: 'Tasks', icon: ListTodo },
  { id: 'settings' as TabType, label: 'Settings', icon: Settings },
];

export function Navigation({ activeTab, setActiveTab }: NavigationProps) {
  return (
    <nav className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm">
      <div className="container mx-auto px-6">
        <div className="flex gap-2 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 whitespace-nowrap px-6 py-4 transition-all ${
                  isActive
                    ? 'border-b-2 border-indigo-500 bg-gradient-to-b from-indigo-500/10 to-transparent text-indigo-400'
                    : 'border-b-2 border-transparent text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span className="text-sm">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
