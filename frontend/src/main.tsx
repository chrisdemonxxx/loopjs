import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Import CSS files - Vite will handle these correctly
import './css/style.css';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
