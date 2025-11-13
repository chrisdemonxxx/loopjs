import { useState } from 'react';
import { CheckSquare, Plus, Play, Pause, XCircle, Clock, CheckCircle2, ClipboardList, Hourglass, MoreVertical, Eye, Edit, X, Trash } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Input } from './ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';
import { Progress } from './ui/progress';

interface Task {
  id: string;
  name: string;
  description: string;
  status: 'Pending' | 'Running' | 'Completed' | 'Failed' | 'Paused';
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  assignedTo: string;
  progress: number;
  created: string;
  updated: string;
}

export default function TasksSection() {
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const [tasks] = useState<Task[]>([
    { id: '1', name: 'System Information Scan', description: 'Collect system info from all clients', status: 'Running', priority: 'High', assignedTo: 'DESKTOP-WK8X', progress: 65, created: '2h ago', updated: '5 min ago' },
    { id: '2', name: 'Network Enumeration', description: 'Map network topology', status: 'Completed', priority: 'Medium', assignedTo: 'SERVER-01', progress: 100, created: '4h ago', updated: '1h ago' },
    { id: '3', name: 'Screenshot Capture', description: 'Capture screenshots every 5 minutes', status: 'Running', priority: 'Low', assignedTo: 'CLIENT-PC', progress: 45, created: '1h ago', updated: '2 min ago' },
    { id: '4', name: 'Process Monitor', description: 'Monitor running processes', status: 'Paused', priority: 'Medium', assignedTo: 'WORKSTATION-A', progress: 30, created: '3h ago', updated: '30 min ago' },
    { id: '5', name: 'Keylogger Data Collection', description: 'Collect keylogger data', status: 'Pending', priority: 'Critical', assignedTo: 'LAPTOP-7Y9Z', progress: 0, created: '30 min ago', updated: '30 min ago' },
    { id: '6', name: 'File System Search', description: 'Search for specific file types', status: 'Failed', priority: 'High', assignedTo: 'OFFICE-PC-12', progress: 15, created: '2h ago', updated: '45 min ago' },
  ]);

  const filteredTasks = tasks.filter(task => {
    const matchesStatus = statusFilter === 'all' || task.status.toLowerCase() === statusFilter;
    const matchesPriority = priorityFilter === 'all' || task.priority.toLowerCase() === priorityFilter;
    const matchesSearch = task.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         task.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesPriority && matchesSearch;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Running':
        return 'border-blue-500/50 bg-blue-500/10 text-blue-400';
      case 'Pending':
        return 'border-orange-500/50 bg-orange-500/10 text-orange-400';
      case 'Completed':
        return 'border-green-500/50 bg-green-500/10 text-green-400';
      case 'Failed':
        return 'border-red-500/50 bg-red-500/10 text-red-400';
      case 'Paused':
        return 'border-slate-500/50 bg-slate-500/10 text-slate-400';
      default:
        return 'border-slate-500/50 bg-slate-500/10 text-slate-400';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Critical':
        return 'border-red-500/50 bg-red-500/10 text-red-400';
      case 'High':
        return 'border-orange-500/50 bg-orange-500/10 text-orange-400';
      case 'Medium':
        return 'border-yellow-500/50 bg-yellow-500/10 text-yellow-400';
      case 'Low':
        return 'border-blue-500/50 bg-blue-500/10 text-blue-400';
      default:
        return 'border-slate-500/50 bg-slate-500/10 text-slate-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Running':
        return Play;
      case 'Pending':
        return Hourglass;
      case 'Completed':
        return CheckCircle2;
      case 'Failed':
        return XCircle;
      case 'Paused':
        return Pause;
      default:
        return ClipboardList;
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border-[#00d9b5]/30 bg-gradient-to-br from-[#131824]/90 to-[#1e2538]/90 backdrop-blur-2xl"
        style={{
          boxShadow: '0 8px 32px 0 rgba(0, 217, 181, 0.15), inset 0 1px 1px 0 rgba(255, 255, 255, 0.05)'
        }}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-green-500/20 p-3">
                <CheckSquare className="h-6 w-6 text-green-400" />
              </div>
              <div>
                <CardTitle className="text-slate-100">Task Management</CardTitle>
                <CardDescription className="text-slate-400">
                  Create and monitor automated tasks
                </CardDescription>
              </div>
            </div>
            <Button className="gap-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white hover:from-indigo-600 hover:to-purple-600">
              <Plus className="h-4 w-4" />
              Create Task
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-1 items-center gap-2">
              <Input
                placeholder="Search tasks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="max-w-sm border-slate-600 bg-slate-900/50 text-slate-200 placeholder:text-slate-500"
              />
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px] border-slate-600 bg-slate-900/50 text-slate-200">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent className="border-slate-700 bg-slate-800">
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="running">Running</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="paused">Paused</SelectItem>
                </SelectContent>
              </Select>

              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="w-[140px] border-slate-600 bg-slate-900/50 text-slate-200">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent className="border-slate-700 bg-slate-800">
                  <SelectItem value="all">All Priority</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Tasks Table */}
          <div className="rounded-lg border border-slate-700 bg-slate-900/50">
            <Table>
              <TableHeader>
                <TableRow className="border-slate-700 hover:bg-slate-800/50">
                  <TableHead className="text-slate-300">Task Name</TableHead>
                  <TableHead className="text-slate-300">Status</TableHead>
                  <TableHead className="text-slate-300">Priority</TableHead>
                  <TableHead className="text-slate-300">Assigned To</TableHead>
                  <TableHead className="text-slate-300">Progress</TableHead>
                  <TableHead className="text-slate-300">Updated</TableHead>
                  <TableHead className="text-slate-300 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTasks.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-slate-400">
                      No tasks found matching your filters
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTasks.map((task) => {
                    const StatusIcon = getStatusIcon(task.status);
                    return (
                    <TableRow
                      key={task.id}
                      className="border-slate-700 transition-colors hover:bg-slate-800/50"
                    >
                      <TableCell>
                        <div>
                          <div className="flex items-center gap-2 text-slate-200">
                            <StatusIcon className="h-4 w-4" />
                            {task.name}
                          </div>
                          <p className="text-xs text-slate-500 mt-1">{task.description}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={getStatusColor(task.status)}>
                          {task.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={getPriorityColor(task.priority)}>
                          {task.priority}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-slate-400">
                        {task.assignedTo}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-400">{task.progress}%</span>
                          </div>
                          <Progress value={task.progress} className="h-1.5" />
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-slate-400">
                        {task.updated}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-slate-400 hover:bg-slate-700 hover:text-slate-200"
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48 border-slate-700 bg-slate-800">
                            <DropdownMenuItem className="gap-2 text-slate-200 focus:bg-slate-700 focus:text-white">
                              <Eye className="h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem className="gap-2 text-slate-200 focus:bg-slate-700 focus:text-white">
                              <Edit className="h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem className="gap-2 text-slate-200 focus:bg-slate-700 focus:text-white">
                              {task.status === 'Paused' ? (
                                <>
                                  <Play className="h-4 w-4" />
                                  Resume
                                </>
                              ) : (
                                <>
                                  <Pause className="h-4 w-4" />
                                  Pause
                                </>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuItem className="gap-2 text-orange-400 focus:bg-orange-500/20 focus:text-orange-300">
                              <X className="h-4 w-4" />
                              Cancel
                            </DropdownMenuItem>
                            <DropdownMenuItem className="gap-2 text-red-400 focus:bg-red-500/20 focus:text-red-300">
                              <Trash className="h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}