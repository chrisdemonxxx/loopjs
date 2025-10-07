import React, { useState } from 'react';
import { Agent } from '../types';
import { 
  FiMonitor, 
  FiShield, 
  FiClock, 
  FiMapPin, 
  FiCpu, 
  FiHardDrive,
  FiMoreVertical,
  FiPower,
  FiRefreshCw,
  FiCamera,
  FiTerminal,
  FiInfo
} from 'react-icons/fi';

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
    <div className="premium-client-card group">
      {/* Header */}
      <div className="premium-client-header">
        <div className="flex items-center gap-3">
          <div className="premium-client-status"></div>
          <div>
            <h3 className="premium-client-name">{client.computerName}</h3>
            <p className="text-sm text-gray-500 font-mono">{client.uuid}</p>
          </div>
        </div>
        
        {/* Floating Actions Menu */}
        <div className="premium-floating-menu">
          <button
            className="premium-floating-menu-button"
            onClick={() => setShowActions(!showActions)}
          >
            <FiMoreVertical className="w-4 h-4" />
          </button>
          
          {showActions && (
            <div className="premium-dropdown show">
              <div className="premium-dropdown-item" onClick={() => onAction('reboot', client)}>
                <FiRefreshCw className="w-4 h-4 mr-2" />
                Reboot
              </div>
              <div className="premium-dropdown-item" onClick={() => onAction('screenshot', client)}>
                <FiCamera className="w-4 h-4 mr-2" />
                Screenshot
              </div>
              <div className="premium-dropdown-item" onClick={() => onAction('system-info', client)}>
                <FiInfo className="w-4 h-4 mr-2" />
                System Info
              </div>
              <div className="premium-dropdown-item" onClick={() => onAction('custom-command', client)}>
                <FiTerminal className="w-4 h-4 mr-2" />
                Custom Command
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Client Info Grid */}
      <div className="premium-client-info">
        <div className="premium-client-info-item">
          <FiMonitor className="premium-client-info-icon" />
          <span>{getOSDisplay()}</span>
        </div>
        
        <div className="premium-client-info-item">
          <FiShield className="premium-client-info-icon" />
          <span>{getAntivirusDisplay()}</span>
        </div>
        
        <div className="premium-client-info-item">
          <FiCpu className="premium-client-info-icon" />
          <span className={`premium-badge ${isAdmin ? 'badge-admin' : 'badge-user'}`}>
            {isAdmin ? 'Administrator' : 'Standard User'}
          </span>
        </div>
        
        <div className="premium-client-info-item">
          <FiMapPin className="premium-client-info-icon" />
          <span>{client.geoLocation?.country || client.country || 'Unknown'}</span>
        </div>
        
        <div className="premium-client-info-item">
          <FiClock className="premium-client-info-icon" />
          <span>{client.systemInfo?.uptime ? formatUptime(client.systemInfo.uptime) : 'Unknown'}</span>
        </div>
        
        <div className="premium-client-info-item">
          <FiHardDrive className="premium-client-info-icon" />
          <span>{client.ipAddress}</span>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="premium-client-actions">
        <button 
          className="premium-action-button"
          onClick={() => onAction('reboot', client)}
        >
          <FiRefreshCw className="w-3 h-3 mr-1" />
          Reboot
        </button>
        <button 
          className="premium-action-button"
          onClick={() => onAction('custom-command', client)}
        >
          <FiTerminal className="w-3 h-3 mr-1" />
          Command
        </button>
      </div>
    </div>
  );
};

export default ClientCard;
