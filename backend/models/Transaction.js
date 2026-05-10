const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
    studentId: {
        type: String,
        required: true
    },
    studentName: {
        type: String,
        required: true
    },
    studentEmail: {
        type: String,
        required: true
    },
    studentPhone: {
        type: String,
        required: false  // Changed from true to false
    },
    serviceType: {
        type: String,
        enum: ['TUITION', 'LIBRARY', 'HOSTEL', 'EVENT', 'LAB', 'SPORTS', 'CANTEEN', 'OTHER'],
        required: true
    },
    serviceName: {
        type: String,
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    currency: {
        type: String,
        default: 'INR'
    },
    razorpay: {
        orderId: String,
        paymentId: String,
        signature: String
    },
    status: {
        type: String,
        enum: ['PENDING', 'PROCESSING', 'SUCCESS', 'FAILED'],
        default: 'PENDING'
    },
    paymentMethod: String,
    description: String,
    metadata: {
        feeId: String
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Transaction', transactionSchema);