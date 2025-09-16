export interface User {
  _id?: string;
  uuid: string;
  computerName: string;
  hostname?: string;
  ip?: string;
  ipAddress: string;
  platform: string;
  operatingSystem: string;
  osVersion: string;
  architecture: string;
  capabilities: {
    persistence: string[];
    injection: string[];
    evasion: string[];
    commands: string[];
    features: string[];
  };
  country: string;
  status: 'online' | 'offline';
  lastActiveTime: string;
  lastSeen?: string;
  lastHeartbeat?: string;
  connectionCount?: number;
  systemInfo?: {
    username?: string;
    domain?: string;
    isAdmin?: boolean;
    antivirus?: string[];
    processes?: number;
    uptime?: number;
    memory?: {
      total: number;
      available: number;
      used: number;
    };
    disk?: {
      total: number;
      free: number;
      used: number;
    };
  };
  // Legacy fields for backward compatibility
  additionalSystemDetails?: string;
}

export interface AuthUser {
  id: string;
  username: string;
  role: string;
}

export interface Task {
  _id: string;
  uuid: string;
  command: string;
  originalCommand?: string;
  platform?: string;
  status: 'pending' | 'executed' | 'failed' | 'cancelled';
  output: string;
  errorMessage?: string;
  executionTime?: number;
  createdAt: string;
  executedAt?: string;
  completedAt?: string;
}

export interface AuditLog {
  _id: string;
  user: string;
  action: string;
  timestamp: string;
}

export interface CommandCategory {
  [key: string]: string[];
}

export interface PlatformCapabilities {
  platform: string;
  capabilities: {
    persistence: string[];
    injection: string[];
    evasion: string[];
    commands: string[];
    features: string[];
  };
  availableCommands: string[];
  commandCategories: CommandCategory;
}

export interface CommandValidation {
  isSupported: boolean;
  platform: string;
  originalCommand: string;
  translatedCommand: string;
  reason: string;
}
