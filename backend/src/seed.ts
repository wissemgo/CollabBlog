/**
 * Database seeding script for CollabBlog
 * Creates default admin user and initial data
 */

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import User from './models/User';
import { UserRole } from './types';

// Load environment variables
dotenv.config();

const seedDatabase = async () => {
  try {
    // Connect to MongoDB
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/collab-blog';
    await mongoose.connect(mongoURI);
    console.log('✅ Connected to MongoDB');

    // Check if admin user already exists
    const existingAdmin = await User.findOne({ role: UserRole.ADMIN });
    if (existingAdmin) {
      console.log('⚠️  Admin user already exists');
      await mongoose.connection.close();
      return;
    }

    // Create default admin user
    const adminPassword = await bcrypt.hash('admin123', 12);
    const adminUser = new User({
      username: 'admin',
      email: 'admin@collabblog.com',
      password: adminPassword,
      role: UserRole.ADMIN,
      isEmailVerified: true
    });

    await adminUser.save();
    console.log('✅ Default admin user created:');
    console.log(`   Username: admin`);
    console.log(`   Email: admin@collabblog.com`);
    console.log(`   Password: admin123`);
    console.log(`   Role: ${UserRole.ADMIN}`);

    // Create sample users
    const sampleUsers = [
      {
        username: 'editor',
        email: 'editor@collabblog.com',
        password: await bcrypt.hash('editor123', 12),
        role: UserRole.EDITOR,
        isEmailVerified: true
      },
      {
        username: 'writer',
        email: 'writer@collabblog.com',
        password: await bcrypt.hash('writer123', 12),
        role: UserRole.WRITER,
        isEmailVerified: true
      },
      {
        username: 'reader',
        email: 'reader@collabblog.com',
        password: await bcrypt.hash('reader123', 12),
        role: UserRole.READER,
        isEmailVerified: true
      }
    ];

    for (const userData of sampleUsers) {
      const existingUser = await User.findOne({ email: userData.email });
      if (!existingUser) {
        const user = new User(userData);
        await user.save();
        console.log(`✅ Sample user created: ${user.username} (${user.role})`);
      } else {
        console.log(`⚠️  Sample user already exists: ${userData.username}`);
      }
    }

    console.log('✅ Database seeding completed successfully');
    await mongoose.connection.close();
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
};

// Run the seeding function
seedDatabase();