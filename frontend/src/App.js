import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [backendStatus, setBackendStatus] = useState('Checking...');
  const [clients, setClients] = useState([]);
  const [wsStatus, setWsStatus] = useState('Disconnected');
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    // Check backend health
    const apiUrl = process.env.REACT_APP_API_URL || 'https://loopjs-backend-361659024403.us-central1.run.app';
    fetch(`${apiUrl}/health`)
      .then(response => response.json())
      .then(data => {
        setBackendStatus(data.status === 'healthy' ? 'Connected' : 'Unhealthy');
      })
      .catch(error => {
        console.error('Error checking backend health:', error);
        setBackendStatus('Disconnected');
      });

    // Connect to WebSocket
    const wsUrl = process.env.REACT_APP_WS_URL || 'wss://loopjs-backend-361659024403.us-central1.run.app/ws';
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      setWsStatus('Connected');
      setSocket(ws);
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        if (message.type === 'clients') {
          setClients(message.data);
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    ws.onclose = () => {
      setWsStatus('Disconnected');
      setSocket(null);
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      setWsStatus('Error');
    };

    // Cleanup on unmount
    return () => {
      if (ws) {
        ws.close();
      }
    };
  }, []);

  const sendCommand = (clientId, command) => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({
        type: 'command',
        clientId,
        command
      }));
    }
  };

  return (
    <div className="App">
      <div className="header">
        <h1>LoopJS Control Panel</h1>
        <p>Backend Status: <span style={{ color: backendStatus === 'Connected' ? '#4ade80' : '#ef4444' }}>{backendStatus}</span></p>
        <p>WebSocket Status: <span style={{ color: wsStatus === 'Connected' ? '#4ade80' : '#ef4444' }}>{wsStatus}</span></p>
      </div>

      <div className="card">
        <h2>Connected Clients</h2>
        {clients.length === 0 ? (
          <p>No clients connected</p>
        ) : (
          <div className="client-list">
            {clients.map(client => (
              <div key={client.id} className="client-card">
                <div className="client-header">
                  <h3>{client.name || 'Unknown Client'}</h3>
                  <span style={{ color: '#4ade80' }}>Online</span>
                </div>
                <p>IP: {client.ip || 'Unknown'}</p>
                <p>OS: {client.os || 'Unknown'}</p>
                <div>
                  <button onClick={() => sendCommand(client.id, 'info')}>Get Info</button>
                  <button onClick={() => sendCommand(client.id, 'screenshot')}>Screenshot</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
