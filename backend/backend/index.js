
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
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const apiRoutes = require('./routes/index');
const wsHandler = require('./configs/ws.handler');
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
const wss = new WebSocket.Server({ server, path: "/ws" });

const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI;

mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error(err));

app.use(express.json());
app.use(session({
    secret: process.env.SESSION_SECRET || 'defaultsecret',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl: MONGO_URI })
}));
app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy(async (username, password, done) => {
    const user = await User.findOne({ username });
    if (!user) return done(null, false);
    const match = await bcrypt.compare(password, user.password_hash);
    return match ? done(null, user) : done(null, false);
}));
passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser((id, done) => User.findById(id, done));

app.use('/api', apiRoutes);

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/index.html'));
});

// WebSocket logic merged
wss.on('connection', (ws) => {
    console.log("Client connected.");

    ws.on('message', async (data) => {
        const message = data.toString();
        console.log("Received:", message);

        if (mongoose.connection.readyState === 1) {
            await mongoose.connection.db.collection('messages').insertOne({
                text: message,
                at: new Date()
            });
        }

        ws.send("FROM_SERVERsep-x8jmjgfmr9messageboxsep-x8jmjgfmr9Hello,This is from Node,info");
    });

    ws.on('close', () => {
        console.log("Client disconnected.");
    });
});

server.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});
