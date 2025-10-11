require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const http = require('http');
const WebSocket = require('ws');
const mongoose = require('mongoose');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server, path: "/ws" });

console.log('[STARTUP] Starting LoopJS Backend Server...');
console.log('[STARTUP] Environment:', process.env.NODE_ENV || 'development');

// MongoDB Connection
const connectDB = async () => {
    try {
        const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/loopjs';
        await mongoose.connect(mongoUri);
        console.log('[STARTUP] MongoDB connected successfully');
    } catch (error) {
        console.error('[STARTUP] MongoDB connection failed:', error.message);
        console.log('[STARTUP] Continuing without database connection...');
    }
};

// Connect to MongoDB
connectDB();

// CORS CONFIGURATION
const corsOptions = {
    origin: function (origin, callback) {
        const allowedOrigins = [
            'http://localhost:5173',
            'http://localhost:5174',
            'http://localhost:5175',
            'http://localhost:4173',
            'http://localhost:4174',
            'http://localhost',
            'https://loopjs-frontend-361659024403.us-central1.run.app',
            'https://loopjs.vidai.sbs'
        ];
        
        // Allow requests with no origin (like mobile apps, curl requests)
        if (!origin) {
            console.log('CORS: Allowing request with no origin');
            callback(null, true);
        } else if (allowedOrigins.indexOf(origin) !== -1) {
            console.log(`CORS: Allowing request from origin: ${origin}`);
            callback(null, true);
        } else {
            console.log(`CORS: Blocking request from origin: ${origin}`);
            console.log('CORS: Allowed origins:', allowedOrigins);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
};

// Apply CORS middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Mount API routes
const apiRoutes = require('./routes/index');
app.use('/api', apiRoutes);

const PORT = process.env.PORT || 8080;

// Set fallback values for required environment variables
if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = 'loopjs-dev-secret-key-2024';
  console.warn('JWT_SECRET not set, using development fallback');
}
if (!process.env.SESSION_SECRET) {
  process.env.SESSION_SECRET = 'loopjs-session-secret-2024';
  console.warn('SESSION_SECRET not set, using development fallback');
}

// WebSocket connection handler - use proper handler with database integration
const wsHandler = require('./configs/ws.handler');
wss.on('connection', wsHandler);

// API Routes
app.get('/api/test', (req, res) => {
    res.json({ message: 'API is working', timestamp: new Date().toISOString() });
});

// User profile endpoint
app.get('/api/api/user/profile', (req, res) => {
    res.json({ 
        id: 'demo-user',
        username: 'demo',
        email: 'demo@loopjs.com',
        role: 'admin',
        createdAt: new Date().toISOString(),
        message: 'Demo user profile - MongoDB not connected'
    });
});

// User list endpoint - handled by info.route.js controller

// Task stats endpoint - handled by task.route.js controller

// Client list endpoint - handled by info.route.js controller

// Health check endpoint for deployment monitoring
app.get('/health', (req, res) => {
    res.status(200).json({ 
        status: 'healthy', 
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development',
        websocket: 'enabled'
    });
});

// Root endpoint
app.get('/', (req, res) => {
    res.json({ message: 'LoopJS Backend Server is running' });
});

// Global error handler
app.use((err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';

    console.error("🔥 UNHANDLED ERROR:", err.stack || err);

    res.status(err.statusCode).json({
        status: err.status,
        message: err.message,
        // For development, include the stack trace
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    });
});

server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on port ${PORT} on all network interfaces`);
    console.log(`Local access: http://localhost:${PORT}`);
    console.log(`Network access: http://192.168.0.127:${PORT}`);
    console.log(`WebSocket endpoint: ws://192.168.0.127:${PORT}/ws`);
});
