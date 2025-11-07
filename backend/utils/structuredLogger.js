/**
 * Structured Logger Utility
 * Provides structured logging with different log levels
 */

const logLevels = {
    ERROR: 0,
    WARN: 1,
    INFO: 2,
    DEBUG: 3
};

const currentLogLevel = process.env.LOG_LEVEL 
    ? logLevels[process.env.LOG_LEVEL.toUpperCase()] || logLevels.INFO
    : (process.env.NODE_ENV === 'production' ? logLevels.INFO : logLevels.DEBUG);

/**
 * Structured log entry
 */
function createLogEntry(level, message, data = {}) {
    return {
        timestamp: new Date().toISOString(),
        level: level.toUpperCase(),
        message,
        ...data,
        environment: process.env.NODE_ENV || 'development',
        pid: process.pid
    };
}

/**
 * Log error
 */
function error(message, data = {}) {
    if (currentLogLevel >= logLevels.ERROR) {
        const entry = createLogEntry('ERROR', message, data);
        console.error(JSON.stringify(entry));
    }
}

/**
 * Log warning
 */
function warn(message, data = {}) {
    if (currentLogLevel >= logLevels.WARN) {
        const entry = createLogEntry('WARN', message, data);
        console.warn(JSON.stringify(entry));
    }
}

/**
 * Log info
 */
function info(message, data = {}) {
    if (currentLogLevel >= logLevels.INFO) {
        const entry = createLogEntry('INFO', message, data);
        console.log(JSON.stringify(entry));
    }
}

/**
 * Log debug
 */
function debug(message, data = {}) {
    if (currentLogLevel >= logLevels.DEBUG) {
        const entry = createLogEntry('DEBUG', message, data);
        console.log(JSON.stringify(entry));
    }
}

/**
 * Log with context
 */
function logWithContext(level, message, context = {}) {
    const data = {
        ...context,
        traceId: context.traceId || `trace-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    };
    
    switch (level.toUpperCase()) {
        case 'ERROR':
            error(message, data);
            break;
        case 'WARN':
            warn(message, data);
            break;
        case 'INFO':
            info(message, data);
            break;
        case 'DEBUG':
            debug(message, data);
            break;
        default:
            info(message, data);
    }
}

module.exports = {
    error,
    warn,
    info,
    debug,
    logWithContext,
    logLevels
};
