import React, { useState } from 'react';
import Terminal, { TerminalRef } from './Terminal';
import UnifiedTerminal from './UnifiedTerminal';
import AdvancedTerminal from './AdvancedTerminal';
import { Agent } from '../types';
import { FiTerminal } from 'react-icons/fi';

export type TerminalMode = 'simple' | 'advanced';

interface EnhancedTerminalProps {
  selectedAgent: Agent | null;
  onCommandSent: (command: any) => void;
  terminalRef: React.RefObject<TerminalRef>;
  naturalLanguageHistory: any[];
  setNaturalLanguageHistory: (history: any[]) => void;
  agents?: Agent[]; // Add agents prop for Terminal component
}

const EnhancedTerminal: React.FC<EnhancedTerminalProps> = ({
  selectedAgent,
  onCommandSent,
  terminalRef,
  naturalLanguageHistory,
  setNaturalLanguageHistory,
  agents = []
}) => {
  const [currentMode, setCurrentMode] = useState<TerminalMode>('simple');

  return (
    <div className="premium-card h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-3">
          <FiTerminal className="w-5 h-5 text-indigo-600" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">AI Terminal</h2>
        </div>
        
        <div className="flex items-center space-x-2">
          <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            <button
              onClick={() => setCurrentMode('simple')}
              className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                currentMode === 'simple'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Simple Mode
            </button>
            <button
              onClick={() => setCurrentMode('advanced')}
              className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                currentMode === 'advanced'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Advanced Mode
            </button>
          </div>
        </div>
      </div>

      {/* Terminal Content */}
      <div className="h-full">
        {currentMode === 'simple' && (
          <UnifiedTerminal
            selectedAgent={selectedAgent}
            agents={agents}
            onCommandSent={onCommandSent}
            commandHistory={naturalLanguageHistory}
            setCommandHistory={setNaturalLanguageHistory}
          />
        )}
        {currentMode === 'advanced' && (
          <AdvancedTerminal
            selectedAgent={selectedAgent}
            agents={agents}
            onCommandSent={onCommandSent}
            commandHistory={naturalLanguageHistory}
            setCommandHistory={setNaturalLanguageHistory}
          />
        )}
      </div>
    </div>
  );
};

export default EnhancedTerminal;
