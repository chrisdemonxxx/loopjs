# Create default admin user for testing
const bcrypt = require('bcryptjs');
const User = require('./models/User');

async function createAdminUser() {
  try {
    const existingUser = await User.findOne({ username: 'admin' });
    if (existingUser) {
      console.log('Admin user already exists');
      return;
    }
    
    const hashedPassword = await bcrypt.hash('admin123', 10);
    const admin = new User({
      username: 'admin',
      password: hashedPassword,
      role: 'admin'
    });
    
    await admin.save();
    console.log('Admin user created: username=admin, password=admin123');
  } catch (error) {
    console.log('Could not create admin user (database not connected):', error.message);
  }
}

createAdminUser();
