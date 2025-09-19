#!/usr/bin/env node

/**
 * Rate Limit Bypass Script
 * Usage: node scripts/bypass-rate-limit.js [enable|disable|status]
 */

const { 
    addBypassToEnv, 
    removeBypassFromEnv, 
    getRateLimitStatus,
    disableRateLimit,
    enableRateLimit
} = require('../utils/rateLimitBypass');

const command = process.argv[2];

switch (command) {
    case 'enable':
    case 'disable':
        console.log('🔧 Toggling rate limit bypass...');
        if (command === 'disable') {
            addBypassToEnv();
            disableRateLimit();
        } else {
            removeBypassFromEnv();
            enableRateLimit();
        }
        break;
        
    case 'status':
        const status = getRateLimitStatus();
        console.log('\n📊 Rate Limit Status:');
        console.log(`   Bypassed: ${status.bypassed ? '✅ YES' : '❌ NO'}`);
        console.log(`   Reason: ${status.reason}`);
        console.log(`   NODE_ENV: ${status.nodeEnv || 'not set'}`);
        console.log(`   BYPASS_RATE_LIMIT: ${status.bypassFlag || 'not set'}`);
        break;
        
    default:
        console.log(`
🚀 Rate Limit Bypass Tool

Usage:
  node scripts/bypass-rate-limit.js disable    # Disable rate limiting
  node scripts/bypass-rate-limit.js enable     # Enable rate limiting  
  node scripts/bypass-rate-limit.js status     # Check current status

Current Methods to Bypass Rate Limiting:
  1. Set NODE_ENV=development in .env file
  2. Set BYPASS_RATE_LIMIT=true in .env file
  3. Access from localhost/local network IPs
  4. Use this script to toggle bypass

Note: Server restart may be required for changes to take effect.
        `);
        break;
}