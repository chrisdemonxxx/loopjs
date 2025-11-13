import React from 'react';
import { FiX } from 'react-icons/fi';
import HvncControl from './HvncControl';

interface HvncModalProps {
  agentId: string;
  platform: string;
  isOpen: boolean;
  onClose: () => void;
}

const HvncModal: React.FC<HvncModalProps> = ({ agentId, platform, isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white dark:bg-boxdark rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-stroke dark:border-strokedark">
          <h2 className="text-xl font-semibold">HVNC Remote Control</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-bodydark2 rounded-lg transition-colors"
            aria-label="Close"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          <HvncControl agentId={agentId} platform={platform} onClose={onClose} />
        </div>
      </div>
    </div>
  );
};

export default HvncModal;
