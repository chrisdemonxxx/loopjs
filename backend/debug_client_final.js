const { MongoClient } = require('mongodb');
require('dotenv').config();

const uri = process.env.MONGO_URI;
const client = new MongoClient(uri);

async function debugClient() {
  try {
    await client.connect();
    console.log('Connected to MongoDB Atlas');
    
    const db = client.db('stealth-client');
    const collection = db.collection('clients');
    
    // Check the newly registered client
    const newUuid = '14911692-e07a-466d-997b-9e2341bb61de';
    const newClient = await collection.findOne({ uuid: newUuid });
    
    if (newClient) {
      console.log('\n=== NEW CLIENT FOUND ===');
      console.log('UUID:', newClient.uuid);
      console.log('Computer Name:', newClient.computerName);
      console.log('IP Address:', newClient.ipAddress);
      console.log('Hostname:', newClient.hostname);
      console.log('Platform:', newClient.platform);
      console.log('Operating System:', newClient.operatingSystem);
      console.log('Capabilities:', JSON.stringify(newClient.capabilities, null, 2));
      console.log('Last Heartbeat:', newClient.lastHeartbeat);
      console.log('Status:', newClient.status);
    } else {
      console.log('New client not found');
    }
    
    // Count total clients
    const totalClients = await collection.countDocuments();
    console.log('\n=== TOTAL CLIENTS ===');
    console.log('Total clients in database:', totalClients);
    
    // List last 3 clients
    const lastClients = await collection.find().sort({ _id: -1 }).limit(3).toArray();
    console.log('\n=== LAST 3 CLIENTS ===');
    lastClients.forEach((client, index) => {
      console.log(`${index + 1}. UUID: ${client.uuid}, Computer: ${client.computerName}, Features: ${client.capabilities?.features?.length || 0} items`);
      if (client.capabilities?.features) {
        console.log(`   Features: [${client.capabilities.features.join(', ')}]`);
      }
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

debugClient();