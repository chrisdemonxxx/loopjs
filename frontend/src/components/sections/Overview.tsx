import { useState, useEffect } from 'react';
import { Users, UserCheck, UserX, Clock, CheckCircle, Timer, Activity, TrendingUp, Zap, AlertTriangle, CircleX, Pin, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { useTheme } from '../../contexts/ThemeContext';
import { soundManager } from '../../utils/sounds';

interface ActivityItem {
  id: string;
  type: 'connection' | 'disconnection' | 'command' | 'alert';
  message: string;
  timestamp: Date;
}

export function Overview() {
  const [stats] = useState({
    totalClients: 24,
    onlineClients: 18,
    offlineClients: 6,
    pendingTasks: 12,
    successRate: 95.5,
    avgExecutionTime: 1.2,
  });

  const [activities, setActivities] = useState<ActivityItem[]>([
    { id: '1', type: 'connection', message: 'WORKSTATION-PC-045 connected from 192.168.1.105', timestamp: new Date(Date.now() - 2 * 60000) },
    { id: '2', type: 'command', message: 'Command executed successfully on SERVER-01', timestamp: new Date(Date.now() - 5 * 60000) },
    { id: '3', type: 'alert', message: 'High CPU usage detected on DESKTOP-WIN10', timestamp: new Date(Date.now() - 8 * 60000) },
    { id: '4', type: 'disconnection', message: 'LAPTOP-MAC-03 disconnected', timestamp: new Date(Date.now() - 12 * 60000) },
  ]);

  useEffect(() => {
    const interval = setInterval(() => {
      const newActivity: ActivityItem = {
        id: Math.random().toString(),
        type: ['connection', 'command', 'alert'][Math.floor(Math.random() * 3)] as ActivityItem['type'],
        message: [
          'New client connected from 192.168.1.' + Math.floor(Math.random() * 255),
          'Command executed successfully',
          'System health check completed',
          'Task completed on remote client',
        ][Math.floor(Math.random() * 4)],
        timestamp: new Date(),
      };
      setActivities(prev => [newActivity, ...prev].slice(0, 10));
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  const getActivityIcon = (type: ActivityItem['type']) => {
    switch (type) {
      case 'connection': return '🟢';
      case 'disconnection': return '🔴';
      case 'command': return '⚡';
      case 'alert': return '⚠️';
    }
  };

  const getRelativeTime = (date: Date) => {
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="border-slate-800 bg-gradient-to-br from-indigo-500/10 via-slate-900 to-slate-900 backdrop-blur">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-slate-200">Total Clients</CardTitle>
            <Users className="h-5 w-5 text-indigo-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl text-slate-100">{stats.totalClients}</div>
            <p className="mt-1 text-xs text-slate-400">All registered clients</p>
          </CardContent>
        </Card>

        <Card className="border-slate-800 bg-gradient-to-br from-green-500/10 via-slate-900 to-slate-900 backdrop-blur">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-slate-200">Online Clients</CardTitle>
            <UserCheck className="h-5 w-5 text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl text-slate-100">{stats.onlineClients}</div>
            <p className="mt-1 text-xs text-slate-400">Active connections</p>
          </CardContent>
        </Card>

        <Card className="border-slate-800 bg-gradient-to-br from-slate-500/10 via-slate-900 to-slate-900 backdrop-blur">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-slate-200">Offline Clients</CardTitle>
            <UserX className="h-5 w-5 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl text-slate-100">{stats.offlineClients}</div>
            <p className="mt-1 text-xs text-slate-400">Disconnected</p>
          </CardContent>
        </Card>

        <Card className="border-slate-800 bg-gradient-to-br from-orange-500/10 via-slate-900 to-slate-900 backdrop-blur">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-slate-200">Pending Tasks</CardTitle>
            <Clock className="h-5 w-5 text-orange-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl text-slate-100">{stats.pendingTasks}</div>
            <p className="mt-1 text-xs text-slate-400">In queue</p>
          </CardContent>
        </Card>

        <Card className="border-slate-800 bg-gradient-to-br from-green-500/10 via-slate-900 to-slate-900 backdrop-blur">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-slate-200">Success Rate</CardTitle>
            <CheckCircle className="h-5 w-5 text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl text-slate-100">{stats.successRate}%</div>
            <p className="mt-1 text-xs text-slate-400">Command execution</p>
          </CardContent>
        </Card>

        <Card className="border-slate-800 bg-gradient-to-br from-blue-500/10 via-slate-900 to-slate-900 backdrop-blur">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-slate-200">Avg Execution Time</CardTitle>
            <Timer className="h-5 w-5 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl text-slate-100">{stats.avgExecutionTime}s</div>
            <p className="mt-1 text-xs text-slate-400">Average response time</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Real-time Activity Feed */}
        <Card className="border-slate-800 bg-slate-900/50 backdrop-blur">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-indigo-400" />
              <CardTitle className="text-slate-200">Real-time Activity Feed</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activities.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3 rounded-lg border border-slate-800 bg-slate-800/50 p-3 transition-all hover:bg-slate-800">
                  <span className="text-xl">{getActivityIcon(activity.type)}</span>
                  <div className="flex-1">
                    <p className="text-sm text-slate-200">{activity.message}</p>
                    <p className="mt-1 text-xs text-slate-500">{getRelativeTime(activity.timestamp)}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions Panel */}
        <Card className="border-slate-800 bg-slate-900/50 backdrop-blur">
          <CardHeader>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-purple-400" />
              <CardTitle className="text-slate-200">Quick Actions</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button className="w-full justify-start bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700">
              <Users className="mr-2 h-4 w-4" />
              View All Clients
            </Button>
            <Button className="w-full justify-start bg-gradient-to-r from-blue-600 to-cyan-600 text-white hover:from-blue-700 hover:to-cyan-700">
              <Clock className="mr-2 h-4 w-4" />
              Create New Task
            </Button>
            <Button className="w-full justify-start bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700">
              <FileText className="mr-2 h-4 w-4" />
              View Recent Logs
            </Button>

            {/* System Health Status */}
            <div className="mt-6 space-y-3 rounded-lg border border-slate-800 bg-slate-800/30 p-4">
              <h3 className="text-sm text-slate-300">System Health</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">Server Status</span>
                  <Badge className="bg-green-500/20 text-green-400">Healthy</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">Database</span>
                  <Badge className="bg-green-500/20 text-green-400">Connected</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">Network</span>
                  <Badge className="bg-green-500/20 text-green-400">Stable</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}