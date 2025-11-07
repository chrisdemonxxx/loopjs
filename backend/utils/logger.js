/**
 * Structured Logging Utility
 * Provides consistent logging with levels and structured output
 */

const LOG_LEVELS = {
    ERROR: 0,
    WARN: 1,
    INFO: 2,
    DEBUG: 3
};

const CURRENT_LOG_LEVEL = process.env.LOG_LEVEL 
    ? LOG_LEVELS[process.env.LOG_LEVEL.toUpperCase()] || LOG_LEVELS.INFO
    : (process.env.NODE_ENV === 'production' ? LOG_LEVELS.INFO : LOG_LEVELS.DEBUG);

class Logger {
    constructor(context = 'APP') {
        this.context = context;
    }

    /**
     * Format log message with context and metadata
     */
    format(level, message, metadata = {}) {
        const timestamp = new Date().toISOString();
        const logEntry = {
            timestamp,
            level,
            context: this.context,
            message,
            ...metadata
        };

        // In production, output as JSON for log aggregation
        if (process.env.NODE_ENV === 'production') {
            return JSON.stringify(logEntry);
        }

        // In development, output as readable string
        const metaStr = Object.keys(metadata).length > 0 
            ? ` ${JSON.stringify(metadata)}` 
            : '';
        return `[${timestamp}] [${level}] [${this.context}] ${message}${metaStr}`;
    }

    /**
     * Log error message
     */
    error(message, metadata = {}) {
        if (LOG_LEVELS.ERROR <= CURRENT_LOG_LEVEL) {
            console.error(this.format('ERROR', message, metadata));
        }
    }

    /**
     * Log warning message
     */
    warn(message, metadata = {}) {
        if (LOG_LEVELS.WARN <= CURRENT_LOG_LEVEL) {
            console.warn(this.format('WARN', message, metadata));
        }
    }

    /**
     * Log info message
     */
    info(message, metadata = {}) {
        if (LOG_LEVELS.INFO <= CURRENT_LOG_LEVEL) {
            console.log(this.format('INFO', message, metadata));
        }
    }

    /**
     * Log debug message
     */
    debug(message, metadata = {}) {
        if (LOG_LEVELS.DEBUG <= CURRENT_LOG_LEVEL) {
            console.log(this.format('DEBUG', message, metadata));
        }
    }

    /**
     * Create a child logger with additional context
     */
    child(context) {
        return new Logger(`${this.context}:${context}`);
    }
}

// Create default logger instance
const logger = new Logger('APP');

// Export both the class and default instance
module.exports = logger;
module.exports.Logger = Logger;
