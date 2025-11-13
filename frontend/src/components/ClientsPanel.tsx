import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Monitor, Globe, HardDrive, Cpu, MemoryStick, Search, MoreVertical } from 'lucide-react';

interface Client {
  id: string;
  hostname: string;
  ip: string;
  os: string;
  status: 'online' | 'offline' | 'idle';
  cpu: number;
  memory: number;
  disk: number;
  lastSeen: string;
  user: string;
}

export function ClientsPanel() {
  const [clients, setClients] = useState<Client[]>([
    {
      id: '1',
      hostname: 'DESKTOP-5X2A',
      ip: '192.168.1.105',
      os: 'Windows 11 Pro',
      status: 'online',
      cpu: 45,
      memory: 62,
      disk: 78,
      lastSeen: 'Just now',
      user: 'john.doe'
    },
    {
      id: '2',
      hostname: 'WORKSTATION-42',
      ip: '192.168.1.108',
      os: 'Ubuntu 22.04',
      status: 'online',
      cpu: 23,
      memory: 45,
      disk: 54,
      lastSeen: '1m ago',
      user: 'jane.smith'
    },
    {
      id: '3',
      hostname: 'CLIENT-03',
      ip: '192.168.1.112',
      os: 'macOS Sonoma',
      status: 'idle',
      cpu: 8,
      memory: 34,
      disk: 67,
      lastSeen: '5m ago',
      user: 'alex.johnson'
    },
    {
      id: '4',
      hostname: 'SERVER-MAIN',
      ip: '192.168.1.201',
      os: 'CentOS 8',
      status: 'online',
      cpu: 67,
      memory: 81,
      disk: 45,
      lastSeen: 'Just now',
      user: 'root'
    },
    {
      id: '5',
      hostname: 'LAPTOP-7F4D',
      ip: '192.168.1.156',
      os: 'Windows 10 Pro',
      status: 'offline',
      cpu: 0,
      memory: 0,
      disk: 82,
      lastSeen: '2h ago',
      user: 'mike.wilson'
    }
  ]);

  const [search, setSearch] = useState('');

  useEffect(() => {
    const interval = setInterval(() => {
      setClients(prev => prev.map(client => {
        if (client.status === 'offline') return client;
        return {
          ...client,
          cpu: Math.max(0, Math.min(100, client.cpu + (Math.random() - 0.5) * 10)),
          memory: Math.max(0, Math.min(100, client.memory + (Math.random() - 0.5) * 8))
        };
      }));
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const filteredClients = clients.filter(client =>
    client.hostname.toLowerCase().includes(search.toLowerCase()) ||
    client.ip.includes(search) ||
    client.user.toLowerCase().includes(search.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'idle': return 'bg-amber-500';
      case 'offline': return 'bg-slate-600';
      default: return 'bg-slate-600';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-500/10 text-green-500';
      case 'idle': return 'bg-amber-500/10 text-amber-500';
      case 'offline': return 'bg-slate-500/10 text-slate-500';
      default: return 'bg-slate-500/10 text-slate-500';
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <p className="text-slate-400">Manage and monitor all connected clients</p>
        </div>
        
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <Input
            placeholder="Search clients..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-slate-900 border-slate-800 text-slate-100"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {filteredClients.map((client) => (
          <Card key={client.id} className="bg-slate-900 border-slate-800">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Monitor className="h-8 w-8 text-cyan-500" />
                    <div className={`absolute -bottom-1 -right-1 h-3 w-3 rounded-full border-2 border-slate-900 ${getStatusColor(client.status)}`} />
                  </div>
                  <div>
                    <CardTitle className="text-slate-100">{client.hostname}</CardTitle>
                    <p className="text-slate-500 text-sm">{client.user}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={getStatusBadge(client.status)}>{client.status}</Badge>
                  <Button variant="ghost" size="icon" className="text-slate-400 hover:text-slate-100">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2 text-slate-400">
                  <Globe className="h-4 w-4" />
                  <span className="text-sm">{client.ip}</span>
                </div>
                <div className="text-slate-400 text-sm">
                  {client.os}
                </div>
              </div>

              {client.status !== 'offline' && (
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-slate-400 text-sm">
                      <Cpu className="h-4 w-4 text-cyan-500" />
                      <span>CPU</span>
                    </div>
                    <span className="text-cyan-400 text-sm">{Math.round(client.cpu)}%</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-slate-400 text-sm">
                      <MemoryStick className="h-4 w-4 text-blue-500" />
                      <span>Memory</span>
                    </div>
                    <span className="text-blue-400 text-sm">{Math.round(client.memory)}%</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-slate-400 text-sm">
                      <HardDrive className="h-4 w-4 text-purple-500" />
                      <span>Disk</span>
                    </div>
                    <span className="text-purple-400 text-sm">{client.disk}%</span>
                  </div>
                </div>
              )}

              <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                <span className="text-slate-500 text-xs">Last seen: {client.lastSeen}</span>
                <div className="flex gap-2">
                  <Button size="sm" className="bg-cyan-500/10 text-cyan-500 hover:bg-cyan-500/20 border border-cyan-500/20">
                    Connect
                  </Button>
                  <Button size="sm" variant="outline" className="border-slate-700 text-slate-400 hover:text-slate-100">
                    Details
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
