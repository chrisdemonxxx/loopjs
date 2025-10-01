const mongoose = require('mongoose');
const Client = require('./models/Client');
const Task = require('./models/Task');
const AuditLog = require('./models/AuditLog');
const RefreshToken = require('./models/RefreshToken');
require('dotenv').config();

async function clearAllAgents() {
    try {
        // Connect to MongoDB using the correct URI from .env
        const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/loopjs';
        await mongoose.connect(mongoUri);
        console.log('✅ Connected to MongoDB');

        // Get count of all data before deletion
        const agentCount = await Client.countDocuments();
        const taskCount = await Task.countDocuments();
        const auditCount = await AuditLog.countDocuments();
        const tokenCount = await RefreshToken.countDocuments();
        
        console.log(`📊 Found ${agentCount} agents in database`);
        console.log(`📊 Found ${taskCount} tasks in database`);
        console.log(`📊 Found ${auditCount} audit logs in database`);
        console.log(`📊 Found ${tokenCount} refresh tokens in database`);

        if (agentCount === 0 && taskCount === 0 && auditCount === 0 && tokenCount === 0) {
            console.log('✅ Database is already clean - no data to remove');
            process.exit(0);
        }

        // Clear all agents/clients
        if (agentCount > 0) {
            const agentResult = await Client.deleteMany({});
            console.log(`🗑️  Deleted ${agentResult.deletedCount} agents from database`);
        }

        // Clear all tasks
        if (taskCount > 0) {
            const taskResult = await Task.deleteMany({});
            console.log(`🗑️  Deleted ${taskResult.deletedCount} tasks from database`);
        }

        // Clear all audit logs
        if (auditCount > 0) {
            const auditResult = await AuditLog.deleteMany({});
            console.log(`🗑️  Deleted ${auditResult.deletedCount} audit logs from database`);
        }

        // Clear all refresh tokens
        if (tokenCount > 0) {
            const tokenResult = await RefreshToken.deleteMany({});
            console.log(`🗑️  Deleted ${tokenResult.deletedCount} refresh tokens from database`);
        }

        console.log('✅ All data cleared successfully');
        console.log('🔄 Server panel should now show no residual information');
        
    } catch (error) {
        console.error('❌ Error clearing data:', error);
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