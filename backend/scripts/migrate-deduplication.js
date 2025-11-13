const mongoose = require('mongoose');
const Client = require('../models/Client');
const Task = require('../models/Task');

// MongoDB connection
const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/loopjs';

async function connectToDatabase() {
    try {
        if (!MONGO_URI) {
            console.error('MongoDB URI not found. Please set MONGODB_URI or MONGO_URI environment variable.');
            process.exit(1);
        }
        await mongoose.connect(MONGO_URI);
        console.log('Connected to MongoDB');
    } catch (error) {
        console.error('MongoDB connection failed:', error);
        process.exit(1);
    }
}

async function generateMachineFingerprint(client) {
    // Generate a best-effort machine fingerprint for existing clients
    const components = [];
    
    // Computer name
    if (client.computerName) {
        components.push(client.computerName);
    }
    
    // IP address (first one)
    if (client.ipAddress) {
        components.push(client.ipAddress);
    } else if (client.ip) {
        components.push(client.ip);
    }
    
    // Platform/OS
    if (client.platform) {
        components.push(client.platform);
    }
    
    // Operating system
    if (client.operatingSystem) {
        components.push(client.operatingSystem);
    }
    
    // Architecture
    if (client.architecture) {
        components.push(client.architecture);
    }
    
    // Created date bucket (to group similar clients)
    if (client.createdAt) {
        const dateBucket = new Date(client.createdAt);
        dateBucket.setHours(0, 0, 0, 0); // Round to day
        components.push(dateBucket.toISOString());
    }
    
    // Combine and hash
    const combined = components.join('|');
    const crypto = require('crypto');
    const hash = crypto.createHash('sha256').update(combined).digest('hex');
    
    return hash.substring(0, 32); // Take first 32 characters
}

async function migrateClients() {
    console.log('Starting client deduplication migration...');
    
    try {
        // Get all clients
        const clients = await Client.find({}).sort({ createdAt: 1 });
        console.log(`Found ${clients.length} clients to process`);
        
        const fingerprintMap = new Map();
        const duplicates = [];
        const processed = [];
        
        // Process each client
        for (const client of clients) {
            let fingerprint = client.machineFingerprint;
            
            // Generate fingerprint if not present
            if (!fingerprint) {
                fingerprint = await generateMachineFingerprint(client);
                console.log(`Generated fingerprint for client ${client.uuid}: ${fingerprint}`);
            }
            
            // Check for duplicates
            if (fingerprintMap.has(fingerprint)) {
                const existingClient = fingerprintMap.get(fingerprint);
                duplicates.push({
                    fingerprint,
                    existing: existingClient,
                    duplicate: client
                });
                console.log(`Found duplicate: ${client.uuid} matches ${existingClient.uuid}`);
            } else {
                fingerprintMap.set(fingerprint, client);
                processed.push(client);
            }
        }
        
        console.log(`Found ${duplicates.length} duplicate clients`);
        
        // Process duplicates
        for (const duplicate of duplicates) {
            const { fingerprint, existing, duplicate: dupClient } = duplicate;
            
            console.log(`Processing duplicate: ${dupClient.uuid} -> ${existing.uuid}`);
            
            // Update tasks to point to the canonical client
            const taskUpdateResult = await Task.updateMany(
                { agentUuid: dupClient.uuid },
                { $set: { agentUuid: existing.uuid } }
            );
            
            console.log(`Updated ${taskUpdateResult.modifiedCount} tasks for client ${dupClient.uuid}`);
            
            // Merge client data (keep the most complete record)
            const existingData = {
                computerName: existing.computerName,
                ipAddress: existing.ipAddress,
                hostname: existing.hostname,
                platform: existing.platform,
                operatingSystem: existing.operatingSystem,
                architecture: existing.architecture,
                capabilities: existing.capabilities,
                additionalSystemDetails: existing.additionalSystemDetails,
                lastActiveTime: existing.lastActiveTime,
                lastHeartbeat: existing.lastHeartbeat,
                status: existing.status
            };
            
            const duplicateData = {
                computerName: dupClient.computerName,
                ipAddress: dupClient.ipAddress,
                hostname: dupClient.hostname,
                platform: dupClient.platform,
                operatingSystem: dupClient.operatingSystem,
                architecture: dupClient.architecture,
                capabilities: dupClient.capabilities,
                additionalSystemDetails: dupClient.additionalSystemDetails,
                lastActiveTime: dupClient.lastActiveTime,
                lastHeartbeat: dupClient.lastHeartbeat,
                status: dupClient.status
            };
            
            // Merge data (prefer non-empty values)
            const mergedData = {};
            Object.keys(existingData).forEach(key => {
                const existingValue = existingData[key];
                const duplicateValue = duplicateData[key];
                
                if (existingValue && existingValue !== 'Unknown' && existingValue !== '') {
                    mergedData[key] = existingValue;
                } else if (duplicateValue && duplicateValue !== 'Unknown' && duplicateValue !== '') {
                    mergedData[key] = duplicateValue;
                } else {
                    mergedData[key] = existingValue || duplicateValue;
                }
            });
            
            // Update the canonical client with merged data
            await Client.findByIdAndUpdate(existing._id, {
                $set: {
                    ...mergedData,
                    machineFingerprint: fingerprint,
                    firstSeen: existing.firstSeen || existing.createdAt,
                    connectedAt: existing.connectedAt || existing.lastActiveTime,
                    uptimeSeconds: existing.uptimeSeconds || 0
                }
            });
            
            // Delete the duplicate client
            await Client.findByIdAndDelete(dupClient._id);
            console.log(`Deleted duplicate client: ${dupClient.uuid}`);
        }
        
        // Update remaining clients with missing fields
        for (const client of processed) {
            const updates = {};
            
            if (!client.machineFingerprint) {
                updates.machineFingerprint = await generateMachineFingerprint(client);
            }
            
            if (!client.firstSeen) {
                updates.firstSeen = client.createdAt;
            }
            
            if (!client.connectedAt && client.lastActiveTime) {
                updates.connectedAt = client.lastActiveTime;
            }
            
            if (client.uptimeSeconds === undefined) {
                updates.uptimeSeconds = 0;
            }
            
            if (Object.keys(updates).length > 0) {
                await Client.findByIdAndUpdate(client._id, { $set: updates });
                console.log(`Updated client ${client.uuid} with missing fields`);
            }
        }
        
        console.log('Migration completed successfully!');
        console.log(`Processed ${processed.length} unique clients`);
        console.log(`Merged ${duplicates.length} duplicate clients`);
        
    } catch (error) {
        console.error('Migration failed:', error);
        throw error;
    }
}

async function createIndexes() {
    console.log('Creating database indexes...');
    
    try {
        // Create Client indexes
        await Client.collection.createIndex({ uuid: 1 }, { unique: true });
        console.log('Created unique index on Client.uuid');
        
        await Client.collection.createIndex({ machineFingerprint: 1 }, { unique: true, sparse: true });
        console.log('Created unique sparse index on Client.machineFingerprint');
        
        await Client.collection.createIndex({ status: 1, lastHeartbeat: -1 });
        console.log('Created compound index on Client.status and lastHeartbeat');
        
        await Client.collection.createIndex({ machineFingerprint: 1, uuid: 1 });
        console.log('Created compound index on Client.machineFingerprint and uuid');
        
        // Create Task indexes
        await Task.collection.createIndex({ taskId: 1 }, { unique: true });
        console.log('Created unique index on Task.taskId');
        
        await Task.collection.createIndex({ agentUuid: 1, 'queue.state': 1, createdAt: -1 });
        console.log('Created compound index on Task.agentUuid, queue.state, and createdAt');
        
        await Task.collection.createIndex({ createdAt: -1 });
        console.log('Created index on Task.createdAt');
        
        await Task.collection.createIndex({ 'queue.state': 1, createdAt: -1 });
        console.log('Created compound index on Task.queue.state and createdAt');
        
        console.log('All indexes created successfully!');
        
    } catch (error) {
        console.error('Index creation failed:', error);
        throw error;
    }
}

async function main() {
    console.log('Starting database migration and deduplication...');
    
    try {
        await connectToDatabase();
        await createIndexes();
        await migrateClients();
        
        console.log('Migration completed successfully!');
        process.exit(0);
        
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

// Run migration if called directly
if (require.main === module) {
    main();
}

module.exports = {
    migrateClients,
    createIndexes,
    generateMachineFingerprint
};
