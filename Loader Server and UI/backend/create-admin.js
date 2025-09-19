require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    
    // Check if admin already exists
    const existingAdmin = await User.findOne({ username: 'admin' });
    if (existingAdmin) {
      console.log('⚠️  Admin user already exists!');
      return;
    }
    
    const password = await bcrypt.hash('admin123', 10);
    await User.create({ 
      username: 'admin', 
      password,
      role: 'admin'
    });
    console.log('✅ Admin user created successfully!');
    console.log('📋 Login credentials:');
    console.log('   Username: admin');
    console.log('   Password: admin123');
    console.log('⚠️  Please change the default password after first login!');
  } catch (err) {
    console.error('❌ Error creating admin user:', err.message);
  } finally {
    process.exit();
  }
})();
