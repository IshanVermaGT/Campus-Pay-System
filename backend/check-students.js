const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const User = require('./models/User');

async function checkStudents() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB\n');

        // Find all students
        const students = await User.find({ role: 'student' });
        
        console.log(`📊 Total students found: ${students.length}\n`);
        
        if (students.length === 0) {
            console.log('❌ No students found in database!');
            console.log('   You need to register students first.');
            console.log('   Go to: http://127.0.0.1:5500/frontend/register.html');
            console.log('   Create some test student accounts.\n');
        } else {
            console.log('📋 Student List:');
            students.forEach((s, i) => {
                console.log(`   ${i+1}. ${s.rollNumber} - ${s.name} (${s.email})`);
            });
        }

        // Also check if there are any users at all
        const allUsers = await User.find({});
        console.log(`\n👥 Total users in database: ${allUsers.length}`);
        console.log('   Roles:', [...new Set(allUsers.map(u => u.role))]);

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await mongoose.disconnect();
    }
}

checkStudents();