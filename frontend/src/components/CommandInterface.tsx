import React, { useState, useEffect } from 'react';
import { User, CommandCategory, PlatformCapabilities } from '../types';

interface CommandInterfaceProps {
  selectedUser: User | null;
  onExecuteCommand: (command: string, args?: string[]) => void;
}

const CommandInterface: React.FC<CommandInterfaceProps> = ({ selectedUser, onExecuteCommand }) => {
  const [availableCommands, setAvailableCommands] = useState<CommandCategory[]>([]);
  const [platformCapabilities, setPlatformCapabilities] = useState<PlatformCapabilities | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [customCommand, setCustomCommand] = useState<string>('');
  const [commandArgs, setCommandArgs] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  // Fetch available commands and capabilities when user changes
  useEffect(() => {
    if (!selectedUser) {
      setAvailableCommands([]);
      setPlatformCapabilities(null);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch available commands
        const commandsResponse = await fetch(`/api/commands/available/${selectedUser.id}`);
        if (commandsResponse.ok) {
          const capabilities = await commandsResponse.json();
          setPlatformCapabilities(capabilities);
          setAvailableCommands(capabilities.commandCategories || []);
        }
      } catch (error) {
        console.error('Failed to fetch command data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedUser]);

  const handleExecuteCommand = (command: string) => {
    if (!selectedUser) return;
    
    const args = commandArgs.trim() ? commandArgs.split(' ') : [];
    onExecuteCommand(command, args);
    setCommandArgs('');
  };

  const handleExecuteCustomCommand = () => {
    if (!customCommand.trim() || !selectedUser) return;
    
    const args = commandArgs.trim() ? commandArgs.split(' ') : [];
    onExecuteCommand(customCommand.trim(), args);
    setCustomCommand('');
    setCommandArgs('');
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform?.toLowerCase()) {
      case 'windows': return '🪟';
      case 'linux': return '🐧';
      case 'macos': return '🍎';
      default: return '💻';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'system': return '⚙️';
      case 'network': return '🌐';
      case 'file': return '📁';
      case 'process': return '⚡';
      case 'registry': return '📋';
      case 'persistence': return '🔒';
      case 'evasion': return '🥷';
      case 'injection': return '💉';
      case 'reconnaissance': return '🔍';
      default: return '📝';
    }
  };

  if (!selectedUser) {
    return (
      <div className="bg-gray-900 rounded-lg p-6 text-center">
        <div className="text-gray-500 mb-4">
          <span className="text-4xl">🎯</span>
        </div>
        <h3 className="text-lg font-semibold text-white mb-2">No Agent Selected</h3>
        <p className="text-gray-400">Select an agent from the table to view available commands</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 rounded-lg shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gray-800 px-6 py-4 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">{getPlatformIcon(selectedUser.platform)}</span>
            <div>
              <h3 className="text-lg font-semibold text-white">Command Interface</h3>
              <p className="text-sm text-gray-400">
                {selectedUser.name} • {selectedUser.platform} {selectedUser.version}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <span className={`px-2 py-1 text-xs rounded ${
              selectedUser.status === 'online' ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'
            }`}>
              {selectedUser.status}
            </span>
            {platformCapabilities && (
              <span className="px-2 py-1 text-xs rounded bg-blue-900 text-blue-300">
                {platformCapabilities.availableCommands?.length || 0} commands
              </span>
            )}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="p-6 text-center">
          <div className="text-gray-400">Loading commands...</div>
        </div>
      ) : (
        <div className="p-6">
          {/* Platform Capabilities Summary */}
          {platformCapabilities && (
            <div className="mb-6 p-4 bg-gray-800 rounded-lg">
              <h4 className="text-sm font-semibold text-white mb-3">Agent Capabilities</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                <div>
                  <span className="text-gray-400">Architecture:</span>
                  <div className="text-blue-400 font-medium">{selectedUser.architecture || 'Unknown'}</div>
                </div>
                <div>
                  <span className="text-gray-400">Privileges:</span>
                  <div className={`font-medium ${selectedUser.systemInfo?.isAdmin ? 'text-red-400' : 'text-green-400'}`}>
                    {selectedUser.systemInfo?.isAdmin ? 'Administrator' : 'Standard User'}
                  </div>
                </div>
                <div>
                  <span className="text-gray-400">Features:</span>
                  <div className="text-purple-400 font-medium">
                    {Object.values(selectedUser.features || {}).filter(feature => feature.enabled).length} available
                  </div>
                </div>
                <div>
                  <span className="text-gray-400">Connection:</span>
                  <div className="text-green-400 font-medium">
                    {selectedUser.connectionCount || 0} sessions
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Command Categories */}
          {availableCommands.length > 0 && (
            <div className="mb-6">
              <h4 className="text-sm font-semibold text-white mb-3">Available Command Categories</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {availableCommands.map((category) => (
                  <div
                    key={category.name}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedCategory === category.name
                        ? 'bg-blue-900 border-blue-600'
                        : 'bg-gray-800 border-gray-700 hover:bg-gray-750'
                    }`}
                    onClick={() => setSelectedCategory(selectedCategory === category.name ? '' : category.name)}
                  >
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="text-lg">{getCategoryIcon(category.name)}</span>
                      <span className="font-medium text-white capitalize">{category.name}</span>
                    </div>
                    <div className="text-xs text-gray-400">
                      {category.commands.length} commands available
                    </div>
                    {category.description && (
                      <div className="text-xs text-gray-500 mt-1">{category.description}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Selected Category Commands */}
          {selectedCategory && (
            <div className="mb-6">
              <h4 className="text-sm font-semibold text-white mb-3">
                {getCategoryIcon(selectedCategory)} {selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)} Commands
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {availableCommands
                  .find(cat => cat.name === selectedCategory)
                  ?.commands.map((command) => (
                    <div
                      key={command.name}
                      className="p-3 bg-gray-800 rounded border border-gray-700 hover:bg-gray-750 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-white">{command.name}</span>
                        <button
                          onClick={() => handleExecuteCommand(command.name)}
                          className="px-2 py-1 text-xs bg-blue-900 text-blue-300 rounded hover:bg-blue-800 transition-colors"
                        >
                          Execute
                        </button>
                      </div>
                      {command.description && (
                        <div className="text-xs text-gray-400 mb-2">{command.description}</div>
                      )}
                      {command.syntax && (
                        <div className="text-xs text-gray-500 font-mono bg-gray-900 p-1 rounded">
                          {command.syntax}
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Custom Command Input */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-white">Custom Command</h4>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Command</label>
                <input
                  type="text"
                  value={customCommand}
                  onChange={(e) => setCustomCommand(e.target.value)}
                  placeholder="Enter command..."
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Arguments (optional)</label>
                <input
                  type="text"
                  value={commandArgs}
                  onChange={(e) => setCommandArgs(e.target.value)}
                  placeholder="Enter arguments separated by spaces..."
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                />
              </div>
              <button
                onClick={handleExecuteCustomCommand}
                disabled={!customCommand.trim()}
                className="w-full px-4 py-2 bg-green-900 text-green-300 rounded hover:bg-green-800 disabled:bg-gray-800 disabled:text-gray-500 disabled:cursor-not-allowed transition-colors"
              >
                Execute Custom Command
              </button>
            </div>
          </div>

          {/* Warning */}
          <div className="mt-6 p-3 bg-yellow-900 border border-yellow-700 rounded-lg">
            <div className="flex items-center space-x-2">
              <span className="text-yellow-400">⚠️</span>
              <span className="text-xs text-yellow-300">
                Commands are filtered based on the agent's platform and capabilities. 
                Incompatible commands are automatically hidden.
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CommandInterface;