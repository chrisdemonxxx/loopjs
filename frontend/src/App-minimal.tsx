import { useState } from 'react';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  return (
    <div style={{ 
      minHeight: '100vh', 
      padding: '20px', 
      fontFamily: 'Arial, sans-serif',
      backgroundColor: '#f5f5f5'
    }}>
      {!isAuthenticated ? (
        <div style={{ 
          maxWidth: '400px', 
          margin: '0 auto', 
          padding: '40px', 
          backgroundColor: 'white',
          borderRadius: '10px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
        }}>
          <h1 style={{ textAlign: 'center', marginBottom: '30px', color: '#333' }}>
            🎯 C2 Command & Control Panel
          </h1>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Username
            </label>
            <input 
              type="text" 
              style={{ 
                width: '100%', 
                padding: '10px', 
                border: '1px solid #ddd', 
                borderRadius: '5px',
                fontSize: '16px'
              }}
              placeholder="Enter username"
            />
          </div>
          <div style={{ marginBottom: '30px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Password
            </label>
            <input 
              type="password" 
              style={{ 
                width: '100%', 
                padding: '10px', 
                border: '1px solid #ddd', 
                borderRadius: '5px',
                fontSize: '16px'
              }}
              placeholder="Enter password"
            />
          </div>
          <button 
            onClick={() => setIsAuthenticated(true)}
            style={{ 
              width: '100%',
              padding: '12px', 
              backgroundColor: '#3b82f6', 
              color: 'white', 
              border: 'none', 
              borderRadius: '5px',
              fontSize: '16px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            Access System
          </button>
        </div>
      ) : (
        <div>
          <div style={{ 
            backgroundColor: 'white',
            padding: '20px',
            borderRadius: '10px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            marginBottom: '20px'
          }}>
            <h1 style={{ color: '#333', marginBottom: '10px' }}>
              🎯 C2 Command & Control Panel
            </h1>
            <p style={{ color: '#666', marginBottom: '20px' }}>
              Welcome to the LoopJS C2 Panel! Authentication successful.
            </p>
            <button 
              onClick={() => setIsAuthenticated(false)}
              style={{ 
                padding: '10px 20px', 
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
          
          <div style={{ 
            backgroundColor: 'white',
            padding: '20px',
            borderRadius: '10px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
          }}>
            <h2 style={{ color: '#333', marginBottom: '15px' }}>System Status</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
              <div style={{ padding: '15px', backgroundColor: '#f0f9ff', borderRadius: '8px', border: '1px solid #0ea5e9' }}>
                <h3 style={{ color: '#0c4a6e', marginBottom: '5px' }}>Total Clients</h3>
                <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#0c4a6e' }}>0</p>
              </div>
              <div style={{ padding: '15px', backgroundColor: '#f0fdf4', borderRadius: '8px', border: '1px solid #22c55e' }}>
                <h3 style={{ color: '#166534', marginBottom: '5px' }}>Online Clients</h3>
                <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#166534' }}>0</p>
              </div>
              <div style={{ padding: '15px', backgroundColor: '#fefce8', borderRadius: '8px', border: '1px solid #eab308' }}>
                <h3 style={{ color: '#a16207', marginBottom: '5px' }}>Pending Tasks</h3>
                <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#a16207' }}>0</p>
              </div>
              <div style={{ padding: '15px', backgroundColor: '#fdf2f8', borderRadius: '8px', border: '1px solid #ec4899' }}>
                <h3 style={{ color: '#be185d', marginBottom: '5px' }}>Success Rate</h3>
                <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#be185d' }}>100%</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
