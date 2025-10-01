const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

// Production MongoDB connection
const MONGO_URI = 'mongodb+srv://chrisdemonxxx:QrsdvAf7K3ZVcwRG@cluster0.lsyii5u.mongodb.net/loopjs-production?retryWrites=true&w=majority&appName=Cluster0';

async function createAdminUser() {
    try {
        // Connect to MongoDB
        await mongoose.connect(MONGO_URI);
        console.log('Connected to production MongoDB');

        // Check if admin user already exists
        const existingAdmin = await User.findOne({ username: 'admin' });
        
        if (existingAdmin) {
            console.log('Admin user already exists in production!');
            console.log('Username: admin');
            console.log('You can reset the password if needed.');
            return;
        }

        // Hash the password
        const saltRounds = 12;
        const hashedPassword = await bcrypt.hash('admin123', saltRounds);

        // Create admin user
        const adminUser = new User({
            username: 'admin',
            password: hashedPassword,
            role: 'admin',
            createdAt: new Date(),
            lastLogin: null
        });

        await adminUser.save();
        
        console.log('✅ Production admin user created successfully!');
        console.log('📋 Default credentials:');
        console.log('   Username: admin');
        console.log('   Password: admin123');
        console.log('⚠️  IMPORTANT: Change this password after first login!');
        
    } catch (error) {
        console.error('❌ Error creating admin user:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from production MongoDB');
    }
}

// Run the script
createAdminUser();