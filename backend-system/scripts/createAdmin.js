import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import User from '../models/User.js';

dotenv.config();

const createAdminAccount = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/job-platform-rwanda');
    console.log('✅ Connected to MongoDB');

    // Admin credentials
    const adminEmail = 'admin@jobify.rw';
    const adminPassword = 'AdminSecure123!';

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: adminEmail });
    if (existingAdmin) {
      console.log('⚠️  Admin account already exists:', adminEmail);
      mongoose.connection.close();
      return;
    }

    // Create admin user
    const admin = new User({
      email: adminEmail,
      password: adminPassword,
      userType: 'admin',
      approvalStatus: 'approved',
      profile: {
        firstName: 'Admin',
        lastName: 'Account',
        bio: 'System Administrator'
      }
    });

    await admin.save();
    console.log('✅ Admin account created successfully!');
    console.log('📧 Email:', adminEmail);
    console.log('🔐 Password:', adminPassword);
    console.log('\n⚠️  IMPORTANT: Change this password immediately after first login!');
    console.log('💾 Store these credentials in a secure location.');

    mongoose.connection.close();
  } catch (error) {
    console.error('❌ Error creating admin account:', error);
    mongoose.connection.close();
    process.exit(1);
  }
};

createAdminAccount();
