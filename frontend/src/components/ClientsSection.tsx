import { useState } from 'react';
import { Search, Download, Monitor, Circle, MoreVertical, Eye, Terminal, List, Image, Keyboard, Power, Globe, Laptop, Server as ServerIcon, Apple } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';
import WorldMapVisualization from './WorldMapVisualization';
import HvncModal from './HvncModal';
import QuickTerminal from './QuickTerminal';
import QuickTasks from './QuickTasks';

interface Client {
  id: string;
  computerName: string;
  ipAddress: string;
  platform: 'Windows' | 'Linux' | 'macOS';
  status: 'Online' | 'Offline';
  lastSeen: string;
  features?: {
    hvnc?: boolean;
    keylogger?: boolean;
    screenCapture?: boolean;
    fileManager?: boolean;
  };
}

export default function ClientsSection() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [osFilter, setOsFilter] = useState('all');
  const [showOffline, setShowOffline] = useState(true);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isHvncOpen, setIsHvncOpen] = useState(false);
  const [terminalClient, setTerminalClient] = useState<Client | null>(null);
  const [tasksClient, setTasksClient] = useState<Client | null>(null);

  const [clients] = useState<Client[]>([
    { id: '1', computerName: 'DESKTOP-WK8X', ipAddress: '192.168.1.105', platform: 'Windows', status: 'Online', lastSeen: '2 minutes ago', features: { hvnc: true, keylogger: true, screenCapture: true, fileManager: true } },
    { id: '2', computerName: 'CLIENT-PC', ipAddress: '192.168.1.112', platform: 'Windows', status: 'Online', lastSeen: '5 minutes ago', features: { hvnc: true, screenCapture: true, fileManager: true } },
    { id: '3', computerName: 'LAPTOP-7Y9Z', ipAddress: '192.168.1.89', platform: 'macOS', status: 'Offline', lastSeen: '8 minutes ago', features: { hvnc: true, screenCapture: true } },
    { id: '4', computerName: 'SERVER-01', ipAddress: '192.168.1.50', platform: 'Linux', status: 'Online', lastSeen: 'Just now', features: { hvnc: true, fileManager: true } },
    { id: '5', computerName: 'WORKSTATION-A', ipAddress: '192.168.1.73', platform: 'Windows', status: 'Online', lastSeen: '1 minute ago', features: { hvnc: true, keylogger: true, screenCapture: true, fileManager: true } },
    { id: '6', computerName: 'DEV-MACHINE', ipAddress: '192.168.1.94', platform: 'Linux', status: 'Online', lastSeen: 'Just now', features: { hvnc: true, fileManager: true } },
    { id: '7', computerName: 'OFFICE-PC-12', ipAddress: '192.168.1.156', platform: 'Windows', status: 'Offline', lastSeen: '25 minutes ago', features: { screenCapture: true } },
    { id: '8', computerName: 'MAC-STUDIO', ipAddress: '192.168.1.201', platform: 'macOS', status: 'Online', lastSeen: '3 minutes ago', features: { hvnc: true, screenCapture: true } },
  ]);

  const filteredClients = clients.filter(client => {
    const matchesSearch = client.computerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         client.ipAddress.includes(searchQuery);
    const matchesStatus = statusFilter === 'all' || client.status.toLowerCase() === statusFilter;
    const matchesOS = osFilter === 'all' || client.platform.toLowerCase() === osFilter;
    const matchesOfflineFilter = showOffline || client.status === 'Online';
    
    return matchesSearch && matchesStatus && matchesOS && matchesOfflineFilter;
  });

  const onlineCount = clients.filter(c => c.status === 'Online').length;
  const offlineCount = clients.filter(c => c.status === 'Offline').length;

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'Windows':
        return Monitor;
      case 'Linux':
        return ServerIcon;
      case 'macOS':
        return Apple;
      default:
        return Laptop;
    }
  };

  const getPlatformColor = (platform: string) => {
    switch (platform) {
      case 'Windows':
        return 'border-blue-500/50 bg-blue-500/10 text-blue-400';
      case 'Linux':
        return 'border-yellow-500/50 bg-yellow-500/10 text-yellow-400';
      case 'macOS':
        return 'border-slate-500/50 bg-slate-500/10 text-slate-400';
      default:
        return 'border-slate-500/50 bg-slate-500/10 text-slate-400';
    }
  };

  return (
    <div className="space-y-6">
      {/* World Map Visualization - Place at top */}
      <Card className="border-[#00d9b5]/30 bg-gradient-to-br from-[#131824]/90 to-[#1e2538]/90 backdrop-blur-2xl"
        style={{
          boxShadow: '0 8px 32px 0 rgba(0, 217, 181, 0.15), inset 0 1px 1px 0 rgba(255, 255, 255, 0.05)'
        }}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-slate-100">
                <Globe className="h-5 w-5 text-[#00d9b5] drop-shadow-[0_0_8px_rgba(0,217,181,0.5)]" />
                Global Client Distribution
              </CardTitle>
              <CardDescription className="text-slate-400">
                Real-time geographical visualization of connected agents
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <WorldMapVisualization />
        </CardContent>
      </Card>

      {/* Clients Table */}
      <Card className="border-[#00d9b5]/30 bg-gradient-to-br from-[#131824]/90 to-[#1e2538]/90 backdrop-blur-2xl"
        style={{
          boxShadow: '0 8px 32px 0 rgba(0, 217, 181, 0.15), inset 0 1px 1px 0 rgba(255, 255, 255, 0.05)'
        }}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-slate-100">
                <Monitor className="h-5 w-5 text-[#00d9b5] drop-shadow-[0_0_8px_rgba(0,217,181,0.5)]" />
                Connected Clients
              </CardTitle>
              <CardDescription className="text-slate-400">
                Manage and monitor all connected agents
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="border-[#00d9b5]/50 bg-[#00d9b5]/10 text-[#00d9b5] backdrop-blur-sm">
                <Circle className="mr-1 h-2 w-2 fill-[#00d9b5] animate-pulse shadow-[0_0_8px_rgba(0,217,181,0.8)]" />
                {onlineCount} Online
              </Badge>
              <Badge variant="outline" className="border-slate-500/50 bg-slate-500/10 text-slate-400 backdrop-blur-sm">
                <Circle className="mr-1 h-2 w-2 fill-slate-400" />
                {offlineCount} Offline
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters & Search */}
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-1 items-center gap-2">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  placeholder="Search by name, IP, or OS..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 border-[#00d9b5]/20 bg-[#0f1420]/50 text-slate-200 placeholder:text-slate-500 focus:border-[#00d9b5] focus:ring-[#00d9b5]"
                />
              </div>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px] border-[#00d9b5]/20 bg-[#0f1420]/50 text-slate-200">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent className="border-[#00d9b5]/20 bg-[#131824]">
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="online">Online</SelectItem>
                  <SelectItem value="offline">Offline</SelectItem>
                </SelectContent>
              </Select>

              <Select value={osFilter} onValueChange={setOsFilter}>
                <SelectTrigger className="w-[140px] border-[#00d9b5]/20 bg-[#0f1420]/50 text-slate-200">
                  <SelectValue placeholder="OS" />
                </SelectTrigger>
                <SelectContent className="border-[#00d9b5]/20 bg-[#131824]">
                  <SelectItem value="all">All OS</SelectItem>
                  <SelectItem value="windows">Windows</SelectItem>
                  <SelectItem value="linux">Linux</SelectItem>
                  <SelectItem value="macos">macOS</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowOffline(!showOffline)}
                className={`border-[#00d9b5]/20 ${showOffline ? 'bg-[#1e2538] text-slate-200' : 'bg-[#0f1420]/50 text-slate-400'}`}
              >
                Show Offline ({offlineCount})
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-2 border-[#00d9b5]/20 bg-[#0f1420]/50 text-slate-200 hover:bg-[#1e2538]"
              >
                <Download className="h-4 w-4" />
                Export CSV
              </Button>
            </div>
          </div>

          {/* Clients Table */}
          <div className="rounded-lg border border-[#00d9b5]/20 bg-[#0f1420]/50 backdrop-blur-sm">
            <Table>
              <TableHeader>
                <TableRow className="border-[#00d9b5]/20 hover:bg-[#1e2538]/50">
                  <TableHead className="text-slate-300">Computer Name</TableHead>
                  <TableHead className="text-slate-300">IP Address</TableHead>
                  <TableHead className="text-slate-300">Platform</TableHead>
                  <TableHead className="text-slate-300">Status</TableHead>
                  <TableHead className="text-slate-300">Last Seen</TableHead>
                  <TableHead className="text-slate-300 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClients.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-slate-400">
                      No clients found. {statusFilter === 'online' && 'Start the client to see it appear here.'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredClients.map((client) => {
                    const PlatformIcon = getPlatformIcon(client.platform);
                    return (
                    <TableRow
                      key={client.id}
                      className="border-[#00d9b5]/20 transition-colors hover:bg-[#1e2538]/50 cursor-pointer"
                    >
                      <TableCell className="text-slate-200">
                        <span className="flex items-center gap-2">
                          <Monitor className="h-4 w-4 text-indigo-400" />
                          {client.computerName}
                        </span>
                      </TableCell>
                      <TableCell className="font-mono text-sm text-slate-400">
                        {client.ipAddress}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={getPlatformColor(client.platform)}>
                          <PlatformIcon className="h-3.5 w-3.5 mr-1.5" />
                          {client.platform}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            client.status === 'Online'
                              ? 'border-green-500/50 bg-green-500/10 text-green-400'
                              : 'border-slate-500/50 bg-slate-500/10 text-slate-400'
                          }
                        >
                          <Circle
                            className={`mr-1 h-2 w-2 ${
                              client.status === 'Online' ? 'fill-green-400 animate-pulse' : 'fill-slate-400'
                            }`}
                          />
                          {client.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-slate-400">
                        {client.lastSeen}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-slate-400 hover:bg-slate-700 hover:text-slate-200"
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48 border-slate-700 bg-slate-800">
                            {client.features?.hvnc && (
                              <DropdownMenuItem 
                                onClick={() => {
                                  setSelectedClient(client);
                                  setIsHvncOpen(true);
                                }}
                                disabled={client.status !== 'Online'}
                                className="gap-2 text-[#00d9b5] focus:bg-[#00d9b5]/20 focus:text-[#00d9b5]"
                              >
                                <Monitor className="h-4 w-4" />
                                HVNC Remote Control
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem 
                              onClick={() => setTerminalClient(client)}
                              disabled={client.status !== 'Online'}
                              className="gap-2 text-[#00d9b5] focus:bg-[#00d9b5]/20 focus:text-[#00d9b5]"
                            >
                              <Terminal className="h-4 w-4" />
                              Execute Command
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => setTasksClient(client)}
                              disabled={client.status !== 'Online'}
                              className="gap-2 text-[#00d9b5] focus:bg-[#00d9b5]/20 focus:text-[#00d9b5]"
                            >
                              <List className="h-4 w-4" />
                              View Tasks
                            </DropdownMenuItem>
                            <DropdownMenuItem className="gap-2 text-slate-200 focus:bg-slate-700 focus:text-white">
                              <Image className="h-4 w-4" />
                              Screenshot
                            </DropdownMenuItem>
                            <DropdownMenuItem className="gap-2 text-slate-200 focus:bg-slate-700 focus:text-white">
                              <Keyboard className="h-4 w-4" />
                              Keylogger
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* HVNC Modal */}
      {isHvncOpen && selectedClient && (
        <HvncModal
          isOpen={isHvncOpen}
          onClose={() => setIsHvncOpen(false)}
          client={selectedClient}
        />
      )}

      {/* Quick Terminal */}
      {terminalClient && (
        <QuickTerminal
          client={terminalClient}
          onClose={() => setTerminalClient(null)}
        />
      )}

      {/* Quick Tasks */}
      {tasksClient && (
        <QuickTasks
          client={tasksClient}
          onClose={() => setTasksClient(null)}
        />
      )}
    </div>
  );
}