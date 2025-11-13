import { useState, useEffect } from 'react';
import { ThemeProvider } from './contexts/ThemeContext';
import { NotificationProvider } from './contexts/NotificationContext';
import ThemeLoginPage from './components/ThemeLoginPage';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  const tabs = [
    { id: 'overview', label: '📊 Overview', icon: '📊' },
    { id: 'clients', label: '👥 Clients', icon: '👥' },
    { id: 'terminal', label: '💻 Terminal', icon: '💻' },
    { id: 'tasks', label: '📋 Tasks', icon: '📋' },
    { id: 'settings', label: '⚙️ Settings', icon: '⚙️' },
    { id: 'logs', label: '📝 Logs', icon: '📝' }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div style={{ padding: '20px' }}>
            <h2 style={{ marginBottom: '20px', color: '#333' }}>📊 Dashboard Overview</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '30px' }}>
              <div style={{ padding: '20px', backgroundColor: '#f0f9ff', borderRadius: '10px', border: '1px solid #0ea5e9' }}>
                <h3 style={{ color: '#0c4a6e', marginBottom: '10px' }}>Total Clients</h3>
                <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#0c4a6e' }}>0</p>
              </div>
              <div style={{ padding: '20px', backgroundColor: '#f0fdf4', borderRadius: '10px', border: '1px solid #22c55e' }}>
                <h3 style={{ color: '#166534', marginBottom: '10px' }}>Online Clients</h3>
                <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#166534' }}>0</p>
              </div>
              <div style={{ padding: '20px', backgroundColor: '#fefce8', borderRadius: '10px', border: '1px solid #eab308' }}>
                <h3 style={{ color: '#a16207', marginBottom: '10px' }}>Pending Tasks</h3>
                <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#a16207' }}>0</p>
              </div>
              <div style={{ padding: '20px', backgroundColor: '#fdf2f8', borderRadius: '10px', border: '1px solid #ec4899' }}>
                <h3 style={{ color: '#be185d', marginBottom: '10px' }}>Success Rate</h3>
                <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#be185d' }}>100%</p>
              </div>
            </div>
            <div style={{ padding: '20px', backgroundColor: 'white', borderRadius: '10px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
              <h3 style={{ marginBottom: '15px', color: '#333' }}>Recent Activity</h3>
              <p style={{ color: '#666' }}>No recent activity to display.</p>
            </div>
          </div>
        );
      case 'clients':
        return (
          <div style={{ padding: '20px' }}>
            <h2 style={{ marginBottom: '20px', color: '#333' }}>👥 Client Management</h2>
            <div style={{ padding: '20px', backgroundColor: 'white', borderRadius: '10px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ color: '#333' }}>Connected Clients</h3>
                <button style={{ padding: '8px 16px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
                  Refresh
                </button>
              </div>
              <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                <p>No clients currently connected.</p>
                <p style={{ fontSize: '14px', marginTop: '10px' }}>Clients will appear here when they connect to the C2 server.</p>
              </div>
            </div>
          </div>
        );
      case 'terminal':
        return (
          <div style={{ padding: '20px' }}>
            <h2 style={{ marginBottom: '20px', color: '#333' }}>💻 AI Terminal</h2>
            <div style={{ padding: '20px', backgroundColor: '#1a1a1a', borderRadius: '10px', color: '#00ff00', fontFamily: 'monospace' }}>
              <div style={{ marginBottom: '15px' }}>
                <span style={{ color: '#00ff00' }}>root@c2-panel:~$</span>
                <span style={{ marginLeft: '10px' }}>Welcome to LoopJS C2 Terminal</span>
              </div>
              <div style={{ marginBottom: '15px' }}>
                <span style={{ color: '#00ff00' }}>root@c2-panel:~$</span>
                <span style={{ marginLeft: '10px' }}>Type commands to interact with connected clients</span>
              </div>
              <div style={{ marginBottom: '15px' }}>
                <span style={{ color: '#00ff00' }}>root@c2-panel:~$</span>
                <span style={{ marginLeft: '10px' }}>Available commands: help, list, status, execute</span>
              </div>
              <div>
                <span style={{ color: '#00ff00' }}>root@c2-panel:~$</span>
                <input 
                  type="text" 
                  style={{ 
                    marginLeft: '10px', 
                    backgroundColor: 'transparent', 
                    border: 'none', 
                    color: '#00ff00', 
                    fontFamily: 'monospace',
                    outline: 'none',
                    width: '300px'
                  }}
                  placeholder="Enter command..."
                />
              </div>
            </div>
          </div>
        );
      case 'tasks':
        return (
          <div style={{ padding: '20px' }}>
            <h2 style={{ marginBottom: '20px', color: '#333' }}>📋 Task Management</h2>
            <div style={{ padding: '20px', backgroundColor: 'white', borderRadius: '10px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ color: '#333' }}>Scheduled Tasks</h3>
                <button style={{ padding: '8px 16px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
                  Create Task
                </button>
              </div>
              <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                <p>No tasks scheduled.</p>
                <p style={{ fontSize: '14px', marginTop: '10px' }}>Create tasks to automate client operations.</p>
              </div>
            </div>
          </div>
        );
      case 'settings':
        return (
          <div style={{ padding: '20px' }}>
            <h2 style={{ marginBottom: '20px', color: '#333' }}>⚙️ Settings</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
              <div style={{ padding: '20px', backgroundColor: 'white', borderRadius: '10px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                <h3 style={{ marginBottom: '15px', color: '#333' }}>Panel Settings</h3>
                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Panel Name</label>
                  <input type="text" defaultValue="C2 Panel" style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '5px' }} />
                </div>
                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Theme</label>
                  <select style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '5px' }}>
                    <option value="dark">Dark</option>
                    <option value="light">Light</option>
                    <option value="hacker">Hacker</option>
                    <option value="cyberpunk">Cyberpunk</option>
                  </select>
                </div>
                <button style={{ padding: '10px 20px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
                  Save Settings
                </button>
              </div>
              <div style={{ padding: '20px', backgroundColor: 'white', borderRadius: '10px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                <h3 style={{ marginBottom: '15px', color: '#333' }}>Security Settings</h3>
                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                    <input type="checkbox" style={{ marginRight: '10px' }} />
                    Enable Two-Factor Authentication
                  </label>
                </div>
                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                    <input type="checkbox" style={{ marginRight: '10px' }} />
                    Require Strong Passwords
                  </label>
                </div>
                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                    <input type="checkbox" style={{ marginRight: '10px' }} />
                    Enable Session Timeout
                  </label>
                </div>
              </div>
            </div>
          </div>
        );
      case 'logs':
        return (
          <div style={{ padding: '20px' }}>
            <h2 style={{ marginBottom: '20px', color: '#333' }}>📝 System Logs</h2>
            <div style={{ padding: '20px', backgroundColor: '#1a1a1a', borderRadius: '10px', color: '#ffffff', fontFamily: 'monospace', maxHeight: '400px', overflowY: 'auto' }}>
              <div style={{ marginBottom: '10px', color: '#00ff00' }}>[2024-01-15 12:00:00] INFO: C2 Panel initialized</div>
              <div style={{ marginBottom: '10px', color: '#ffffff' }}>[2024-01-15 12:00:01] INFO: WebSocket server started on port 8080</div>
              <div style={{ marginBottom: '10px', color: '#ffffff' }}>[2024-01-15 12:00:02] INFO: Database connection established</div>
              <div style={{ marginBottom: '10px', color: '#ffff00' }}>[2024-01-15 12:00:03] WARN: No clients connected</div>
              <div style={{ marginBottom: '10px', color: '#ffffff' }}>[2024-01-15 12:00:04] INFO: Authentication system ready</div>
              <div style={{ marginBottom: '10px', color: '#00ff00' }}>[2024-01-15 12:00:05] INFO: All systems operational</div>
            </div>
          </div>
        );
      default:
        return <div>Section not found</div>;
    }
  };

  return (
    <ThemeProvider>
      <NotificationProvider>
        {!isAuthenticated ? (
          <ThemeLoginPage onLogin={() => setIsAuthenticated(true)} />
        ) : (
          <div style={{ minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
            {/* Header */}
            <div style={{ 
              backgroundColor: 'white', 
              padding: '20px', 
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              marginBottom: '20px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h1 style={{ color: '#333', margin: '0', fontSize: '24px' }}>
                    🎯 C2 Command & Control Panel
                  </h1>
                  <p style={{ color: '#666', margin: '5px 0 0 0' }}>LoopJS C2 Management System</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <div style={{ width: '8px', height: '8px', backgroundColor: '#22c55e', borderRadius: '50%' }}></div>
                    <span style={{ color: '#666', fontSize: '14px' }}>OPERATIONAL</span>
                  </div>
                  <button 
                    onClick={() => setIsAuthenticated(false)}
                    style={{ 
                      padding: '8px 16px', 
                      backgroundColor: '#ef4444', 
                      color: 'white', 
                      border: 'none', 
                      borderRadius: '5px',
                      cursor: 'pointer',
                      fontWeight: 'bold'
                    }}
                  >
                    Logout
                  </button>
                </div>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div style={{ 
              backgroundColor: 'white', 
              padding: '0 20px', 
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              marginBottom: '20px'
            }}>
              <div style={{ display: 'flex', gap: '0' }}>
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    style={{
                      padding: '15px 20px',
                      border: 'none',
                      backgroundColor: activeTab === tab.id ? '#3b82f6' : 'transparent',
                      color: activeTab === tab.id ? 'white' : '#666',
                      cursor: 'pointer',
                      fontWeight: 'bold',
                      borderBottom: activeTab === tab.id ? '3px solid #1d4ed8' : '3px solid transparent',
                      transition: 'all 0.2s'
                    }}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Main Content */}
            <div style={{ padding: '0 20px 20px 20px' }}>
              {renderTabContent()}
            </div>
          </div>
        )}
      </NotificationProvider>
    </ThemeProvider>
  );
}
