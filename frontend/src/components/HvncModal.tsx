import React from 'react';
import { FiX, FiMonitor } from 'react-icons/fi';
import HvncControl from './HvncControl';
import { Agent } from '../types';

interface HvncModalProps {
  isOpen: boolean;
  agent: Agent | null;
  onClose: () => void;
}

const HvncModal: React.FC<HvncModalProps> = ({ isOpen, agent, onClose }) => {
  if (!isOpen || !agent) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[10000] flex items-center justify-center px-4">
      <div className="bg-white dark:bg-boxdark rounded-xl shadow-xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col border border-stroke dark:border-strokedark">
        <div className="flex items-center justify-between px-6 py-4 border-b border-stroke dark:border-strokedark">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <FiMonitor className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-black dark:text-white">
                Remote HVNC Session – {agent.computerName}
              </h2>
              <p className="text-sm text-bodydark2">
                Agent ID: {agent.id} · Platform: {agent.platform || 'unknown'}
              </p>
            </div>
          </div>
          <button
            className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
            onClick={onClose}
            aria-label="Close HVNC modal"
          >
            <FiX className="w-5 h-5 text-bodydark2" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 bg-gray-50 dark:bg-boxdark-2">
          <HvncControl agentId={agent.id} platform={agent.platform} onClose={onClose} />
        </div>
      </div>
    </div>
  );
};

export default HvncModal;
