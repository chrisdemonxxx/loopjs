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
const wsHandler = require('./configs/ws.handler');
const User = require('./models/User');
const { helmetConfig, apiRateLimit } = require('./middleware/security');

const app = express();

// CORS middleware should be first
const corsOptions = {
    origin: [
        'http://localhost:5173',
        'http://localhost:3000',
        'https://loopjs-frontend-361659024403.us-central1.run.app',
        'https://loopjs-backend-361659024403.us-central1.run.app'
    ],
    credentials: true,
    optionsSuccessStatus: 200,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};
app.use(cors(corsOptions));

// Security middleware
app.use(helmetConfig);
app.use(apiRateLimit);
app.use(express.static(path.join(__dirname, 'public')));

const server = http.createServer(app);
const wss = new WebSocket.Server({ server, path: "/ws" });

const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI;

// MongoDB connection
mongoose.connect(MONGO_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error(err));

// Express middleware
app.use(express.json());
app.use(passport.initialize());
require('./configs/passport-jwt')(passport);

// Passport local strategy

passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser((id, done) => User.findById(id, done));

// Routes
app.use('/api', apiRoutes);
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

server.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});
