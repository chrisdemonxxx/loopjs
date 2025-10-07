import React, { useEffect, useRef } from 'react';

interface CommandOutputTerminalProps {
  commandHistory: any[];
  className?: string;
}

const CommandOutputTerminal: React.FC<CommandOutputTerminalProps> = ({
  commandHistory,
  className = ''
}) => {
  const terminalRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new commands are added
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [commandHistory]);

  const formatTimestamp = (timestamp: string | Date) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString();
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'processing':
        return '⏳';
      case 'optimized':
        return '✨';
      case 'fallback':
        return '⚡';
      case 'error':
        return '❌';
      case 'success':
        return '✅';
      default:
        return '📋';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'processing':
        return 'text-blue-600 dark:text-blue-400';
      case 'optimized':
        return 'text-green-600 dark:text-green-400';
      case 'fallback':
        return 'text-yellow-600 dark:text-yellow-400';
      case 'error':
        return 'text-red-600 dark:text-red-400';
      case 'success':
        return 'text-green-600 dark:text-green-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  return (
    <div className={`bg-gray-900 text-green-400 font-mono text-sm rounded-lg shadow-lg border border-gray-700 ${className}`}>
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        <div className="flex items-center gap-2 text-green-300">
          <span className="text-lg">💻</span>
          <span className="font-bold text-white">Command Output Terminal</span>
          <span className="text-xs text-gray-400">({commandHistory.length} commands)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          <span className="text-xs text-green-400 font-semibold">LIVE</span>
        </div>
      </div>
      
      <div 
        ref={terminalRef}
        className="p-4 h-80 overflow-y-auto"
        style={{ fontFamily: 'Consolas, Monaco, "Courier New", monospace' }}
      >
        {commandHistory.length === 0 ? (
          <div className="text-gray-500 text-center py-8">
            <div className="text-2xl mb-2">🚀</div>
            <div>No commands executed yet</div>
            <div className="text-xs mt-1">Execute commands to see output here</div>
          </div>
        ) : (
          <div className="space-y-3">
            {commandHistory.map((entry, index) => (
              <div key={entry.id || index} className="border-l-2 border-gray-700 pl-3">
                {/* Command Header */}
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-yellow-400">$</span>
                  <span className="text-white font-semibold">
                    {entry.command?.name || entry.userInput || entry.commandName || 'Command'}
                  </span>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusColor(entry.status)}`}>
                    {getStatusIcon(entry.status)} {entry.status.toUpperCase()}
                  </span>
                  <span className="text-gray-500 text-xs">
                    {formatTimestamp(entry.timestamp)}
                  </span>
                </div>

                {/* AI Command (if different from original) */}
                {entry.aiCommand && (
                  <div className="ml-4 mb-3">
                    <div className="text-blue-400 text-xs mb-1 font-semibold">🤖 AI Optimized Command:</div>
                    <div className="text-blue-200 bg-blue-900/30 p-3 rounded text-xs font-mono break-all border border-blue-700">
                      {entry.aiCommand}
                    </div>
                  </div>
                )}

                {/* AI Explanation */}
                {entry.aiExplanation && (
                  <div className="ml-4 mb-3">
                    <div className="text-purple-400 text-xs mb-1 font-semibold">💡 AI Explanation:</div>
                    <div className="text-purple-200 bg-purple-900/30 p-2 rounded text-xs border border-purple-700">
                      {entry.aiExplanation}
                    </div>
                  </div>
                )}

                {/* Command Output */}
                {entry.output && (
                  <div className="ml-4 mb-3">
                    <div className="text-green-400 text-xs mb-1 font-semibold">📤 Command Output:</div>
                    <div className="text-green-200 bg-green-900/30 p-3 rounded text-xs whitespace-pre-wrap font-mono border border-green-700">
                      {entry.output}
                    </div>
                  </div>
                )}

                {/* Error Output */}
                {entry.error && (
                  <div className="ml-4 mb-3">
                    <div className="text-red-400 text-xs mb-1 font-semibold">❌ Error:</div>
                    <div className="text-red-200 bg-red-900/30 p-3 rounded text-xs whitespace-pre-wrap font-mono border border-red-700">
                      {entry.error}
                    </div>
                  </div>
                )}

                {/* Execution Details */}
                <div className="ml-4 mb-2 flex gap-4 text-xs text-gray-400">
                  {entry.retryCount > 0 && (
                    <span>🔄 Retries: {entry.retryCount}</span>
                  )}
                  {entry.executionTime && (
                    <span>⏱️ Time: {entry.executionTime}ms</span>
                  )}
                  {entry.commandType && (
                    <span>🏷️ Type: {entry.commandType}</span>
                  )}
                </div>

                {/* Processing Status */}
                {entry.status === 'processing' && (
                  <div className="ml-4 mb-2">
                    <div className="text-yellow-400 text-xs animate-pulse">
                      ⏳ Processing command...
                    </div>
                  </div>
                )}

                {/* No Output Message */}
                {!entry.output && !entry.error && entry.status === 'completed' && (
                  <div className="ml-4 mb-2">
                    <div className="text-gray-400 text-xs italic">
                      ✅ Command completed successfully (no output)
                    </div>
                  </div>
                )}

                {/* Separator */}
                {index < commandHistory.length - 1 && (
                  <div className="mt-3 border-t border-gray-700"></div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Terminal Footer */}
      <div className="p-4 border-t border-gray-700 bg-gray-800">
        <div className="flex items-center justify-between text-xs text-gray-400">
          <div className="flex items-center gap-6">
            <span className="flex items-center gap-1">
              <span className="text-green-400">📊</span>
              <span>Commands: {commandHistory.length}</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="text-blue-400">⚡</span>
              <span>Status: {commandHistory.length > 0 ? commandHistory[commandHistory.length - 1].status.toUpperCase() : 'READY'}</span>
            </span>
            {commandHistory.length > 0 && (
              <span className="flex items-center gap-1">
                <span className="text-purple-400">🕒</span>
                <span>Last: {formatTimestamp(commandHistory[commandHistory.length - 1].timestamp)}</span>
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-green-400 font-semibold">LIVE MONITORING</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommandOutputTerminal;
