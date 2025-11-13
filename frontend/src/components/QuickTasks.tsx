import { useState } from 'react';
import { List, X, Minimize2, Plus, CheckCircle, Clock, AlertCircle, Trash2 } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { useTheme } from '../contexts/ThemeContext';
import { Badge } from './ui/badge';

interface QuickTasksProps {
  client: {
    id: string;
    computerName: string;
  };
  onClose: () => void;
}

interface Task {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  createdAt: Date;
}

export default function QuickTasks({ client, onClose }: QuickTasksProps) {
  const { colors } = useTheme();
  const [isMinimized, setIsMinimized] = useState(false);
  const [newTaskName, setNewTaskName] = useState('');
  const [tasks, setTasks] = useState<Task[]>([
    { id: '1', name: 'Screenshot Capture', status: 'completed', progress: 100, createdAt: new Date(Date.now() - 120000) },
    { id: '2', name: 'File Download: document.pdf', status: 'running', progress: 65, createdAt: new Date(Date.now() - 60000) },
    { id: '3', name: 'System Info Gathering', status: 'pending', progress: 0, createdAt: new Date() },
  ]);

  const addTask = () => {
    if (!newTaskName.trim()) return;
    
    const newTask: Task = {
      id: Date.now().toString(),
      name: newTaskName,
      status: 'pending',
      progress: 0,
      createdAt: new Date()
    };
    
    setTasks(prev => [...prev, newTask]);
    setNewTaskName('');
  };

  const removeTask = (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  const getStatusIcon = (status: Task['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-400" />;
      case 'running':
        return <Clock className="h-4 w-4 text-blue-400 animate-spin" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-400" />;
      default:
        return <Clock className="h-4 w-4 text-slate-400" />;
    }
  };

  const getStatusBadge = (status: Task['status']) => {
    const variants = {
      pending: 'border-slate-500/50 bg-slate-500/10 text-slate-400',
      running: 'border-blue-500/50 bg-blue-500/10 text-blue-400',
      completed: 'border-green-500/50 bg-green-500/10 text-green-400',
      failed: 'border-red-500/50 bg-red-500/10 text-red-400'
    };
    
    return (
      <Badge variant="outline" className={`text-xs ${variants[status]}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  if (isMinimized) {
    return (
      <div 
        className="fixed bottom-4 right-4 z-50 backdrop-blur-xl rounded-lg border cursor-pointer animate-in slide-in-from-bottom-4"
        style={{
          background: `linear-gradient(to right, ${colors.cardGradientFrom}f5, ${colors.cardGradientTo}f5)`,
          border: `1px solid ${colors.border}`,
          boxShadow: `0 8px 32px ${colors.glowColor}`
        }}
        onClick={() => setIsMinimized(false)}
      >
        <div className="px-4 py-2 flex items-center gap-2">
          <List className="h-4 w-4" style={{ color: colors.primary }} />
          <span className="text-sm text-slate-200">Tasks - {client.computerName}</span>
          <Badge variant="outline" className="text-xs border-blue-500/50 bg-blue-500/10 text-blue-400">
            {tasks.filter(t => t.status === 'running').length}
          </Badge>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-[500px] h-[450px] backdrop-blur-xl rounded-lg border flex flex-col overflow-hidden animate-in slide-in-from-bottom-4"
      style={{
        background: `linear-gradient(to bottom right, ${colors.cardGradientFrom}f5, ${colors.cardGradientTo}f5)`,
        border: `1px solid ${colors.border}`,
        boxShadow: `0 20px 60px ${colors.glowColor}`
      }}>
      
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b" style={{ borderColor: colors.border }}>
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded" style={{
            backgroundColor: `${colors.primary}20`,
            border: `1px solid ${colors.primary}40`
          }}>
            <List className="h-4 w-4" style={{ color: colors.primary }} />
          </div>
          <div>
            <h3 className="text-sm text-slate-100">Task Manager</h3>
            <p className="text-xs text-slate-400">{client.computerName}</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setIsMinimized(true)}
            className="h-7 w-7 p-0 hover:bg-slate-700/50"
          >
            <Minimize2 className="h-3 w-3 text-slate-400" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={onClose}
            className="h-7 w-7 p-0 hover:bg-red-500/20 text-red-400"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 p-3 border-b" style={{ borderColor: colors.border }}>
        <div className="text-center p-2 rounded" style={{
          background: `${colors.cardGradientFrom}80`,
          border: `1px solid ${colors.border}`
        }}>
          <div className="text-lg text-slate-100">{tasks.length}</div>
          <div className="text-xs text-slate-400">Total</div>
        </div>
        <div className="text-center p-2 rounded bg-blue-500/10 border border-blue-500/30">
          <div className="text-lg text-blue-400">{tasks.filter(t => t.status === 'running').length}</div>
          <div className="text-xs text-slate-400">Running</div>
        </div>
        <div className="text-center p-2 rounded bg-green-500/10 border border-green-500/30">
          <div className="text-lg text-green-400">{tasks.filter(t => t.status === 'completed').length}</div>
          <div className="text-xs text-slate-400">Completed</div>
        </div>
      </div>

      {/* Task List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {tasks.map(task => (
          <div 
            key={task.id} 
            className="p-3 rounded-lg border"
            style={{
              background: `${colors.cardGradientFrom}60`,
              borderColor: colors.border
            }}
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-start gap-2 flex-1">
                {getStatusIcon(task.status)}
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm text-slate-200 truncate">{task.name}</h4>
                  <p className="text-xs text-slate-500">{task.createdAt.toLocaleTimeString()}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {getStatusBadge(task.status)}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => removeTask(task.id)}
                  className="h-6 w-6 p-0 hover:bg-red-500/20 text-red-400"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
            
            {/* Progress Bar */}
            {task.status === 'running' && (
              <div className="mt-2">
                <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full transition-all duration-500"
                    style={{
                      width: `${task.progress}%`,
                      background: `linear-gradient(to right, ${colors.primary}, ${colors.primaryDark})`
                    }}
                  />
                </div>
                <p className="text-xs text-slate-400 mt-1">{task.progress}%</p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add Task */}
      <div className="p-3 border-t flex gap-2" style={{ borderColor: colors.border }}>
        <Input
          value={newTaskName}
          onChange={(e) => setNewTaskName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addTask()}
          placeholder="New task name..."
          className="flex-1 h-8 text-xs border-slate-600 bg-slate-900/50 text-slate-200 placeholder:text-slate-500"
        />
        <Button
          size="sm"
          onClick={addTask}
          className="h-8 px-3 text-white text-xs"
          style={{
            background: `linear-gradient(to right, ${colors.primary}, ${colors.primaryDark})`
          }}
        >
          <Plus className="h-3 w-3 mr-1" />
          Add
        </Button>
      </div>
    </div>
  );
}
