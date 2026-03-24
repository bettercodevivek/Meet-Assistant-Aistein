/**
 * Script to migrate existing users to new schema
 * Run with: node scripts/migrateUsers.js
 */

const mongoose = require('mongoose');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ai_avatar_studio';

const UserSchema = new mongoose.Schema({
  username: String,
  email: String,
  password: String,
  role: String,
  createdAt: Date,
  lastLoginAt: Date,
});

const User = mongoose.models.User || mongoose.model('User', UserSchema);

async function migrateUsers() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected successfully!');

    // Find all users
    const users = await User.find({});
    console.log(`\nFound ${users.length} users`);

    let migrated = 0;

    for (const user of users) {
      let needsUpdate = false;
      
      // Add role if missing
      if (!user.role) {
        user.role = user.username === 'admin' ? 'admin' : 'user';
        needsUpdate = true;
        console.log(`- Adding role '${user.role}' to user: ${user.username}`);
      }
      
      // Add email if missing
      if (!user.email) {
        user.email = `${user.username}@temp.local`;
        needsUpdate = true;
        console.log(`- Adding email '${user.email}' to user: ${user.username}`);
      }
      
      if (needsUpdate) {
        await user.save();
        migrated++;
      }
    }

    console.log(`\n✅ Migration complete!`);
    console.log(`- ${migrated} users migrated`);
    console.log(`- ${users.length - migrated} users already up to date`);

    process.exit(0);
  } catch (error) {
    console.error('Migration error:', error);
    process.exit(1);
  }
}

migrateUsers();

