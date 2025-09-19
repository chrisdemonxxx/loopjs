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
      // Check if client already exists
      let client = await Client.findOne({ uuid: clientData.uuid });
      
      if (client) {
        // Update existing client
        client.computerName = clientData.computerName || client.computerName;
        client.ipAddress = clientData.ipAddress || client.ipAddress;
        client.hostname = clientData.hostname || client.hostname;
        client.platform = clientData.platform || client.platform;
        client.additionalSystemDetails = clientData.additionalSystemDetails || client.additionalSystemDetails;
        client.status = 'online';
        client.lastActiveTime = new Date();
        
        await client.save();
        return client;
      } else {
        // Create new client
        const newClient = new Client({
          uuid: clientData.uuid,
          computerName: clientData.computerName,
          ipAddress: clientData.ipAddress,
          hostname: clientData.hostname,
          platform: clientData.platform,
          additionalSystemDetails: clientData.additionalSystemDetails,
          status: 'online',
          lastActiveTime: new Date()
        });
        
        await newClient.save();
        return newClient;
      }
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
  updateClientHeartbeat: async (uuid) => {
    try {
      const client = await Client.findOneAndUpdate(
        { uuid },
        { 
          $set: { 
            status: 'online',
            lastActiveTime: new Date()
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
      ws.clientType = 'stealth';
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
      return await clientIntegration.updateClientHeartbeat(data.uuid);
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