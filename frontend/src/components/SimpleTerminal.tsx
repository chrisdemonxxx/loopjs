import React from 'react';
import { Agent } from '../types';
import NaturalLanguageTerminal from './NaturalLanguageTerminal';
import CommandOutputTerminal from './CommandOutputTerminal';

interface SimpleTerminalProps {
  selectedAgent: Agent | null;
  onCommandSent: (command: any) => void;
  commandHistory: any[];
  setCommandHistory: (history: any[]) => void;
}

const SimpleTerminal: React.FC<SimpleTerminalProps> = ({
  selectedAgent,
  onCommandSent,
  commandHistory,
  setCommandHistory
}) => {
  return (
    <div className="space-y-4">
      {/* Clean Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 rounded-lg">
        <h3 className="text-xl font-bold flex items-center gap-2">
          <span className="text-2xl">✨</span>
          Magic Commands
        </h3>
        <p className="text-blue-100 text-sm mt-1">
          Type what you want to do in plain English
        </p>
        {selectedAgent && (
          <div className="mt-2 text-xs">
            <span className="bg-white/20 px-2 py-1 rounded">Target: {selectedAgent.computerName}</span>
          </div>
        )}
      </div>

      {/* Input Area */}
      <NaturalLanguageTerminal
        selectedAgent={selectedAgent}
        onCommandSent={onCommandSent}
        commandHistory={commandHistory}
        setCommandHistory={setCommandHistory}
      />

      {/* Terminal Output */}
      <CommandOutputTerminal
        commandHistory={commandHistory}
        className="mt-4"
      />
    </div>
  );
};

export default SimpleTerminal;