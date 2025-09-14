export interface User {
  uuid: string;
  computerName: string;
  ipAddress: string;
  country: string;
  status: 'online' | 'offline';
  lastActiveTime: string;
  additionalSystemDetails: string;
}

export interface AuthUser {
  id: string;
  username: string;
  role: 'admin' | 'user' | 'viewer';
}

export interface Task {
  command: string;
  output: string;
  status: string;
  createdAt: string;
}

export interface AuditLog {
  _id: string;
  user: string;
  action: string;
  timestamp: string;
  details: Record<string, any>;
}
