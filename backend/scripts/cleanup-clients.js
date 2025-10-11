#!/usr/bin/env node

/**
 * Database Cleanup Script
 * Removes all offline clients from MongoDB
 */

const mongoose = require('mongoose');
const Client = require('../models/Client');

async function cleanupOfflineClients() {
    try {
        console.log('[CLEANUP] Starting client database cleanup...');
        
        // Connect to MongoDB
        const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/loopjs';
        await mongoose.connect(mongoUri);
        console.log('[CLEANUP] Connected to MongoDB');
        
        // Count total clients before cleanup
        const totalClients = await Client.countDocuments();
        console.log(`[CLEANUP] Total clients before cleanup: ${totalClients}`);
        
        // Count offline clients
        const offlineClients = await Client.countDocuments({ status: 'offline' });
        console.log(`[CLEANUP] Offline clients to remove: ${offlineClients}`);
        
        // Delete all offline clients
        if (offlineClients > 0) {
            const result = await Client.deleteMany({ status: 'offline' });
            console.log(`[CLEANUP] Deleted ${result.deletedCount} offline clients`);
        } else {
            console.log('[CLEANUP] No offline clients found');
        }
        
        // Count remaining clients
        const remainingClients = await Client.countDocuments();
        console.log(`[CLEANUP] Remaining clients: ${remainingClients}`);
        
        // Show online clients
        const onlineClients = await Client.countDocuments({ status: 'online' });
        console.log(`[CLEANUP] Online clients: ${onlineClients}`);
        
        console.log('[CLEANUP] Database cleanup completed successfully');
        
    } catch (error) {
        console.error('[CLEANUP] Error during cleanup:', error);
        process.exit(1);
    } finally {
        await mongoose.disconnect();
        console.log('[CLEANUP] Disconnected from MongoDB');
    }
}

// Run cleanup if called directly
if (require.main === module) {
    cleanupOfflineClients();
}

module.exports = cleanupOfflineClients;
