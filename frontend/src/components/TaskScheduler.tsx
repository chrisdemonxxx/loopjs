import React, { useState, useEffect } from 'react';
import { Agent } from '../types';
import toast from 'react-hot-toast';

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

const TaskScheduler: React.FC<TaskSchedulerProps> = ({ agents, onScheduleTask = () => {} }) => {
  const [tasks, setTasks] = useState<ScheduledTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<ScheduledTask | null>(null);
  const [newTask, setNewTask] = useState({
    name: '',
    description: '',
    command: '',
    targetAgents: [] as string[],
    scheduleType: 'once' as 'once' | 'recurring',
    datetime: '',
    interval: 'daily' as 'hourly' | 'daily' | 'weekly' | 'monthly',
    intervalValue: 1
  });

  const onlineAgents = agents.filter(agent => agent.status === 'online');

  // Fetch tasks from backend
  const fetchTasks = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // For now, we'll use mock data since the backend doesn't have scheduled tasks yet
      // In a real implementation, this would call the backend API
      const mockTasks: ScheduledTask[] = [
        {
          id: '1',
          name: 'System Information Gathering',
          description: 'Collect system information from all online agents',
          command: 'systeminfo',
          targetAgents: ['all'],
          schedule: { type: 'recurring', interval: 'daily', intervalValue: 1 },
          status: 'active',
          createdAt: new Date(Date.now() - 86400000),
          lastRun: new Date(Date.now() - 3600000),
          nextRun: new Date(Date.now() + 82800000),
        },
        {
          id: '2',
          name: 'Screenshot Capture',
          description: 'Take screenshots from selected high-value targets',
          command: 'screenshot',
          targetAgents: ['agent-1', 'agent-3'],
          schedule: { type: 'recurring', interval: 'hourly', intervalValue: 2 },
          status: 'active',
          createdAt: new Date(Date.now() - 172800000),
          lastRun: new Date(Date.now() - 7200000),
          nextRun: new Date(Date.now() + 300000),
        }
      ];
      
      setTasks(mockTasks);
    } catch (error) {
      console.error('Failed to fetch tasks:', error);
      setError('Failed to fetch tasks');
      toast.error('Failed to fetch tasks');
    } finally {
      setLoading(false);
    }
  };

  // Create a new scheduled task
  const createScheduledTask = async (taskData: Omit<ScheduledTask, 'id' | 'createdAt'>) => {
    try {
      // For now, we'll add it to local state
      // In a real implementation, this would call the backend API
      const newTask: ScheduledTask = {
        ...taskData,
        id: Date.now().toString(),
        createdAt: new Date()
      };
      
      setTasks(prev => [...prev, newTask]);
      toast.success('Task created successfully');
      
      // Call the callback if provided
      onScheduleTask(newTask);
      
      return newTask;
    } catch (error) {
      console.error('Failed to create task:', error);
      toast.error('Failed to create task');
      throw error;
    }
  };

  // Update task status
  const updateTaskStatus = async (taskId: string, status: ScheduledTask['status']) => {
    try {
      setTasks(prev => prev.map(task => 
        task.id === taskId ? { ...task, status } : task
      ));
      toast.success(`Task ${status === 'active' ? 'activated' : 'paused'}`);
    } catch (error) {
      console.error('Failed to update task status:', error);
      toast.error('Failed to update task status');
    }
  };

  // Delete task
  const deleteScheduledTask = async (taskId: string) => {
    try {
      setTasks(prev => prev.filter(task => task.id !== taskId));
      toast.success('Task deleted successfully');
    } catch (error) {
      console.error('Failed to delete task:', error);
      toast.error('Failed to delete task');
    }
  };

  // Load tasks on component mount
  useEffect(() => {
    fetchTasks();
  }, []);

  const predefinedCommands = [
    { label: 'System Info', value: 'systeminfo', description: 'Get detailed system information' },
    { label: 'Screenshot', value: 'screenshot', description: 'Capture desktop screenshot' },
    { label: 'Process List', value: 'tasklist', description: 'List running processes' },
    { label: 'Network Status', value: 'netstat -an', description: 'List network connections' },
    { label: 'Current User', value: 'whoami', description: 'Show current user' },
    { label: 'IP Config', value: 'ipconfig', description: 'Show network configuration' },
    { label: 'File Explorer', value: 'dir', description: 'List directory contents' },
    { label: 'Reboot', value: 'shutdown /r /t 0', description: 'Restart the system' },
    { label: 'Shutdown', value: 'shutdown /s /t 0', description: 'Shutdown the system' },
    { label: 'Download File', value: 'download', description: 'Download file from URL', isModal: true },
    { label: 'Download & Execute', value: 'download_execute', description: 'Download and execute silently', isModal: true },
    { label: 'Custom Command', value: 'custom', description: 'Execute custom command', isModal: true }
  ];

  const handleCreateTask = async () => {
    if (!newTask.name || !newTask.command) return;

    try {
      const taskData: Omit<ScheduledTask, 'id' | 'createdAt'> = {
        name: newTask.name,
        description: newTask.description,
        command: newTask.command,
        targetAgents: newTask.targetAgents.length > 0 ? newTask.targetAgents : ['all'],
        schedule: {
          type: newTask.scheduleType,
          ...(newTask.scheduleType === 'once' 
            ? { datetime: new Date(newTask.datetime) }
            : { interval: newTask.interval, intervalValue: newTask.intervalValue }
          )
        },
        status: 'pending',
        nextRun: newTask.scheduleType === 'once' 
          ? new Date(newTask.datetime)
          : new Date(Date.now() + getIntervalMs(newTask.interval, newTask.intervalValue))
      };

      await createScheduledTask(taskData);
      setShowCreateModal(false);
      resetNewTask();
    } catch (error) {
      console.error('Failed to create task:', error);
    }
  };

  const resetNewTask = () => {
    setNewTask({
      name: '',
      description: '',
      command: '',
      targetAgents: [],
      scheduleType: 'once',
      datetime: '',
      interval: 'daily',
      intervalValue: 1
    });
  };

  const getIntervalMs = (interval: string, value: number) => {
    const multipliers = {
      hourly: 3600000,
      daily: 86400000,
      weekly: 604800000,
      monthly: 2592000000
    };
    return multipliers[interval as keyof typeof multipliers] * value;
  };

  const toggleTaskStatus = async (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    
    const newStatus = task.status === 'active' ? 'paused' : 'active';
    await updateTaskStatus(taskId, newStatus);
  };

  const deleteTask = async (taskId: string) => {
    await deleteScheduledTask(taskId);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-400 bg-green-900/20 border-green-500/30';
      case 'pending': return 'text-yellow-400 bg-yellow-900/20 border-yellow-500/30';
      case 'paused': return 'text-gray-400 bg-gray-900/20 border-gray-500/30';
      case 'completed': return 'text-blue-400 bg-blue-900/20 border-blue-500/30';
      case 'failed': return 'text-red-400 bg-red-900/20 border-red-500/30';
      default: return 'text-gray-400 bg-gray-900/20 border-gray-500/30';
    }
  };

  const formatNextRun = (date?: Date) => {
    if (!date) return 'N/A';
    const now = new Date();
    const diff = date.getTime() - now.getTime();
    
    if (diff < 0) return 'Overdue';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`;
    return `${Math.floor(diff / 86400000)}d`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-black/40 border border-red-500/20 rounded-lg p-6 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-red-400 mb-2 flex items-center">
              <span className="mr-2">⏰</span>TASK SCHEDULER
            </h2>
            <p className="text-gray-400">Automate command execution across infected systems</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-colors flex items-center space-x-2"
          >
            <span>➕</span>
            <span>CREATE TASK</span>
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Active Tasks', value: tasks.filter(t => t.status === 'active').length, color: 'green' },
          { label: 'Pending Tasks', value: tasks.filter(t => t.status === 'pending').length, color: 'yellow' },
          { label: 'Paused Tasks', value: tasks.filter(t => t.status === 'paused').length, color: 'gray' },
          { label: 'Total Tasks', value: tasks.length, color: 'red' }
        ].map((stat) => (
          <div key={stat.label} className={`bg-${stat.color}-900/20 border border-${stat.color}-500/30 rounded-lg p-4`}>
            <div className={`text-${stat.color}-400 font-bold text-2xl`}>{stat.value}</div>
            <div className="text-gray-300 text-sm">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Tasks List */}
      <div className="bg-black/40 border border-red-500/20 rounded-lg backdrop-blur-sm overflow-hidden">
        <div className="bg-gray-900/50 px-6 py-4 border-b border-red-500/20">
          <h3 className="text-red-400 font-bold text-lg">📋 SCHEDULED TASKS</h3>
        </div>
        
        {loading ? (
          <div className="p-8 text-center">
            <div className="text-gray-400">Loading tasks...</div>
          </div>
        ) : error ? (
          <div className="p-8 text-center">
            <div className="text-red-400 mb-4">{error}</div>
            <button
              onClick={fetchTasks}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
            >
              Retry
            </button>
          </div>
        ) : (
          <div className="divide-y divide-red-500/10">
            {tasks.length === 0 ? (
              <div className="p-8 text-center">
                <div className="text-gray-400 mb-4">No scheduled tasks found</div>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
                >
                  Create First Task
                </button>
              </div>
            ) : (
              tasks.map((task) => (
            <div key={task.id} className="p-6 hover:bg-red-900/10 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h4 className="text-white font-semibold text-lg">{task.name}</h4>
                    <span className={`px-2 py-1 rounded text-xs font-semibold border ${getStatusColor(task.status)}`}>
                      {task.status.toUpperCase()}
                    </span>
                  </div>
                  
                  <p className="text-gray-400 mb-3">{task.description}</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-red-400 font-semibold">Command:</span>
                      <div className="text-white font-mono bg-gray-900/50 rounded px-2 py-1 mt-1">
                        {task.command}
                      </div>
                    </div>
                    
                    <div>
                      <span className="text-red-400 font-semibold">Schedule:</span>
                      <div className="text-gray-300 mt-1">
                        {task.schedule.type === 'once' 
                          ? `Once at ${task.schedule.datetime?.toLocaleString()}`
                          : `Every ${task.schedule.intervalValue} ${task.schedule.interval}`
                        }
                      </div>
                    </div>
                    
                    <div>
                      <span className="text-red-400 font-semibold">Next Run:</span>
                      <div className="text-gray-300 mt-1">
                        {formatNextRun(task.nextRun)}
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-3">
                    <span className="text-red-400 font-semibold text-sm">Targets:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {task.targetAgents.includes('all') ? (
                        <span className="px-2 py-1 bg-red-900/30 text-red-300 rounded text-xs">
                          All Online Agents ({onlineAgents.length})
                        </span>
                      ) : (
                        task.targetAgents.map(agentId => {
                          const agent = agents.find(a => a.id === agentId);
                          return (
                            <span key={agentId} className="px-2 py-1 bg-gray-900/50 text-gray-300 rounded text-xs">
                              {agent?.name || agentId}
                            </span>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2 ml-4">
                  <button
                    onClick={() => setSelectedTask(task)}
                    className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm transition-colors"
                  >
                    📊 DETAILS
                  </button>
                  <button
                    onClick={() => toggleTaskStatus(task.id)}
                    className={`px-3 py-1 rounded text-sm transition-colors ${
                      task.status === 'active' 
                        ? 'bg-yellow-600 hover:bg-yellow-700 text-white' 
                        : 'bg-green-600 hover:bg-green-700 text-white'
                    }`}
                  >
                    {task.status === 'active' ? '⏸️ PAUSE' : '▶️ RESUME'}
                  </button>
                  <button
                    onClick={() => deleteTask(task.id)}
                    className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm transition-colors"
                  >
                    🗑️ DELETE
                  </button>
                </div>
              </div>
            </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Create Task Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-red-500/30 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-red-400 font-bold text-xl">🆕 CREATE NEW TASK</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-white text-2xl"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-red-400 font-semibold mb-2">Task Name:</label>
                <input
                  type="text"
                  value={newTask.name}
                  onChange={(e) => setNewTask(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full bg-gray-800 border border-red-500/30 rounded px-3 py-2 text-white focus:border-red-500 focus:outline-none"
                  placeholder="Enter task name..."
                />
              </div>
              
              <div>
                <label className="block text-red-400 font-semibold mb-2">Description:</label>
                <textarea
                  value={newTask.description}
                  onChange={(e) => setNewTask(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full bg-gray-800 border border-red-500/30 rounded px-3 py-2 text-white focus:border-red-500 focus:outline-none h-20"
                  placeholder="Enter task description..."
                />
              </div>
              
              <div>
                <label className="block text-red-400 font-semibold mb-2">Command:</label>
                <select
                  value={newTask.command}
                  onChange={(e) => setNewTask(prev => ({ ...prev, command: e.target.value }))}
                  className="w-full bg-gray-800 border border-red-500/30 rounded px-3 py-2 text-white focus:border-red-500 focus:outline-none mb-2"
                >
                  <option value="">Select a predefined command...</option>
                  {predefinedCommands.map(cmd => (
                    <option key={cmd.value} value={cmd.value}>
                      {cmd.label} - {cmd.description}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  value={newTask.command}
                  onChange={(e) => setNewTask(prev => ({ ...prev, command: e.target.value }))}
                  className="w-full bg-gray-800 border border-red-500/30 rounded px-3 py-2 text-white focus:border-red-500 focus:outline-none font-mono"
                  placeholder="Or enter custom command..."
                />
              </div>
              
              <div>
                <label className="block text-red-400 font-semibold mb-2">Schedule Type:</label>
                <div className="flex space-x-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="once"
                      checked={newTask.scheduleType === 'once'}
                      onChange={(e) => setNewTask(prev => ({ ...prev, scheduleType: e.target.value as 'once' | 'recurring' }))}
                      className="mr-2"
                    />
                    <span className="text-white">Run Once</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="recurring"
                      checked={newTask.scheduleType === 'recurring'}
                      onChange={(e) => setNewTask(prev => ({ ...prev, scheduleType: e.target.value as 'once' | 'recurring' }))}
                      className="mr-2"
                    />
                    <span className="text-white">Recurring</span>
                  </label>
                </div>
              </div>
              
              {newTask.scheduleType === 'once' ? (
                <div>
                  <label className="block text-red-400 font-semibold mb-2">Execution Time:</label>
                  <input
                    type="datetime-local"
                    value={newTask.datetime}
                    onChange={(e) => setNewTask(prev => ({ ...prev, datetime: e.target.value }))}
                    className="w-full bg-gray-800 border border-red-500/30 rounded px-3 py-2 text-white focus:border-red-500 focus:outline-none"
                  />
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-red-400 font-semibold mb-2">Interval:</label>
                    <select
                      value={newTask.interval}
                      onChange={(e) => setNewTask(prev => ({ ...prev, interval: e.target.value as any }))}
                      className="w-full bg-gray-800 border border-red-500/30 rounded px-3 py-2 text-white focus:border-red-500 focus:outline-none"
                    >
                      <option value="hourly">Hourly</option>
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-red-400 font-semibold mb-2">Every:</label>
                    <input
                      type="number"
                      min="1"
                      value={newTask.intervalValue}
                      onChange={(e) => setNewTask(prev => ({ ...prev, intervalValue: parseInt(e.target.value) }))}
                      className="w-full bg-gray-800 border border-red-500/30 rounded px-3 py-2 text-white focus:border-red-500 focus:outline-none"
                    />
                  </div>
                </div>
              )}
              
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateTask}
                  disabled={!newTask.name || !newTask.command}
                  className="px-6 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded transition-colors"
                >
                  Create Task
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Task Details Modal */}
      {selectedTask && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-red-500/30 rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-red-400 font-bold text-xl">📊 TASK DETAILS: {selectedTask.name}</h3>
              <button
                onClick={() => setSelectedTask(null)}
                className="text-gray-400 hover:text-white text-2xl"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-red-400 font-semibold mb-2">Task Information</h4>
                  <div className="space-y-2 text-sm">
                    <div><span className="text-gray-400">Status:</span> <span className={`font-semibold ${getStatusColor(selectedTask.status).split(' ')[0]}`}>{selectedTask.status.toUpperCase()}</span></div>
                    <div><span className="text-gray-400">Created:</span> <span className="text-white">{selectedTask.createdAt.toLocaleString()}</span></div>
                    <div><span className="text-gray-400">Last Run:</span> <span className="text-white">{selectedTask.lastRun?.toLocaleString() || 'Never'}</span></div>
                    <div><span className="text-gray-400">Next Run:</span> <span className="text-white">{selectedTask.nextRun?.toLocaleString() || 'N/A'}</span></div>
                  </div>
                </div>
                
                <div>
                  <h4 className="text-red-400 font-semibold mb-2">Execution Stats</h4>
                  <div className="space-y-2 text-sm">
                    <div><span className="text-gray-400">Total Runs:</span> <span className="text-white">{selectedTask.results?.length || 0}</span></div>
                    <div><span className="text-gray-400">Success Rate:</span> <span className="text-green-400">85%</span></div>
                    <div><span className="text-gray-400">Avg Duration:</span> <span className="text-white">2.3s</span></div>
                    <div><span className="text-gray-400">Target Count:</span> <span className="text-white">{selectedTask.targetAgents.includes('all') ? onlineAgents.length : selectedTask.targetAgents.length}</span></div>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="text-red-400 font-semibold mb-2">Recent Execution Results</h4>
                <div className="bg-black/50 rounded border border-red-500/20 p-4 max-h-60 overflow-y-auto">
                  <div className="text-gray-400 text-sm">No execution results available yet.</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskScheduler;