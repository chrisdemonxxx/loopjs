import React, { useEffect, useMemo, useState } from 'react';
import { Agent } from '../types';
import { API_URL } from '../config';

interface CommandDefinition {
  name: string;
  description?: string;
  syntax?: string;
}

interface CommandCategory {
  name: string;
  description?: string;
  commands: CommandDefinition[];
}

interface CommandInterfaceProps {
  selectedAgent: Agent | null;
  onExecuteCommand: (command: string, args?: string[]) => void;
}

const placeholderCategories: CommandCategory[] = [
  {
    name: 'system',
    description: 'Popular operating system commands',
    commands: [
      { name: 'systeminfo', description: 'Collect detailed operating system information' },
      { name: 'whoami', description: 'Display current user context' }
    ]
  },
  {
    name: 'network',
    description: 'Connectivity and discovery helpers',
    commands: [
      { name: 'ipconfig /all', description: 'Enumerate network adapters on Windows' },
      { name: 'ping 8.8.8.8', description: 'Validate outbound connectivity to the internet' }
    ]
  }
];

const CommandInterface: React.FC<CommandInterfaceProps> = ({ selectedAgent, onExecuteCommand }) => {
  const [categories, setCategories] = useState<CommandCategory[]>(placeholderCategories);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(placeholderCategories[0]?.name ?? null);
  const [customCommand, setCustomCommand] = useState('');
  const [commandArgs, setCommandArgs] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchCommands = async () => {
      if (!selectedAgent) {
        setCategories(placeholderCategories);
        setSelectedCategory(placeholderCategories[0]?.name ?? null);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`${API_URL}/commands/available/${selectedAgent.id}`, {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('accessToken') ?? ''}`
          }
        });

        if (!response.ok) {
          throw new Error(`Unable to fetch commands (${response.status})`);
        }

        const data = await response.json();

        const rawCategories =
          data?.commandCategories ??
          data?.data?.commandCategories ??
          data?.categories ??
          [];

        const normalisedCategories: CommandCategory[] = Array.isArray(rawCategories)
          ? rawCategories.map((category: any) => ({
              name: String(category?.name ?? 'custom'),
              description: category?.description ?? '',
              commands: Array.isArray(category?.commands)
                ? category.commands
                    .filter((cmd: any) => cmd && cmd.name)
                    .map((cmd: any) => ({
                      name: String(cmd.name),
                      description: cmd.description ?? '',
                      syntax: cmd.syntax ?? ''
                    }))
                : []
            }))
          : Object.entries(rawCategories as Record<string, any>).map(([name, value]) => {
              const commands = Array.isArray(value)
                ? value
                : value?.commands ?? [];
              return {
                name,
                description: value?.description ?? '',
                commands: commands
                  .filter((cmd: any) => cmd && cmd.name)
                  .map((cmd: any) => ({
                    name: String(cmd.name),
                    description: cmd.description ?? '',
                    syntax: cmd.syntax ?? ''
                  }))
              };
            });

        if (isMounted && normalisedCategories.length > 0) {
          setCategories(normalisedCategories);
          setSelectedCategory(normalisedCategories[0]?.name ?? null);
        } else if (isMounted) {
          setCategories(placeholderCategories);
          setSelectedCategory(placeholderCategories[0]?.name ?? null);
        }
      } catch (err) {
        if (isMounted) {
          setCategories(placeholderCategories);
          setSelectedCategory(placeholderCategories[0]?.name ?? null);
          setError(err instanceof Error ? err.message : 'Failed to load available commands');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchCommands();

    return () => {
      isMounted = false;
    };
  }, [selectedAgent?.id]);

  const selectedAgentFeatures = useMemo(() => {
    if (!selectedAgent?.features) {
      return [];
    }

    const featureEntries = Object.entries(selectedAgent.features);
    return featureEntries
      .filter(([, enabled]) => Boolean(enabled))
      .map(([key]) => key);
  }, [selectedAgent]);

  const handleExecute = (command: string) => {
    const args = commandArgs.trim() ? commandArgs.trim().split(/\s+/) : undefined;
    onExecuteCommand(command, args);
    setCommandArgs('');
  };

  const handleCustomCommand = () => {
    const trimmed = customCommand.trim();
    if (!trimmed) {
      return;
    }
    const args = commandArgs.trim() ? commandArgs.trim().split(/\s+/) : undefined;
    onExecuteCommand(trimmed, args);
    setCustomCommand('');
    setCommandArgs('');
  };

  if (!selectedAgent) {
    return (
      <div className="bg-white dark:bg-boxdark rounded-lg border border-stroke dark:border-strokedark p-8 text-center">
        <div className="text-4xl mb-4">🎯</div>
        <h2 className="text-xl font-semibold text-black dark:text-white mb-2">Select an Agent</h2>
        <p className="text-bodydark2">Choose an agent from the dashboard to explore available commands.</p>
      </div>
    );
  }

  const category = categories.find((item) => item.name === selectedCategory);

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-boxdark rounded-lg shadow-sm border border-stroke dark:border-strokedark">
        <div className="px-6 py-4 border-b border-stroke dark:border-strokedark flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-black dark:text-white">Command Library</h2>
            <p className="text-sm text-bodydark2">
              {selectedAgent.name} • {selectedAgent.platform} {selectedAgent.version}
            </p>
          </div>
          <div
            className={`px-2 py-1 rounded text-xs ${
              selectedAgent.status === 'online'
                ? 'bg-success/10 text-success'
                : 'bg-danger/10 text-danger'
            }`}
          >
            {selectedAgent.status.toUpperCase()}
          </div>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-bodydark2 uppercase tracking-wide mb-1">Architecture</p>
              <p className="text-sm font-medium text-black dark:text-white">
                {selectedAgent.architecture || 'Unknown'}
              </p>
            </div>
            <div>
              <p className="text-xs text-bodydark2 uppercase tracking-wide mb-1">Privileges</p>
              <p className="text-sm font-medium text-black dark:text-white">
                {selectedAgent.systemInfo?.isAdmin ? 'Administrator' : 'Standard user'}
              </p>
            </div>
            <div>
              <p className="text-xs text-bodydark2 uppercase tracking-wide mb-1">Active Features</p>
              <p className="text-sm font-medium text-black dark:text-white">
                {selectedAgentFeatures.length > 0 ? selectedAgentFeatures.join(', ') : 'None detected'}
              </p>
            </div>
            <div>
              <p className="text-xs text-bodydark2 uppercase tracking-wide mb-1">Sessions</p>
              <p className="text-sm font-medium text-black dark:text-white">
                {selectedAgent.connectionCount ?? 0}
              </p>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-black dark:text-white mb-3">Command Categories</h3>
            <div className="flex flex-wrap gap-2">
              {categories.map((item) => (
                <button
                  key={item.name}
                  onClick={() => setSelectedCategory(item.name)}
                  className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                    item.name === selectedCategory
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-stroke dark:border-strokedark hover:border-primary/50 text-bodydark2'
                  }`}
                >
                  {item.name}
                </button>
              ))}
            </div>
            {error && (
              <p className="text-xs text-danger mt-2">
                {error}. Displaying a basic command set while we retry.
              </p>
            )}
          </div>

          <div>
            <h3 className="text-sm font-semibold text-black dark:text-white mb-3">
              {isLoading ? 'Loading commands…' : `Commands in ${selectedCategory ?? 'category'}`}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {(category?.commands ?? []).map((command) => (
                <div
                  key={command.name}
                  className="border border-stroke dark:border-strokedark rounded-lg p-3 bg-white dark:bg-boxdark"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-black dark:text-white">{command.name}</span>
                    <button
                      onClick={() => handleExecute(command.name)}
                      className="text-xs px-2 py-1 rounded bg-primary text-white hover:bg-primary/90 transition-colors"
                    >
                      Execute
                    </button>
                  </div>
                  {command.description && (
                    <p className="text-xs text-bodydark2 mb-2">{command.description}</p>
                  )}
                  {command.syntax && (
                    <pre className="text-xs bg-gray-100 dark:bg-gray-800 text-bodydark2 rounded px-2 py-1 overflow-x-auto">
                      {command.syntax}
                    </pre>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-black dark:text-white">Custom Command</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-bodydark2 mb-1">Command</label>
                <input
                  type="text"
                  value={customCommand}
                  onChange={(event) => setCustomCommand(event.target.value)}
                  placeholder="Enter command (e.g. tasklist)"
                  className="w-full px-3 py-2 border border-stroke dark:border-strokedark rounded bg-white dark:bg-boxdark text-black dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs text-bodydark2 mb-1">Arguments (optional)</label>
                <input
                  type="text"
                  value={commandArgs}
                  onChange={(event) => setCommandArgs(event.target.value)}
                  placeholder="Example: /SVC /FO LIST"
                  className="w-full px-3 py-2 border border-stroke dark:border-strokedark rounded bg-white dark:bg-boxdark text-black dark:text-white"
                />
              </div>
            </div>
            <button
              onClick={handleCustomCommand}
              disabled={!customCommand.trim()}
              className="px-4 py-2 rounded bg-success text-white text-sm font-medium hover:bg-success/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Send Command
            </button>
          </div>

          <div className="border border-warning/30 bg-warning/10 rounded-lg px-4 py-3 text-xs text-warning">
            Commands are sent directly over the secure WebSocket connection. Ensure you understand the
            impact before running high-risk commands on production systems.
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommandInterface;
