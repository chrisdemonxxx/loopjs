import React, { useState, useEffect } from 'react';
import { 
  FiUsers, 
  FiMonitor, 
  FiActivity, 
  FiShield,
  FiTrendingUp,
  FiTrendingDown,
  FiAlertTriangle,
  FiCheckCircle
} from 'react-icons/fi';
import ApexCharts from 'react-apexcharts';
import { ApexOptions } from 'apexcharts';

interface DashboardProps {
  tableData: any[];
  activeTab?: string;
}

interface StatCardProps {
  title: string;
  value: string | number;
  change: string;
  changeType: 'increase' | 'decrease' | 'neutral';
  icon: React.ReactNode;
  color: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, change, changeType, icon, color }) => {
  const getChangeIcon = () => {
    switch (changeType) {
      case 'increase':
        return <FiTrendingUp className="w-4 h-4 text-success" />;
      case 'decrease':
        return <FiTrendingDown className="w-4 h-4 text-danger" />;
      default:
        return <FiActivity className="w-4 h-4 text-warning" />;
    }
  };

  return (
    <div className="bg-white dark:bg-boxdark rounded-lg shadow-sm border border-stroke dark:border-strokedark p-4 md:p-6 hover:shadow-md transition-shadow hover-lift">
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-bodydark2 mb-1 truncate">{title}</p>
          <p className="text-xl md:text-2xl font-bold text-black dark:text-white mb-2">{value}</p>
          <div className="flex items-center space-x-1 flex-wrap">
            {getChangeIcon()}
            <span className={`text-sm font-medium ${
              changeType === 'increase' ? 'text-success' : 
              changeType === 'decrease' ? 'text-danger' : 'text-warning'
            }`}>
              {change}
            </span>
            <span className="text-xs text-bodydark2 hidden sm:inline">vs last week</span>
          </div>
        </div>
        <div className={`w-10 h-10 md:w-12 md:h-12 rounded-lg flex items-center justify-center flex-shrink-0 ml-2 ${color}`}>
          {icon}
        </div>
      </div>
    </div>
  );
};

const Dashboard: React.FC<DashboardProps> = ({ tableData }) => {
  const [systemStats, setSystemStats] = useState({
    totalClients: 0,
    activeClients: 0,
    offlineClients: 0,
    totalTasks: 0,
    completedTasks: 0,
    failedTasks: 0
  });

  // Calculate stats from tableData
  useEffect(() => {
    if (tableData && tableData.length > 0) {
      const active = tableData.filter(client => client.status === 'Online').length;
      const offline = tableData.length - active;
      
      setSystemStats({
        totalClients: tableData.length,
        activeClients: active,
        offlineClients: offline,
        totalTasks: Math.floor(Math.random() * 100) + 50,
        completedTasks: Math.floor(Math.random() * 80) + 40,
        failedTasks: Math.floor(Math.random() * 10) + 2
      });
    }
  }, [tableData]);

  // Chart configurations
  const clientStatusChartOptions: ApexOptions = {
    chart: {
      type: 'donut',
      height: 300,
      toolbar: { show: false }
    },
    labels: ['Online', 'Offline'],
    colors: ['#10B981', '#F87171'],
    legend: {
      position: 'bottom',
      labels: {
        colors: '#64748B'
      }
    },
    plotOptions: {
      pie: {
        donut: {
          size: '70%',
          labels: {
            show: true,
            total: {
              show: true,
              label: 'Total Clients',
              color: '#64748B'
            }
          }
        }
      }
    },
    dataLabels: {
      enabled: false
    },
    responsive: [{
      breakpoint: 480,
      options: {
        chart: {
          height: 250
        },
        legend: {
          position: 'bottom'
        }
      }
    }]
  };

  const activityChartOptions: ApexOptions = {
    chart: {
      type: 'area',
      height: 300,
      toolbar: { show: false },
      zoom: { enabled: false }
    },
    stroke: {
      curve: 'smooth',
      width: 2
    },
    fill: {
      type: 'gradient',
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.7,
        opacityTo: 0.3
      }
    },
    colors: ['#3C50E0', '#80CAEE'],
    xaxis: {
      categories: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', '24:00'],
      labels: {
        style: {
          colors: '#64748B'
        }
      }
    },
    yaxis: {
      labels: {
        style: {
          colors: '#64748B'
        }
      }
    },
    grid: {
      borderColor: '#E2E8F0'
    },
    legend: {
      labels: {
        colors: '#64748B'
      }
    }
  };

  const clientStatusSeries = [systemStats.activeClients, systemStats.offlineClients];
  const activitySeries = [
    {
      name: 'Active Connections',
      data: [30, 40, 35, 50, 49, 60, 70]
    },
    {
      name: 'System Load',
      data: [20, 30, 25, 40, 39, 50, 60]
    }
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-primary to-secondary rounded-lg p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">Welcome to LoopJS Dashboard</h2>
        <p className="text-blue-100">Monitor and manage your system infrastructure from this centralized panel.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 animate-fade-in-up">
        <StatCard
          title="Total Clients"
          value={systemStats.totalClients}
          change="+12%"
          changeType="increase"
          icon={<FiUsers className="w-6 h-6 text-white" />}
          color="bg-primary"
        />
        <StatCard
          title="Active Clients"
          value={systemStats.activeClients}
          change="+8%"
          changeType="increase"
          icon={<FiCheckCircle className="w-6 h-6 text-white" />}
          color="bg-success"
        />
        <StatCard
          title="System Load"
          value="68%"
          change="-3%"
          changeType="decrease"
          icon={<FiActivity className="w-6 h-6 text-white" />}
          color="bg-warning"
        />
        <StatCard
          title="Security Alerts"
          value="2"
          change="-50%"
          changeType="decrease"
          icon={<FiShield className="w-6 h-6 text-white" />}
          color="bg-danger"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 md:gap-6 animate-fade-in-up" style={{animationDelay: '0.1s'}}>
        {/* Client Status Chart */}
        <div className="bg-white dark:bg-boxdark rounded-lg shadow-sm border border-stroke dark:border-strokedark p-4 md:p-6">
          <h3 className="text-base md:text-lg font-semibold text-black dark:text-white mb-4">Client Status Distribution</h3>
          <ApexCharts
            options={clientStatusChartOptions}
            series={clientStatusSeries}
            type="donut"
            height={300}
          />
        </div>

        {/* Activity Chart */}
        <div className="bg-white dark:bg-boxdark rounded-lg shadow-sm border border-stroke dark:border-strokedark p-4 md:p-6">
          <h3 className="text-base md:text-lg font-semibold text-black dark:text-white mb-4">System Activity (24h)</h3>
          <ApexCharts
            options={activityChartOptions}
            series={activitySeries}
            type="area"
            height={300}
          />
        </div>
      </div>

      {/* Recent Activity & Alerts */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 md:gap-6 animate-fade-in-up" style={{animationDelay: '0.2s'}}>
        {/* Recent Activity */}
        <div className="bg-white dark:bg-boxdark rounded-lg shadow-sm border border-stroke dark:border-strokedark p-4 md:p-6">
          <h3 className="text-base md:text-lg font-semibold text-black dark:text-white mb-4">Recent Activity</h3>
          <div className="space-y-4">
            {[
              { time: '2 minutes ago', action: 'New client connected', type: 'success' },
              { time: '15 minutes ago', action: 'Task completed successfully', type: 'success' },
              { time: '1 hour ago', action: 'System backup completed', type: 'info' },
              { time: '2 hours ago', action: 'Security scan finished', type: 'warning' },
              { time: '3 hours ago', action: 'Client disconnected', type: 'error' }
            ].map((activity, index) => (
              <div key={index} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-2 dark:hover:bg-meta-4 transition-colors">
                <div className={`w-2 h-2 rounded-full ${
                  activity.type === 'success' ? 'bg-success' :
                  activity.type === 'warning' ? 'bg-warning' :
                  activity.type === 'error' ? 'bg-danger' : 'bg-primary'
                }`}></div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-black dark:text-white">{activity.action}</p>
                  <p className="text-xs text-bodydark2">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* System Alerts */}
        <div className="bg-white dark:bg-boxdark rounded-lg shadow-sm border border-stroke dark:border-strokedark p-4 md:p-6">
          <h3 className="text-base md:text-lg font-semibold text-black dark:text-white mb-4">System Alerts</h3>
          <div className="space-y-4">
            {[
              { 
                title: 'High CPU Usage', 
                description: 'Server CPU usage is above 80%', 
                severity: 'warning',
                time: '5 minutes ago'
              },
              { 
                title: 'Security Update Available', 
                description: 'New security patches are ready for installation', 
                severity: 'info',
                time: '1 hour ago'
              },
              { 
                title: 'Backup Completed', 
                description: 'Daily system backup completed successfully', 
                severity: 'success',
                time: '2 hours ago'
              }
            ].map((alert, index) => (
              <div key={index} className="flex items-start space-x-3 p-3 rounded-lg border border-stroke dark:border-strokedark">
                <div className={`mt-1 ${
                  alert.severity === 'warning' ? 'text-warning' :
                  alert.severity === 'success' ? 'text-success' : 'text-primary'
                }`}>
                  {alert.severity === 'warning' ? <FiAlertTriangle className="w-4 h-4" /> :
                   alert.severity === 'success' ? <FiCheckCircle className="w-4 h-4" /> :
                   <FiMonitor className="w-4 h-4" />}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-black dark:text-white">{alert.title}</p>
                  <p className="text-xs text-bodydark2 mb-1">{alert.description}</p>
                  <p className="text-xs text-bodydark2">{alert.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;