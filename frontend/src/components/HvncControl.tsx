import React from 'react';
import { Agent } from '../types';

interface HvncControlProps {
  agent: Agent | null;
  onClose: () => void;
}

const HvncControl: React.FC<HvncControlProps> = ({ agent, onClose }) => {
  if (!agent) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-6">
      <div className="bg-white dark:bg-boxdark rounded-xl shadow-2xl border border-stroke dark:border-strokedark w-full max-w-3xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-stroke dark:border-strokedark">
          <div>
            <h2 className="text-lg font-semibold text-black dark:text-white">
              Hidden VNC (Preview)
            </h2>
            <p className="text-sm text-bodydark2">
              Preparing secure remote desktop streaming for {agent.computerName}
            </p>
          </div>
          <button
            onClick={onClose}
            className="px-3 py-1 text-sm rounded-lg bg-primary text-white hover:bg-primary/90 transition-colors"
          >
            Close
          </button>
        </div>

        <div className="px-6 py-8 space-y-6">
          <div className="rounded-lg border border-dashed border-stroke dark:border-strokedark p-6 text-center">
            <div className="text-5xl mb-4">🖥️</div>
            <p className="text-bodydark2 max-w-3xl mx-auto">
              Live HVNC streaming, remote input routing, and session recording are under active
              development. The module will automatically surface once the infrastructure update
              is deployed. Until then, commands and the AI terminal remain the recommended path
              for remote operator workflows.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              {
                title: 'Secure transport',
                description: 'WebSocket overlay with per-session encryption and token rotation.'
              },
              {
                title: 'Adaptive quality',
                description: 'Auto-tunes FPS and resolution based on latency and packet loss.'
              },
              {
                title: 'Operator tooling',
                description: 'Clipboard sync, file staging, and terminal passthrough controls.'
              }
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-lg border border-stroke dark:border-strokedark bg-white dark:bg-boxdark p-4"
              >
                <h3 className="text-sm font-semibold text-black dark:text-white mb-2">
                  {item.title}
                </h3>
                <p className="text-xs text-bodydark2">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HvncControl;
