require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('./models/User');

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const password = await bcrypt.hash('admin123', 10);
    await User.create({ username: 'admin', password });
    console.log('✅ Admin user created!');
  } catch (err) {
    console.error('Error:', err);
  } finally {
    process.exit();
  }
})();
