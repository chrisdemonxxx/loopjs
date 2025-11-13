import { useEffect, useState } from 'react';
import { Computer } from '../types';
import { generateMockComputers } from '../lib/mockData';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { MonitorDot, AlertTriangle, MonitorOff, Activity } from 'lucide-react';

export function DashboardStats() {
  const [computers, setComputers] = useState<Computer[]>([]);

  useEffect(() => {
    setComputers(generateMockComputers());
  }, []);

  const onlineCount = computers.filter(c => c.status === 'online').length;
  const warningCount = computers.filter(c => c.status === 'warning').length;
  const offlineCount = computers.filter(c => c.status === 'offline').length;
  const avgCpu = computers.length > 0 
    ? Math.round(computers.reduce((sum, c) => sum + c.cpu, 0) / computers.length) 
    : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-slate-600">Online</CardTitle>
          <MonitorDot className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-slate-900">{onlineCount}</div>
          <p className="text-slate-500">Active computers</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-slate-600">Warnings</CardTitle>
          <AlertTriangle className="h-4 w-4 text-amber-600" />
        </CardHeader>
        <CardContent>
          <div className="text-slate-900">{warningCount}</div>
          <p className="text-slate-500">Need attention</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-slate-600">Offline</CardTitle>
          <MonitorOff className="h-4 w-4 text-slate-400" />
        </CardHeader>
        <CardContent>
          <div className="text-slate-900">{offlineCount}</div>
          <p className="text-slate-500">Not responding</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-slate-600">Avg CPU</CardTitle>
          <Activity className="h-4 w-4 text-blue-600" />
        </CardHeader>
        <CardContent>
          <div className="text-slate-900">{avgCpu}%</div>
          <p className="text-slate-500">Fleet average</p>
        </CardContent>
      </Card>
    </div>
  );
}
