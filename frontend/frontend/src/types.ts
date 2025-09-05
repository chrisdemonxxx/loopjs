export interface User {
  uuid: string;
  computerName: string;
  ipAddress: string;
  country: string;
  status: 'online' | 'offline';
  lastActiveTime: string;
  additionalSystemDetails: string;
}

export interface Task {
  command: string;
  output: string;
  status: string;
  createdAt: string;
}
