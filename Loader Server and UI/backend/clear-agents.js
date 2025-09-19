const mongoose = require('mongoose');
const Client = require('./models/Client');
const Task = require('./models/Task');
require('dotenv').config();

async function clearAllAgents() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/loopjs');
        console.log('✅ Connected to MongoDB');

        // Get count of agents before deletion
        const agentCount = await Client.countDocuments();
        console.log(`📊 Found ${agentCount} agents in database`);

        // Get count of tasks before deletion
        const taskCount = await Task.countDocuments();
        console.log(`📊 Found ${taskCount} tasks in database`);

        if (agentCount === 0 && taskCount === 0) {
            console.log('✅ Database is already clean - no agents or tasks to remove');
            process.exit(0);
        }

        // Clear all agents
        if (agentCount > 0) {
            const agentResult = await Client.deleteMany({});
            console.log(`🗑️  Deleted ${agentResult.deletedCount} agents from database`);
        }

        // Clear all tasks
        if (taskCount > 0) {
            const taskResult = await Task.deleteMany({});
            console.log(`🗑️  Deleted ${taskResult.deletedCount} tasks from database`);
        }

        console.log('✅ All agent data cleared successfully');
        console.log('🔄 Server panel should now show no residual information');
        
    } catch (error) {
        console.error('❌ Error clearing agents:', error);
        process.exit(1);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Disconnected from MongoDB');
        process.exit(0);
    }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
    console.log('\n🛑 Received interrupt signal, shutting down...');
    await mongoose.disconnect();
    process.exit(0);
});

console.log('🚀 Starting agent cleanup process...');
clearAllAgents();