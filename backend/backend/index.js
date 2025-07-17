require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors'); // Make sure you have `npm install cors`
const mongoose = require('mongoose');
const WebSocket = require('ws');

// --- Main App Setup ---
const app = express();

// --- CORS Configuration ---
// This is the most important part. Place it before any routes.
// This will allow your frontend to make API calls to your backend.
app.use(cors({
    origin: 'https://loopjs-2.onrender.com', // The URL of your frontend
    credentials: true
}));

// --- Middleware ---
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// Your passport and session middleware would go here as before...

// --- API Routes ---
// You need to define your API routes. For example:
const infoRoutes = express.Router();

infoRoutes.get('/get-user-list', (req, res) => {
    // In here, you would fetch the list of connected agents
    // from your database (e.g., MongoDB) and send it back.
    // For now, let's send back a dummy array.
    const dummyUsers = [
        { computerName: 'TEST-PC-1', ipAddress: '192.168.1.10', status: 'Online' },
        { computerName: 'TEST-PC-2', ipAddress: '192.168.1.12', status: 'Offline' }
    ];
    res.json(dummyUsers);
});

// Tell your app to use these routes when the path starts with /info
app.use('/info', infoRoutes);


// --- Server and WebSocket Setup ---
const server = http.createServer(app);
const wss = new WebSocket.Server({ server, path: "/ws" });

// Handle WebSocket connections
wss.on('connection', (ws) => {
    console.log('A client connected via WebSocket');
    // Your existing WebSocket handling logic goes here.
    // When an agent connects, you should save its info to the database.
});


// --- Start Server ---
const PORT = process.env.PORT || 10000;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});