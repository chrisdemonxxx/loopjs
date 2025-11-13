const catchAsync = require('../utils/catchAsync');
const { clientIntegration, webPanelIntegration } = require('../configs/integration');

/**
 * Fetches the list of all clients (agents) from the database.
 * Uses integration layer to get and format client data
 */
const getUserListAction = catchAsync(async (req, res, next) => {
    console.log('🔍 Fetching client list...');
    
    const clients = await clientIntegration.getAllClients();
    console.log(`📊 Found ${clients.length} clients in database`);
    
    // Use integration layer to format clients for web panel
    const mappedClients = webPanelIntegration.formatClientListForWebPanel(clients);
    
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
        // Use integration layer to register client
        const client = await clientIntegration.registerClient({
            uuid,
            computerName,
            ipAddress,
            hostname: hostname || 'Unknown',
            platform: platform || 'Unknown',
            additionalSystemDetails: additionalSystemDetails || 'Unknown'
        });
        
        console.log('✅ Client registered successfully:', uuid);
        
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
    
    try {
        const client = await clientIntegration.updateClientHeartbeat(uuid);
        
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
    } catch (error) {
        console.error('❌ Heartbeat update error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to update heartbeat'
        });
    }
});

// Export the functions so they can be used by info.route.js
module.exports = {
    getUserListAction,
    registerClientAction,
    updateClientHeartbeatAction,
};
