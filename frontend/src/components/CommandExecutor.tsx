import React from 'react';
import { Agent } from '../types';

interface CommandExecutorProps {
  agent: Agent | null;
  isOpen: boolean;
  onClose: () => void;
}

const CommandExecutor: React.FC<CommandExecutorProps> = ({ agent, isOpen, onClose }) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-6">
      <div className="bg-white dark:bg-boxdark rounded-xl shadow-2xl border border-stroke dark:border-strokedark w-full max-w-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-stroke dark:border-strokedark">
          <div>
            <h2 className="text-lg font-semibold text-black dark:text-white">Command Executor</h2>
            <p className="text-sm text-bodydark2">
              {agent
                ? `Execute commands for ${agent.computerName} (${agent.platform})`
                : 'Select an agent to begin'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="px-3 py-1 text-sm rounded-lg bg-primary text-white hover:bg-primary/90 transition-colors"
          >
            Close
          </button>
        </div>
        <div className="px-6 py-8 text-center text-bodydark2 space-y-4">
          <div className="text-4xl">⚙️</div>
          <p>
            A streamlined terminal-like experience for sending commands is on the roadmap.
            For now, use the AI Terminal or command interface to issue instructions to connected agents.
          </p>
        </div>
      </div>
    </div>
  );
};

export default CommandExecutor;
