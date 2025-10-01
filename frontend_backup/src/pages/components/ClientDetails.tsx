import React from 'react';

const ClientDetails = ({ client }) => {
  if (!client) {
    return (
      <div className="bg-gray-800 text-white p-4 rounded-lg mb-4">
        <h2 className="text-xl font-bold mb-4">Client Details</h2>
        <p>Select a client to view details.</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 text-white p-4 rounded-lg mb-4">
      <h2 className="text-xl font-bold mb-4">Client Details</h2>
      <p><strong>Name:</strong> {client.name}</p>
      <p><strong>IP Address:</strong> {client.ip}</p>
      <p><strong>OS:</strong> {client.os}</p>
      <p><strong>Status:</strong> {client.status}</p>
      {/* Add more client details here */}
    </div>
  );
};

export default ClientDetails;