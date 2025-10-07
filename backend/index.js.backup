require('dotenv').config();
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

// CORS CONFIGURATION
const corsOptions = {
    origin: function (origin, callback) {
        const allowedOrigins = [
            'http://localhost:5173',
            'http://192.168.0.127:5173',
            'http://172.19.64.1:5173',
            'http://172.19.64.1',
            'http://localhost:4173',
            'http://localhost:4174',
            'http://localhost',
            'https://www.sendparcel.art',
            'https://loopjs.sendparcel.art',
            'https://loopjs.vidai.sbs',
            'https://loopjs-frontend-361659024403.us-central1.run.app',
            'https://loopjs-frontend-kn2yg4ji5a-uc.a.run.app',
            'https://loopjs-backend-kn2yg4ji5a-uc.a.run.app',
            'https://loopjs-by-loopcreations-6p0gj7w5b-chrisdemonxxxs-projects.vercel.app',
            'https://frontend-i5o13j8jz-chrisdemonxxxs-projects.vercel.app',
            'https://frontend-b65tmnfvy-chrisdemonxxxs-projects.vercel.app',
            'https://storage.googleapis.com'
        ];
        
        // Allow requests with no origin (like mobile apps, curl requests)
        if (!origin) {
            console.log('CORS: Allowing request with no origin');
            callback(null, true);
        } else if (allowedOrigins.indexOf(origin) !== -1) {
            console.log(`CORS: Allowing request from origin: ${origin}`);
            callback(null, true);
        } else if (origin.match(/^http:\/\/172\.\d+\.\d+\.\d+:5173$/)) {
            // Allow Docker/VM network IPs for development
            console.log(`CORS: Allowing Docker/VM origin: ${origin}`);
            callback(null, true);
        } else if (origin.match(/^http:\/\/192\.168\.\d+\.\d+:5173$/)) {
            // Allow local network IPs for development
            console.log(`CORS: Allowing local network origin: ${origin}`);
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

    console.error("🔥 UNHANDLED ERROR:", err.stack || err);

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
