import React from 'react';
import { User } from '../types';

interface UserTableProps {
  users: User[];
  onActionClick: (user: User) => void;
  onTasksClick: (user: User) => void;
}

const UserTable: React.FC<UserTableProps> = ({ users, onActionClick, onTasksClick }) => {
  return (
    <div className="rounded-lg border border-stroke bg-white shadow-sm dark:border-strokedark dark:bg-boxdark animate-fade-in-up hover-lift">
      <div className="p-4 md:p-6">
        <h3 className="text-lg font-semibold text-black dark:text-white mb-4">Connected Clients</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full table-auto min-w-[800px]">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-800 text-left">
              <th className="min-w-[200px] py-3 px-4 font-medium text-black dark:text-white">Computer Name</th>
              <th className="min-w-[140px] py-3 px-4 font-medium text-black dark:text-white">IP Address</th>
              <th className="min-w-[100px] py-3 px-4 font-medium text-black dark:text-white">Country</th>
              <th className="min-w-[100px] py-3 px-4 font-medium text-black dark:text-white">Status</th>
              <th className="min-w-[140px] py-3 px-4 font-medium text-black dark:text-white">Last Active</th>
              <th className="min-w-[160px] py-3 px-4 font-medium text-black dark:text-white">System Details</th>
              <th className="w-[100px] py-3 px-4 font-medium text-black dark:text-white text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user, index) => (
              <tr key={user.uuid || user.id || index} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200 ease-in-out animate-fade-in-up" style={{animationDelay: `${index * 0.05}s`}}>
                <td className="border-b border-gray-200 dark:border-gray-700 py-4 px-4">
                  <p className="text-black dark:text-white text-sm font-medium">{user.computerName || 'Unknown'}</p>
                </td>
                <td className="border-b border-gray-200 dark:border-gray-700 py-4 px-4">
                  <p className="text-gray-600 dark:text-gray-300 text-sm">{user.ipAddress || 'Unknown'}</p>
                </td>
                <td className="border-b border-gray-200 dark:border-gray-700 py-4 px-4">
                  <p className="text-gray-600 dark:text-gray-300 text-sm">{user.country || 'Unknown'}</p>
                </td>
                <td className="border-b border-gray-200 dark:border-gray-700 py-4 px-4">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    user.status === 'online' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                      : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                  }`}>
                    {user.status || 'offline'}
                  </span>
                </td>
                <td className="border-b border-gray-200 dark:border-gray-700 py-4 px-4">
                  <p className="text-gray-600 dark:text-gray-300 text-sm">{user.lastActiveTime || 'Never'}</p>
                </td>
                <td className="border-b border-gray-200 dark:border-gray-700 py-4 px-4">
                  <p className="text-gray-600 dark:text-gray-300 text-sm truncate">{user.additionalSystemDetails || 'Unknown'}</p>
                </td>
                <td className="border-b border-gray-200 dark:border-gray-700 py-4 px-4">
                  <div className="flex items-center justify-center space-x-2">
                    <button 
                      className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium transition-all duration-200 ease-in-out hover-scale focus-ring" 
                      onClick={() => onActionClick('view', user)}
                    >
                      View
                    </button>
                    <button 
                      className="text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300 text-sm font-medium transition-all duration-200 ease-in-out hover-scale focus-ring" 
                      onClick={() => onTasksClick(user)}
                    >
                      Tasks
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UserTable;
