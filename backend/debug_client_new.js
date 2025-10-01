const mongoose = require('mongoose');
const Client = require('./models/Client');
require('dotenv').config();

async function debugClient() {
  try {
    // Connect using the same URI as the backend
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB Atlas');
    
    // Find the current client
    const client = await Client.findOne({uuid: '0aef7de0-cc19-49fa-8844-ad00b901dc5c'});
    
    if (client) {
      console.log('Client found:');
      console.log('UUID:', client.uuid);
      console.log('Computer Name:', client.computerName);
      console.log('IP Address:', client.ipAddress);
      console.log('Hostname:', client.hostname);
      console.log('Platform:', client.platform);
      console.log('Operating System:', client.operatingSystem);
      console.log('Capabilities:', JSON.stringify(client.capabilities, null, 2));
      console.log('Last Heartbeat:', client.lastHeartbeat);
      console.log('Status:', client.status);
      console.log('Last Active Time:', client.lastActiveTime);
      console.log('\nFull client object:');
      console.log(JSON.stringify(client.toObject(), null, 2));
    } else {
      console.log('Client not found');
    }
    
    // List all clients
    const allClients = await Client.find({});
    console.log(`\nTotal clients in database: ${allClients.length}`);
    
    // Show the last 3 clients
    const recentClients = await Client.find({}).sort({createdAt: -1}).limit(3);
    console.log('\nLast 3 clients:');
    recentClients.forEach((client, index) => {
      console.log(`${index + 1}. UUID: ${client.uuid}, Name: ${client.computerName}, Platform: ${client.platform}, Status: ${client.status}`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

debugClient();