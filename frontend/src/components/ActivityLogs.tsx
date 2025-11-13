import { useState, useEffect } from 'react';
import { ActivityLog } from '../types';
import { generateMockLogs } from '../lib/mockData';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Search, AlertCircle, Info, LogIn, LogOut, AlertTriangle } from 'lucide-react';

export function ActivityLogs() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  useEffect(() => {
    setLogs(generateMockLogs());
    
    // Simulate new logs being added
    const interval = setInterval(() => {
      const newLog: ActivityLog = {
        id: `log-${Date.now()}`,
        computerId: '1',
        computerName: 'DEV-WORKSTATION-01',
        timestamp: new Date(),
        user: 'john.doe',
        action: 'System Health Check',
        details: 'Automated health check completed successfully',
        type: 'info'
      };
      setLogs(prev => [newLog, ...prev].slice(0, 50));
    }, 15000);

    return () => clearInterval(interval);
  }, []);

  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      log.computerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.details.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = typeFilter === 'all' || log.type === typeFilter;
    
    return matchesSearch && matchesType;
  });

  const getTypeIcon = (type: ActivityLog['type']) => {
    switch (type) {
      case 'login':
        return <LogIn className="h-4 w-4 text-green-600" />;
      case 'logout':
        return <LogOut className="h-4 w-4 text-slate-600" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-amber-600" />;
      case 'info':
        return <Info className="h-4 w-4 text-blue-600" />;
    }
  };

  const getTypeBadge = (type: ActivityLog['type']) => {
    switch (type) {
      case 'login':
        return <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Login</Badge>;
      case 'logout':
        return <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-100">Logout</Badge>;
      case 'error':
        return <Badge className="bg-red-100 text-red-700 hover:bg-red-100">Error</Badge>;
      case 'warning':
        return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">Warning</Badge>;
      case 'info':
        return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">Info</Badge>;
    }
  };

  const formatTimestamp = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (seconds < 60) return `${seconds}s ago`;
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search logs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="login">Login</SelectItem>
            <SelectItem value="logout">Logout</SelectItem>
            <SelectItem value="error">Error</SelectItem>
            <SelectItem value="warning">Warning</SelectItem>
            <SelectItem value="info">Info</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <div className="divide-y divide-slate-200">
          {filteredLogs.map((log) => (
            <div key={log.id} className="p-4 hover:bg-slate-50 transition-colors">
              <div className="flex items-start gap-4">
                <div className="mt-1">
                  {getTypeIcon(log.type)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-slate-900">{log.action}</span>
                    {getTypeBadge(log.type)}
                  </div>
                  
                  <div className="mt-1 text-slate-600">
                    <span>{log.computerName}</span>
                    <span className="mx-2">•</span>
                    <span>User: {log.user}</span>
                  </div>
                  
                  <p className="mt-1 text-slate-500">{log.details}</p>
                </div>
                
                <div className="text-slate-500 whitespace-nowrap">
                  {formatTimestamp(log.timestamp)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {filteredLogs.length === 0 && (
        <div className="text-center py-12 text-slate-500">
          No logs found matching your filters.
        </div>
      )}
    </div>
  );
}
