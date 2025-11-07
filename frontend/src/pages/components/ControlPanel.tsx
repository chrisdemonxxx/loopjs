import React from 'react';
import { Agent } from '../../types';

interface ControlPanelProps {
  client: Agent | null;
  onRunCommand?: (command: string) => void;
}

const ControlPanel: React.FC<ControlPanelProps> = ({ client, onRunCommand }) => {
  if (!client) {
    return (
      <div className="bg-white dark:bg-boxdark rounded-lg border border-stroke dark:border-strokedark p-6 text-center text-bodydark2">
        Select a client to view quick actions.
      </div>
    );
  }

  const quickCommands = [
    { id: 'systeminfo', label: 'System Info' },
    { id: 'ipconfig', label: 'Network Info' },
    { id: 'screenshot', label: 'Screenshot' }
  ];

  return (
    <div className="bg-white dark:bg-boxdark rounded-lg border border-stroke dark:border-strokedark p-6 space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-black dark:text-white">{client.computerName}</h3>
        <p className="text-xs text-bodydark2">
          {client.platform} • {client.ipAddress}
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {quickCommands.map((item) => (
          <button
            key={item.id}
            onClick={() => onRunCommand?.(item.id)}
            className="px-4 py-3 border border-stroke dark:border-strokedark rounded-lg text-sm hover:bg-primary/10 transition-colors"
          >
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default ControlPanel;
