import React from 'react';
import { Agent } from '../../types';

interface ClientsTableProps {
  clients: Agent[];
  onSelectClient?: (client: Agent) => void;
}

const ClientsTable: React.FC<ClientsTableProps> = ({ clients, onSelectClient }) => {
  return (
    <div className="border border-stroke dark:border-strokedark rounded-lg overflow-hidden">
      <table className="min-w-full divide-y divide-stroke dark:divide-strokedark text-sm">
        <thead className="bg-gray-50 dark:bg-gray-800 text-bodydark2 uppercase text-xs">
          <tr>
            <th className="px-4 py-3 text-left">Client</th>
            <th className="px-4 py-3 text-left">Platform</th>
            <th className="px-4 py-3 text-left">Status</th>
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-boxdark divide-y divide-stroke dark:divide-strokedark">
          {clients.map((client) => (
            <tr
              key={client.id}
              className={onSelectClient ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800' : ''}
              onClick={() => onSelectClient?.(client)}
            >
              <td className="px-4 py-3 text-black dark:text-white">{client.computerName}</td>
              <td className="px-4 py-3 text-bodydark2">{client.platform}</td>
              <td className="px-4 py-3 text-bodydark2">{client.status}</td>
            </tr>
          ))}
          {clients.length === 0 && (
            <tr>
              <td colSpan={3} className="px-4 py-6 text-center text-bodydark2">
                No clients connected.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default ClientsTable;
