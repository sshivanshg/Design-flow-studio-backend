const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import User model
const User = require('./src/models/User');

async function createAdminUser() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // Check if admin already exists
        const existingAdmin = await User.findOne({ role: 'admin' });
        if (existingAdmin) {
            console.log('✅ Admin user already exists:');
            console.log('Email:', existingAdmin.email);
            console.log('Name:', existingAdmin.name);
            console.log('Role:', existingAdmin.role);
            console.log('Created:', existingAdmin.createdAt);
            console.log('\n📝 You can login with these credentials:');
            console.log('Email: admin@designflowstudio.com');
            console.log('Password: admin123 (if this was the original password)');
            console.log('\n🔗 Login URL: POST /api/auth/login');
            return;
        }

        // Create admin user
        const adminUser = await User.create({
            name: 'System Admin',
            email: 'admin@designflowstudio.com',
            password: await bcrypt.hash('admin123', 10),
            role: 'admin',
            isEmailVerified: true,
            isActive: true
        });

        console.log('✅ Admin user created successfully:');
        console.log('Email:', adminUser.email);
        console.log('Password: admin123');
        console.log('Role:', adminUser.role);

    } catch (error) {
        console.error('❌ Error creating admin user:', error.message);
        
        // If it's a duplicate key error, try to find the existing user
        if (error.code === 11000) {
            console.log('\n🔍 Checking for existing admin users...');
            const allUsers = await User.find({});
            console.log('All users in database:');
            allUsers.forEach(user => {
                console.log(`- ${user.email} (${user.role})`);
            });
        }
    } finally {
        await mongoose.disconnect();
        console.log('\n🔌 Disconnected from MongoDB');
    }
}

// Run the script
createAdminUser(); 