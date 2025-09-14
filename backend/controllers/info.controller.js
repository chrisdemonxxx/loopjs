const Client = require('../models/Client');
const catchAsync = require('../utils/catchAsync');

/**
 * Fetches the list of all clients (agents) from the database.
 * Maps Client model to User interface format expected by frontend
 */
const getUserListAction = catchAsync(async (req, res, next) => {
    console.log('🔍 Fetching client list...');
    
    const clients = await Client.find({});
    console.log(`📊 Found ${clients.length} clients in database`);
    
    // Map Client model to User interface format
    const mappedClients = clients.map(client => {
        console.log(`📋 Mapping client: ${client.uuid} - ${client.computerName}`);
        
        return {
            uuid: client.uuid,
            computerName: client.computerName || 'Unknown',
            ipAddress: client.ipAddress || client.ip || 'Unknown',
            country: client.country || 'Unknown',
            status: client.status || 'offline',
            lastActiveTime: client.lastActiveTime ? 
                client.lastActiveTime.toISOString().split('T')[0] : 
                (client.lastSeen ? client.lastSeen.toISOString().split('T')[0] : 'Never'),
            additionalSystemDetails: client.additionalSystemDetails || client.platform || 'Unknown',
            // Legacy fields for backward compatibility
            hostname: client.hostname,
            platform: client.platform,
            lastSeen: client.lastSeen,
            createdAt: client.createdAt,
            updatedAt: client.updatedAt
        };
    });
    
    console.log(`✅ Successfully mapped ${mappedClients.length} clients`);
    
    res.status(200).json({
        status: 'success',
        data: mappedClients,
    });
});

/**
 * Registers a new client or updates existing client information
 */
const registerClientAction = catchAsync(async (req, res, next) => {
    const { uuid, computerName, ipAddress, hostname, platform, additionalSystemDetails } = req.body;
    
    console.log('🔄 Client registration attempt:', {
        uuid,
        computerName,
        ipAddress,
        hostname,
        platform,
        additionalSystemDetails
    });
    
    if (!uuid || !computerName || !ipAddress) {
        console.log('❌ Missing required fields for client registration');
        return res.status(400).json({
            status: 'error',
            message: 'Missing required fields: uuid, computerName, ipAddress'
        });
    }
    
    try {
        // Try to find existing client
        let client = await Client.findOne({ uuid });
        
        if (client) {
            // Update existing client
            client.computerName = computerName;
            client.ipAddress = ipAddress;
            client.hostname = hostname || client.hostname;
            client.platform = platform || client.platform;
            client.additionalSystemDetails = additionalSystemDetails || client.additionalSystemDetails;
            client.status = 'online';
            client.lastActiveTime = new Date();
            client.lastSeen = new Date(); // Legacy field
            client.ip = ipAddress; // Legacy field
            
            await client.save();
            console.log('✅ Updated existing client:', uuid);
        } else {
            // Create new client
            client = new Client({
                uuid,
                computerName,
                ipAddress,
                hostname: hostname || 'Unknown',
                platform: platform || 'Unknown',
                additionalSystemDetails: additionalSystemDetails || 'Unknown',
                status: 'online',
                lastActiveTime: new Date(),
                lastSeen: new Date(), // Legacy field
                ip: ipAddress, // Legacy field
                country: 'Unknown' // Will be updated later with IP geolocation
            });
            
            await client.save();
            console.log('✅ Registered new client:', uuid);
        }
        
        res.status(200).json({
            status: 'success',
            message: 'Client registered successfully',
            data: client
        });
        
    } catch (error) {
        console.error('❌ Client registration error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to register client'
        });
    }
});

/**
 * Updates client heartbeat/status
 */
const updateClientHeartbeatAction = catchAsync(async (req, res, next) => {
    const { uuid } = req.body;
    
    if (!uuid) {
        return res.status(400).json({
            status: 'error',
            message: 'UUID is required'
        });
    }
    
    const client = await Client.findOneAndUpdate(
        { uuid },
        { 
            status: 'online',
            lastActiveTime: new Date(),
            lastSeen: new Date() // Legacy field
        },
        { new: true }
    );
    
    if (!client) {
        return res.status(404).json({
            status: 'error',
            message: 'Client not found'
        });
    }
    
    res.status(200).json({
        status: 'success',
        message: 'Heartbeat updated'
    });
});

// Export the functions so they can be used by info.route.js
module.exports = {
    getUserListAction,
    registerClientAction,
    updateClientHeartbeatAction,
};
