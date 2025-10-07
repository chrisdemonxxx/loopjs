import React, { useState, useEffect, useRef } from 'react';
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Play, 
  Pause, 
  RotateCcw,
  Filter,
  Download,
  Search,
  RefreshCw
} from 'lucide-react';
import { FiTerminal, FiPaperclip } from 'react-icons/fi';
import request from '../axios';
import toast from 'react-hot-toast';

interface Task {
  _id: string;
  taskId: string;
  agentUuid: string;
  command: string;
  params: any;
  queue: {
    state: 'pending' | 'sent' | 'ack' | 'completed' | 'failed';
    reason?: string;
    attempts: number;
    lastAttemptAt?: string;
    priority: number;
  };
  createdBy: string;
  sentAt?: string;
  ackAt?: string;
  completedAt?: string;
  executionTimeMs: number;
  output: string;
  errorMessage: string;
  platform: string;
  createdAt: string;
  updatedAt: string;
}

interface TaskStats {
  total: number;
  pending: number;
  sent: number;
  completed: number;
  failed: number;
  successRate: number;
  avgExecutionTimeMs: number;
}

const LogsPage: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [stats, setStats] = useState<TaskStats>({
    total: 0,
    pending: 0,
    sent: 0,
    completed: 0,
    failed: 0,
    successRate: 0,
    avgExecutionTimeMs: 0
  });
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    state: '',
    agentUuid: '',
    search: ''
  });
  const [pagination, setPagination] = useState({
    limit: 50,
    offset: 0,
    hasMore: false
  });
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
  const wsRef = useRef<WebSocket | null>(null);

  // Fetch tasks
  const fetchTasks = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.state) params.append('state', filters.state);
      if (filters.agentUuid) params.append('agentUuid', filters.agentUuid);
      params.append('limit', pagination.limit.toString());
      params.append('offset', pagination.offset.toString());

      const response = await request({
        url: `/api/task?${params.toString()}`,
        method: 'GET'
      });

      if (response.data && response.data.data) {
        setTasks(response.data.data.tasks || []);
        setPagination(response.data.data.pagination || { hasMore: false });
      } else {
        setTasks([]);
        setPagination({ hasMore: false });
      }
    } catch (error) {
      console.error('Failed to fetch tasks:', error);
      toast.error('Failed to fetch tasks');
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch stats
  const fetchStats = async () => {
    try {
      const params = new URLSearchParams();
      if (filters.agentUuid) params.append('agentUuid', filters.agentUuid);

      const response = await request({
        url: `/api/task/stats?${params.toString()}`,
        method: 'GET'
      });

      if (response.data && response.data.data) {
        setStats(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  // Retry task
  const retryTask = async (taskId: string) => {
    try {
      await request({
        url: `/task/${taskId}/retry`,
        method: 'POST'
      });
      toast.success('Task retry initiated');
      fetchTasks();
      fetchStats();
    } catch (error) {
      console.error('Failed to retry task:', error);
      toast.error('Failed to retry task');
    }
  };

  // Cancel task
  const cancelTask = async (taskId: string) => {
    try {
      await request({
        url: `/task/${taskId}/cancel`,
        method: 'POST'
      });
      toast.success('Task cancelled');
      fetchTasks();
      fetchStats();
    } catch (error) {
      console.error('Failed to cancel task:', error);
      toast.error('Failed to cancel task');
    }
  };

  // Bulk retry failed tasks
  const bulkRetryFailed = async () => {
    const failedTasks = tasks.filter(task => 
      task.queue.state === 'failed' && selectedTasks.includes(task.taskId)
    );

    for (const task of failedTasks) {
      try {
        await retryTask(task.taskId);
      } catch (error) {
        console.error(`Failed to retry task ${task.taskId}:`, error);
      }
    }

    setSelectedTasks([]);
    toast.success(`Retried ${failedTasks.length} tasks`);
  };

  // Bulk cancel pending tasks
  const bulkCancelPending = async () => {
    const pendingTasks = tasks.filter(task => 
      task.queue.state === 'pending' && selectedTasks.includes(task.taskId)
    );

    for (const task of pendingTasks) {
      try {
        await cancelTask(task.taskId);
      } catch (error) {
        console.error(`Failed to cancel task ${task.taskId}:`, error);
      }
    }

    setSelectedTasks([]);
    toast.success(`Cancelled ${pendingTasks.length} tasks`);
  };

  // WebSocket connection for real-time updates
  useEffect(() => {
    const connectWebSocket = () => {
      const wsUrl = process.env.NODE_ENV === 'production' 
        ? 'wss://loopjs-backend-361659024403.us-central1.run.app/ws'
        : 'ws://localhost:8080/ws';
      
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('WebSocket connected for logs');
        // Send authentication if needed
        const token = localStorage.getItem('accessToken');
        if (token) {
          ws.send(JSON.stringify({
            type: 'auth',
            token: token
          }));
        }
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.type === 'task_created' || data.type === 'task_updated') {
            // Refresh tasks when new task is created or updated
            fetchTasks();
            fetchStats();
          }
        } catch (error) {
          console.error('WebSocket message error:', error);
        }
      };

      ws.onclose = () => {
        console.log('WebSocket disconnected, reconnecting...');
        setTimeout(connectWebSocket, 5000);
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
    };

    connectWebSocket();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  // Initial data fetch
  useEffect(() => {
    fetchTasks();
    fetchStats();
  }, [filters, pagination.offset]);

  // Get status icon
  const getStatusIcon = (state: string) => {
    switch (state) {
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'sent':
        return <Play className="w-4 h-4 text-blue-500" />;
      case 'ack':
        return <AlertCircle className="w-4 h-4 text-orange-500" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  // Get status color
  const getStatusColor = (state: string) => {
    switch (state) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'sent':
        return 'bg-blue-100 text-blue-800';
      case 'ack':
        return 'bg-orange-100 text-orange-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Format duration
  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  // Filter tasks based on search
  const filteredTasks = tasks.filter(task => {
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      return (
        task.command.toLowerCase().includes(searchLower) ||
        task.taskId.toLowerCase().includes(searchLower) ||
        task.agentUuid.toLowerCase().includes(searchLower)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="premium-card p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <FiTerminal className="w-6 h-6 text-indigo-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Command Logs
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Monitor and manage command execution logs
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => { fetchTasks(); fetchStats(); }}
              className="premium-button flex items-center space-x-2"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Refresh</span>
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="premium-stats-grid">
        <div className="premium-stat-card">
          <div className="premium-stat-value">{stats.total}</div>
          <div className="premium-stat-label">Total Commands</div>
        </div>
        
        <div className="premium-stat-card">
          <div className="premium-stat-value text-yellow-600">{stats.pending}</div>
          <div className="premium-stat-label">In Queue</div>
        </div>
        
        <div className="premium-stat-card">
          <div className="premium-stat-value text-green-600">{stats.completed}</div>
          <div className="premium-stat-label">Executed</div>
        </div>
        
        <div className="premium-stat-card">
          <div className="premium-stat-value text-red-600">{stats.failed}</div>
          <div className="premium-stat-label">Failed</div>
        </div>
      </div>

      {/* Filters */}
      <div className="premium-card p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              value={filters.state}
              onChange={(e) => setFilters({ ...filters, state: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="sent">Sent</option>
              <option value="ack">Acknowledged</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Client UUID
            </label>
            <input
              type="text"
              value={filters.agentUuid}
              onChange={(e) => setFilters({ ...filters, agentUuid: e.target.value })}
              placeholder="Filter by client UUID"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                placeholder="Search commands..."
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          
          <div className="flex items-end space-x-2">
            {selectedTasks.length > 0 && (
              <>
                <button
                  onClick={bulkRetryFailed}
                  className="flex items-center space-x-1 px-3 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Retry Failed</span>
                </button>
                <button
                  onClick={bulkCancelPending}
                  className="flex items-center space-x-1 px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                >
                  <Pause className="w-4 h-4" />
                  <span>Cancel Pending</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Tasks Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <input
                    type="checkbox"
                    checked={selectedTasks.length === filteredTasks.length && filteredTasks.length > 0}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedTasks(filteredTasks.map(task => task.taskId));
                      } else {
                        setSelectedTasks([]);
                      }
                    }}
                    className="rounded border-gray-300"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Task ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Client
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Command
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Duration
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-4 text-center text-gray-500">
                    Loading tasks...
                  </td>
                </tr>
              ) : filteredTasks.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-4 text-center text-gray-500">
                    No tasks found
                  </td>
                </tr>
              ) : (
                filteredTasks.map((task) => (
                  <tr key={task.taskId} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedTasks.includes(task.taskId)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedTasks([...selectedTasks, task.taskId]);
                          } else {
                            setSelectedTasks(selectedTasks.filter(id => id !== task.taskId));
                          }
                        }}
                        className="rounded border-gray-300"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                      {task.taskId}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {task.agentUuid}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                      {task.command}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(task.queue.state)}
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(task.queue.state)}`}>
                          {task.queue.state}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(task.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {task.executionTimeMs > 0 ? formatDuration(task.executionTimeMs) : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      {task.queue.state === 'failed' && (
                        <button
                          onClick={() => retryTask(task.taskId)}
                          className="text-orange-600 hover:text-orange-900"
                        >
                          <RotateCcw className="w-4 h-4" />
                        </button>
                      )}
                      {['pending', 'sent'].includes(task.queue.state) && (
                        <button
                          onClick={() => cancelTask(task.taskId)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Pause className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        {pagination.hasMore && (
          <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
            <button
              onClick={() => setPagination({ ...pagination, offset: pagination.offset + pagination.limit })}
              className="w-full text-center text-sm text-gray-600 hover:text-gray-900"
            >
              Load More
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default LogsPage;
