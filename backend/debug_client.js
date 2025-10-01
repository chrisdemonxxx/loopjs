const mongoose = require('mongoose');
const Client = require('./models/Client');
require('dotenv').config();

async function debugClient() {
  try {
    // Connect using the same URI as the backend
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB Atlas');
    
    // Find the current client
    const client = await Client.findOne({uuid: 'e8df61f5-ff7c-444d-baea-e89839686fb3'});
    
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
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

debugClient();