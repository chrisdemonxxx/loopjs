import { Computer } from '../types';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { MonitorDot, MonitorOff, AlertTriangle, HardDrive, Cpu, MemoryStick, Clock, User } from 'lucide-react';

interface ComputerCardProps {
  computer: Computer;
}

export function ComputerCard({ computer }: ComputerCardProps) {
  const getStatusIcon = () => {
    switch (computer.status) {
      case 'online':
        return <MonitorDot className="h-5 w-5 text-green-600" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-amber-600" />;
      case 'offline':
        return <MonitorOff className="h-5 w-5 text-slate-400" />;
    }
  };

  const getStatusBadge = () => {
    switch (computer.status) {
      case 'online':
        return <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Online</Badge>;
      case 'warning':
        return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">Warning</Badge>;
      case 'offline':
        return <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-100">Offline</Badge>;
    }
  };

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    if (days > 0) return `${days}d ${hours}h`;
    return `${hours}h`;
  };

  const getMetricColor = (value: number) => {
    if (value >= 85) return 'text-red-600';
    if (value >= 70) return 'text-amber-600';
    return 'text-green-600';
  };

  return (
    <Card className={computer.status === 'offline' ? 'opacity-75' : ''}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            {getStatusIcon()}
            <div>
              <CardTitle className="text-slate-900">{computer.name}</CardTitle>
              <p className="text-slate-500">{computer.hostname}</p>
            </div>
          </div>
          {getStatusBadge()}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-slate-600">
          <div className="flex items-center gap-2">
            <span>IP:</span>
            <span className="text-slate-900">{computer.ip}</span>
          </div>
          <div className="flex items-center gap-2">
            <span>OS:</span>
            <span className="text-slate-900">{computer.os}</span>
          </div>
        </div>

        {computer.currentUser && (
          <div className="flex items-center gap-2 text-slate-600">
            <User className="h-4 w-4" />
            <span>Current user:</span>
            <span className="text-slate-900">{computer.currentUser}</span>
          </div>
        )}

        {computer.status !== 'offline' && (
          <div className="space-y-3">
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-600">
                  <Cpu className="h-4 w-4" />
                  <span>CPU</span>
                </div>
                <span className={getMetricColor(computer.cpu)}>
                  {Math.round(computer.cpu)}%
                </span>
              </div>
              <Progress value={computer.cpu} className="h-2" />
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-600">
                  <MemoryStick className="h-4 w-4" />
                  <span>Memory</span>
                </div>
                <span className={getMetricColor(computer.memory)}>
                  {Math.round(computer.memory)}%
                </span>
              </div>
              <Progress value={computer.memory} className="h-2" />
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-600">
                  <HardDrive className="h-4 w-4" />
                  <span>Disk</span>
                </div>
                <span className={getMetricColor(computer.disk)}>
                  {Math.round(computer.disk)}%
                </span>
              </div>
              <Progress value={computer.disk} className="h-2" />
            </div>
          </div>
        )}

        <div className="flex items-center gap-2 text-slate-500 pt-2 border-t">
          <Clock className="h-4 w-4" />
          <span>
            {computer.status === 'offline' 
              ? `Last seen ${formatUptime(Math.floor((Date.now() - computer.lastSeen.getTime()) / 1000))} ago`
              : `Uptime: ${formatUptime(computer.uptime)}`
            }
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
