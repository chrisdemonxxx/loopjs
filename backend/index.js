require('dotenv').config();

// Set critical environment variable fallbacks IMMEDIATELY (only in development)
if (!process.env.JWT_SECRET) {
    if (process.env.NODE_ENV === 'production') {
        console.error('[CRITICAL] JWT_SECRET is required in production!');
        process.exit(1);
    }
    process.env.JWT_SECRET = 'loopjs-dev-secret-key-2024';
    console.warn('[WARNING] Using fallback JWT_SECRET - NOT SECURE FOR PRODUCTION!');
}
if (!process.env.JWT_ACCESS_TOKEN_EXPIRATION) {
    process.env.JWT_ACCESS_TOKEN_EXPIRATION = '1h';
}
if (!process.env.JWT_REFRESH_TOKEN_EXPIRATION) {
    process.env.JWT_REFRESH_TOKEN_EXPIRATION = '7d';
}

const express = require('express');
const cors = require('cors');
const http = require('http');
const mongoose = require('mongoose');

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 8080;

console.log('[STARTUP] Starting LoopJS Backend Server...');
console.log('[STARTUP] PORT:', PORT);
console.log('[STARTUP] Environment:', process.env.NODE_ENV || 'development');

// Basic middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint - available immediately
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        port: PORT,
        initialized: global.appInitialized || false
    });
});

// START SERVER IMMEDIATELY - before loading heavy dependencies
server.listen(PORT, '0.0.0.0', () => {
    console.log(`[STARTUP] ✅ Server listening on port ${PORT}`);
    console.log(`[STARTUP] ✅ Health check: http://localhost:${PORT}/health`);
    
    // NOW load heavy dependencies asynchronously
    initializeApp();
});

// Async initialization of heavy components
async function initializeApp() {
    try {
        console.log('[INIT] Loading application components...');
        
        // Set environment fallbacks (only in development)
        if (!process.env.JWT_SECRET) {
            if (process.env.NODE_ENV === 'production') {
                console.error('[CRITICAL] JWT_SECRET is required in production!');
                process.exit(1);
            }
            process.env.JWT_SECRET = 'loopjs-dev-secret-key-2024';
            console.warn('[WARNING] Using fallback JWT_SECRET - NOT SECURE FOR PRODUCTION!');
        }
        if (!process.env.SESSION_SECRET) {
            process.env.SESSION_SECRET = 'loopjs-session-secret-2024';
            console.warn('[INIT] SESSION_SECRET not set, using fallback');
        }
        if (!process.env.JWT_ACCESS_TOKEN_EXPIRATION) {
            process.env.JWT_ACCESS_TOKEN_EXPIRATION = '1h';
            console.warn('[INIT] JWT_ACCESS_TOKEN_EXPIRATION not set, using fallback: 1h');
        }
        if (!process.env.JWT_REFRESH_TOKEN_EXPIRATION) {
            process.env.JWT_REFRESH_TOKEN_EXPIRATION = '7d';
            console.warn('[INIT] JWT_REFRESH_TOKEN_EXPIRATION not set, using fallback: 7d');
        }
        
        // CORS setup
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
                
                // Allow requests with no origin only in development (like mobile apps, curl requests)
                if (!origin) {
                    if (process.env.NODE_ENV === 'production') {
                        console.log('CORS: Blocking request with no origin in production');
                        callback(new Error('Not allowed by CORS'));
                        return;
                    }
                    console.log('CORS: Allowing request with no origin (development mode)');
                    callback(null, true);
                } else if (allowedOrigins.indexOf(origin) !== -1) {
                    console.log(`CORS: Allowing origin: ${origin}`);
                    callback(null, true);
                } else {
                    console.log(`CORS: Blocking origin: ${origin}`);
                    callback(new Error('Not allowed by CORS'));
                }
            },
            credentials: true
        };
        app.use(cors(corsOptions));
        
        // Load routes
        const apiRoutes = require('./routes/index');
        app.use('/api', apiRoutes);
        
        // Connect MongoDB (non-blocking, but log warnings in production)
        connectDB().catch(err => {
            console.error('[INIT] MongoDB error:', err.message);
            if (process.env.NODE_ENV === 'production') {
                console.error('[CRITICAL] Database connection failed in production!');
                // Don't exit - allow server to start but functionality will be limited
            }
        });
        
        // Initialize WebSocket
        const WebSocket = require('ws');
        const wss = new WebSocket.Server({ server, path: "/ws" });
        const wsHandler = require('./configs/ws.handler');
        wss.on('connection', wsHandler);
        
        // Mark as fully initialized
        global.appInitialized = true;
        console.log('[INIT] ✅ Application components loaded');
        console.log('[INIT] ✅ Full application initialization complete');
    } catch (error) {
        console.error('[INIT] ❌ Error loading components:', error);
        // Don't crash - server is already listening
    }
}

async function connectDB() {
    try {
        const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/loopjs';
        
        // Connection pool configuration for production
        const connectionOptions = {
            serverSelectionTimeoutMS: process.env.NODE_ENV === 'production' ? 10000 : 5000,
            connectTimeoutMS: process.env.NODE_ENV === 'production' ? 10000 : 5000,
            socketTimeoutMS: process.env.NODE_ENV === 'production' ? 45000 : 5000,
            // Connection pool settings
            maxPoolSize: process.env.NODE_ENV === 'production' ? 10 : 5,
            minPoolSize: process.env.NODE_ENV === 'production' ? 2 : 1,
            maxIdleTimeMS: 30000,
            // Retry settings
            retryWrites: true,
            retryReads: true,
            // Buffer settings
            bufferMaxEntries: 0,
            bufferCommands: false
        };
        
        await mongoose.connect(mongoUri, connectionOptions);
        console.log('[INIT] ✅ MongoDB connected');
        console.log('[INIT] Connection pool configured:', {
            maxPoolSize: connectionOptions.maxPoolSize,
            minPoolSize: connectionOptions.minPoolSize
        });
        
        // Handle connection events
        mongoose.connection.on('error', (err) => {
            console.error('[MONGODB] Connection error:', err);
        });
        
        mongoose.connection.on('disconnected', () => {
            console.warn('[MONGODB] Disconnected from MongoDB');
        });
        
        mongoose.connection.on('reconnected', () => {
            console.log('[MONGODB] Reconnected to MongoDB');
        });
        
    } catch (error) {
        console.error('[INIT] MongoDB connection failed:', error.message);
        if (process.env.NODE_ENV === 'production') {
            console.error('[CRITICAL] Database connection required in production!');
            // In production, we might want to retry or exit
            // For now, we'll continue but log the error
        }
    }
}

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('[ERROR]', err);
    res.status(500).json({
        error: 'Internal server error',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    });
});