require('dotenv').config();

// Set critical environment variable fallbacks IMMEDIATELY
if (!process.env.JWT_SECRET) {
    process.env.JWT_SECRET = 'loopjs-dev-secret-key-2024';
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
        
        // Set environment fallbacks
        if (!process.env.JWT_SECRET) {
            process.env.JWT_SECRET = 'loopjs-dev-secret-key-2024';
            console.warn('[INIT] JWT_SECRET not set, using fallback');
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
                    'https://loopjs.vidai.sbs',
                    'https://loopjs-frontend.onrender.com',
                    'https://frontend-c6l7dzrkd-chrisdemonxxxs-projects.vercel.app',
                    'https://*.vercel.app'
                ];
                
                // Allow requests with no origin (like mobile apps, curl requests)
                if (!origin) {
                    console.log('CORS: Allowing request with no origin');
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
        
        // Connect MongoDB (non-blocking)
        connectDB().catch(err => {
            console.error('[INIT] MongoDB error:', err.message);
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
        await mongoose.connect(mongoUri, {
            serverSelectionTimeoutMS: 5000,
            connectTimeoutMS: 5000,
            socketTimeoutMS: 5000,
        });
        console.log('[INIT] ✅ MongoDB connected');
    } catch (error) {
        console.error('[INIT] MongoDB connection failed:', error.message);
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