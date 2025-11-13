import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { ListChecks, Plus, Play, Pause, CheckCircle2, Clock } from 'lucide-react';

interface Task {
  id: string;
  name: string;
  target: string;
  status: 'running' | 'completed' | 'scheduled' | 'paused';
  progress: number;
  startTime: string;
  estimatedCompletion?: string;
}

export function TasksPanel() {
  const [tasks] = useState<Task[]>([
    {
      id: '1',
      name: 'System Scan',
      target: 'DESKTOP-5X2A',
      status: 'running',
      progress: 45,
      startTime: '10:30 AM',
      estimatedCompletion: '11:15 AM'
    },
    {
      id: '2',
      name: 'Log Collection',
      target: 'All Clients',
      status: 'running',
      progress: 78,
      startTime: '10:00 AM',
      estimatedCompletion: '10:45 AM'
    },
    {
      id: '3',
      name: 'Security Update',
      target: 'WORKSTATION-42',
      status: 'scheduled',
      progress: 0,
      startTime: '2:00 PM',
      estimatedCompletion: '2:30 PM'
    },
    {
      id: '4',
      name: 'Backup Task',
      target: 'SERVER-MAIN',
      status: 'completed',
      progress: 100,
      startTime: '9:00 AM'
    },
    {
      id: '5',
      name: 'Network Analysis',
      target: 'CLIENT-03',
      status: 'paused',
      progress: 34,
      startTime: '9:45 AM'
    }
  ]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'running':
        return <Badge className="bg-blue-500/10 text-blue-500">Running</Badge>;
      case 'completed':
        return <Badge className="bg-green-500/10 text-green-500">Completed</Badge>;
      case 'scheduled':
        return <Badge className="bg-amber-500/10 text-amber-500">Scheduled</Badge>;
      case 'paused':
        return <Badge className="bg-slate-500/10 text-slate-500">Paused</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running':
        return <Play className="h-4 w-4 text-blue-500" />;
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'scheduled':
        return <Clock className="h-4 w-4 text-amber-500" />;
      case 'paused':
        return <Pause className="h-4 w-4 text-slate-500" />;
      default:
        return null;
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-slate-400">Schedule and manage automated tasks</p>
        </div>
        
        <Button className="bg-cyan-500 hover:bg-cyan-600 text-white">
          <Plus className="h-4 w-4 mr-2" />
          New Task
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <Input
          placeholder="Search tasks..."
          className="bg-slate-900 border-slate-800 text-slate-100"
        />
        
        <Select defaultValue="all">
          <SelectTrigger className="w-full sm:w-48 bg-slate-900 border-slate-800 text-slate-100">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-slate-800 border-slate-700">
            <SelectItem value="all">All Tasks</SelectItem>
            <SelectItem value="running">Running</SelectItem>
            <SelectItem value="scheduled">Scheduled</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-4">
        {tasks.map((task) => (
          <Card key={task.id} className="bg-slate-900 border-slate-800">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-3">
                  <div className="mt-1">
                    {getStatusIcon(task.status)}
                  </div>
                  <div>
                    <h3 className="text-slate-100 mb-1">{task.name}</h3>
                    <p className="text-slate-400 text-sm">Target: {task.target}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {getStatusBadge(task.status)}
                  <Button variant="ghost" size="sm" className="text-slate-400 hover:text-slate-100">
                    {task.status === 'running' ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              {task.status !== 'completed' && (
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-slate-400 text-sm">Progress</span>
                    <span className="text-cyan-400 text-sm">{task.progress}%</span>
                  </div>
                  <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-500"
                      style={{ width: `${task.progress}%` }}
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-4">
                  <span className="text-slate-500">Started: {task.startTime}</span>
                  {task.estimatedCompletion && (
                    <span className="text-slate-500">ETA: {task.estimatedCompletion}</span>
                  )}
                </div>
                
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="border-slate-700 text-slate-400 hover:text-slate-100">
                    Details
                  </Button>
                  <Button variant="outline" size="sm" className="border-slate-700 text-slate-400 hover:text-slate-100">
                    Logs
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
