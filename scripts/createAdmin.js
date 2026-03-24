/**
 * Script to create the first admin user
 * Run with: node scripts/createAdmin.js
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { loadLocalEnv } = require('./load-local-env.js');

loadLocalEnv();

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error('Missing MONGODB_URI. Set it in .env.local or your shell environment.');
  process.exit(1);
}

const UserSchema = new mongoose.Schema({
  username: String,
  email: String,
  password: String,
  role: String,
  createdAt: Date,
  lastLoginAt: Date,
  createdBy: mongoose.Schema.Types.ObjectId,
  isActive: Boolean,
});

const User = mongoose.models.User || mongoose.model('User', UserSchema);

async function createAdminUser() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected successfully!');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ username: 'admin' });
    
    if (existingAdmin) {
      console.log('Admin user already exists!');
      console.log('Username:', existingAdmin.username);
      console.log('Email:', existingAdmin.email);
      console.log('Role:', existingAdmin.role);
      process.exit(0);
    }

    // Create new admin user
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    const adminUser = await User.create({
      username: 'admin',
      email: 'admin@aiavatar.com',
      password: hashedPassword,
      role: 'admin',
      isActive: true,
      createdAt: new Date(),
    });

    console.log('\n✅ Admin user created successfully!');
    console.log('------------------------');
    console.log('Username: admin');
    console.log('Email: admin@aiavatar.com');
    console.log('Password: admin123');
    console.log('Role: admin');
    console.log('------------------------');
    console.log('\n⚠️  Please change the password after first login!');

    process.exit(0);
  } catch (error) {
    console.error('Error creating admin user:', error);
    process.exit(1);
  }
}

createAdminUser();

