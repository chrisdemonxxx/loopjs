require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcrypt');
const WebSocket = require('ws');
const http = require('http');
const cors =require('cors');
const path = require('path');
const fs = require('fs');
const url = require('url');

const apiRoutes = require('./routes/index');
const wsHandler = require('./configs/ws.handler');
const terminalWsHandler = require('./configs/terminal.ws.handler');
const User = require('./models/User');

const app = express();
const corsOptions = {
    origin: '*',
    credentials: true,
    optionsSuccessStatus: 200
};
app.use(cors(corsOptions));
app.use(express.static(path.join(__dirname, 'public')));

const server = http.createServer(app);

// Create two WebSocket servers without attaching them to the HTTP server
const mainWss = new WebSocket.Server({ noServer: true });
const terminalWss = new WebSocket.Server({ noServer: true });

// Set up the connection handlers for each server
mainWss.on('connection', wsHandler);

terminalWss.on('connection', (ws, req) => {
    // We need to extract the uuid from the request url
    const { pathname } = url.parse(req.url);
    const uuid = pathname.split('/').pop();
    terminalWsHandler(ws, uuid);
});

const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI;

// MongoDB connection
mongoose.connect(MONGO_URI)
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error(err));

// Express middleware
app.use(express.json());
app.use(session({
    secret: process.env.SESSION_SECRET || 'defaultsecret',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl: MONGO_URI })
}));

// Debug: Session status
app.use((req, res, next) => {
    console.log("Session state:", req.session);
    next();
});

app.use(passport.initialize());
app.use(passport.session());

// Passport local strategy
passport.use(new LocalStrategy(async (username, password, done) => {
    try {
        const user = await User.findOne({ username });
        if (!user) return done(null, false);
        const match = await bcrypt.compare(password, user.password);
        return match ? done(null, user) : done(null, false);
    } catch (err) {
        return done(err);
    }
}));
passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser((id, done) => User.findById(id, done));

// API Routes
app.use('/api', apiRoutes);

// Base HTML
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/index.html'));
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

// NEW: Handle WebSocket upgrades manually
server.on('upgrade', (request, socket, head) => {
    const { pathname } = url.parse(request.url);

    if (pathname.startsWith('/ws/terminal/')) {
        terminalWss.handleUpgrade(request, socket, head, (ws) => {
            terminalWss.emit('connection', ws, request);
        });
    } else if (pathname === '/ws') {
        mainWss.handleUpgrade(request, socket, head, (ws) => {
            mainWss.emit('connection', ws, request);
        });
    } else {
        console.log('Destroying socket for invalid WebSocket path:', pathname);
        socket.destroy();
    }
});

server.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});
