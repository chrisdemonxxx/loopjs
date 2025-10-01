import React, { useState } from 'react';
import { Agent } from './types';

interface TransferModalProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  user: Agent;
  handleProcess: (user: Agent, commandKey: string) => void;
}

const TransferModal: React.FC<TransferModalProps> = ({ isOpen, setIsOpen, user, handleProcess }) => {
  if (!isOpen) return null;

  const [commandKey, setCommandKey] = useState('');

  const commands = {
    'get-processes': 'Get Processes',
    'get-services': 'Get Services',
    'get-system-info': 'Get System Info',
    'reboot-computer': 'Reboot Computer',
  };

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex justify-center items-center z-[9999]">
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-lg w-full dark:bg-boxdark">
        <h2 className="text-xl font-semibold mb-4">Sending Commands</h2>
        <div className="mb-4 flex">
          <label className="font-semibold text-gray-700 flex-2 dark:text-gray-300">Computer Name:</label>
          <div className="text-gray-900 flex-1 pl-2 dark:text-gray-100">{user.name}</div>
        </div>
        {/* ... other user details ... */}

        <div className="mb-4">
          <label className="font-semibold text-gray-700 flex-2 dark:text-gray-300">Command:</label>
          <br />
          <select
            value={commandKey}
            onChange={(e) => setCommandKey(e.target.value)}
            className="mt-1 block w-full p-2 border border-gray-300 bg-white rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-boxdark-2 dark:border-strokedark"
          >
            <option value="">Choose a command</option>
            {Object.entries(commands).map(([key, name]) => (
              <option key={key} value={key}>
                {name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex justify-end">
          <button
            onClick={() => handleProcess(user, commandKey)}
            disabled={!commandKey}
            className="mr-2 bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-700 transition disabled:bg-gray-400"
          >
            Send Command
          </button>
          <button
            className="bg-red-500 text-white py-2 px-4 rounded hover:bg-red-700 transition"
            onClick={() => setIsOpen(false)}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default TransferModal;