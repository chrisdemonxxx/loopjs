import React, { useState, useEffect } from 'react';
import { 
  FiSearch, 
  FiFilter, 
  FiDownload, 
  FiRefreshCw,
  FiUser,
  FiSettings,
  FiShield,
  FiActivity,
  FiAlertTriangle,
  FiCheckCircle,
  FiClock,
    FiEye,
    FiChevronDown
} from 'react-icons/fi';

interface AuditLog {
  id: string;
  timestamp: Date;
  user: string;
  action: string;
  resource: string;
  details: string;
  ipAddress: string;
  userAgent: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: 'authentication' | 'user_management' | 'system' | 'security' | 'data';
  status: 'success' | 'failure' | 'warning';
}

const AuditLogs: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<AuditLog[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [dateRange, setDateRange] = useState<string>('7d');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [logsPerPage] = useState(20);

  // Load audit logs from API
  useEffect(() => {
    const loadAuditLogs = async () => {
      try {
        // TODO: Replace with actual API call
        // const response = await fetch('/api/audit-logs');
        // const data = await response.json();
        // setLogs(data);
        
        // For now, initialize with empty array
        setLogs([]);
      } catch (error) {
        console.error('Failed to load audit logs:', error);
        setLogs([]);
      }
    };

    loadAuditLogs();
  }, []);

  // Filter logs based on search and filters
  useEffect(() => {
    let filtered = logs;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(log => 
        log.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.resource.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.ipAddress.includes(searchTerm)
      );
    }

    // Category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(log => log.category === selectedCategory);
    }

    // Severity filter
    if (selectedSeverity !== 'all') {
      filtered = filtered.filter(log => log.severity === selectedSeverity);
    }

    // Status filter
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(log => log.status === selectedStatus);
    }

    // Date range filter
    const now = new Date();
    const dateThreshold = new Date();
    switch (dateRange) {
      case '1d':
        dateThreshold.setDate(now.getDate() - 1);
        break;
      case '7d':
        dateThreshold.setDate(now.getDate() - 7);
        break;
      case '30d':
        dateThreshold.setDate(now.getDate() - 30);
        break;
      case '90d':
        dateThreshold.setDate(now.getDate() - 90);
        break;
      default:
        dateThreshold.setFullYear(2000); // Show all
    }
    
    if (dateRange !== 'all') {
      filtered = filtered.filter(log => log.timestamp >= dateThreshold);
    }

    setFilteredLogs(filtered);
    setCurrentPage(1);
  }, [logs, searchTerm, selectedCategory, selectedSeverity, selectedStatus, dateRange]);

  const getSeverityColor = (severity: AuditLog['severity']) => {
    switch (severity) {
      case 'critical': return 'text-danger bg-danger/10';
      case 'high': return 'text-warning bg-warning/10';
      case 'medium': return 'text-primary bg-primary/10';
      case 'low': return 'text-success bg-success/10';
      default: return 'text-bodydark2 bg-gray-100 dark:bg-meta-4';
    }
  };

  const getStatusColor = (status: AuditLog['status']) => {
    switch (status) {
      case 'success': return 'text-success';
      case 'failure': return 'text-danger';
      case 'warning': return 'text-warning';
      default: return 'text-bodydark2';
    }
  };

  const getStatusIcon = (status: AuditLog['status']) => {
    switch (status) {
      case 'success': return <FiCheckCircle className="w-4 h-4" />;
      case 'failure': return <FiAlertTriangle className="w-4 h-4" />;
      case 'warning': return <FiAlertTriangle className="w-4 h-4" />;
      default: return <FiActivity className="w-4 h-4" />;
    }
  };

  const getCategoryIcon = (category: AuditLog['category']) => {
    switch (category) {
      case 'authentication': return <FiShield className="w-4 h-4" />;
      case 'user_management': return <FiUser className="w-4 h-4" />;
      case 'system': return <FiSettings className="w-4 h-4" />;
      case 'security': return <FiShield className="w-4 h-4" />;
      case 'data': return <FiActivity className="w-4 h-4" />;
      default: return <FiActivity className="w-4 h-4" />;
    }
  };

  const exportLogs = () => {
    const csvContent = [
      ['Timestamp', 'User', 'Action', 'Resource', 'Status', 'Severity', 'Category', 'IP Address', 'Details'],
      ...filteredLogs.map(log => [
        log.timestamp.toISOString(),
        log.user,
        log.action,
        log.resource,
        log.status,
        log.severity,
        log.category,
        log.ipAddress,
        log.details
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Pagination
  const indexOfLastLog = currentPage * logsPerPage;
  const indexOfFirstLog = indexOfLastLog - logsPerPage;
  const currentLogs = filteredLogs.slice(indexOfFirstLog, indexOfLastLog);
  const totalPages = Math.ceil(filteredLogs.length / logsPerPage);

  const LogDetailModal: React.FC<{ log: AuditLog; onClose: () => void }> = ({ log, onClose }) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-boxdark rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-stroke dark:border-strokedark">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-black dark:text-white">Audit Log Details</h3>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-2 dark:hover:bg-meta-4 rounded-lg transition-colors"
            >
              <span className="text-xl text-bodydark2">×</span>
            </button>
          </div>
        </div>
        
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-bodydark2">Timestamp</label>
              <p className="text-black dark:text-white">{log.timestamp.toLocaleString()}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-bodydark2">User</label>
              <p className="text-black dark:text-white">{log.user}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-bodydark2">Action</label>
              <p className="text-black dark:text-white">{log.action}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-bodydark2">Resource</label>
              <p className="text-black dark:text-white">{log.resource}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-bodydark2">Status</label>
              <div className="flex items-center space-x-2">
                <span className={getStatusColor(log.status)}>
                  {getStatusIcon(log.status)}
                </span>
                <span className="text-black dark:text-white capitalize">{log.status}</span>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-bodydark2">Severity</label>
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(log.severity)}`}>
                {log.severity.toUpperCase()}
              </span>
            </div>
            <div>
              <label className="text-sm font-medium text-bodydark2">Category</label>
              <div className="flex items-center space-x-2">
                {getCategoryIcon(log.category)}
                <span className="text-black dark:text-white capitalize">{log.category.replace('_', ' ')}</span>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-bodydark2">IP Address</label>
              <p className="text-black dark:text-white">{log.ipAddress}</p>
            </div>
          </div>
          
          <div>
            <label className="text-sm font-medium text-bodydark2">Details</label>
            <p className="text-black dark:text-white mt-1">{log.details}</p>
          </div>
          
          <div>
            <label className="text-sm font-medium text-bodydark2">User Agent</label>
            <p className="text-black dark:text-white mt-1 text-sm break-all">{log.userAgent}</p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-boxdark rounded-lg shadow-sm border border-stroke dark:border-strokedark p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <div>
            <h2 className="text-2xl font-bold text-black dark:text-white mb-2">Audit Logs</h2>
            <p className="text-bodydark2">Track and monitor all system activities and user actions</p>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center space-x-2 px-4 py-2 border border-stroke dark:border-strokedark rounded-lg hover:bg-gray-2 dark:hover:bg-meta-4 transition-colors"
            >
              <FiFilter className="w-4 h-4" />
              <span>Filters</span>
              <FiChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </button>
            
            <button
              onClick={exportLogs}
              className="flex items-center space-x-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
            >
              <FiDownload className="w-4 h-4" />
              <span>Export</span>
            </button>
            
            <button
              onClick={() => window.location.reload()}
              className="p-2 border border-stroke dark:border-strokedark rounded-lg hover:bg-gray-2 dark:hover:bg-meta-4 transition-colors"
            >
              <FiRefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="bg-white dark:bg-boxdark rounded-lg shadow-sm border border-stroke dark:border-strokedark p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-black dark:text-white mb-2">Search</label>
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-bodydark2 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search logs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-stroke dark:border-strokedark rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/25 bg-transparent text-black dark:text-white"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-black dark:text-white mb-2">Category</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 border border-stroke dark:border-strokedark rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/25 bg-white dark:bg-boxdark text-black dark:text-white"
              >
                <option value="all">All Categories</option>
                <option value="authentication">Authentication</option>
                <option value="user_management">User Management</option>
                <option value="system">System</option>
                <option value="security">Security</option>
                <option value="data">Data</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-black dark:text-white mb-2">Severity</label>
              <select
                value={selectedSeverity}
                onChange={(e) => setSelectedSeverity(e.target.value)}
                className="w-full px-3 py-2 border border-stroke dark:border-strokedark rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/25 bg-white dark:bg-boxdark text-black dark:text-white"
              >
                <option value="all">All Severities</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-black dark:text-white mb-2">Status</label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full px-3 py-2 border border-stroke dark:border-strokedark rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/25 bg-white dark:bg-boxdark text-black dark:text-white"
              >
                <option value="all">All Statuses</option>
                <option value="success">Success</option>
                <option value="failure">Failure</option>
                <option value="warning">Warning</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-black dark:text-white mb-2">Date Range</label>
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="w-full px-3 py-2 border border-stroke dark:border-strokedark rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/25 bg-white dark:bg-boxdark text-black dark:text-white"
              >
                <option value="1d">Last 24 Hours</option>
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
                <option value="90d">Last 90 Days</option>
                <option value="all">All Time</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-boxdark rounded-lg shadow-sm border border-stroke dark:border-strokedark p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-black dark:text-white">{filteredLogs.length}</p>
              <p className="text-sm text-bodydark2">Total Logs</p>
            </div>
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
              <FiActivity className="w-6 h-6 text-primary" />
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-boxdark rounded-lg shadow-sm border border-stroke dark:border-strokedark p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-success">
                {filteredLogs.filter(log => log.status === 'success').length}
              </p>
              <p className="text-sm text-bodydark2">Successful</p>
            </div>
            <div className="w-12 h-12 bg-success/10 rounded-lg flex items-center justify-center">
              <FiCheckCircle className="w-6 h-6 text-success" />
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-boxdark rounded-lg shadow-sm border border-stroke dark:border-strokedark p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-danger">
                {filteredLogs.filter(log => log.status === 'failure').length}
              </p>
              <p className="text-sm text-bodydark2">Failed</p>
            </div>
            <div className="w-12 h-12 bg-danger/10 rounded-lg flex items-center justify-center">
              <FiAlertTriangle className="w-6 h-6 text-danger" />
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-boxdark rounded-lg shadow-sm border border-stroke dark:border-strokedark p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-warning">
                {filteredLogs.filter(log => log.severity === 'critical' || log.severity === 'high').length}
              </p>
              <p className="text-sm text-bodydark2">High Priority</p>
            </div>
            <div className="w-12 h-12 bg-warning/10 rounded-lg flex items-center justify-center">
              <FiShield className="w-6 h-6 text-warning" />
            </div>
          </div>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white dark:bg-boxdark rounded-lg shadow-sm border border-stroke dark:border-strokedark">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-2 dark:bg-meta-4">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-medium text-black dark:text-white">Timestamp</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-black dark:text-white">User</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-black dark:text-white">Action</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-black dark:text-white">Resource</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-black dark:text-white">Status</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-black dark:text-white">Severity</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-black dark:text-white">Category</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-black dark:text-white">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stroke dark:divide-strokedark">
              {currentLogs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-2 dark:hover:bg-meta-4 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <FiClock className="w-4 h-4 text-bodydark2" />
                      <div>
                        <p className="text-sm font-medium text-black dark:text-white">
                          {log.timestamp.toLocaleDateString()}
                        </p>
                        <p className="text-xs text-bodydark2">
                          {log.timestamp.toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <FiUser className="w-4 h-4 text-bodydark2" />
                      <span className="text-sm font-medium text-black dark:text-white">{log.user}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-black dark:text-white">{log.action}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-black dark:text-white">{log.resource}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <span className={getStatusColor(log.status)}>
                        {getStatusIcon(log.status)}
                      </span>
                      <span className="text-sm capitalize text-black dark:text-white">{log.status}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(log.severity)}`}>
                      {log.severity.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      {getCategoryIcon(log.category)}
                      <span className="text-sm capitalize text-black dark:text-white">
                        {log.category.replace('_', ' ')}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => setSelectedLog(log)}
                      className="p-2 hover:bg-gray-2 dark:hover:bg-meta-4 rounded-lg transition-colors"
                      title="View Details"
                    >
                      <FiEye className="w-4 h-4 text-bodydark2" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-stroke dark:border-strokedark">
            <div className="flex items-center justify-between">
              <div className="text-sm text-bodydark2">
                Showing {indexOfFirstLog + 1} to {Math.min(indexOfLastLog, filteredLogs.length)} of {filteredLogs.length} logs
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 border border-stroke dark:border-strokedark rounded-lg hover:bg-gray-2 dark:hover:bg-meta-4 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const pageNum = currentPage <= 3 ? i + 1 : currentPage - 2 + i;
                  if (pageNum > totalPages) return null;
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`px-3 py-1 rounded-lg transition-colors ${
                        currentPage === pageNum
                          ? 'bg-primary text-white'
                          : 'border border-stroke dark:border-strokedark hover:bg-gray-2 dark:hover:bg-meta-4'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 border border-stroke dark:border-strokedark rounded-lg hover:bg-gray-2 dark:hover:bg-meta-4 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
        
        {filteredLogs.length === 0 && (
          <div className="text-center py-12">
            <FiActivity className="w-12 h-12 text-bodydark2 mx-auto mb-4" />
            <p className="text-bodydark2">No audit logs found matching your criteria</p>
          </div>
        )}
      </div>

      {/* Log Detail Modal */}
      {selectedLog && (
        <LogDetailModal log={selectedLog} onClose={() => setSelectedLog(null)} />
      )}
    </div>
  );
};

export default AuditLogs;