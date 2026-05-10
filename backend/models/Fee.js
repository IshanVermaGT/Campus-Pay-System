const mongoose = require('mongoose');

const feeSchema = new mongoose.Schema({
    studentRollNumber: {
        type: String,
        required: true,
        index: true
    },
    feeType: {
        type: String,
        enum: ['TUITION', 'LIBRARY', 'HOSTEL', 'LAB', 'SPORTS', 'OTHER'],
        required: true
    },
    description: String,
    amount: {
        type: Number,
        required: true
    },
    dueDate: {
        type: Date,
        required: true
    },
    status: {
        type: String,
        enum: ['PENDING', 'PARTIAL', 'PAID', 'OVERDUE'],
        default: 'PENDING'
    },
    assignedBy: {
        type: String,  // Admin's roll number
        required: true
    },
    assignedDate: {
        type: Date,
        default: Date.now
    },
    paidAmount: {
        type: Number,
        default: 0
    },
    paidDate: Date,
    transactionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Transaction'
    },
    remarks: String
});

module.exports = mongoose.model('Fee', feeSchema);