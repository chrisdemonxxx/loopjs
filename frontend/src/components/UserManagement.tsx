import React, { useState } from 'react';
import { 
  FiUsers, 
  FiPlus, 
  FiEdit, 
  FiTrash2, 
  FiSearch, 
  FiFilter,
  FiMoreVertical,
  FiShield,
  FiMail,
  FiCalendar,
  FiCheck,
  FiX
} from 'react-icons/fi';
import { Agent } from '../types';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  status: 'active' | 'inactive' | 'pending';
  lastLogin: string;
  createdAt: string;
  avatar?: string;
}

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<Agent[]>([
    {
      id: '1',
      name: 'John Administrator',
      email: 'admin@loopjs.com',
      role: 'Administrator',
      status: 'active',
      lastLogin: '2024-01-15 14:30:25',
      createdAt: '2024-01-01 10:00:00'
    },
    {
      id: '2',
      name: 'Sarah Operator',
      email: 'sarah@loopjs.com',
      role: 'Operator',
      status: 'active',
      lastLogin: '2024-01-15 13:45:12',
      createdAt: '2024-01-05 09:30:00'
    },
    {
      id: '3',
      name: 'Mike Viewer',
      email: 'mike@loopjs.com',
      role: 'Viewer',
      status: 'inactive',
      lastLogin: '2024-01-14 16:20:45',
      createdAt: '2024-01-10 14:15:00'
    },
    {
      id: '4',
      name: 'Lisa Manager',
      email: 'lisa@loopjs.com',
      role: 'Manager',
      status: 'pending',
      lastLogin: 'Never',
      createdAt: '2024-01-15 11:00:00'
    }
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const roles = ['Administrator', 'Manager', 'Operator', 'Viewer'];
  const statuses = ['active', 'inactive', 'pending'];

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    const matchesStatus = filterStatus === 'all' || user.status === filterStatus;
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-success text-white';
      case 'inactive': return 'bg-bodydark2 text-white';
      case 'pending': return 'bg-warning text-white';
      default: return 'bg-bodydark2 text-white';
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'Administrator': return 'bg-danger text-white';
      case 'Manager': return 'bg-primary text-white';
      case 'Operator': return 'bg-warning text-white';
      case 'Viewer': return 'bg-success text-white';
      default: return 'bg-bodydark2 text-white';
    }
  };

  const handleDeleteUser = (userId: string) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      setUsers(users.filter(user => user.id !== userId));
    }
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setShowAddModal(true);
  };

  const handleSaveUser = (userData: Partial<User>) => {
    if (editingUser) {
      // Update existing user
      setUsers(users.map(user => 
        user.id === editingUser.id 
          ? { ...user, ...userData }
          : user
      ));
    } else {
      // Add new user
      const newUser: User = {
        id: Date.now().toString(),
        name: userData.name || '',
        email: userData.email || '',
        role: userData.role || 'Viewer',
        status: 'pending',
        lastLogin: 'Never',
        createdAt: new Date().toISOString().replace('T', ' ').substring(0, 19)
      };
      setUsers([...users, newUser]);
    }
    
    setShowAddModal(false);
    setEditingUser(null);
  };

  const UserModal: React.FC = () => {
    const [formData, setFormData] = useState({
      name: editingUser?.name || '',
      email: editingUser?.email || '',
      role: editingUser?.role || 'Viewer',
      status: editingUser?.status || 'pending'
    });

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      handleSaveUser(formData);
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-boxdark rounded-lg shadow-xl w-full max-w-md mx-4">
          <div className="p-6">
            <h3 className="text-lg font-semibold text-black dark:text-white mb-4">
              {editingUser ? 'Edit User' : 'Add New User'}
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-black dark:text-white mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-3 py-2 border border-stroke dark:border-strokedark rounded-lg bg-white dark:bg-form-input text-black dark:text-white focus:border-primary focus:outline-none"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-black dark:text-white mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full px-3 py-2 border border-stroke dark:border-strokedark rounded-lg bg-white dark:bg-form-input text-black dark:text-white focus:border-primary focus:outline-none"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-black dark:text-white mb-2">
                  Role
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({...formData, role: e.target.value})}
                  className="w-full px-3 py-2 border border-stroke dark:border-strokedark rounded-lg bg-white dark:bg-form-input text-black dark:text-white focus:border-primary focus:outline-none"
                >
                  {roles.map(role => (
                    <option key={role} value={role}>{role}</option>
                  ))}
                </select>
              </div>
              
              {editingUser && (
                <div>
                  <label className="block text-sm font-medium text-black dark:text-white mb-2">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value as any})}
                    className="w-full px-3 py-2 border border-stroke dark:border-strokedark rounded-lg bg-white dark:bg-form-input text-black dark:text-white focus:border-primary focus:outline-none"
                  >
                    {statuses.map(status => (
                      <option key={status} value={status}>
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingUser(null);
                  }}
                  className="px-4 py-2 border border-stroke dark:border-strokedark rounded-lg hover:bg-gray-2 dark:hover:bg-meta-4 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                >
                  {editingUser ? 'Update' : 'Create'} User
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-boxdark rounded-lg shadow-sm border border-stroke dark:border-strokedark p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-black dark:text-white mb-2">User Management</h2>
            <p className="text-bodydark2">Manage system users, roles, and permissions</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
          >
            <FiPlus className="w-4 h-4" />
            <span>Add User</span>
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0 md:space-x-4">
          <div className="flex-1 relative">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-bodydark2 w-4 h-4" />
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-stroke dark:border-strokedark rounded-lg bg-white dark:bg-form-input text-black dark:text-white focus:border-primary focus:outline-none"
            />
          </div>
          
          <div className="flex space-x-3">
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="px-3 py-2 border border-stroke dark:border-strokedark rounded-lg bg-white dark:bg-form-input text-black dark:text-white focus:border-primary focus:outline-none"
            >
              <option value="all">All Roles</option>
              {roles.map(role => (
                <option key={role} value={role}>{role}</option>
              ))}
            </select>
            
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-stroke dark:border-strokedark rounded-lg bg-white dark:bg-form-input text-black dark:text-white focus:border-primary focus:outline-none"
            >
              <option value="all">All Status</option>
              {statuses.map(status => (
                <option key={status} value={status}>
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white dark:bg-boxdark rounded-lg shadow-sm border border-stroke dark:border-strokedark overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-2 dark:bg-meta-4">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-medium text-black dark:text-white">User</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-black dark:text-white">Role</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-black dark:text-white">Status</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-black dark:text-white">Last Login</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-black dark:text-white">Created</th>
                <th className="px-6 py-4 text-right text-sm font-medium text-black dark:text-white">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stroke dark:divide-strokedark">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-2 dark:hover:bg-meta-4 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                        <span className="text-white font-medium">
                          {user.name.split(' ').map(n => n[0]).join('')}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-black dark:text-white">{user.name}</p>
                        <p className="text-xs text-bodydark2">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}>
                      <FiShield className="w-3 h-3 mr-1" />
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(user.status)}`}>
                      {user.status === 'active' && <FiCheck className="w-3 h-3 mr-1" />}
                      {user.status === 'inactive' && <FiX className="w-3 h-3 mr-1" />}
                      {user.status === 'pending' && <FiCalendar className="w-3 h-3 mr-1" />}
                      {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-black dark:text-white">{user.lastLogin}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-black dark:text-white">{user.createdAt}</p>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => handleEditUser(user)}
                        className="p-2 text-bodydark2 hover:text-primary hover:bg-gray-2 dark:hover:bg-meta-4 rounded-lg transition-colors"
                        title="Edit user"
                      >
                        <FiEdit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteUser(user.id)}
                        className="p-2 text-bodydark2 hover:text-danger hover:bg-gray-2 dark:hover:bg-meta-4 rounded-lg transition-colors"
                        title="Delete user"
                      >
                        <FiTrash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredUsers.length === 0 && (
          <div className="text-center py-12">
            <FiUsers className="w-12 h-12 text-bodydark2 mx-auto mb-4" />
            <p className="text-bodydark2">No users found matching your criteria</p>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-boxdark rounded-lg shadow-sm border border-stroke dark:border-strokedark p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-bodydark2">Total Users</p>
              <p className="text-2xl font-bold text-black dark:text-white">{users.length}</p>
            </div>
            <FiUsers className="w-8 h-8 text-primary" />
          </div>
        </div>
        
        <div className="bg-white dark:bg-boxdark rounded-lg shadow-sm border border-stroke dark:border-strokedark p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-bodydark2">Active Users</p>
              <p className="text-2xl font-bold text-black dark:text-white">
                {users.filter(u => u.status === 'active').length}
              </p>
            </div>
            <FiCheck className="w-8 h-8 text-success" />
          </div>
        </div>
        
        <div className="bg-white dark:bg-boxdark rounded-lg shadow-sm border border-stroke dark:border-strokedark p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-bodydark2">Pending Users</p>
              <p className="text-2xl font-bold text-black dark:text-white">
                {users.filter(u => u.status === 'pending').length}
              </p>
            </div>
            <FiCalendar className="w-8 h-8 text-warning" />
          </div>
        </div>
        
        <div className="bg-white dark:bg-boxdark rounded-lg shadow-sm border border-stroke dark:border-strokedark p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-bodydark2">Administrators</p>
              <p className="text-2xl font-bold text-black dark:text-white">
                {users.filter(u => u.role === 'Administrator').length}
              </p>
            </div>
            <FiShield className="w-8 h-8 text-danger" />
          </div>
        </div>
      </div>

      {/* Modal */}
      {showAddModal && <UserModal />}
    </div>
  );
};

export default UserManagement;