const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
require('dotenv').config();

async function createTestUser() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/c2server');
        console.log('Connected to MongoDB');

        // Check if user already exists
        const existingUser = await User.findOne({ username: 'admin' });
        if (existingUser) {
            console.log('Admin user already exists');
            process.exit(0);
        }

        // Create admin user
        const hashedPassword = await bcrypt.hash('admin', 10);
        const user = new User({
            username: 'admin',
            password: hashedPassword,
            role: 'admin'
        });

        await user.save();
        console.log('Admin user created successfully');
        
    } catch (error) {
        console.error('Error creating user:', error);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

createTestUser();

