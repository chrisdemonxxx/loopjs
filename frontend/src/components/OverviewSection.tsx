import { useState, useEffect } from 'react';
import { Activity, Server, Users, Clock, TrendingUp, Cpu, HardDrive, Network, Zap, AlertTriangle, CircleCheck, CircleX, Pin, Timer, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Button } from './ui/button';
import { useTheme } from '../contexts/ThemeContext';

export default function OverviewSection() {
  const [stats, setStats] = useState({
    totalClients: 12,
    onlineClients: 8,
    offlineClients: 4,
    pendingTasks: 5,
    successRate: 95.5,
    avgExecutionTime: '1.2s'
  });

  const [activities, setActivities] = useState([
    { id: 1, type: 'connection', message: 'Client DESKTOP-WK8X connected', time: '2 min ago', status: 'success' },
    { id: 2, type: 'command', message: 'Command executed successfully on CLIENT-PC', time: '5 min ago', status: 'success' },
    { id: 3, type: 'disconnection', message: 'Client LAPTOP-7Y9Z disconnected', time: '8 min ago', status: 'warning' },
    { id: 4, type: 'alert', message: 'High CPU usage detected on SERVER-01', time: '12 min ago', status: 'error' },
    { id: 5, type: 'command', message: 'Batch command sent to 5 clients', time: '15 min ago', status: 'info' },
  ]);

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setStats(prev => ({
        ...prev,
        onlineClients: Math.floor(Math.random() * 3) + 7,
        pendingTasks: Math.floor(Math.random() * 5) + 3,
        successRate: (95 + Math.random() * 4).toFixed(1),
      }));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const statCards = [
    {
      title: 'Total Clients',
      value: stats.totalClients,
      icon: Users,
      gradient: 'from-indigo-500 to-purple-500',
      iconBg: 'bg-indigo-500/20',
      iconColor: 'text-indigo-400'
    },
    {
      title: 'Online Clients',
      value: stats.onlineClients,
      icon: CircleCheck,
      gradient: 'from-green-500 to-emerald-500',
      iconBg: 'bg-green-500/20',
      iconColor: 'text-green-400'
    },
    {
      title: 'Offline Clients',
      value: stats.offlineClients,
      icon: CircleX,
      gradient: 'from-slate-500 to-slate-600',
      iconBg: 'bg-slate-500/20',
      iconColor: 'text-slate-400'
    },
    {
      title: 'Pending Tasks',
      value: stats.pendingTasks,
      subtitle: 'In queue',
      icon: Clock,
      gradient: 'from-orange-500 to-amber-500',
      iconBg: 'bg-orange-500/20',
      iconColor: 'text-orange-400'
    },
    {
      title: 'Success Rate',
      value: `${stats.successRate}%`,
      subtitle: 'Command execution',
      icon: CircleCheck,
      gradient: 'from-green-500 to-teal-500',
      iconBg: 'bg-green-500/20',
      iconColor: 'text-green-400'
    },
    {
      title: 'Avg Execution Time',
      value: stats.avgExecutionTime,
      icon: Timer,
      gradient: 'from-blue-500 to-cyan-500',
      iconBg: 'bg-blue-500/20',
      iconColor: 'text-blue-400'
    },
  ];

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'connection':
        return CircleCheck;
      case 'disconnection':
        return CircleX;
      case 'command':
        return Zap;
      case 'alert':
        return AlertTriangle;
      default:
        return Pin;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'text-green-400';
      case 'warning':
        return 'text-orange-400';
      case 'error':
        return 'text-red-400';
      default:
        return 'text-blue-400';
    }
  };

  return (
    <div className="space-y-6">
      {/* Dashboard Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {statCards.map((stat, index) => (
          <Card 
            key={index}
            className="group relative overflow-hidden border-[#00d9b5]/30 bg-gradient-to-br from-[#131824]/90 to-[#1e2538]/90 backdrop-blur-2xl transition-all hover:scale-[1.02] hover:shadow-2xl hover:shadow-[#00d9b5]/40 hover:border-[#00d9b5]/60"
            style={{
              boxShadow: '0 8px 32px 0 rgba(0, 217, 181, 0.1), inset 0 1px 1px 0 rgba(255, 255, 255, 0.05)'
            }}
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-0 transition-opacity group-hover:opacity-10`} />
            <div className="absolute inset-0 bg-gradient-to-br from-transparent via-[#00d9b5]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm text-slate-300">{stat.title}</CardTitle>
              <div className={`rounded-lg p-2 ${stat.iconBg} backdrop-blur-sm ring-1 ring-white/10`}>
                <stat.icon className={`h-5 w-5 ${stat.iconColor} drop-shadow-lg`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className={`text-3xl bg-gradient-to-r ${stat.gradient} bg-clip-text text-transparent drop-shadow-2xl`}>
                {stat.value}
              </div>
              {stat.subtitle && (
                <p className="text-xs text-slate-400 mt-1">{stat.subtitle}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Real-time Activity Feed */}
        <Card className="border-[#00d9b5]/30 bg-gradient-to-br from-[#131824]/90 to-[#1e2538]/90 backdrop-blur-2xl"
          style={{
            boxShadow: '0 8px 32px 0 rgba(0, 217, 181, 0.15), inset 0 1px 1px 0 rgba(255, 255, 255, 0.05)'
          }}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-slate-100">
                  <Activity className="h-5 w-5 text-[#00d9b5] drop-shadow-[0_0_8px_rgba(0,217,181,0.5)]" />
                  Real-time Activity Feed
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Live system events and notifications
                </CardDescription>
              </div>
              <Badge variant="outline" className="border-[#00d9b5]/50 bg-[#00d9b5]/10 text-[#00d9b5] backdrop-blur-sm">
                <span className="mr-1 h-2 w-2 rounded-full bg-[#00d9b5] animate-pulse shadow-[0_0_8px_rgba(0,217,181,0.8)]" />
                Live
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {activities.map((activity) => {
                const IconComponent = getActivityIcon(activity.type);
                return (
                  <div
                    key={activity.id}
                    className="flex items-start gap-3 rounded-lg border border-[#00d9b5]/20 bg-[#0f1420]/50 p-3 transition-all hover:bg-[#1e2538]/50 hover:border-[#00d9b5]/40 hover:shadow-lg hover:shadow-[#00d9b5]/10 backdrop-blur-sm"
                  >
                    <IconComponent className={`h-5 w-5 ${getStatusColor(activity.status)}`} />
                    <div className="flex-1">
                      <p className={`text-sm ${getStatusColor(activity.status)}`}>
                        {activity.message}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">{activity.time}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions Panel */}
        <Card className="border-[#00d9b5]/30 bg-gradient-to-br from-[#131824]/90 to-[#1e2538]/90 backdrop-blur-2xl"
          style={{
            boxShadow: '0 8px 32px 0 rgba(0, 217, 181, 0.15), inset 0 1px 1px 0 rgba(255, 255, 255, 0.05)'
          }}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-100">
              <TrendingUp className="h-5 w-5 text-[#00d9b5] drop-shadow-[0_0_8px_rgba(0,217,181,0.5)]" />
              Quick Actions
            </CardTitle>
            <CardDescription className="text-slate-400">
              Common operations and shortcuts
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button className="w-full justify-start gap-2 bg-gradient-to-r from-[#00d9b5] to-[#00b894] text-[#0a0e1a] hover:from-[#00c4a3] hover:to-[#00a082] shadow-lg shadow-[#00d9b5]/40 hover:shadow-[#00d9b5]/60 transition-all">
              <Users className="h-4 w-4" />
              View All Clients
            </Button>
            <Button className="w-full justify-start gap-2 bg-gradient-to-r from-[#10b981] to-[#059669] text-white hover:from-[#0ea070] hover:to-[#047857] shadow-lg shadow-green-500/30 hover:shadow-green-500/50 transition-all">
              <CheckCircle className="h-4 w-4" />
              Create New Task
            </Button>
            <Button className="w-full justify-start gap-2 bg-gradient-to-r from-[#3b82f6] to-[#2563eb] text-white hover:from-[#2563eb] hover:to-[#1d4ed8] shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 transition-all">
              <Activity className="h-4 w-4" />
              View Recent Logs
            </Button>
            <Button className="w-full justify-start gap-2 bg-gradient-to-r from-[#f59e0b] to-[#d97706] text-white hover:from-[#d97706] hover:to-[#b45309] shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50 transition-all">
              <Timer className="h-4 w-4" />
              Monitor Performance
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}