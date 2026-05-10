const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    rollNumber: {
        type: String,
        required: true,
        unique: true
    },
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    phone: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ['student', 'admin'],
        default: 'student'
    },
    course: String,
    batch: String,
    department: String,
    isActive: {
        type: Boolean,
        default: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// FIXED: Pre-save hook to hash password ONLY if it's modified and NOT already hashed
userSchema.pre('save', async function(next) {
    try {
        // Only hash if password is modified
        if (!this.isModified('password')) {
            return next();
        }
        
        // Check if password is already hashed (starts with $2b$ or $2a$)
        const password = this.password;
        if (password.startsWith('$2b$') || password.startsWith('$2a$')) {
            console.log('⚠️ Password already appears hashed, skipping re-hash');
            return next();
        }
        
        console.log('🔐 Hashing new password for:', this.rollNumber);
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        console.log('✅ Password hashed successfully');
        next();
    } catch (error) {
        console.error('❌ Password hashing error:', error);
        next(error);
    }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
    try {
        return await bcrypt.compare(candidatePassword, this.password);
    } catch (error) {
        console.error('❌ Compare error:', error);
        return false;
    }
};

module.exports = mongoose.model('User', userSchema);