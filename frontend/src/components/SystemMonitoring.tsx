import React from 'react';
import { Agent } from '../types';

interface SystemMonitoringProps {
  tableData: Agent[];
}

const SystemMonitoring: React.FC<SystemMonitoringProps> = ({ tableData }) => {
  const onlineCount = tableData.filter((agent) => agent.status === 'online').length;

  return (
    <div className="bg-white dark:bg-boxdark rounded-lg border border-stroke dark:border-strokedark p-8 text-center">
      <div className="text-4xl mb-4">📡</div>
      <h2 className="text-xl font-semibold text-black dark:text-white mb-2">System Monitoring</h2>
      <p className="text-bodydark2">
        {onlineCount} of {tableData.length} agents currently online. Detailed telemetry will return
        with the metrics refresh.
      </p>
    </div>
  );
};

export default SystemMonitoring;
