const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// Rate limiting configuration
const createRateLimit = (windowMs = 15 * 60 * 1000, max = 100, message = 'Too many requests from this IP') => {
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
        trustProxy: true
    });
};

// Different rate limits for different endpoints
const authRateLimit = createRateLimit(15 * 60 * 1000, 5, 'Too many authentication attempts');
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

module.exports = {
    helmetConfig,
    authRateLimit,
    apiRateLimit,
    commandRateLimit,
    createRateLimit
};