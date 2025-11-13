import React, { useState, useEffect } from 'react';
import { Agent } from '../types';
import toast from 'react-hot-toast';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Calendar, Clock, Play, Pause, Trash2, Edit } from 'lucide-react';

interface TaskSchedulerProps {
  agents: Agent[];
  onScheduleTask?: (task: ScheduledTask) => void;
}

interface ScheduledTask {
  id: string;
  name: string;
  description: string;
  command: string;
  targetAgents: string[];
  schedule: {
    type: 'once' | 'recurring';
    datetime?: Date;
    interval?: 'hourly' | 'daily' | 'weekly' | 'monthly';
    intervalValue?: number;
  };
  status: 'pending' | 'active' | 'completed' | 'failed' | 'paused';
  createdAt: Date;
  lastRun?: Date;
  nextRun?: Date;
  results?: TaskResult[];
}

interface TaskResult {
  agentId: string;
  agentName: string;
  status: 'success' | 'failed' | 'timeout';
  output: string;
  executedAt: Date;
}

const TaskScheduler: React.FC<TaskSchedulerProps> = ({ agents }) => {
  const [tasks, setTasks] = useState<ScheduledTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTask, setNewTask] = useState({
    name: '',
    description: '',
    command: '',
    targetAgents: [] as string[],
    scheduleType: 'once' as 'once' | 'recurring',
    datetime: '',
    interval: 'hourly' as 'hourly' | 'daily' | 'weekly' | 'monthly',
    intervalValue: 1
  });

  // Mock data for demonstration
  useEffect(() => {
    const mockTasks: ScheduledTask[] = [
      {
        id: '1',
        name: 'System Info Collection',
        description: 'Collect system information from all clients',
        command: 'systeminfo',
        targetAgents: agents.slice(0, 2).map(a => a.id),
        schedule: { type: 'recurring', interval: 'daily', intervalValue: 1 },
        status: 'active',
        createdAt: new Date(),
        nextRun: new Date(Date.now() + 24 * 60 * 60 * 1000)
      },
      {
        id: '2',
        name: 'Process List',
        description: 'Get running processes from selected clients',
        command: 'tasklist',
        targetAgents: agents.slice(0, 1).map(a => a.id),
        schedule: { type: 'once', datetime: new Date(Date.now() + 60 * 60 * 1000) },
        status: 'pending',
        createdAt: new Date()
      }
    ];
    setTasks(mockTasks);
    setLoading(false);
  }, [agents]);

  const handleCreateTask = async () => {
    if (!newTask.name || !newTask.command || newTask.targetAgents.length === 0) {
      toast.error('Please fill in all required fields');
      return;
    }

    const task: ScheduledTask = {
      id: Date.now().toString(),
      name: newTask.name,
      description: newTask.description,
      command: newTask.command,
      targetAgents: newTask.targetAgents,
      schedule: {
        type: newTask.scheduleType,
        datetime: newTask.scheduleType === 'once' ? new Date(newTask.datetime) : undefined,
        interval: newTask.scheduleType === 'recurring' ? newTask.interval : undefined,
        intervalValue: newTask.scheduleType === 'recurring' ? newTask.intervalValue : undefined
      },
      status: 'pending',
      createdAt: new Date()
    };

    setTasks(prev => [...prev, task]);
    setShowCreateModal(false);
    setNewTask({
      name: '',
      description: '',
      command: '',
      targetAgents: [],
      scheduleType: 'once',
      datetime: '',
      interval: 'hourly',
      intervalValue: 1
    });
    toast.success('Task created successfully');
  };

  const toggleTaskStatus = (taskId: string) => {
    setTasks(prev => prev.map(task => 
      task.id === taskId 
        ? { ...task, status: task.status === 'active' ? 'paused' : 'active' }
        : task
    ));
  };

  const deleteTask = (taskId: string) => {
    setTasks(prev => prev.filter(task => task.id !== taskId));
    toast.success('Task deleted');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active': return <Badge variant="default">Active</Badge>;
      case 'pending': return <Badge variant="secondary">Pending</Badge>;
      case 'paused': return <Badge variant="outline">Paused</Badge>;
      case 'completed': return <Badge variant="default">Completed</Badge>;
      case 'failed': return <Badge variant="destructive">Failed</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-6 h-6" />
                Task Scheduler
              </CardTitle>
              <p className="text-muted-foreground mt-1">Automate command execution across connected systems</p>
            </div>
            <Button onClick={() => setShowCreateModal(true)} className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Create Task
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Active Tasks', value: tasks.filter(t => t.status === 'active').length },
          { label: 'Pending Tasks', value: tasks.filter(t => t.status === 'pending').length },
          { label: 'Paused Tasks', value: tasks.filter(t => t.status === 'paused').length },
          { label: 'Total Tasks', value: tasks.length }
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-6">
              <div className="text-2xl font-bold">{stat.value}</div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tasks List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Scheduled Tasks
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <span className="ml-2">Loading tasks...</span>
            </div>
          ) : (
            <div>
              {tasks.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-muted-foreground mb-4">No scheduled tasks found</div>
                  <Button onClick={() => setShowCreateModal(true)}>
                    Create First Task
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Command</TableHead>
                      <TableHead>Schedule</TableHead>
                      <TableHead>Targets</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tasks.map((task) => (
                      <TableRow key={task.id}>
                        <TableCell className="font-medium">{task.name}</TableCell>
                        <TableCell>{getStatusBadge(task.status)}</TableCell>
                        <TableCell className="font-mono text-sm">{task.command}</TableCell>
                        <TableCell>
                          {task.schedule.type === 'once' 
                            ? `Once: ${task.schedule.datetime?.toLocaleString() || 'N/A'}`
                            : `Every ${task.schedule.intervalValue} ${task.schedule.interval}`
                          }
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {task.targetAgents.slice(0, 2).map((agentId) => {
                              const agent = agents.find(a => a.id === agentId);
                              return (
                                <Badge key={agentId} variant="outline" className="text-xs">
                                  {agent?.computerName || agentId}
                                </Badge>
                              );
                            })}
                            {task.targetAgents.length > 2 && (
                              <Badge variant="outline" className="text-xs">
                                +{task.targetAgents.length - 2} more
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => toggleTaskStatus(task.id)}
                            >
                              {task.status === 'active' ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => console.log('Edit task:', task.id)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => deleteTask(task.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Task Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Create New Task</DialogTitle>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="task-name" className="text-right">
                Name
              </Label>
              <Input
                id="task-name"
                value={newTask.name}
                onChange={(e) => setNewTask(prev => ({ ...prev, name: e.target.value }))}
                className="col-span-3"
                placeholder="Enter task name"
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="task-description" className="text-right">
                Description
              </Label>
              <Textarea
                id="task-description"
                value={newTask.description}
                onChange={(e) => setNewTask(prev => ({ ...prev, description: e.target.value }))}
                className="col-span-3"
                placeholder="Enter task description"
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="task-command" className="text-right">
                Command
              </Label>
              <Input
                id="task-command"
                value={newTask.command}
                onChange={(e) => setNewTask(prev => ({ ...prev, command: e.target.value }))}
                className="col-span-3"
                placeholder="Enter command to execute"
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="schedule-type" className="text-right">
                Schedule Type
              </Label>
              <Select value={newTask.scheduleType} onValueChange={(value: 'once' | 'recurring') => setNewTask(prev => ({ ...prev, scheduleType: value }))}>
                <SelectTrigger className="col-span-3">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="once">Run Once</SelectItem>
                  <SelectItem value="recurring">Recurring</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {newTask.scheduleType === 'once' && (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="datetime" className="text-right">
                  Date & Time
                </Label>
                <Input
                  id="datetime"
                  type="datetime-local"
                  value={newTask.datetime}
                  onChange={(e) => setNewTask(prev => ({ ...prev, datetime: e.target.value }))}
                  className="col-span-3"
                />
              </div>
            )}

            {newTask.scheduleType === 'recurring' && (
              <>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="interval" className="text-right">
                    Interval
                  </Label>
                  <Select value={newTask.interval} onValueChange={(value: 'hourly' | 'daily' | 'weekly' | 'monthly') => setNewTask(prev => ({ ...prev, interval: value }))}>
                    <SelectTrigger className="col-span-3">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hourly">Hourly</SelectItem>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="interval-value" className="text-right">
                    Every
                  </Label>
                  <Input
                    id="interval-value"
                    type="number"
                    min="1"
                    value={newTask.intervalValue}
                    onChange={(e) => setNewTask(prev => ({ ...prev, intervalValue: parseInt(e.target.value) || 1 }))}
                    className="col-span-3"
                  />
                </div>
              </>
            )}

            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Target Agents</Label>
              <div className="col-span-3 space-y-2">
                {agents.map((agent) => (
                  <div key={agent.id} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={`agent-${agent.id}`}
                      checked={newTask.targetAgents.includes(agent.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setNewTask(prev => ({ ...prev, targetAgents: [...prev.targetAgents, agent.id] }));
                        } else {
                          setNewTask(prev => ({ ...prev, targetAgents: prev.targetAgents.filter(id => id !== agent.id) }));
                        }
                      }}
                      className="rounded"
                    />
                    <Label htmlFor={`agent-${agent.id}`} className="text-sm">
                      {agent.computerName} ({agent.ipAddress})
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateTask}>
              Create Task
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TaskScheduler;