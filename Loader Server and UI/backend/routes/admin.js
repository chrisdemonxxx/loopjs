const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');

// Database clearing endpoints
router.post('/clear-database', async (req, res) => {
  try {
    const { type } = req.body;
    
    switch (type) {
      case 'users':
        await clearUsers();
        break;
      case 'clients':
        await clearClients();
        break;
      case 'tasks':
        await clearTasks();
        break;
      case 'all':
        await clearAllData();
        break;
      default:
        return res.status(400).json({ error: 'Invalid clear type' });
    }
    
    res.json({ success: true, message: `${type} cleared successfully` });
  } catch (error) {
    console.error('Database clear error:', error);
    res.status(500).json({ error: 'Failed to clear database' });
  }
});

// Delete specific client
router.delete('/client/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await deleteClient(id);
    res.json({ success: true, message: 'Client deleted successfully' });
  } catch (error) {
    console.error('Client deletion error:', error);
    res.status(500).json({ error: 'Failed to delete client' });
  }
});

// Helper functions for database operations
async function clearUsers() {
  // Clear user data - implement based on your database structure
  console.log('Clearing users...');
  // If using file-based storage
  const usersFile = path.join(__dirname, '../data/users.json');
  try {
    await fs.writeFile(usersFile, JSON.stringify([]));
  } catch (error) {
    console.log('Users file not found, creating empty array');
  }
}

async function clearClients() {
  // Clear client data
  console.log('Clearing clients...');
  const clientsFile = path.join(__dirname, '../data/clients.json');
  try {
    await fs.writeFile(clientsFile, JSON.stringify([]));
  } catch (error) {
    console.log('Clients file not found, creating empty array');
  }
  
  // Also clear connected agents
  global.connectedAgents = new Map();
}

async function clearTasks() {
  // Clear task data
  console.log('Clearing tasks...');
  const tasksFile = path.join(__dirname, '../data/tasks.json');
  try {
    await fs.writeFile(tasksFile, JSON.stringify([]));
  } catch (error) {
    console.log('Tasks file not found, creating empty array');
  }
}

async function clearAllData() {
  // Clear all data
  console.log('Clearing all data...');
  await clearUsers();
  await clearClients();
  await clearTasks();
  
  // Clear any other data files
  const dataDir = path.join(__dirname, '../data');
  try {
    const files = await fs.readdir(dataDir);
    for (const file of files) {
      if (file.endsWith('.json')) {
        await fs.writeFile(path.join(dataDir, file), JSON.stringify([]));
      }
    }
  } catch (error) {
    console.log('Data directory not found');
  }
}

async function deleteClient(clientId) {
  // Delete specific client
  console.log(`Deleting client: ${clientId}`);
  
  // Remove from connected agents
  if (global.connectedAgents && global.connectedAgents.has(clientId)) {
    global.connectedAgents.delete(clientId);
  }
  
  // Remove from clients file
  const clientsFile = path.join(__dirname, '../data/clients.json');
  try {
    const data = await fs.readFile(clientsFile, 'utf8');
    const clients = JSON.parse(data);
    const updatedClients = clients.filter(client => client.id !== clientId);
    await fs.writeFile(clientsFile, JSON.stringify(updatedClients, null, 2));
  } catch (error) {
    console.log('Clients file not found or empty');
  }
}

module.exports = router;