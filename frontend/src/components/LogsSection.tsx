import { useState } from 'react';
import { FileText, Search, Download, Filter, Info, AlertTriangle, XCircle, Search as SearchIcon, FileEdit, RefreshCw, Trash2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';

interface LogEntry {
  id: number;
  timestamp: string;
  level: 'Info' | 'Warning' | 'Error' | 'Debug';
  component: string;
  message: string;
}

export default function LogsSection() {
  const [levelFilter, setLevelFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(true);

  const [logs] = useState<LogEntry[]>([
    { id: 1, timestamp: '14:23:45', level: 'Info', component: 'Connection', message: 'Client DESKTOP-WK8X connected successfully' },
    { id: 2, timestamp: '14:22:31', level: 'Info', component: 'Command', message: 'Command executed on CLIENT-PC' },
    { id: 3, timestamp: '14:21:18', level: 'Warning', component: 'Network', message: 'High latency detected (250ms)' },
    { id: 4, timestamp: '14:20:05', level: 'Error', component: 'Database', message: 'Failed to write log entry - retry in progress' },
    { id: 5, timestamp: '14:19:42', level: 'Debug', component: 'AI', message: 'Processing natural language command' },
    { id: 6, timestamp: '14:18:29', level: 'Info', component: 'Task', message: 'Task #1247 completed successfully' },
    { id: 7, timestamp: '14:17:15', level: 'Warning', component: 'Security', message: 'Multiple failed login attempts detected' },
    { id: 8, timestamp: '14:16:02', level: 'Info', component: 'Agent', message: 'Agent configuration updated' },
  ]);

  const filteredLogs = logs.filter(log => {
    const matchesLevel = levelFilter === 'all' || log.level.toLowerCase() === levelFilter;
    const matchesSearch = log.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         log.component.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesLevel && matchesSearch;
  });

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'Info':
        return 'border-blue-500/50 bg-blue-500/10 text-blue-400';
      case 'Warning':
        return 'border-orange-500/50 bg-orange-500/10 text-orange-400';
      case 'Error':
        return 'border-red-500/50 bg-red-500/10 text-red-400';
      case 'Debug':
        return 'border-purple-500/50 bg-purple-500/10 text-purple-400';
      default:
        return 'border-slate-500/50 bg-slate-500/10 text-slate-400';
    }
  };

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'Info':
        return Info;
      case 'Warning':
        return AlertTriangle;
      case 'Error':
        return XCircle;
      case 'Debug':
        return SearchIcon;
      default:
        return FileEdit;
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border-[#00d9b5]/30 bg-gradient-to-br from-[#131824]/90 to-[#1e2538]/90 backdrop-blur-2xl"
        style={{
          boxShadow: '0 8px 32px 0 rgba(0, 217, 181, 0.15), inset 0 1px 1px 0 rgba(255, 255, 255, 0.05)'
        }}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-blue-500/20 p-3">
                <FileText className="h-6 w-6 text-blue-400" />
              </div>
              <div>
                <CardTitle className="text-slate-100">System Logs</CardTitle>
                <CardDescription className="text-slate-400">
                  Monitor system events and activities
                </CardDescription>
              </div>
            </div>
            <Badge
              variant="outline"
              className={autoRefresh 
                ? 'border-green-500/50 bg-green-500/10 text-green-400' 
                : 'border-slate-500/50 bg-slate-500/10 text-slate-400'
              }
            >
              <span className={`mr-1 h-2 w-2 rounded-full ${autoRefresh ? 'bg-green-400 animate-pulse' : 'bg-slate-400'}`} />
              {autoRefresh ? 'Auto-refresh' : 'Manual'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-1 items-center gap-2">
              <div className="relative flex-1 max-w-sm">
                <Input
                  placeholder="Search logs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="border-slate-600 bg-slate-900/50 text-slate-200 placeholder:text-slate-500"
                />
              </div>
              
              <Select value={levelFilter} onValueChange={setLevelFilter}>
                <SelectTrigger className="w-[140px] border-slate-600 bg-slate-900/50 text-slate-200">
                  <SelectValue placeholder="Level" />
                </SelectTrigger>
                <SelectContent className="border-slate-700 bg-slate-800">
                  <SelectItem value="all">All Levels</SelectItem>
                  <SelectItem value="info">Info</SelectItem>
                  <SelectItem value="warning">Warning</SelectItem>
                  <SelectItem value="error">Error</SelectItem>
                  <SelectItem value="debug">Debug</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAutoRefresh(!autoRefresh)}
                className="gap-2 border-slate-600 bg-slate-900/50 text-slate-200 hover:bg-slate-700"
              >
                <RefreshCw className="h-4 w-4" />
                Refresh
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-2 border-slate-600 bg-slate-900/50 text-slate-200 hover:bg-slate-700"
              >
                <Download className="h-4 w-4" />
                Export
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-2 border-red-600 bg-red-900/20 text-red-400 hover:bg-red-900/40"
              >
                <Trash2 className="h-4 w-4" />
                Clear All
              </Button>
            </div>
          </div>

          {/* Logs List */}
          <div className="space-y-2">
            {filteredLogs.map((log) => {
              const LevelIcon = getLevelIcon(log.level);
              return (
              <div
                key={log.id}
                className="flex items-start gap-3 rounded-lg border border-slate-700 bg-slate-900/50 p-4 transition-colors hover:bg-slate-800/50"
              >
                <LevelIcon className="h-5 w-5 mt-0.5" />
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-slate-500">{log.timestamp}</span>
                    <Badge variant="outline" className={getLevelColor(log.level)}>
                      {log.level}
                    </Badge>
                    <Badge variant="outline" className="border-slate-600 bg-slate-700/50 text-slate-300">
                      {log.component}
                    </Badge>
                  </div>
                  <p className="text-sm text-slate-300">{log.message}</p>
                </div>
              </div>
              );
            })}
          </div>

          {filteredLogs.length === 0 && (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400">No logs found matching your filters</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}