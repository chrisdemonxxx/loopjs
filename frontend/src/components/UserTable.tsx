import React from 'react';
import { Agent } from '../types';

interface UserTableProps {
  users: Agent[];
  onViewUser?: (user: Agent) => void;
  onViewTasks?: (user: Agent) => void;
}

const UserTable: React.FC<UserTableProps> = ({ users, onViewUser, onViewTasks }) => {
  return (
    <div className="overflow-x-auto border border-stroke dark:border-strokedark rounded-lg">
      <table className="min-w-full divide-y divide-stroke dark:divide-strokedark">
        <thead className="bg-gray-50 dark:bg-gray-800 text-xs uppercase text-bodydark2">
          <tr>
            <th className="px-4 py-3 text-left">Computer Name</th>
            <th className="px-4 py-3 text-left">Platform</th>
            <th className="px-4 py-3 text-left">IP Address</th>
            <th className="px-4 py-3 text-left">Status</th>
            <th className="px-4 py-3 text-left">Last Seen</th>
            {(onViewUser || onViewTasks) && <th className="px-4 py-3 text-right">Actions</th>}
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-boxdark divide-y divide-stroke dark:divide-strokedark text-sm">
          {users.map((user) => (
            <tr key={user.id}>
              <td className="px-4 py-3">
                <div className="font-medium text-black dark:text-white">{user.computerName}</div>
                <div className="text-xs text-bodydark2">{user.id}</div>
              </td>
              <td className="px-4 py-3">
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-primary/10 text-primary">
                  {user.platform}
                </span>
              </td>
              <td className="px-4 py-3 text-bodydark2">{user.ipAddress}</td>
              <td className="px-4 py-3">
                <span
                  className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
                    user.status === 'online'
                      ? 'bg-success/10 text-success'
                      : 'bg-danger/10 text-danger'
                  }`}
                >
                  {user.status}
                </span>
              </td>
              <td className="px-4 py-3 text-bodydark2">
                {new Date(user.lastActiveTime ?? user.lastSeen ?? '').toLocaleString()}
              </td>
              {(onViewUser || onViewTasks) && (
                <td className="px-4 py-3 text-right space-x-2">
                  {onViewUser && (
                    <button
                      onClick={() => onViewUser(user)}
                      className="px-3 py-1 text-xs rounded bg-gray-200 dark:bg-gray-700 text-bodydark2 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                    >
                      Details
                    </button>
                  )}
                  {onViewTasks && (
                    <button
                      onClick={() => onViewTasks(user)}
                      className="px-3 py-1 text-xs rounded bg-primary text-white hover:bg-primary/90 transition-colors"
                    >
                      Tasks
                    </button>
                  )}
                </td>
              )}
            </tr>
          ))}
          {users.length === 0 && (
            <tr>
              <td colSpan={6} className="px-4 py-8 text-center text-bodydark2">
                No agents found. Start a client to see it listed here.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default UserTable;
