import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Users, Shield, Activity, AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';

export function Overview() {
  const [stats, setStats] = useState({
    activeClients: 24,
    totalClients: 32,
    threats: 3,
    cpuUsage: 45,
    memoryUsage: 62,
    networkActivity: 78
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setStats(prev => ({
        ...prev,
        cpuUsage: Math.max(0, Math.min(100, prev.cpuUsage + (Math.random() - 0.5) * 10)),
        memoryUsage: Math.max(0, Math.min(100, prev.memoryUsage + (Math.random() - 0.5) * 5)),
        networkActivity: Math.max(0, Math.min(100, prev.networkActivity + (Math.random() - 0.5) * 15))
      }));
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="p-6 space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-slate-400 text-sm">Active Clients</CardTitle>
            <Users className="h-4 w-4 text-cyan-500" />
          </CardHeader>
          <CardContent>
            <div className="text-slate-100 text-2xl">{stats.activeClients}/{stats.totalClients}</div>
            <div className="flex items-center gap-1 mt-2 text-green-500 text-xs">
              <TrendingUp className="h-3 w-3" />
              <span>12% from last hour</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-slate-400 text-sm">Threat Level</CardTitle>
            <Shield className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-slate-100 text-2xl">Medium</div>
            <div className="flex items-center gap-1 mt-2">
              <Badge className="bg-amber-500/10 text-amber-500 text-xs">
                {stats.threats} Active Alerts
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-slate-400 text-sm">System Load</CardTitle>
            <Activity className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-slate-100 text-2xl">{Math.round(stats.cpuUsage)}%</div>
            <div className="flex items-center gap-1 mt-2 text-slate-500 text-xs">
              <TrendingDown className="h-3 w-3" />
              <span>Optimal performance</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-slate-400 text-sm">Active Threats</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-slate-100 text-2xl">{stats.threats}</div>
            <div className="flex items-center gap-1 mt-2">
              <Badge className="bg-red-500/10 text-red-500 text-xs">
                Requires attention
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Resources */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-slate-100">System Resources</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-400 text-sm">CPU Usage</span>
                <span className="text-cyan-400">{Math.round(stats.cpuUsage)}%</span>
              </div>
              <Progress value={stats.cpuUsage} className="h-2 bg-slate-800" />
            </div>
            
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-400 text-sm">Memory Usage</span>
                <span className="text-cyan-400">{Math.round(stats.memoryUsage)}%</span>
              </div>
              <Progress value={stats.memoryUsage} className="h-2 bg-slate-800" />
            </div>
            
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-400 text-sm">Network Activity</span>
                <span className="text-cyan-400">{Math.round(stats.networkActivity)}%</span>
              </div>
              <Progress value={stats.networkActivity} className="h-2 bg-slate-800" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-slate-100">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { type: 'success', msg: 'Client DESKTOP-5X2A connected', time: '2m ago' },
                { type: 'warning', msg: 'Suspicious activity detected on CLIENT-03', time: '5m ago' },
                { type: 'info', msg: 'System scan completed successfully', time: '12m ago' },
                { type: 'error', msg: 'Failed login attempt from 192.168.1.45', time: '18m ago' },
              ].map((activity, i) => (
                <div key={i} className="flex items-start gap-3 pb-4 border-b border-slate-800 last:border-0 last:pb-0">
                  <div className={`h-2 w-2 rounded-full mt-1.5 ${
                    activity.type === 'success' ? 'bg-green-500' :
                    activity.type === 'warning' ? 'bg-amber-500' :
                    activity.type === 'error' ? 'bg-red-500' : 'bg-blue-500'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-slate-300 text-sm">{activity.msg}</p>
                    <p className="text-slate-500 text-xs mt-1">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
