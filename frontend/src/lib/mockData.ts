import { Computer, ActivityLog } from '../types';

export const generateMockComputers = (): Computer[] => {
  return [
    {
      id: '1',
      name: 'DEV-WORKSTATION-01',
      hostname: 'dev-ws-01.company.local',
      status: 'online',
      cpu: 45,
      memory: 62,
      disk: 78,
      uptime: 432000,
      lastSeen: new Date(),
      ip: '192.168.1.101',
      os: 'Windows 11 Pro',
      currentUser: 'john.doe'
    },
    {
      id: '2',
      name: 'DEV-WORKSTATION-02',
      hostname: 'dev-ws-02.company.local',
      status: 'online',
      cpu: 23,
      memory: 45,
      disk: 54,
      uptime: 864000,
      lastSeen: new Date(),
      ip: '192.168.1.102',
      os: 'Ubuntu 22.04',
      currentUser: 'jane.smith'
    },
    {
      id: '3',
      name: 'PROD-SERVER-01',
      hostname: 'prod-srv-01.company.local',
      status: 'warning',
      cpu: 87,
      memory: 91,
      disk: 45,
      uptime: 2592000,
      lastSeen: new Date(Date.now() - 300000),
      ip: '192.168.1.201',
      os: 'CentOS 8',
      currentUser: 'root'
    },
    {
      id: '4',
      name: 'QA-WORKSTATION-01',
      hostname: 'qa-ws-01.company.local',
      status: 'online',
      cpu: 15,
      memory: 34,
      disk: 67,
      uptime: 172800,
      lastSeen: new Date(),
      ip: '192.168.1.103',
      os: 'macOS Sonoma',
      currentUser: 'alex.johnson'
    },
    {
      id: '5',
      name: 'DEV-WORKSTATION-03',
      hostname: 'dev-ws-03.company.local',
      status: 'offline',
      cpu: 0,
      memory: 0,
      disk: 82,
      uptime: 0,
      lastSeen: new Date(Date.now() - 7200000),
      ip: '192.168.1.104',
      os: 'Windows 11 Pro',
      currentUser: undefined
    },
    {
      id: '6',
      name: 'PROD-SERVER-02',
      hostname: 'prod-srv-02.company.local',
      status: 'online',
      cpu: 56,
      memory: 73,
      disk: 38,
      uptime: 5184000,
      lastSeen: new Date(),
      ip: '192.168.1.202',
      os: 'Ubuntu Server 22.04',
      currentUser: 'service'
    }
  ];
};

export const generateMockLogs = (): ActivityLog[] => {
  const computers = generateMockComputers();
  const actions = [
    { action: 'User Login', type: 'login' as const, details: 'Successful authentication' },
    { action: 'User Logout', type: 'logout' as const, details: 'Session ended normally' },
    { action: 'High CPU Usage', type: 'warning' as const, details: 'CPU usage exceeded 85%' },
    { action: 'Disk Space Low', type: 'warning' as const, details: 'Disk usage above 80%' },
    { action: 'Software Update', type: 'info' as const, details: 'System updates installed' },
    { action: 'Connection Lost', type: 'error' as const, details: 'Network connection interrupted' },
    { action: 'Connection Restored', type: 'info' as const, details: 'Network connection re-established' },
    { action: 'Service Started', type: 'info' as const, details: 'Background service initialized' }
  ];

  const users = ['john.doe', 'jane.smith', 'alex.johnson', 'system', 'root', 'service'];
  
  const logs: ActivityLog[] = [];
  
  for (let i = 0; i < 50; i++) {
    const computer = computers[Math.floor(Math.random() * computers.length)];
    const actionData = actions[Math.floor(Math.random() * actions.length)];
    const user = users[Math.floor(Math.random() * users.length)];
    
    logs.push({
      id: `log-${i}`,
      computerId: computer.id,
      computerName: computer.name,
      timestamp: new Date(Date.now() - Math.random() * 86400000),
      user,
      action: actionData.action,
      details: actionData.details,
      type: actionData.type
    });
  }
  
  return logs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
};

export const updateComputerMetrics = (computer: Computer): Computer => {
  if (computer.status === 'offline') return computer;
  
  return {
    ...computer,
    cpu: Math.max(0, Math.min(100, computer.cpu + (Math.random() - 0.5) * 10)),
    memory: Math.max(0, Math.min(100, computer.memory + (Math.random() - 0.5) * 8)),
    lastSeen: new Date(),
    status: computer.cpu > 85 || computer.memory > 90 ? 'warning' : 'online'
  };
};
