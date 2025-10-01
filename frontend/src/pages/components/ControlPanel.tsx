import React from 'react';

const ControlPanel = ({ client }) => {
  if (!client) {
    return (
      <div className="bg-gray-800 text-white p-4 rounded-lg">
        <h2 className="text-xl font-bold mb-4">Control Panel</h2>
        <p>Select a client to enable controls.</p>
      </div>
    );
  }

  const handleCommand = (command) => {
    console.log(`Executing command ${command} on client ${client.id}`);
    // Implement actual command execution here
  };

  return (
    <div className="bg-gray-800 text-white p-4 rounded-lg">
      <h2 className="text-xl font-bold mb-4">Control Panel for {client.name}</h2>
      <div className="flex flex-col space-y-2">
        <button
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          onClick={() => handleCommand('screenshot')}
        >
          Take Screenshot
        </button>
        <button
          className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
          onClick={() => handleCommand('keylog')}
        >
          Start Keylogger
        </button>
        <button
          className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
          onClick={() => handleCommand('terminate')}
        >
          Terminate Agent
        </button>
      </div>
    </div>
  );
};

export default ControlPanel;