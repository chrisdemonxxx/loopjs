#!/usr/bin/env node
/**
 * Create admin user directly in MongoDB
 * Use this if Render service is suspended
 */

const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

// Load environment
function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env.deploy');
  const envContent = fs.readFileSync(envPath, 'utf8');
  const env = {};
  envContent.split('\n').forEach(line => {
    line = line.trim();
    if (line && !line.startsWith('#')) {
      const [key, ...valueParts] = line.split('=');
      if (key && valueParts.length > 0) {
        env[key.trim()] = valueParts.join('=').trim();
      }
    }
  });
  return env;
}

const env = loadEnv();
const MONGODB_URI = env.MONGODB_URI;

async function createAdminUser() {
  console.log('\n🔐 Creating Admin User Directly in MongoDB\n' + '='.repeat(50));

  const client = new MongoClient(MONGODB_URI);

  try {
    // Connect
    console.log('🔌 Connecting to MongoDB...');
    await client.connect();
    console.log('✅ Connected!\n');

    const db = client.db('loopjs');
    const users = db.collection('users');

    // Check if admin exists
    const existingAdmin = await users.findOne({ username: 'admin' });

    if (existingAdmin) {
      console.log('⚠️  Admin user already exists!');
      console.log('\nExisting admin details:');
      console.log(`  Username: ${existingAdmin.username}`);
      console.log(`  Email: ${existingAdmin.email}`);
      console.log(`  Role: ${existingAdmin.role}`);
      console.log('\nUse this to login at: https://loopjs-xi.vercel.app\n');
      return;
    }

    // Create admin
    console.log('📝 Creating admin user...');

    const hashedPassword = await bcrypt.hash('admin123', 10);

    const adminUser = {
      username: 'admin',
      email: 'admin@loopjs.local',
      password: hashedPassword,
      role: 'admin',
      displayName: 'Administrator',
      twoFactorEnabled: false,
      preferences: {
        theme: 'dark',
        language: 'en',
        notifications: true,
        autoRefresh: true,
        refreshInterval: 30
      },
      refreshTokens: [],
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await users.insertOne(adminUser);

    console.log('✅ Admin user created successfully!\n');
    console.log('📋 Login Credentials:');
    console.log('─'.repeat(50));
    console.log('  Username: admin');
    console.log('  Password: admin123');
    console.log('  Email:    admin@loopjs.local');
    console.log('  Role:     admin');
    console.log('─'.repeat(50));
    console.log('\n🌐 Login at: https://loopjs-xi.vercel.app\n');
    console.log('⚠️  IMPORTANT: Change the password after first login!\n');

  } catch (error) {
    console.error('\n❌ Error:', error.message);

    if (error.message.includes('not authorized')) {
      console.log('\n💡 Fix:');
      console.log('   1. Go to: https://cloud.mongodb.com');
      console.log('   2. Click "Network Access"');
      console.log('   3. Click "Add IP Address"');
      console.log('   4. Click "Allow Access from Anywhere" (0.0.0.0/0)');
      console.log('   5. Click "Confirm"\n');
    }
  } finally {
    await client.close();
  }
}

createAdminUser().catch(console.error);
