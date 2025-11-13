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
  User, 
  LogOut, 
  Edit, 
  Camera, 
  Key, 
  Shield,
  X,
  Eye,
  EyeOff
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  const [showOfflineClients] = useState(false);
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

  // Panel settings state
  const [panelSettings, setPanelSettings] = useState({
    panelName: 'C2 Panel',
    panelIcon: '💀'
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

  // Load panel settings from database
  const loadPanelSettings = async () => {
    try {
      const response = await request({
        url: '/settings',
        method: 'GET'
      });
      if (response.data.status === 'success' && response.data.settings) {
        setPanelSettings({
          panelName: response.data.settings.panelName || 'C2 Panel',
          panelIcon: response.data.settings.panelIcon || '💀'
        });
      }
    } catch (error) {
      console.error('Failed to load panel settings:', error);
    }
  };

  useEffect(() => {
    loadPanelSettings();
  }, []);

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




  return (
    <div className={`min-h-screen theme-${mode} bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-100/50 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950/50`}>
      {/* Header */}
      <Card className="m-6 mb-0 border-0 shadow-xl">
        <CardContent className="p-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">{panelSettings.panelIcon}</span>
                </div>
                <div>
                  <h1 className="text-xl font-bold" style={{color: 'var(--text-primary)'}}>{panelSettings.panelName}</h1>
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
              <DropdownMenu open={isProfileOpen} onOpenChange={setIsProfileOpen}>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center space-x-2 p-2 h-auto">
                    {user?.profilePicture ? (
                      <img
                        src={user.profilePicture}
                        alt="Profile"
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center">
                        <User className="w-4 h-4 text-white" />
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
                  </Button>
                </DropdownMenuTrigger>
              
                <DropdownMenuContent className="w-64" align="end">
                  <div className="p-4 border-b">
                    <div className="flex items-center space-x-3">
                      {user?.profilePicture ? (
                        <img
                          src={user.profilePicture}
                          alt="Profile"
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-indigo-600 rounded-full flex items-center justify-center">
                          <User className="w-6 h-6 text-white" />
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
                    <DropdownMenuItem
                      onClick={() => {
                        setShowProfileModal(true);
                        setIsProfileOpen(false);
                      }}
                      className="flex items-center space-x-3 px-3 py-2 cursor-pointer"
                    >
                      <Edit className="w-4 h-4" />
                      <span>Edit Profile</span>
                    </DropdownMenuItem>
                    
                    <DropdownMenuItem
                      onClick={() => {
                        setShowPasswordModal(true);
                        setIsProfileOpen(false);
                      }}
                      className="flex items-center space-x-3 px-3 py-2 cursor-pointer"
                    >
                      <Key className="w-4 h-4" />
                      <span>Change Password</span>
                    </DropdownMenuItem>
                    
                    <DropdownMenuItem
                      onClick={toggleTwoFactor}
                      disabled={profileLoading}
                      className="flex items-center space-x-3 px-3 py-2 cursor-pointer disabled:opacity-50"
                    >
                      <Shield className="w-4 h-4" />
                      <span>{user?.twoFactorEnabled ? 'Disable' : 'Enable'} 2FA</span>
                    </DropdownMenuItem>
                    
                    <DropdownMenuSeparator />
                    
                    <DropdownMenuItem
                      onClick={() => {
                        setShowLogoutConfirm(true);
                        setIsProfileOpen(false);
                      }}
                      className="flex items-center space-x-3 px-3 py-2 cursor-pointer text-red-600 dark:text-red-400 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-900/20"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Logout</span>
                    </DropdownMenuItem>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Navigation Tabs */}
      <Card className="mx-6 mb-6 border-0 shadow-lg">
        <CardContent className="p-0">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-8 h-auto p-1 bg-transparent">
              <TabsTrigger value="overview" className="flex items-center space-x-2">
                <span>📊</span>
                <span>Overview</span>
              </TabsTrigger>
              <TabsTrigger value="clients" className="flex items-center space-x-2">
                <span>👥</span>
                <span>Clients</span>
              </TabsTrigger>
              <TabsTrigger value="agent" className="flex items-center space-x-2">
                <span>🤖</span>
                <span>Agent</span>
              </TabsTrigger>
              <TabsTrigger value="terminal" className="flex items-center space-x-2">
                <span>💻</span>
                <span>AI Terminal</span>
              </TabsTrigger>
              {localStorage.getItem('userRole') === 'admin' && (
                <TabsTrigger value="ai-insights" className="flex items-center space-x-2">
                  <span>🧠</span>
                  <span>AI Insights</span>
                </TabsTrigger>
              )}
              <TabsTrigger value="logs" className="flex items-center space-x-2">
                <span>📝</span>
                <span>Logs</span>
              </TabsTrigger>
              <TabsTrigger value="tasks" className="flex items-center space-x-2">
                <span>📋</span>
                <span>Tasks</span>
              </TabsTrigger>
              <TabsTrigger value="settings" className="flex items-center space-x-2">
                <span>⚙️</span>
                <span>Settings</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </CardContent>
      </Card>

      {/* Main Content */}
      <div className="px-6 pb-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsContent value="overview" className="space-y-8">
            {/* Header */}
            <Card className="p-8">
              <CardContent>
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
              </CardContent>
            </Card>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="text-2xl font-bold">{tableData.length}</div>
                  <div className="text-sm text-muted-foreground">Total Clients</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="text-2xl font-bold text-green-600">{onlineAgents.length}</div>
                  <div className="text-sm text-muted-foreground">Online Clients</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="text-2xl font-bold text-yellow-600">{taskStats.pending}</div>
                  <div className="text-sm text-muted-foreground">Pending Tasks</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="text-2xl font-bold text-purple-600">{taskStats.successRate.toFixed(1)}%</div>
                  <div className="text-sm text-muted-foreground">Success Rate</div>
                </CardContent>
              </Card>
            </div>

            {/* Online Clients */}
            <Card className="p-6">
              <CardHeader>
                <CardTitle>Online Clients ({onlineAgents.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {onlineAgents.map((agent) => (
                    <ClientCard key={agent.id} client={agent} onAction={(action, client) => {
                      if (action === 'view') onActionClicked(client);
                      if (action === 'tasks') onTasksClicked(client);
                    }} />
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Offline Clients */}
            {showOfflineClients && offlineAgents.length > 0 && (
              <Card className="p-6">
                <CardHeader>
                  <CardTitle>Offline Clients ({offlineAgents.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {offlineAgents.map((agent) => (
                    <ClientCard key={agent.id} client={agent} onAction={(action, client) => {
                      if (action === 'view') onActionClicked(client);
                      if (action === 'tasks') onTasksClicked(client);
                    }} />
                  ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="clients">
            <Card>
              <CardContent className="p-6">
                <UserTable 
                  users={tableData} 
                  onViewUser={onActionClicked}
                  onViewTasks={onTasksClicked} 
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="terminal">
            <UnifiedTerminal
              selectedAgent={selectedTerminalAgent}
              onSelectAgent={setSelectedTerminalAgent}
              agents={onlineAgents}
              onCommandSent={(command) => {
                const agent = command.targetUuid || selectedTerminalAgent?.id;
                if (agent && command.command) {
                  onSendCommand(agent, command.command, command.id || command.correlationId);
                }
              }}
              commandHistory={naturalLanguageHistory}
              setCommandHistory={setNaturalLanguageHistory}
            />
          </TabsContent>

          <TabsContent value="logs">
            <LogsPage />
          </TabsContent>

          <TabsContent value="tasks">
            <TaskScheduler agents={tableData} />
          </TabsContent>

          <TabsContent value="settings">
            <Settings />
          </TabsContent>

          <TabsContent value="agent">
            <AgentSection />
          </TabsContent>

          {localStorage.getItem('userRole') === 'admin' && (
            <TabsContent value="ai-insights">
              <AIInsightsPanel 
                commandHistory={naturalLanguageHistory}
                learningStats={learningStats}
              />
            </TabsContent>
          )}
        </Tabs>
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
                <X className="w-5 h-5" />
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
                      <User className="w-8 h-8 text-white" />
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
                    <Camera className="w-4 h-4 inline mr-2" />
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
                <X className="w-5 h-5" />
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
                    {showPasswords.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
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
                    {showPasswords.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
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
                    {showPasswords.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
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
                <X className="w-5 h-5" />
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