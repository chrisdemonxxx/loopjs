const mongoose = require('mongoose');
const Client = require('./models/Client');
require('dotenv').config();

// Sample test data for development
const sampleClients = [
  {
    uuid: 'test-windows-001',
    computerName: 'DESKTOP-WIN10',
    ipAddress: '192.168.1.100',
    country: 'United States',
    hostname: 'desktop-win10.local',
    platform: 'windows',
    operatingSystem: 'windows',
    osVersion: 'Windows 10 Pro',
    architecture: 'x64',
    capabilities: {
      persistence: ['registry', 'startup', 'service'],
      injection: ['dll', 'process_hollowing', 'reflective_dll'],
      evasion: ['amsi_bypass', 'etw_bypass', 'defender_bypass'],
      commands: ['cmd', 'powershell', 'wmi', 'registry'],
      features: ['hvnc', 'keylogger', 'screenCapture', 'fileManager', 'processManager']
    },
    systemInfo: {
      cpu: 'Intel Core i7-9700K',
      ram: '16 GB',
      gpu: 'NVIDIA GeForce RTX 3070'
    },
    lastHeartbeat: new Date(),
    authToken: 'test-token-001'
  },
  {
    uuid: 'test-mac-001',
    computerName: 'MacBook-Pro',
    ipAddress: '192.168.1.101',
    country: 'Canada',
    hostname: 'macbook-pro.local',
    platform: 'macos',
    operatingSystem: 'macos',
    osVersion: 'macOS Monterey 12.6',
    architecture: 'arm64',
    capabilities: {
      persistence: ['launchd', 'cron', 'login_items'],
      injection: ['dylib', 'mach_inject'],
      evasion: ['sip_bypass', 'gatekeeper_bypass'],
      commands: ['bash', 'zsh', 'osascript'],
      features: ['keylogger', 'screenCapture', 'fileManager', 'processManager', 'webcam-capture']
    },
    systemInfo: {
      cpu: 'Apple M1 Pro',
      ram: '32 GB',
      gpu: 'Apple M1 Pro GPU'
    },
    lastHeartbeat: new Date(Date.now() - 2 * 60 * 1000), // 2 minutes ago
    authToken: 'test-token-002'
  },
  {
    uuid: 'test-android-001',
    computerName: 'Samsung Galaxy S21',
    ipAddress: '192.168.1.102',
    country: 'United Kingdom',
    hostname: 'android-device',
    platform: 'android',
    operatingSystem: 'android',
    osVersion: 'Android 13',
    architecture: 'arm64',
    capabilities: {
      persistence: ['system_app', 'device_admin'],
      injection: ['zygote', 'native_hook'],
      evasion: ['root_detection_bypass', 'ssl_pinning_bypass'],
      commands: ['shell', 'su', 'am', 'pm'],
      features: ['sms-manager', 'contacts-manager', 'location-tracker', 'app-manager', 'screenCapture']
    },
    systemInfo: {
      cpu: 'Snapdragon 888',
      ram: '8 GB',
      storage: '128 GB'
    },
    lastHeartbeat: new Date(Date.now() - 10 * 60 * 1000), // 10 minutes ago (offline)
    authToken: 'test-token-003'
  }
];

async function seedDatabase() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/loopjs');
    console.log('Connected to MongoDB');

    // Clear existing clients
    await Client.deleteMany({});
    console.log('Cleared existing clients');

    // Insert sample clients
    await Client.insertMany(sampleClients);
    console.log('Sample clients inserted successfully');

    console.log('Database seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  seedDatabase();
}

module.exports = { seedDatabase, sampleClients };