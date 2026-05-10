const mongoose = require('mongoose');

const receiptSchema = new mongoose.Schema({
    receiptNumber: {
        type: String,
        required: true,
        unique: true
    },
    transactionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Transaction',
        required: true
    },
    studentRollNumber: String,
    studentName: String,
    feeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Fee'
    },
    amount: Number,
    paymentDate: Date,
    paymentMethod: String,
    razorpayPaymentId: String,
    pdfUrl: String,
    emailedTo: String,
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Receipt', receiptSchema);