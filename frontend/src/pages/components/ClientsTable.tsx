import React from 'react';

const ClientsTable = ({ clients, onSelectClient }) => {
  return (
    <div className="bg-gray-800 text-white p-4 rounded-lg">
      <h2 className="text-xl font-bold mb-4">Clients</h2>
      <table className="w-full">
        <thead>
          <tr>
            <th className="text-left">Hostname</th>
            <th className="text-left">IP Address</th>
            <th className="text-left">OS</th>
            <th className="text-left">Status</th>
          </tr>
        </thead>
        <tbody>
          {clients.map((client) => (
            <tr key={client.id} onClick={() => onSelectClient(client)} className="cursor-pointer hover:bg-gray-700">
              <td>{client.name}</td>
              <td>{client.ip}</td>
              <td>{client.os}</td>
              <td>{client.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ClientsTable;