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
const path = require('path');
const cors = require('cors'); // ✅ NEW

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const wsHandler = require('./configs/ws.handler');
const User = require('./models/User');

// ✅ CORS Middleware (must be placed BEFORE routes)
app.use(cors({
    origin: "https://loopjs-2.onrender.com", // your frontend origin
    credentials: true
}));

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl: process.env.MONGO_URI }),
    cookie: { sameSite: 'none', secure: true } // ✅ Necessary for cross-site cookie in HTTPS
}));
app.use(passport.initialize());
app.use(passport.session());

// Passport Local Strategy
passport.use(new LocalStrategy(async (username, password, done) => {
    const user = await User.findOne({ username });
    if (!user) return done(null, false);
    const match = await bcrypt.compare(password, user.password);
    return done(null, match ? user : false);
}));
passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
    const user = await User.findById(id);
    done(null, user);
});

// Routes
app.post('/login', passport.authenticate('local'), (req, res) => res.sendStatus(200));
app.get('/logout', (req, res) => {
    req.logout(() => res.sendStatus(200));
});

// WebSocket Handler
wss.on('connection', ws => wsHandler(ws));

server.listen(process.env.PORT || 3001, () => {
    console.log('Server running...');
});
