// Enhanced logging configuration for development
const isDevelopment = process.env.NODE_ENV === 'development';

// Override console methods for better formatting in development
if (isDevelopment) {
    const originalLog = console.log;
    const originalError = console.error;
    const originalWarn = console.warn;
    
    console.log = (...args) => {
        const timestamp = new Date().toISOString();
        originalLog('[' + timestamp + '] [INFO]', ...args);
    };
    
    console.error = (...args) => {
        const timestamp = new Date().toISOString();
        originalError('[' + timestamp + '] [ERROR]', ...args);
    };
    
    console.warn = (...args) => {
        const timestamp = new Date().toISOString();
        originalWarn('[' + timestamp + '] [WARN]', ...args);
    };
}

// Debug logging utilities
const debugLog = {
    // WebSocket connection debugging
    wsConnection: (message, data = {}) => {
        if (isDevelopment) {
            console.log('[WS-CONNECTION] ' + message, data);
        }
    },
    
    // WebSocket message debugging
    wsMessage: (message, data = {}) => {
        if (isDevelopment) {
            console.log('[WS-MESSAGE] ' + message, data);
        }
    },
    
    // Database operations debugging
    dbOperation: (message, data = {}) => {
        if (isDevelopment) {
            console.log('[DB-OPERATION] ' + message, data);
        }
    },
    
    // Authentication debugging
    auth: (message, data = {}) => {
        if (isDevelopment) {
            console.log('[AUTH] ' + message, data);
        }
    },
    
    // Client registration debugging
    clientReg: (message, data = {}) => {
        if (isDevelopment) {
            console.log('[CLIENT-REG] ' + message, data);
        }
    },
    
    // Command execution debugging
    command: (message, data = {}) => {
        if (isDevelopment) {
            console.log('[COMMAND] ' + message, data);
        }
    },
    
    // API request debugging
    api: (message, data = {}) => {
        if (isDevelopment) {
            console.log('[API] ' + message, data);
        }
    },
    
    // CORS debugging
    cors: (message, data = {}) => {
        if (isDevelopment) {
            console.log('[CORS] ' + message, data);
        }
    }
};

module.exports = {
    debugLog,
    isDevelopment
};
