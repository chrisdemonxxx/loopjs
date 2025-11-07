const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// Rate limiting configuration
const createRateLimit = (windowMs = 15 * 60 * 1000, max = 100, message = 'Too many requests from this IP') => {
    // Skip rate limiting only in development environment or if explicitly bypassed
    if (process.env.NODE_ENV === 'development' || process.env.BYPASS_RATE_LIMIT === 'true') {
        return (req, res, next) => next(); // No-op middleware
    }
    // Production: Always enforce rate limiting
    
    return rateLimit({
        windowMs, // 15 minutes default
        max, // limit each IP to max requests per windowMs
        message: {
            error: message,
            retryAfter: Math.ceil(windowMs / 1000)
        },
        standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
        legacyHeaders: false, // Disable the `X-RateLimit-*` headers
        // Use default key generator to avoid IPv6 issues
        // This will automatically handle IPv6 addresses properly
        trustProxy: true,
        // Skip rate limiting for localhost and development IPs
        skip: (req) => {
            const developmentIPs = ['127.0.0.1', '::1', 'localhost'];
            const clientIP = req.ip || req.connection.remoteAddress;
            return developmentIPs.includes(clientIP) || clientIP?.startsWith('192.168.') || clientIP?.startsWith('10.');
        }
    });
};

// Different rate limits for different endpoints
// Increased limit for development environment
const authRateLimit = createRateLimit(15 * 60 * 1000, 20, 'Too many authentication attempts');
const apiRateLimit = createRateLimit(15 * 60 * 1000, 100, 'Too many API requests');
const commandRateLimit = createRateLimit(5 * 60 * 1000, 20, 'Too many command requests');

// Helmet configuration for security headers
const helmetConfig = helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'", "ws:", "wss:", "http:", "https:"],
            fontSrc: ["'self'"],
            objectSrc: ["'none'"],
            mediaSrc: ["'self'"],
            frameSrc: ["'none'"],
        },
    },
    crossOriginEmbedderPolicy: false, // Disable for WebSocket compatibility
});

// JWT Authentication middleware
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const AppError = require('../utils/appError');
const User = require('../models/User');

const protect = async (req, res, next) => {
    // Get token from header
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    // Check if token exists
    if (!token) {
        return next(new AppError('You are not logged in. Please log in to get access.', 401));
    }

    try {
        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Check if this is a development mode token
        if (decoded.id === 'admin-dev-id') {
            // Development mode - no database required
            req.user = {
                id: 'admin-dev-id',
                username: 'admin',
                role: 'admin'
            };
            return next();
        }
        
        // Production mode - fetch user data from database
        if (mongoose.connection.readyState !== 1) {
            return next(new AppError('Database not connected', 500));
        }
        
        const user = await User.findById(decoded.id);
        if (!user) {
            return next(new AppError('The user belonging to this token does no longer exist.', 401));
        }
        
        // Set user data with all fields including role
        req.user = {
            id: user._id,
            username: user.username,
            role: user.role
        };
        
        next();
    } catch (err) {
        return next(new AppError('Invalid token. Please log in again.', 401));
    }
};

module.exports = {
    helmetConfig,
    authRateLimit,
    apiRateLimit,
    commandRateLimit,
    createRateLimit,
    protect
};