const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
dotenv.config();

const User = require('./models/User');

async function createAdmin() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB\n');

        // Delete any existing admin
        await User.deleteMany({ role: 'admin' });
        console.log('🗑️  Deleted existing admins\n');

        // Create admin with plain password (let the model hash it)
        const admin = new User({
            rollNumber: 'ADMIN001',
            name: 'Admin User',
            email: 'admin@campus.edu',
            phone: '9999999999',
            password: 'admin123',  // Plain password - model will hash it ONCE
            role: 'admin',
            isActive: true
        });

        await admin.save();
        console.log('✅ Admin saved\n');

        // Verify the password works
        const savedAdmin = await User.findOne({ rollNumber: 'ADMIN001' });
        const isValid = await savedAdmin.comparePassword('admin123');
        
        console.log('🔐 LOGIN TEST:');
        console.log('   Roll Number: ADMIN001');
        console.log('   Password: admin123');
        console.log('   Result:', isValid ? '✅ SUCCESS - YOU CAN LOGIN!' : '❌ FAILED');
        
        if (isValid) {
            console.log('\n🎉 SUCCESS! Admin is ready to use.');
        } else {
            console.log('\n❌ Still not working. Let me know and we\'ll debug further.');
        }

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await mongoose.disconnect();
    }
}

createAdmin();