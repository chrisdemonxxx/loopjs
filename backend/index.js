﻿require('dotenv').config();
const { debugLog, isDevelopment } = require('./utils/debugLogger');
const express = require('express');

const mongoose = require('mongoose');

const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcryptjs');
const WebSocket = require('ws');
const http = require('http');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const apiRoutes = require('./routes/index');
const healthRoutes = require('./routes/health');
const agentRoutes = require('./routes/agent');
const wsHandler = require('./configs/ws.handler');
const User = require('./models/User');
const Client = require('./models/Client');
const { helmetConfig, apiRateLimit } = require('./middleware/security');

const app = express();

console.log('[STARTUP] Starting LoopJS Backend Server...');
console.log('[STARTUP] Environment:', process.env.NODE_ENV || 'development');
console.log('[STARTUP] Debug Mode:', isDevelopment ? 'ENABLED' : 'DISABLED');

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

// ==============================================================================


// Apply CORS middleware
app.use(cors(corsOptions));

// Security middleware
app.use(helmetConfig);
app.use(apiRateLimit);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

const server = http.createServer(app);
const wss = new WebSocket.Server({ server, path: "/ws" });

const PORT = process.env.PORT || 8080;
const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI;

// Set fallback values for required environment variables
if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = 'loopjs-dev-secret-key-2024';
  console.warn('JWT_SECRET not set, using development fallback');
}
if (!process.env.SESSION_SECRET) {
  process.env.SESSION_SECRET = 'loopjs-session-secret-2024';
  console.warn('SESSION_SECRET not set, using development fallback');
}

// MongoDB connection (optional)
if (MONGO_URI) {
  mongoose.connect(MONGO_URI)
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => {
      console.error('MongoDB connection failed:', err && err.message ? err.message : err);
      console.error('Continuing to run without a database connection.');
    });
} else {
  console.warn('MONGO_URI is not set. Starting server without a database connection.');
}

// Express middleware
app.use(express.json());
app.use(passport.initialize());
require('./configs/passport-jwt')(passport);

// Passport local strategy

passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser((id, done) => User.findById(id, done));

// Routes
app.use('/api', apiRoutes);
app.use('/api/ai', require('./routes/ai'));  // AI API routes
app.use('/admin', require('./middleware/security').protect, require('./routes/admin'));  // Protect admin routes
app.use('/debug', require('./routes/debug'));
app.use('/', healthRoutes);

// Health check endpoint for deployment monitoring
app.get('/health', (req, res) => {
    res.status(200).json({ 
        status: 'healthy', 
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development'
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

    console.error("ðŸ”¥ UNHANDLED ERROR:", err.stack || err);

    res.status(err.statusCode).json({
        status: err.status,
        message: err.message,
        // For development, include the stack trace
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    });
});

// WebSocket logic
wss.on('connection', wsHandler);

// Background job to mark clients as offline after timeout
const markOfflineClients = async () => {
    try {
        const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);
        const result = await Client.updateMany(
            { 
                status: 'online',
                lastHeartbeat: { $lt: twoMinutesAgo }
            },
            { 
                $set: { 
                    status: 'offline',
                    disconnectedAt: new Date()
                }
            }
        );
        
        if (result.modifiedCount > 0) {
            console.log(`Marked ${result.modifiedCount} clients as offline due to timeout`);
        }
    } catch (error) {
        console.error('Error marking offline clients:', error);
    }
};

// Run the offline check every 30 seconds
setInterval(markOfflineClients, 30 * 1000);

server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on port ${PORT} on all network interfaces`);
    console.log(`Local access: http://localhost:${PORT}`);
    console.log(`Network access: http://192.168.0.127:${PORT}`);
    console.log(`WebSocket endpoint: ws://192.168.0.127:${PORT}/ws`);
});
