import { useState, useEffect } from 'react';
import { ThemeProvider } from './contexts/ThemeContext';
import { NotificationProvider } from './contexts/NotificationContext';
import ThemeLoginPage from './components/ThemeLoginPage';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  return (
    <ThemeProvider>
      <NotificationProvider>
        {!isAuthenticated ? (
          <ThemeLoginPage onLogin={() => setIsAuthenticated(true)} />
        ) : (
          <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
            <h1>🎯 C2 Command & Control Panel</h1>
            <p>Welcome to the LoopJS C2 Panel!</p>
            <p>Authentication successful. Dashboard loading...</p>
            <button 
              onClick={() => setIsAuthenticated(false)}
              style={{ 
                padding: '10px 20px', 
                backgroundColor: '#3b82f6', 
                color: 'white', 
                border: 'none', 
                borderRadius: '5px',
                cursor: 'pointer'
              }}
            >
              Logout
            </button>
          </div>
        )}
      </NotificationProvider>
    </ThemeProvider>
  );
}
