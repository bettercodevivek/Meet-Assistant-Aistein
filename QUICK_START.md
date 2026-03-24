# 🚀 Quick Start Guide - Admin Panel

## Initial Setup (First Time Only)

### Step 1: Create Admin User
```bash
cd InteractiveAvatar
node scripts/createAdmin.js
```

**Output:**
```
✅ Admin user created successfully!
------------------------
Username: admin
Email: admin@aiavatar.com
Password: admin123
Role: admin
------------------------
```

### Step 2: Start the Application
```bash
npm run dev
# or
pnpm dev
```

### Step 3: Login as Admin
1. Navigate to `http://localhost:3000/login`
2. Enter credentials:
   - **Username:** `admin`
   - **Password:** `admin123`
3. Click "Login"

You should now see the admin menu with:
- 🏠 New Session
- 💬 My Sessions
- 📚 Knowledge Base
- 🎛️ **Admin Dashboard**
- 👥 **User Management**

---

## Creating Your First Regular User

### From User Management Page

1. Click **"User Management"** in the sidebar
2. Click **"+ Add New User"** button
3. Fill in the form:
   - **Username:** `john_doe` (required)
   - **Email:** `john@example.com` (optional)
   - **Password:** `password123` (required, min 6 chars)
   - **Confirm Password:** `password123`
4. Click **"Create User"**

✅ User created successfully!

---

## Testing Regular User Access

### Login as Regular User

1. **Logout** from admin account (click "Sign Out")
2. Go to `/login`
3. Enter:
   - **Username:** `john_doe`
   - **Password:** `password123`
4. Click "Login"

### Verify Regular User View

Regular users should see:
- ✅ New Session
- ✅ My Sessions
- ✅ Knowledge Base
- ❌ NO Admin Dashboard
- ❌ NO User Management

### Test Data Isolation

1. Create a knowledge base as regular user
2. Start a conversation
3. Logout and login as admin
4. Go to User Management → Click "Details" on the user
5. You should see their knowledge bases and conversations

---

## Admin Operations Guide

### View All Users
**Path:** `/dashboard/admin/users`

Shows table with:
- Username, Email, Role
- Status (Active/Inactive)
- Conversation count
- Knowledge base count
- Last login date

### View User Details
1. Go to User Management
2. Click **"Details"** button on any user
3. See three tabs:
   - **Overview** - User info and statistics
   - **Knowledge Bases** - All user's KBs with edit/delete
   - **Conversations** - All user's chats

### Edit User's Knowledge Base
1. Go to User Details → Knowledge Bases tab
2. Click **"Edit"** on any KB
3. Modify:
   - Knowledge Base Name
   - Welcome Message
   - System Prompt
4. Click **"Save Changes"**

### Reset User Password
1. Go to User Management
2. Click **"Reset"** button on user
3. Enter new password (min 6 chars)
4. Confirm new password
5. Click **"Reset Password"**

### Deactivate User
1. Go to User Management
2. Click **"Deactivate"** button on user
3. Confirm the action
4. User will not be able to login until reactivated

### Delete User
1. Go to User Management
2. Click **"Delete"** button on user
3. Read the warning (deletes ALL user data)
4. Click **"Delete Permanently"**

⚠️ This deletes:
- User account
- All conversations
- All messages
- All knowledge bases

---

## Common Tasks

### Change Admin Password

**Option 1: Using Admin Panel**
1. Create a new admin user
2. Delete the old admin user (if desired)

**Option 2: Using Script**
1. Edit `scripts/createAdmin.js`
2. Change the password in line 43
3. Delete existing admin from database
4. Run `node scripts/createAdmin.js`

### View All Conversations

**Path:** `/dashboard/admin/conversations`

Shows all conversations from all users with:
- User information
- Knowledge base used
- Message count
- Status
- Timestamps

### Filter Conversations by User

**Path:** `/dashboard/admin/conversations?userId=USER_ID`

Or click "View Chats" from User Management table.

---

## Troubleshooting

### Admin user already exists
**Error:** "Admin user already exists!"

**Solution:** Admin was already created. Just login with `admin`/`admin123`.

### Cannot see Admin menu
**Problem:** Logged in but no admin options visible.

**Solutions:**
1. Check if user role is 'admin' in database
2. Clear browser cache and cookies
3. Logout and login again
4. Check console for errors

### User cannot login after creation
**Problem:** "Account is inactive" error.

**Solutions:**
1. Check isActive status in database
2. As admin, go to User Management
3. Click "Activate" button on the user

### Forgot admin password
**Solutions:**

**Option 1: Reset via Database**
```javascript
// In MongoDB shell or Compass
db.users.updateOne(
  { username: 'admin' },
  { $set: { password: '$2a$10$...' } } // Use bcrypt hash
)
```

**Option 2: Delete and Recreate**
```javascript
// In MongoDB shell or Compass
db.users.deleteOne({ username: 'admin' })
```
Then run:
```bash
node scripts/createAdmin.js
```

---

## Security Best Practices

### 1. Change Default Password
After first login, create a new admin with a strong password and delete the default one.

### 2. Use Strong Passwords
- Minimum 8 characters
- Mix of uppercase, lowercase, numbers, symbols

### 3. Regular Backups
Backup your MongoDB database regularly:
```bash
mongodump --uri="your-mongodb-uri" --out=backup
```

### 4. Set Strong JWT Secret
In `.env.local`:
```
JWT_SECRET=your-very-long-random-secret-key-here
```

### 5. Use HTTPS in Production
Set in `.env.production`:
```
NODE_ENV=production
```

---

## Quick Reference

### Admin Credentials (Default)
```
Username: admin
Password: admin123
Email: admin@aiavatar.com
```

### Key Paths
```
/dashboard/admin                    # Admin dashboard
/dashboard/admin/users              # User management
/dashboard/admin/users/:id          # User details
/dashboard/admin/conversations      # All conversations
```

### Scripts
```bash
node scripts/createAdmin.js         # Create admin user
node scripts/migrateUsers.js        # Migrate existing users
```

---

## Need Help?

Check `ADMIN_PANEL_IMPLEMENTATION.md` for complete documentation.

