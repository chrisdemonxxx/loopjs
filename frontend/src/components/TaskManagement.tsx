import React, { useState, useEffect } from 'react';
import {
  FiPlus,
  FiEdit3,
  FiTrash2,
  FiPlay,
  FiPause,
  FiSquare,
  FiClock,
  FiUser,
  FiCalendar,
  FiFilter,
  FiSearch,
  FiRefreshCw,
  FiCheckCircle,
  FiAlertCircle,
  FiXCircle
} from 'react-icons/fi';

interface Task {
  id: string;
  name: string;
  description: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'paused';
  priority: 'low' | 'medium' | 'high' | 'critical';
  assignedTo: string;
  createdAt: string;
  updatedAt: string;
  progress: number;
  estimatedTime: string;
  actualTime?: string;
}

const TaskManagement: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);

  // Load tasks from API
  useEffect(() => {
    const loadTasks = async () => {
      try {
        // TODO: Replace with actual API call
        // const response = await fetch('/api/tasks');
        // const data = await response.json();
        // setTasks(data);
        
        // For now, initialize with empty array
        setTasks([]);
      } catch (error) {
        console.error('Failed to load tasks:', error);
        setTasks([]);
      }
    };

    loadTasks();
  }, []);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);

  const getStatusIcon = (status: Task['status']) => {
    switch (status) {
      case 'running':
        return <FiPlay className="w-4 h-4 text-blue-500" />;
      case 'completed':
        return <FiCheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <FiXCircle className="w-4 h-4 text-red-500" />;
      case 'paused':
        return <FiPause className="w-4 h-4 text-yellow-500" />;
      default:
        return <FiClock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: Task['status']) => {
    switch (status) {
      case 'running':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'failed':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'paused':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getPriorityColor = (priority: Task['priority']) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-500';
      case 'high':
        return 'bg-orange-500';
      case 'medium':
        return 'bg-yellow-500';
      default:
        return 'bg-green-500';
    }
  };

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         task.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const handleTaskAction = (taskId: string, action: 'start' | 'pause' | 'stop' | 'restart') => {
    setTasks(prev => prev.map(task => {
      if (task.id === taskId) {
        switch (action) {
          case 'start':
            return { ...task, status: 'running' as const };
          case 'pause':
            return { ...task, status: 'paused' as const };
          case 'stop':
            return { ...task, status: 'pending' as const, progress: 0 };
          case 'restart':
            return { ...task, status: 'running' as const, progress: 0 };
          default:
            return task;
        }
      }
      return task;
    }));
  };

  return (
    <div className="p-6 space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-black dark:text-white">Task Management</h1>
          <p className="text-bodydark2 mt-1">Monitor and manage system tasks and processes</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-primary text-white rounded-lg hover-scale focus-ring transition-all duration-200 ease-in-out"
        >
          <FiPlus className="w-4 h-4" />
          <span>Create Task</span>
        </button>
      </div>

      {/* Filters and Search */}
      <div className="bg-white dark:bg-boxdark rounded-lg shadow-sm border border-stroke dark:border-strokedark p-6 hover-lift">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-bodydark2 w-4 h-4" />
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-stroke dark:border-strokedark rounded-lg bg-transparent focus:border-primary focus:outline-none transition-colors"
            />
          </div>
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-stroke dark:border-strokedark rounded-lg bg-white dark:bg-boxdark focus:border-primary focus:outline-none transition-colors"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="running">Running</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
            <option value="paused">Paused</option>
          </select>
          
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-4 py-2 border border-stroke dark:border-strokedark rounded-lg bg-white dark:bg-boxdark focus:border-primary focus:outline-none transition-colors"
          >
            <option value="all">All Priority</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
          
          <button className="flex items-center justify-center px-4 py-2 border border-stroke dark:border-strokedark rounded-lg hover:bg-gray-2 dark:hover:bg-meta-4 transition-all duration-200 ease-in-out hover-scale focus-ring">
            <FiRefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Tasks Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredTasks.map((task, index) => (
          <div
            key={task.id}
            className="bg-white dark:bg-boxdark rounded-lg shadow-sm border border-stroke dark:border-strokedark p-6 hover-lift transition-all duration-200 ease-in-out animate-fade-in-up"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            {/* Task Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  {getStatusIcon(task.status)}
                  <h3 className="font-semibold text-black dark:text-white">{task.name}</h3>
                  <div className={`w-2 h-2 rounded-full ${getPriorityColor(task.priority)}`}></div>
                </div>
                <p className="text-sm text-bodydark2 mb-3">{task.description}</p>
              </div>
            </div>

            {/* Status Badge */}
            <div className="flex items-center justify-between mb-4">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
                {task.status.charAt(0).toUpperCase() + task.status.slice(1)}
              </span>
              <span className="text-xs text-bodydark2 capitalize">{task.priority} Priority</span>
            </div>

            {/* Progress Bar */}
            <div className="mb-4">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-bodydark2">Progress</span>
                <span className="text-black dark:text-white font-medium">{task.progress}%</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-meta-4 rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{ width: `${task.progress}%` }}
                ></div>
              </div>
            </div>

            {/* Task Details */}
            <div className="space-y-2 mb-4">
              <div className="flex items-center text-sm text-bodydark2">
                <FiUser className="w-4 h-4 mr-2" />
                <span>{task.assignedTo}</span>
              </div>
              <div className="flex items-center text-sm text-bodydark2">
                <FiClock className="w-4 h-4 mr-2" />
                <span>Est: {task.estimatedTime}</span>
                {task.actualTime && <span className="ml-2">| Actual: {task.actualTime}</span>}
              </div>
              <div className="flex items-center text-sm text-bodydark2">
                <FiCalendar className="w-4 h-4 mr-2" />
                <span>{new Date(task.createdAt).toLocaleDateString()}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center space-x-2">
              {task.status === 'pending' && (
                <button
                  onClick={() => handleTaskAction(task.id, 'start')}
                  className="flex items-center space-x-1 px-3 py-1 bg-green-500 text-white rounded text-sm hover-scale focus-ring transition-all duration-200 ease-in-out"
                >
                  <FiPlay className="w-3 h-3" />
                  <span>Start</span>
                </button>
              )}
              {task.status === 'running' && (
                <>
                  <button
                    onClick={() => handleTaskAction(task.id, 'pause')}
                    className="flex items-center space-x-1 px-3 py-1 bg-yellow-500 text-white rounded text-sm hover-scale focus-ring transition-all duration-200 ease-in-out"
                  >
                    <FiPause className="w-3 h-3" />
                    <span>Pause</span>
                  </button>
                  <button
                    onClick={() => handleTaskAction(task.id, 'stop')}
                    className="flex items-center space-x-1 px-3 py-1 bg-red-500 text-white rounded text-sm hover-scale focus-ring transition-all duration-200 ease-in-out"
                  >
                    <FiSquare className="w-3 h-3" />
                    <span>Stop</span>
                  </button>
                </>
              )}
              {task.status === 'paused' && (
                <>
                  <button
                    onClick={() => handleTaskAction(task.id, 'start')}
                    className="flex items-center space-x-1 px-3 py-1 bg-green-500 text-white rounded text-sm hover-scale focus-ring transition-all duration-200 ease-in-out"
                  >
                    <FiPlay className="w-3 h-3" />
                    <span>Resume</span>
                  </button>
                  <button
                    onClick={() => handleTaskAction(task.id, 'stop')}
                    className="flex items-center space-x-1 px-3 py-1 bg-red-500 text-white rounded text-sm hover-scale focus-ring transition-all duration-200 ease-in-out"
                  >
                    <FiSquare className="w-3 h-3" />
                    <span>Stop</span>
                  </button>
                </>
              )}
              {(task.status === 'failed' || task.status === 'completed') && (
                <button
                  onClick={() => handleTaskAction(task.id, 'restart')}
                  className="flex items-center space-x-1 px-3 py-1 bg-blue-500 text-white rounded text-sm hover-scale focus-ring transition-all duration-200 ease-in-out"
                >
                  <FiRefreshCw className="w-3 h-3" />
                  <span>Restart</span>
                </button>
              )}
              <button className="p-1 text-bodydark2 hover:text-primary transition-colors hover-scale focus-ring">
                <FiEdit3 className="w-4 h-4" />
              </button>
              <button className="p-1 text-bodydark2 hover:text-red-500 transition-colors hover-scale focus-ring">
                <FiTrash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredTasks.length === 0 && (
        <div className="text-center py-12">
          <FiClock className="w-12 h-12 text-bodydark2 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-black dark:text-white mb-2">No tasks found</h3>
          <p className="text-bodydark2">Try adjusting your search or filter criteria</p>
        </div>
      )}
    </div>
  );
};

export default TaskManagement;