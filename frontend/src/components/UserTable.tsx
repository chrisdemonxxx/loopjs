import React, { useState, useMemo } from 'react';
import { Agent } from '../types';
import toast from 'react-hot-toast';
import { API_URL } from '../config';
import { 
  MoreVertical, 
  Shield, 
  Camera, 
  Terminal, 
  Info, 
  Power, 
  RefreshCw,
  Search,
  Download,
  Eye,
  EyeOff,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface UserTableProps {
  users: Agent[];
  onViewUser: (user: Agent) => void;
  onViewTasks: (user: Agent) => void;
}

const UserTable: React.FC<UserTableProps> = ({ users, onViewUser, onViewTasks }) => {
  const [showCustomCommand, setShowCustomCommand] = useState<Agent | null>(null);
  const [customCommand, setCustomCommand] = useState('');
  
  // Enhanced state for sorting, filtering, and search
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'online' | 'offline'>('all');
  const [osFilter, setOsFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<keyof Agent>('computerName');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [showOfflineUsers, setShowOfflineUsers] = useState(false);

  // Enhanced filtering and sorting logic
  const filteredAndSortedUsers = useMemo(() => {
    let filtered = users.filter(user => {
      // Search filter
      const matchesSearch = searchTerm === '' || 
        user.computerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.ipAddress.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.operatingSystem?.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Status filter
      const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
      
      // OS filter
      const matchesOS = osFilter === 'all' || user.operatingSystem === osFilter;
      
      return matchesSearch && matchesStatus && matchesOS;
    });

    // Sorting
    filtered.sort((a, b) => {
      const aValue = a[sortField] || '';
      const bValue = b[sortField] || '';
      
      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [users, searchTerm, statusFilter, osFilter, sortField, sortDirection]);

  // Separate online and offline users from filtered results
  const onlineUsers = filteredAndSortedUsers.filter(user => user.status === 'online');
  const offlineUsers = filteredAndSortedUsers.filter(user => user.status === 'offline');

  // Get unique OS values for filter
  const uniqueOS = useMemo(() => {
    const osSet = new Set(users.map(user => user.operatingSystem).filter(Boolean));
    return Array.from(osSet);
  }, [users]);

  // Handle sorting
  const handleSort = (field: keyof Agent) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Export to CSV
  const exportToCSV = () => {
    const headers = ['Computer Name', 'IP Address', 'Status', 'OS', 'Last Active', 'Uptime'];
    const csvContent = [
      headers.join(','),
      ...filteredAndSortedUsers.map(user => [
        user.computerName,
        user.ipAddress,
        user.status,
        user.operatingSystem || 'Unknown',
        formatLastActive(user.lastActiveTime),
        user.systemInfo?.uptime ? formatUptime(user.systemInfo.uptime) : 'Unknown'
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'clients.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const formatLastActive = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const formatUptime = (uptime: number) => {
    const days = Math.floor(uptime / 86400);
    const hours = Math.floor((uptime % 86400) / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);
    
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const getRealIP = (user: Agent) => {
    // For localhost testing, show actual IP if available
    if (user.ipAddress === '127.0.0.1' || user.ipAddress === 'localhost') {
      return user.ip || '127.0.0.1';
    }
    return user.ipAddress;
  };

  const getOSVersion = (user: Agent) => {
    if (user.osVersion && user.osVersion !== 'Unknown') {
      return user.osVersion;
    }
    // Extract OS version from platform string
    if (user.platform) {
      const platformLower = user.platform.toLowerCase();
      if (platformLower.includes('windows 11')) {
        return 'Windows 11';
      } else if (platformLower.includes('windows 10')) {
        return 'Windows 10';
      } else if (platformLower.includes('windows')) {
        return 'Windows';
      } else if (platformLower.includes('linux')) {
        return 'Linux';
      } else if (platformLower.includes('macos') || platformLower.includes('darwin')) {
        return 'macOS';
      }
    }
    return 'Unknown';
  };

  const getAntivirus = (user: Agent) => {
    if (user.systemInfo?.antivirus && Array.isArray(user.systemInfo.antivirus)) {
      return user.systemInfo.antivirus.join(', ') || 'None detected';
    } else if (user.systemInfo?.antivirus) {
      return user.systemInfo.antivirus;
    }
    return 'Unknown';
  };

  const handleQuickCommand = async (user: Agent, command: string) => {
    console.log('handleQuickCommand called with user:', user);
    console.log('user.id:', user.id);
    console.log('user.computerName:', user.computerName);
    try {
      const response = await fetch(`${API_URL}/agent/${user.id}/command`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: JSON.stringify({
          command: command,
          type: 'system'
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log(`Command ${command} sent to ${user.computerName}:`, result);
        // Show success notification
        toast.success(`Command ${command} sent successfully to ${user.computerName}`);
      } else {
        const errorData = await response.json().catch(() => ({ message: response.statusText }));
        console.error('Failed to send command:', errorData);
        toast.error(`Failed to send command ${command}: ${errorData.message || response.statusText}`);
      }
    } catch (error: any) {
      console.error('Failed to send command:', error);
      toast.error(`Error sending command ${command} to ${user.computerName}: ${error.message}`);
    }
  };

  const handleCustomCommand = async (user: Agent) => {
    if (!customCommand.trim()) {
      toast.error('Please enter a command');
      return;
    }

    await handleQuickCommand(user, customCommand);
    setCustomCommand('');
    setShowCustomCommand(null);
  };

  const FloatingActionMenu = ({ user }: { user: Agent }) => {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm">
            <MoreVertical className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => handleQuickCommand(user, 'shutdown')}>
            <Power className="w-4 h-4 mr-2" />
            Shutdown
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleQuickCommand(user, 'restart')}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Restart
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleQuickCommand(user, 'screenshot')}>
            <Camera className="w-4 h-4 mr-2" />
            Screenshot
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onViewUser(user)}>
            <Info className="w-4 h-4 mr-2" />
            View Details
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setShowCustomCommand(user)}>
            <Terminal className="w-4 h-4 mr-2" />
            Custom Command
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  };

  return (
    <div className="space-y-6">
      {/* Enhanced Controls */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <CardTitle>Connected Clients ({filteredAndSortedUsers.length})</CardTitle>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={exportToCSV}>
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setShowOfflineUsers(!showOfflineUsers)}
              >
                {showOfflineUsers ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
                {showOfflineUsers ? 'Hide' : 'Show'} Offline ({offlineUsers.length})
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search by name, IP, or OS..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={(value: 'all' | 'online' | 'offline') => setStatusFilter(value)}>
              <SelectTrigger className="w-full sm:w-32">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="online">Online</SelectItem>
                <SelectItem value="offline">Offline</SelectItem>
              </SelectContent>
            </Select>
            <Select value={osFilter} onValueChange={setOsFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="OS" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All OS</SelectItem>
                {uniqueOS.map(os => (
                  <SelectItem key={os} value={os}>{os}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Online Clients Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            Online Clients ({onlineUsers.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
        
        {onlineUsers.length > 0 ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort('computerName')}
                  >
                    <div className="flex items-center gap-2">
                      Computer Name
                      {sortField === 'computerName' && (
                        sortDirection === 'asc' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />
                      )}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort('ipAddress')}
                  >
                    <div className="flex items-center gap-2">
                      IP Address
                      {sortField === 'ipAddress' && (
                        sortDirection === 'asc' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />
                      )}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort('operatingSystem')}
                  >
                    <div className="flex items-center gap-2">
                      Operating System
                      {sortField === 'operatingSystem' && (
                        sortDirection === 'asc' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />
                      )}
                    </div>
                  </TableHead>
                  <TableHead>Uptime</TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort('lastActiveTime')}
                  >
                    <div className="flex items-center gap-2">
                      Last Activity
                      {sortField === 'lastActiveTime' && (
                        sortDirection === 'asc' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />
                      )}
                    </div>
                  </TableHead>
                  <TableHead>Antivirus</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {onlineUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                        <div>
                          <div className="font-medium">{user.computerName}</div>
                          <div className="text-xs text-muted-foreground">{user.id}</div>
                          {user.systemInfo?.isAdmin && (
                            <div className="flex items-center mt-1">
                              <Shield className="w-3 h-3 text-yellow-500 mr-1" />
                              <span className="text-xs text-yellow-600 dark:text-yellow-400">Admin</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{getRealIP(user)}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {getOSVersion(user)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {user.systemInfo?.uptime ? formatUptime(user.systemInfo.uptime) : 'Unknown'}
                    </TableCell>
                    <TableCell className="text-green-600 dark:text-green-400">
                      {formatLastActive(user.lastActiveTime)}
                    </TableCell>
                    <TableCell>
                      <span className="text-xs">{getAntivirus(user)}</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onViewUser(user)}
                        >
                          View
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onViewTasks(user)}
                        >
                          Tasks
                        </Button>
                        <FloatingActionMenu user={user} />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <div className="text-4xl mb-4">🔍</div>
            <p>No online clients found</p>
            <p className="text-sm mt-2">Start the client to see it appear here</p>
          </div>
        )}
        </CardContent>
      </Card>

      {/* Offline Clients - Collapsible */}
      {showOfflineUsers && offlineUsers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              Offline Clients ({offlineUsers.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Computer Name</TableHead>
                    <TableHead>IP Address</TableHead>
                    <TableHead>Operating System</TableHead>
                    <TableHead>Last Seen</TableHead>
                    <TableHead>Antivirus</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {offlineUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                          <div>
                            <div className="font-medium">{user.computerName}</div>
                            <div className="text-xs text-muted-foreground">{user.id}</div>
                            {user.systemInfo?.isAdmin && (
                              <div className="flex items-center mt-1">
                                <Shield className="w-3 h-3 text-yellow-500 mr-1" />
                                <span className="text-xs text-yellow-600 dark:text-yellow-400">Admin</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{getRealIP(user)}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {getOSVersion(user)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-red-600 dark:text-red-400">
                        {formatLastActive(user.lastActiveTime)}
                      </TableCell>
                      <TableCell>
                        <span className="text-xs">{getAntivirus(user)}</span>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onViewUser(user)}
                        >
                          View Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Custom Command Modal */}
      {showCustomCommand && (
        <Dialog open={!!showCustomCommand} onOpenChange={() => setShowCustomCommand(null)}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Custom Command - {showCustomCommand.computerName}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="command">Command to execute:</Label>
                <Input
                  id="command"
                  value={customCommand}
                  onChange={(e) => setCustomCommand(e.target.value)}
                  placeholder="Enter command..."
                  onKeyPress={(e) => e.key === 'Enter' && handleCustomCommand(showCustomCommand)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCustomCommand(null)}>
                Cancel
              </Button>
              <Button onClick={() => handleCustomCommand(showCustomCommand)}>
                Execute
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default UserTable;