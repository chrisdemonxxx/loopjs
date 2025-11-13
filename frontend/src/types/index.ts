export type ComputerStatus = 'online' | 'offline' | 'warning';

export interface Computer {
  id: string;
  name: string;
  hostname: string;
  status: ComputerStatus;
  cpu: number;
  memory: number;
  disk: number;
  uptime: number;
  lastSeen: Date;
  ip: string;
  os: string;
  currentUser?: string;
}

export interface ActivityLog {
  id: string;
  computerId: string;
  computerName: string;
  timestamp: Date;
  user: string;
  action: string;
  details: string;
  type: 'login' | 'logout' | 'error' | 'warning' | 'info';
}
