import React, { useState, useEffect, useRef } from 'react';
import { Agent } from '../types';
import UserTable from '../components/UserTable';
import UnifiedTerminal from '../components/UnifiedTerminal';
import TaskScheduler from '../components/TaskScheduler';
import Settings from '../components/Settings';
import AgentSection from '../components/AgentSection';
import LogsPage from './LogsPage';
import AIInsightsPanel from '../components/AIInsightsPanel';
import ClientCard from '../components/ClientCard';
import { 
  FiUser, 
  FiLogOut, 
  FiEdit, 
  FiCamera, 
  FiKey, 
  FiShield,
  FiX,
  FiEye,
  FiEyeOff
} from 'react-icons/fi';
import request from '../axios';
import toast from 'react-hot-toast';
import { useTheme } from '../contexts/ThemeContext';

interface User {
  id: string;
  username: string;
  email: string;
  role: string;
  profilePicture?: string;
  displayName?: string;
  twoFactorEnabled?: boolean;
}

interface DashboardPageProps {
  tableData: Agent[];
  isLoading: boolean;
  onActionClicked: (agent: Agent) => void;
  onTasksClicked: (agent: Agent) => void;
  onLogout: () => void;
  onSendCommand: (agentId: string, command: string, correlationId: string) => void;  // Update signature
  onRegisterPending: (taskId: string, agentId: string, historyId: string) => void;
  naturalLanguageHistory: any[];
  setNaturalLanguageHistory: React.Dispatch<React.SetStateAction<any[]>>;
  wsConnectionStatus?: 'disconnected' | 'connecting' | 'connected' | 'error';
  learningStats?: any;
}

const DashboardPage: React.FC<DashboardPageProps> = ({ 
  tableData, 
  isLoading, 
  onActionClicked, 
  onTasksClicked, 
  onLogout,
  onSendCommand,
  naturalLanguageHistory,
  setNaturalLanguageHistory,
  learningStats
}) => {
  const { mode } = useTheme();
  const [activeTab, setActiveTab] = useState('overview');
  const [taskStats, setTaskStats] = useState({
    total: 0,
    pending: 0,
    sent: 0,
    completed: 0,
    failed: 0,
    successRate: 0,
    avgExecutionTimeMs: 0
  });
  const [showOfflineClients, setShowOfflineClients] = useState(false);
  const [selectedTerminalAgent, setSelectedTerminalAgent] = useState<Agent | null>(null);

  // Profile management state
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const profileDropdownRef = useRef<HTMLDivElement>(null);

  // Profile form state
  const [profileForm, setProfileForm] = useState({
    username: '',
    email: '',
    displayName: ''
  });

  // Password form state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });

  // Calculate stats from real data
  const onlineAgents = tableData.filter(agent => agent.status === 'online');
  const offlineAgents = tableData.filter(agent => agent.status === 'offline');

  // Update selectedTerminalAgent when onlineAgents changes
  useEffect(() => {
    if (onlineAgents.length > 0 && !selectedTerminalAgent) {
      setSelectedTerminalAgent(onlineAgents[0]);
    } else if (onlineAgents.length === 0) {
      setSelectedTerminalAgent(null);
    }
  }, [onlineAgents, selectedTerminalAgent]);

  // Fetch task stats
  const fetchTaskStats = async () => {
    try {
      const response = await fetch('/api/task/stats', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setTaskStats(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch task stats:', error);
    }
  };

  // Fetch stats on component mount
  useEffect(() => {
    fetchTaskStats();
  }, []);

  // Handle client actions
  const handleClientAction = (action: string, client: Agent) => {
    console.log(`Client action: ${action} for ${client.computerName}`);
    
    switch (action) {
      case 'reboot':
        onSendCommand(client.id, 'shutdown /r /t 0', `reboot_${Date.now()}`);
        break;
      case 'screenshot':
        onSendCommand(client.id, 'screenshot', `screenshot_${Date.now()}`);
        break;
      case 'system-info':
        onSendCommand(client.id, 'systeminfo', `systeminfo_${Date.now()}`);
        break;
      case 'custom-command':
        // This would open a modal for custom command input
        const command = prompt('Enter custom command:');
        if (command) {
          onSendCommand(client.id, command, `custom_${Date.now()}`);
        }
        break;
      default:
        console.log('Unknown action:', action);
    }
  };

  // Profile management functions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch user profile
  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const response = await request({
        url: '/api/user/profile',
        method: 'GET'
      });

      if (response.data && response.data.data) {
        const userData = response.data.data.user;
        setUser(userData);
        setProfileForm({
          username: userData.username,
          email: userData.email,
          displayName: userData.displayName || userData.username
        });
      }
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
    }
  };

  const handleProfileUpdate = async () => {
    setProfileLoading(true);
    try {
      const response = await request({
        url: '/api/user/profile',
        method: 'PUT',
        data: profileForm
      });

      if (response.data && response.data.success) {
        toast.success('Profile updated successfully');
        setShowProfileModal(false);
        fetchUserProfile();
      }
    } catch (error: any) {
      console.error('Failed to update profile:', error);
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordChange = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    setProfileLoading(true);
    try {
      const response = await request({
        url: '/api/user/password/change',
        method: 'POST',
        data: {
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword
        }
      });

      if (response.data && response.data.success) {
        toast.success('Password changed successfully');
        setShowPasswordModal(false);
        setPasswordForm({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
      }
    } catch (error: any) {
      console.error('Failed to change password:', error);
      toast.error(error.response?.data?.message || 'Failed to change password');
    } finally {
      setProfileLoading(false);
    }
  };

  const handleProfilePictureUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('profilePicture', file);

    setProfileLoading(true);
    try {
      const response = await request({
        url: '/api/user/profile/picture',
        method: 'POST',
        data: formData,
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data && response.data.success) {
        toast.success('Profile picture updated successfully');
        fetchUserProfile();
      }
    } catch (error: any) {
      console.error('Failed to upload profile picture:', error);
      toast.error(error.response?.data?.message || 'Failed to upload profile picture');
    } finally {
      setProfileLoading(false);
    }
  };

  const toggleTwoFactor = async () => {
    setProfileLoading(true);
    try {
      const response = await request({
        url: '/api/user/two-factor/toggle',
        method: 'POST'
      });

      if (response.data && response.data.success) {
        toast.success(`2FA ${user?.twoFactorEnabled ? 'disabled' : 'enabled'} successfully`);
        fetchUserProfile();
      }
    } catch (error: any) {
      console.error('Failed to toggle 2FA:', error);
      toast.error(error.response?.data?.message || 'Failed to toggle 2FA');
    } finally {
      setProfileLoading(false);
    }
  };

  const handleLogout = () => {
    setShowLogoutConfirm(false);
    onLogout();
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-8">
            {/* Header */}
            <div className="premium-card p-8">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h1 className="text-3xl font-bold mb-2" style={{color: 'var(--text-primary)'}}>
                    🎯 Command & Control Dashboard
                  </h1>
                  <p style={{color: 'var(--text-secondary)'}}>
                    Monitor and control your connected clients in real-time
                  </p>
                </div>
                <div className="text-sm" style={{color: 'var(--text-tertiary)'}}>
                  Theme: {mode}
                </div>
              </div>
            </div>

            {/* Stats Overview */}
            <div className="premium-stats-grid">
              <div className="premium-stat-card">
                <div className="premium-stat-value">{tableData.length}</div>
                <div className="premium-stat-label">Total Clients</div>
              </div>
              
              <div className="premium-stat-card">
                <div className="premium-stat-value text-green-600">{onlineAgents.length}</div>
                <div className="premium-stat-label">Online Clients</div>
              </div>
              
              <div className="premium-stat-card">
                <div className="premium-stat-value text-yellow-600">{taskStats.pending}</div>
                <div className="premium-stat-label">Pending Tasks</div>
              </div>
              
              <div className="premium-stat-card">
                <div className="premium-stat-value text-purple-600">{taskStats.successRate.toFixed(1)}%</div>
                <div className="premium-stat-label">Success Rate</div>
              </div>
            </div>

            {/* Online Clients */}
            <div className="premium-card p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold" style={{color: 'var(--text-primary)'}}>
                  🟢 Online Clients ({onlineAgents.length})
                </h2>
                {offlineAgents.length > 0 && (
                  <button
                    onClick={() => setShowOfflineClients(!showOfflineClients)}
                    className="premium-button text-sm"
                  >
                    {showOfflineClients ? 'Hide' : 'Show'} Offline ({offlineAgents.length})
                  </button>
                )}
              </div>
              
              {onlineAgents.length > 0 ? (
                <div className="premium-client-grid">
                  {onlineAgents.map((client) => (
                    <ClientCard
                      key={client.id}
                      client={client}
                      onAction={handleClientAction}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">🔍</div>
                  <h3 className="text-lg font-medium mb-2" style={{color: 'var(--text-primary)'}}>
                    No Online Clients
                  </h3>
                  <p style={{color: 'var(--text-secondary)'}}>
                    Start the client application to see it appear here
                  </p>
                </div>
              )}
            </div>

            {/* Offline Clients */}
            {showOfflineClients && offlineAgents.length > 0 && (
              <div className="premium-card p-6">
                <h2 className="text-xl font-semibold mb-6" style={{color: 'var(--text-primary)'}}>
                  🔴 Offline Clients ({offlineAgents.length})
                </h2>
                
                <div className="premium-client-grid">
                  {offlineAgents.map((client) => (
                    <div key={client.id} className="premium-client-card opacity-75">
                      <div className="premium-client-header">
                        <div className="flex items-center gap-3">
                          <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                          <div>
                            <h3 className="premium-client-name">{client.computerName}</h3>
                            <p className="text-sm text-gray-500 font-mono">{client.id}</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="premium-client-info">
                        <div className="premium-client-info-item">
                          <span className="text-sm text-gray-500">Last Seen:</span>
                          <span className="text-sm text-red-400">
                            {new Date(client.lastActiveTime).toLocaleString()}
                          </span>
                        </div>
                        <div className="premium-client-info-item">
                          <span className="text-sm text-gray-500">IP:</span>
                          <span className="text-sm text-gray-400">{client.ipAddress}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );

      case 'clients':
        return (
          <div className="space-y-6">
            <div className="bg-white dark:bg-boxdark rounded-lg shadow-sm border border-stroke dark:border-strokedark p-6">
              <h2 className="text-xl font-semibold text-black dark:text-white mb-4">Connected Clients</h2>
              {isLoading ? (
                <div className="flex justify-center items-center h-64">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : (
                <UserTable 
                  users={tableData} 
                  onViewUser={onActionClicked}
                  onViewTasks={onTasksClicked} 
                />
              )}
            </div>
          </div>
        );

      case 'terminal':
        return (
          <div className="space-y-6">
            {/* Unified Terminal Component */}
            <UnifiedTerminal
              selectedAgent={selectedTerminalAgent}
              onSelectAgent={setSelectedTerminalAgent}
              agents={onlineAgents}
              onCommandSent={(command) => {
                console.log('Terminal command sent:', command);
                const agent = command.targetUuid || selectedTerminalAgent?.id;
                if (agent && command.command) {
                  onSendCommand(agent, command.command, command.id || command.correlationId);
                }
              }}
              commandHistory={naturalLanguageHistory}
              setCommandHistory={setNaturalLanguageHistory}
            />
          </div>
        );
      
      case 'logs':
        return <LogsPage />;
      
      case 'tasks':
        return <TaskScheduler agents={tableData} />;
      
      case 'settings':
        return <Settings />;
      
      case 'agent':
        return <AgentSection />;
      
      case 'ai-insights':
        return (
          <div className="h-screen">
            <AIInsightsPanel 
              commandHistory={naturalLanguageHistory}
              learningStats={learningStats}
            />
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className={`min-h-screen theme-${mode}`}>
      {/* Header */}
      <div className="premium-card m-6 mb-0">
        <div className="flex items-center justify-between h-16 px-6">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">💀</span>
              </div>
              <div>
                <h1 className="text-xl font-bold" style={{color: 'var(--text-primary)'}}>C2 Panel</h1>
                <p className="text-xs" style={{color: 'var(--text-secondary)'}}>Command & Control Panel</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm" style={{color: 'var(--text-secondary)'}}>OPERATIONAL</span>
            </div>
            {/* Profile Dropdown */}
            <div className="relative" ref={profileDropdownRef}>
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                {user?.profilePicture ? (
                  <img
                    src={user.profilePicture}
                    alt="Profile"
                    className="w-8 h-8 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center">
                    <FiUser className="w-4 h-4 text-white" />
                  </div>
                )}
                <div className="text-left">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {user?.displayName || user?.username || 'User'}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {user?.role || 'Admin'}
                  </p>
                </div>
              </button>
              
              {isProfileOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50">
                  <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center space-x-3">
                      {user?.profilePicture ? (
                        <img
                          src={user.profilePicture}
                          alt="Profile"
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-indigo-600 rounded-full flex items-center justify-center">
                          <FiUser className="w-6 h-6 text-white" />
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {user?.displayName || user?.username || 'User'}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {user?.email || 'user@example.com'}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-2">
                    <button
                      onClick={() => {
                        setShowProfileModal(true);
                        setIsProfileOpen(false);
                      }}
                      className="w-full flex items-center space-x-3 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                      <FiEdit className="w-4 h-4" />
                      <span>Edit Profile</span>
                    </button>
                    
                    <button
                      onClick={() => {
                        setShowPasswordModal(true);
                        setIsProfileOpen(false);
                      }}
                      className="w-full flex items-center space-x-3 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                      <FiKey className="w-4 h-4" />
                      <span>Change Password</span>
                    </button>
                    
                    <button
                      onClick={toggleTwoFactor}
                      disabled={profileLoading}
                      className="w-full flex items-center space-x-3 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
                    >
                      <FiShield className="w-4 h-4" />
                      <span>{user?.twoFactorEnabled ? 'Disable' : 'Enable'} 2FA</span>
                    </button>
                    
                    <hr className="my-2 border-gray-200 dark:border-gray-700" />
                    
                    <button
                      onClick={() => {
                        setShowLogoutConfirm(true);
                        setIsProfileOpen(false);
                      }}
                      className="w-full flex items-center space-x-3 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    >
                      <FiLogOut className="w-4 h-4" />
                      <span>Logout</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="premium-card mx-6 mb-6">
        <nav className="flex space-x-8 px-6">
          {[
            { id: 'overview', label: 'Overview', icon: '📊' },
            { id: 'clients', label: 'Clients', icon: '👥' },
            { id: 'agent', label: 'Agent', icon: '🤖' },
            { id: 'terminal', label: 'AI Terminal', icon: '💻' },
            ...(localStorage.getItem('userRole') === 'admin' ? [{ id: 'ai-insights', label: 'AI Insights', icon: '🧠' }] : []),
            { id: 'logs', label: 'Logs', icon: '📝' },
            { id: 'tasks', label: 'Tasks', icon: '📋' },
            { id: 'settings', label: 'Settings', icon: '⚙️' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? 'border-indigo-500'
                  : 'border-transparent hover:border-gray-300'
              }`}
              style={{
                color: activeTab === tab.id ? 'var(--premium-primary)' : 'var(--text-secondary)'
              }}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Main Content */}
      <div className="px-6 pb-8">
        {renderTabContent()}
      </div>

      {/* Profile Modal */}
      {showProfileModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Edit Profile
              </h3>
              <button
                onClick={() => setShowProfileModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Profile Picture Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Profile Picture
                </label>
                <div className="flex items-center space-x-4">
                  {user?.profilePicture ? (
                    <img
                      src={user.profilePicture}
                      alt="Profile"
                      className="w-16 h-16 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-16 h-16 bg-indigo-600 rounded-full flex items-center justify-center">
                      <FiUser className="w-8 h-8 text-white" />
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleProfilePictureUpload}
                    className="hidden"
                    id="profile-picture-upload"
                  />
                  <label
                    htmlFor="profile-picture-upload"
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 cursor-pointer transition-colors"
                  >
                    <FiCamera className="w-4 h-4 inline mr-2" />
                    Upload
                  </label>
                </div>
              </div>

              {/* Username */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Username
                </label>
                <input
                  type="text"
                  value={profileForm.username}
                  onChange={(e) => setProfileForm(prev => ({ ...prev, username: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={profileForm.email}
                  onChange={(e) => setProfileForm(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              {/* Display Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Display Name
                </label>
                <input
                  type="text"
                  value={profileForm.displayName}
                  onChange={(e) => setProfileForm(prev => ({ ...prev, displayName: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowProfileModal(false)}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleProfileUpdate}
                disabled={profileLoading}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg disabled:opacity-50"
              >
                {profileLoading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Change Password
              </h3>
              <button
                onClick={() => setShowPasswordModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Current Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Current Password
                </label>
                <div className="relative">
                  <input
                    type={showPasswords.current ? 'text' : 'password'}
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                    className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords(prev => ({ ...prev, current: !prev.current }))}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPasswords.current ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showPasswords.new ? 'text' : 'password'}
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                    className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPasswords.new ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Confirm New Password
                </label>
                <div className="relative">
                  <input
                    type={showPasswords.confirm ? 'text' : 'password'}
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPasswords.confirm ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowPasswordModal(false)}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handlePasswordChange}
                disabled={profileLoading}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg disabled:opacity-50"
              >
                {profileLoading ? 'Changing...' : 'Change Password'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Confirm Logout
              </h3>
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Are you sure you want to logout? You will need to login again to access the system.
            </p>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;