/**
 * Rate Limit Bypass Utility
 * Provides methods to bypass rate limiting for development and testing
 */

const fs = require('fs');
const path = require('path');

/**
 * Temporarily disable rate limiting by setting environment variable
 */
const disableRateLimit = () => {
    process.env.BYPASS_RATE_LIMIT = 'true';
    console.log('✅ Rate limiting disabled for this session');
};

/**
 * Re-enable rate limiting
 */
const enableRateLimit = () => {
    process.env.BYPASS_RATE_LIMIT = 'false';
    console.log('🔒 Rate limiting re-enabled');
};

/**
 * Add bypass flag to .env file
 */
const addBypassToEnv = () => {
    const envPath = path.join(__dirname, '..', '.env');
    
    try {
        let envContent = fs.readFileSync(envPath, 'utf8');
        
        if (!envContent.includes('BYPASS_RATE_LIMIT')) {
            envContent += '\nBYPASS_RATE_LIMIT=true\n';
            fs.writeFileSync(envPath, envContent);
            console.log('✅ Added BYPASS_RATE_LIMIT=true to .env file');
        } else {
            // Update existing value
            envContent = envContent.replace(/BYPASS_RATE_LIMIT=false/g, 'BYPASS_RATE_LIMIT=true');
            fs.writeFileSync(envPath, envContent);
            console.log('✅ Updated BYPASS_RATE_LIMIT to true in .env file');
        }
    } catch (error) {
        console.error('❌ Error updating .env file:', error.message);
    }
};

/**
 * Remove bypass flag from .env file
 */
const removeBypassFromEnv = () => {
    const envPath = path.join(__dirname, '..', '.env');
    
    try {
        let envContent = fs.readFileSync(envPath, 'utf8');
        envContent = envContent.replace(/BYPASS_RATE_LIMIT=true/g, 'BYPASS_RATE_LIMIT=false');
        fs.writeFileSync(envPath, envContent);
        console.log('🔒 Set BYPASS_RATE_LIMIT to false in .env file');
    } catch (error) {
        console.error('❌ Error updating .env file:', error.message);
    }
};

/**
 * Check if rate limiting is currently bypassed
 */
const isRateLimitBypassed = () => {
    return process.env.BYPASS_RATE_LIMIT === 'true' || process.env.NODE_ENV === 'development';
};

/**
 * Get current rate limit status
 */
const getRateLimitStatus = () => {
    const bypassed = isRateLimitBypassed();
    return {
        bypassed,
        reason: bypassed ? 
            (process.env.NODE_ENV === 'development' ? 'Development environment' : 'Bypass flag enabled') :
            'Rate limiting active',
        nodeEnv: process.env.NODE_ENV,
        bypassFlag: process.env.BYPASS_RATE_LIMIT
    };
};

module.exports = {
    disableRateLimit,
    enableRateLimit,
    addBypassToEnv,
    removeBypassFromEnv,
    isRateLimitBypassed,
    getRateLimitStatus
};