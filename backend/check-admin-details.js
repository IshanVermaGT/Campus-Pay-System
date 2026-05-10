const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
dotenv.config();

const User = require('./models/User');

async function checkAdmin() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB\n');

        // Find all admins
        const admins = await User.find({ role: 'admin' });
        
        if (admins.length === 0) {
            console.log('❌ No admin found in database');
            return;
        }

        console.log(`📋 Found ${admins.length} admin(s):\n`);
        
        for (const admin of admins) {
            console.log('Admin Details:');
            console.log('   ID:', admin._id);
            console.log('   Roll Number:', admin.rollNumber);
            console.log('   Name:', admin.name);
            console.log('   Email:', admin.email);
            console.log('   Role:', admin.role);
            console.log('   Password Hash:', admin.password.substring(0, 30) + '...');
            console.log('   Is Active:', admin.isActive);
            
            // Test password comparison
            const testPassword = 'admin123';
            const isValid = await bcrypt.compare(testPassword, admin.password);
            console.log(`   Password 'admin123' valid:`, isValid ? '✅ YES' : '❌ NO');
            
            console.log('-------------------\n');
        }

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await mongoose.disconnect();
    }
}

checkAdmin();