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
const cors = require('cors'); // Ensure you have run 'npm install cors'

// Route imports
const apiRoutes = require('./routes/index'); 
const wsHandler = require('./configs/ws.handler');
const User = require('./models/User');

// --- Main App Setup ---
const app = express();

// --- CORS Configuration ---
// This is the most important part. It MUST be placed before any routes.
// This configuration allows your frontend at 'loopjs-2.onrender.com'
// to make API calls to this backend.
const corsOptions = {
    origin: 'https://loopjs-2.onrender.com', // The specific URL of your frontend
    credentials: true, // Allows cookies and session info to be sent
    optionsSuccessStatus: 200 // For legacy browser support
};
app.use(cors(corsOptions));


// --- Server and WebSocket Setup ---
const server = http.createServer(app);
const wss = new WebSocket.Server({ server, path: "/ws" });


// --- MongoDB Connection ---
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('MongoDB connected successfully.'))
    .catch(err => console.error('MongoDB connection error:', err));


// --- Middleware ---
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session Middleware (must be before passport)
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl: process.env.MONGO_URI }),
    // Cookie settings are important for cross-domain requests
    cookie: { 
        sameSite: 'none', 
        secure: true, // 'secure: true' is required for 'sameSite: none'
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// Passport Middleware
app.use(passport.initialize());
app.use(passport.session());


// --- Passport Configuration ---
passport.use(new LocalStrategy(async (username, password, done) => {
    try {
        const user = await User.findOne({ username });
        if (!user) {
            return done(null, false, { message: 'Incorrect username.' });
        }
        const match = await bcrypt.compare(password, user.password);
        if (!match) {
            return done(null, false, { message: 'Incorrect password.' });
        }
        return done(null, user);
    } catch (err) {
        return done(err);
    }
}));
passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findById(id);
        done(null, user);
    } catch (err) {
        done(err);
    }
});


// --- API Routes ---
// This line is changed to remove the '/api' prefix, matching the frontend's requests.
app.use('/', apiRoutes);


// --- WebSocket Connection Handler ---
wss.on('connection', wsHandler);


// --- Start Server ---
const PORT = process.env.PORT || 10000;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
