import React, { useState, useEffect } from 'react';
import { 
  FiMonitor, 
  FiCpu, 
  FiHardDrive, 
  FiWifi, 
  FiActivity,
  FiAlertTriangle,
  FiCheckCircle,
  FiRefreshCw,
  FiTrendingUp,
  FiTrendingDown
} from 'react-icons/fi';
import ApexCharts from 'react-apexcharts';
import { ApexOptions } from 'apexcharts';

interface SystemMonitoringProps {
  tableData: any[];
}

interface SystemMetrics {
  cpu: number;
  memory: number;
  disk: number;
  network: number;
  uptime: string;
  processes: number;
}

interface ClientMetrics {
  id: string;
  name: string;
  ip: string;
  cpu: number;
  memory: number;
  disk: number;
  status: 'online' | 'offline' | 'warning';
  lastUpdate: string;
}

const SystemMonitoring: React.FC<SystemMonitoringProps> = ({ tableData }) => {
  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics>({
    cpu: 45,
    memory: 68,
    disk: 72,
    network: 23,
    uptime: '15d 8h 32m',
    processes: 156
  });

  const [clientMetrics, setClientMetrics] = useState<ClientMetrics[]>([]);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  // Simulate real-time data updates
  useEffect(() => {
    const updateMetrics = () => {
      setSystemMetrics(prev => ({
        ...prev,
        cpu: Math.max(10, Math.min(90, prev.cpu + (Math.random() - 0.5) * 10)),
        memory: Math.max(20, Math.min(95, prev.memory + (Math.random() - 0.5) * 8)),
        disk: Math.max(30, Math.min(85, prev.disk + (Math.random() - 0.5) * 3)),
        network: Math.max(5, Math.min(100, prev.network + (Math.random() - 0.5) * 15)),
        processes: Math.max(100, Math.min(300, prev.processes + Math.floor((Math.random() - 0.5) * 20)))
      }));

      // Update client metrics based on tableData
      if (tableData && tableData.length > 0) {
        const updatedClients = tableData.map(client => ({
          id: client.id || Math.random().toString(),
          name: client.name || 'Unknown',
          ip: client.ip || '0.0.0.0',
          cpu: Math.floor(Math.random() * 80) + 10,
          memory: Math.floor(Math.random() * 70) + 20,
          disk: Math.floor(Math.random() * 60) + 30,
          status: client.status === 'Online' ? 'online' as const : 'offline' as const,
          lastUpdate: new Date().toLocaleTimeString()
        }));
        setClientMetrics(updatedClients);
      }

      setLastUpdate(new Date());
    };

    updateMetrics(); // Initial update

    let interval: NodeJS.Timeout;
    if (autoRefresh) {
      interval = setInterval(updateMetrics, 5000); // Update every 5 seconds
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh, tableData]);

  const getStatusColor = (value: number, thresholds = { warning: 70, critical: 85 }) => {
    if (value >= thresholds.critical) return 'text-danger';
    if (value >= thresholds.warning) return 'text-warning';
    return 'text-success';
  };

  const getStatusBg = (value: number, thresholds = { warning: 70, critical: 85 }) => {
    if (value >= thresholds.critical) return 'bg-danger';
    if (value >= thresholds.warning) return 'bg-warning';
    return 'bg-success';
  };

  // Chart configurations
  const cpuChartOptions: ApexOptions = {
    chart: {
      type: 'line',
      height: 200,
      toolbar: { show: false },
      animations: {
        enabled: true,
        easing: 'linear',
        dynamicAnimation: {
          speed: 1000
        }
      }
    },
    stroke: {
      curve: 'smooth',
      width: 2
    },
    colors: ['#3C50E0'],
    xaxis: {
      categories: ['5m', '4m', '3m', '2m', '1m', 'Now'],
      labels: {
        style: {
          colors: '#64748B',
          fontSize: '12px'
        }
      }
    },
    yaxis: {
      min: 0,
      max: 100,
      labels: {
        style: {
          colors: '#64748B',
          fontSize: '12px'
        },
        formatter: (value) => `${value}%`
      }
    },
    grid: {
      borderColor: '#E2E8F0',
      strokeDashArray: 3
    },
    tooltip: {
      y: {
        formatter: (value) => `${value}%`
      }
    }
  };

  const cpuSeries = [{
    name: 'CPU Usage',
    data: [42, 38, 45, 52, 48, systemMetrics.cpu]
  }];

  const memoryChartOptions: ApexOptions = {
    ...cpuChartOptions,
    colors: ['#10B981']
  };

  const memorySeries = [{
    name: 'Memory Usage',
    data: [65, 62, 68, 71, 69, systemMetrics.memory]
  }];

  const MetricCard: React.FC<{
    title: string;
    value: number;
    unit: string;
    icon: React.ReactNode;
    color: string;
  }> = ({ title, value, unit, icon, color }) => (
    <div className="bg-white dark:bg-boxdark rounded-lg shadow-sm border border-stroke dark:border-strokedark p-6">
      <div className="flex items-center justify-between mb-4">
        <div className={`w-12 h-12 ${color} rounded-lg flex items-center justify-center`}>
          {icon}
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-black dark:text-white">{value}{unit}</p>
          <p className="text-sm text-bodydark2">{title}</p>
        </div>
      </div>
      <div className="w-full bg-gray-200 dark:bg-meta-4 rounded-full h-2">
        <div 
          className={`h-2 rounded-full transition-all duration-500 ${getStatusBg(value)}`}
          style={{ width: `${value}%` }}
        ></div>
      </div>
      <div className="flex items-center justify-between mt-2">
        <span className="text-xs text-bodydark2">0%</span>
        <span className={`text-xs font-medium ${getStatusColor(value)}`}>
          {value >= 85 ? 'Critical' : value >= 70 ? 'Warning' : 'Normal'}
        </span>
        <span className="text-xs text-bodydark2">100%</span>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-boxdark rounded-lg shadow-sm border border-stroke dark:border-strokedark p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-black dark:text-white mb-2">System Monitoring</h2>
            <p className="text-bodydark2">Real-time system performance and client monitoring</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-bodydark2">Auto Refresh</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/25 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
              </label>
            </div>
            <div className="text-sm text-bodydark2">
              Last updated: {lastUpdate.toLocaleTimeString()}
            </div>
            <button
              onClick={() => setLastUpdate(new Date())}
              className="p-2 rounded-lg hover:bg-gray-2 dark:hover:bg-meta-4 transition-colors"
            >
              <FiRefreshCw className="w-4 h-4 text-bodydark" />
            </button>
          </div>
        </div>
      </div>

      {/* System Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="CPU Usage"
          value={systemMetrics.cpu}
          unit="%"
          icon={<FiCpu className="w-6 h-6 text-white" />}
          color="bg-primary"
        />
        <MetricCard
          title="Memory Usage"
          value={systemMetrics.memory}
          unit="%"
          icon={<FiActivity className="w-6 h-6 text-white" />}
          color="bg-success"
        />
        <MetricCard
          title="Disk Usage"
          value={systemMetrics.disk}
          unit="%"
          icon={<FiHardDrive className="w-6 h-6 text-white" />}
          color="bg-warning"
        />
        <MetricCard
          title="Network I/O"
          value={systemMetrics.network}
          unit="%"
          icon={<FiWifi className="w-6 h-6 text-white" />}
          color="bg-secondary"
        />
      </div>

      {/* Performance Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-boxdark rounded-lg shadow-sm border border-stroke dark:border-strokedark p-6">
          <h3 className="text-lg font-semibold text-black dark:text-white mb-4">CPU Usage Trend</h3>
          <ApexCharts
            options={cpuChartOptions}
            series={cpuSeries}
            type="line"
            height={200}
          />
        </div>
        
        <div className="bg-white dark:bg-boxdark rounded-lg shadow-sm border border-stroke dark:border-strokedark p-6">
          <h3 className="text-lg font-semibold text-black dark:text-white mb-4">Memory Usage Trend</h3>
          <ApexCharts
            options={memoryChartOptions}
            series={memorySeries}
            type="line"
            height={200}
          />
        </div>
      </div>

      {/* System Information */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-boxdark rounded-lg shadow-sm border border-stroke dark:border-strokedark p-6">
          <h3 className="text-lg font-semibold text-black dark:text-white mb-4">System Information</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-bodydark2">Uptime:</span>
              <span className="text-black dark:text-white font-medium">{systemMetrics.uptime}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-bodydark2">Processes:</span>
              <span className="text-black dark:text-white font-medium">{systemMetrics.processes}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-bodydark2">Connected Clients:</span>
              <span className="text-black dark:text-white font-medium">{clientMetrics.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-bodydark2">Active Clients:</span>
              <span className="text-success font-medium">
                {clientMetrics.filter(c => c.status === 'online').length}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-boxdark rounded-lg shadow-sm border border-stroke dark:border-strokedark p-6">
          <h3 className="text-lg font-semibold text-black dark:text-white mb-4">System Alerts</h3>
          <div className="space-y-3">
            {[
              {
                type: systemMetrics.cpu > 80 ? 'critical' : systemMetrics.cpu > 60 ? 'warning' : 'info',
                message: `CPU usage at ${systemMetrics.cpu}%`,
                time: '2 min ago'
              },
              {
                type: systemMetrics.memory > 85 ? 'critical' : systemMetrics.memory > 70 ? 'warning' : 'info',
                message: `Memory usage at ${systemMetrics.memory}%`,
                time: '5 min ago'
              },
              {
                type: 'info',
                message: 'System backup completed',
                time: '1 hour ago'
              }
            ].map((alert, index) => (
              <div key={index} className="flex items-start space-x-3">
                <div className={`mt-1 ${
                  alert.type === 'critical' ? 'text-danger' :
                  alert.type === 'warning' ? 'text-warning' : 'text-primary'
                }`}>
                  {alert.type === 'critical' ? <FiAlertTriangle className="w-4 h-4" /> :
                   alert.type === 'warning' ? <FiAlertTriangle className="w-4 h-4" /> :
                   <FiCheckCircle className="w-4 h-4" />}
                </div>
                <div className="flex-1">
                  <p className="text-sm text-black dark:text-white">{alert.message}</p>
                  <p className="text-xs text-bodydark2">{alert.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-boxdark rounded-lg shadow-sm border border-stroke dark:border-strokedark p-6">
          <h3 className="text-lg font-semibold text-black dark:text-white mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <button className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors">
              <FiRefreshCw className="w-4 h-4" />
              <span>Restart Services</span>
            </button>
            <button className="w-full flex items-center justify-center space-x-2 px-4 py-2 border border-stroke dark:border-strokedark rounded-lg hover:bg-gray-2 dark:hover:bg-meta-4 transition-colors">
              <FiHardDrive className="w-4 h-4" />
              <span>Clear Cache</span>
            </button>
            <button className="w-full flex items-center justify-center space-x-2 px-4 py-2 border border-stroke dark:border-strokedark rounded-lg hover:bg-gray-2 dark:hover:bg-meta-4 transition-colors">
              <FiMonitor className="w-4 h-4" />
              <span>System Report</span>
            </button>
          </div>
        </div>
      </div>

      {/* Client Monitoring */}
      <div className="bg-white dark:bg-boxdark rounded-lg shadow-sm border border-stroke dark:border-strokedark p-6">
        <h3 className="text-lg font-semibold text-black dark:text-white mb-4">Client System Monitoring</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-2 dark:bg-meta-4">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-black dark:text-white">Client</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-black dark:text-white">Status</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-black dark:text-white">CPU</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-black dark:text-white">Memory</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-black dark:text-white">Disk</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-black dark:text-white">Last Update</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stroke dark:divide-strokedark">
              {clientMetrics.map((client) => (
                <tr key={client.id} className="hover:bg-gray-2 dark:hover:bg-meta-4 transition-colors">
                  <td className="px-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-black dark:text-white">{client.name}</p>
                      <p className="text-xs text-bodydark2">{client.ip}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      client.status === 'online' ? 'bg-success text-white' :
                      client.status === 'warning' ? 'bg-warning text-white' :
                      'bg-bodydark2 text-white'
                    }`}>
                      {client.status === 'online' ? <FiCheckCircle className="w-3 h-3 mr-1" /> :
                       <FiAlertTriangle className="w-3 h-3 mr-1" />}
                      {client.status.charAt(0).toUpperCase() + client.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center space-x-2">
                      <div className="w-16 bg-gray-200 dark:bg-meta-4 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${getStatusBg(client.cpu)}`}
                          style={{ width: `${client.cpu}%` }}
                        ></div>
                      </div>
                      <span className={`text-sm font-medium ${getStatusColor(client.cpu)}`}>
                        {client.cpu}%
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center space-x-2">
                      <div className="w-16 bg-gray-200 dark:bg-meta-4 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${getStatusBg(client.memory)}`}
                          style={{ width: `${client.memory}%` }}
                        ></div>
                      </div>
                      <span className={`text-sm font-medium ${getStatusColor(client.memory)}`}>
                        {client.memory}%
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center space-x-2">
                      <div className="w-16 bg-gray-200 dark:bg-meta-4 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${getStatusBg(client.disk)}`}
                          style={{ width: `${client.disk}%` }}
                        ></div>
                      </div>
                      <span className={`text-sm font-medium ${getStatusColor(client.disk)}`}>
                        {client.disk}%
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-bodydark2">{client.lastUpdate}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {clientMetrics.length === 0 && (
          <div className="text-center py-12">
            <FiMonitor className="w-12 h-12 text-bodydark2 mx-auto mb-4" />
            <p className="text-bodydark2">No clients connected for monitoring</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SystemMonitoring;