import React, { useState } from 'react';
import { Agent } from '../types';
import { 
  Monitor, 
  Shield, 
  Clock, 
  MapPin, 
  Cpu, 
  HardDrive,
  MoreVertical,
  RefreshCw,
  Camera,
  Terminal,
  Info
} from 'lucide-react';
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

interface ClientCardProps {
  client: Agent;
  onAction: (action: string, client: Agent) => void;
}

const ClientCard: React.FC<ClientCardProps> = ({ client, onAction }) => {
  const [showActions, setShowActions] = useState(false);

  const formatUptime = (uptime: number) => {
    const days = Math.floor(uptime / 86400);
    const hours = Math.floor((uptime % 86400) / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);
    
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };


  const getOSDisplay = () => {
    if (client.operatingSystem === 'windows') {
      const version = client.osVersion || 'Unknown';
      if (version.includes('10')) return 'Windows 10';
      if (version.includes('11')) return 'Windows 11';
      return `Windows ${version}`;
    }
    return client.operatingSystem || 'Unknown';
  };

  const getAntivirusDisplay = () => {
    if (client.systemInfo?.antivirus && client.systemInfo.antivirus.length > 0) {
      return client.systemInfo.antivirus.join(', ');
    }
    return 'Windows Defender';
  };

  const isAdmin = client.systemInfo?.isAdmin || false;

  return (
    <Card className="group hover:shadow-lg transition-all duration-300">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${client.status === 'online' ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
            <div>
              <h3 className="font-semibold text-lg">{client.computerName}</h3>
              <p className="text-sm text-muted-foreground font-mono">{client.id}</p>
            </div>
          </div>
          
          {/* Actions Menu */}
          <DropdownMenu open={showActions} onOpenChange={setShowActions}>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onAction('reboot', client)}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Reboot
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onAction('screenshot', client)}>
                <Camera className="w-4 h-4 mr-2" />
                Screenshot
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onAction('system-info', client)}>
                <Info className="w-4 h-4 mr-2" />
                System Info
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onAction('custom-command', client)}>
                <Terminal className="w-4 h-4 mr-2" />
                Custom Command
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {/* Client Info Grid */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2">
            <Monitor className="w-4 h-4 text-muted-foreground" />
            <span>{getOSDisplay()}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-muted-foreground" />
            <span>{getAntivirusDisplay()}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-muted-foreground" />
            <Badge variant={isAdmin ? "default" : "secondary"}>
              {isAdmin ? 'Administrator' : 'Standard User'}
            </Badge>
          </div>
          
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-muted-foreground" />
            <span>{client.geoLocation?.country || client.country || 'Unknown'}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <span>{client.systemInfo?.uptime ? formatUptime(client.systemInfo.uptime) : 'Unknown'}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <HardDrive className="w-4 h-4 text-muted-foreground" />
            <span>{client.ipAddress}</span>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex gap-2 mt-4">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => onAction('reboot', client)}
            className="flex-1"
          >
            <RefreshCw className="w-3 h-3 mr-1" />
            Reboot
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => onAction('custom-command', client)}
            className="flex-1"
          >
            <Terminal className="w-3 h-3 mr-1" />
            Command
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ClientCard;
