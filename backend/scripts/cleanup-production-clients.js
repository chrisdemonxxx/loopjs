#!/usr/bin/env node

/**
 * Production Database Cleanup Script
 * Removes ALL clients from production MongoDB to ensure clean state
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Client = require('../models/Client');

async function cleanupAllClients() {
    try {
        console.log('[PRODUCTION CLEANUP] Starting production database cleanup...');
        
        // Get MongoDB URI from command line argument first, then environment
        const mongoUri = process.argv[2] || process.env.MONGODB_URI;
        
        if (!mongoUri) {
            console.error('[ERROR] MongoDB URI required. Set MONGODB_URI environment variable or pass as argument.');
            console.error('Usage: node cleanup-production-clients.js [mongodb-uri]');
            process.exit(1);
        }
        
        console.log('[PRODUCTION CLEANUP] Connecting to MongoDB...');
        console.log('[PRODUCTION CLEANUP] URI:', mongoUri.replace(/\/\/.*@/, '//***:***@')); // Hide credentials
        
        // Connect to MongoDB
        await mongoose.connect(mongoUri);
        console.log('[PRODUCTION CLEANUP] Connected to production MongoDB');
        
        // Count total clients before cleanup
        const totalClients = await Client.countDocuments();
        console.log(`[PRODUCTION CLEANUP] Total clients before cleanup: ${totalClients}`);
        
        if (totalClients === 0) {
            console.log('[PRODUCTION CLEANUP] Database is already clean - no clients found');
            await mongoose.disconnect();
            return;
        }
        
        // Count by status
        const onlineClients = await Client.countDocuments({ status: 'online' });
        const offlineClients = await Client.countDocuments({ status: 'offline' });
        console.log(`[PRODUCTION CLEANUP] Online clients: ${onlineClients}`);
        console.log(`[PRODUCTION CLEANUP] Offline clients: ${offlineClients}`);
        
        // Delete ALL clients to ensure clean state
        console.log('[PRODUCTION CLEANUP] Deleting ALL clients from database...');
        const result = await Client.deleteMany({});
        console.log(`[PRODUCTION CLEANUP] Deleted ${result.deletedCount} clients`);
        
        // Verify cleanup
        const remainingClients = await Client.countDocuments();
        console.log(`[PRODUCTION CLEANUP] Remaining clients: ${remainingClients}`);
        
        if (remainingClients === 0) {
            console.log('[PRODUCTION CLEANUP] ✅ Database cleanup completed successfully');
        } else {
            console.log('[PRODUCTION CLEANUP] ⚠️ Warning: Some clients may still remain');
        }
        
    } catch (error) {
        console.error('[PRODUCTION CLEANUP] Error during cleanup:', error);
        process.exit(1);
    } finally {
        await mongoose.disconnect();
        console.log('[PRODUCTION CLEANUP] Disconnected from MongoDB');
    }
}

// Run cleanup if called directly
if (require.main === module) {
    cleanupAllClients();
}

module.exports = { cleanupAllClients };
