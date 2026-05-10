const Transaction = require('../models/Transaction');
const Fee = require('../models/Fee');
const Receipt = require('../models/Receipt');
const Razorpay = require('razorpay');

// Initialize Razorpay
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});

// @desc    Create Razorpay order
// @route   POST /api/payments/create-order
exports.createOrder = async (req, res) => {
    try {
        const { 
            amount, 
            studentId, 
            studentName, 
            studentEmail, 
            studentPhone,
            serviceType,
            serviceName,
            feeId 
        } = req.body;

        // Validate required fields
        if (!amount || !studentId || !studentName || !studentEmail) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: amount, studentId, studentName, studentEmail are required'
            });
        }

        // Create Razorpay order
        const options = {
            amount: amount * 100, // Convert to paise
            currency: 'INR',
            receipt: `receipt_${Date.now()}`,
            notes: {
                studentId,
                studentName,
                serviceType,
                serviceName,
                feeId: feeId || ''
            }
        };

        const order = await razorpay.orders.create(options);

        // Create transaction record - make studentPhone optional
        const transaction = new Transaction({
            studentId,
            studentName,
            studentEmail,
            studentPhone: studentPhone || '', // Provide empty string if not provided
            serviceType,
            serviceName,
            amount,
            razorpay: {
                orderId: order.id
            },
            status: 'PENDING',
            metadata: {
                feeId: feeId || null
            }
        });

        await transaction.save();

        // If this payment is for a specific fee, update the fee record
        if (feeId) {
            await Fee.findByIdAndUpdate(feeId, {
                status: 'PROCESSING',
                transactionId: transaction._id
            });
        }

        res.json({
            success: true,
            orderId: order.id,
            amount: order.amount,
            currency: order.currency,
            keyId: process.env.RAZORPAY_KEY_ID,
            transactionId: transaction._id
        });

    } catch (error) {
        console.error('Order creation error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to create order',
            error: error.message 
        });
    }
};
// @desc    Verify payment after completion
// @route   POST /api/payments/verify-payment
exports.verifyPayment = async (req, res) => {
    try {
        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            transactionId,
            feeId
        } = req.body;

        // Verify signature
        const crypto = require('crypto');
        const body = razorpay_order_id + '|' + razorpay_payment_id;
        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(body.toString())
            .digest('hex');

        const isAuthentic = expectedSignature === razorpay_signature;

        if (!isAuthentic) {
            // Update transaction as failed
            await Transaction.findByIdAndUpdate(transactionId, {
                status: 'FAILED',
                'razorpay.paymentId': razorpay_payment_id,
                'razorpay.signature': razorpay_signature
            });

            return res.status(400).json({
                success: false,
                message: 'Invalid signature'
            });
        }

        // Get transaction details
        const transaction = await Transaction.findById(transactionId);
        
        if (!transaction) {
            return res.status(404).json({
                success: false,
                message: 'Transaction not found'
            });
        }

        // Update transaction as successful
        transaction.status = 'SUCCESS';
        transaction.razorpay.paymentId = razorpay_payment_id;
        transaction.razorpay.signature = razorpay_signature;
        await transaction.save();

        // Generate receipt number
        const receiptNumber = `RCPT${Date.now()}${Math.floor(Math.random() * 1000)}`;

        // Create receipt
        const receipt = new Receipt({
            receiptNumber,
            transactionId: transaction._id,
            studentRollNumber: transaction.studentId,
            studentName: transaction.studentName,
            amount: transaction.amount,
            paymentDate: new Date(),
            paymentMethod: 'razorpay',
            razorpayPaymentId: razorpay_payment_id
        });
        await receipt.save();

        // If this payment was for a specific fee, update fee status
        if (feeId || transaction.metadata?.feeId) {
            const targetFeeId = feeId || transaction.metadata?.feeId;
            await Fee.findByIdAndUpdate(targetFeeId, {
                status: 'PAID',
                paidAmount: transaction.amount,
                paidDate: new Date(),
                transactionId: transaction._id
            });
        }

        res.json({
            success: true,
            message: 'Payment verified successfully',
            transaction: {
                id: transaction._id,
                status: transaction.status,
                amount: transaction.amount,
                receiptNumber: receipt.receiptNumber
            }
        });

    } catch (error) {
        console.error('Payment verification error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Verification failed',
            error: error.message 
        });
    }
};

// @desc    Get transaction by ID
// @route   GET /api/payments/transaction/:transactionId
exports.getTransaction = async (req, res) => {
    try {
        const transaction = await Transaction.findById(req.params.transactionId);
        
        if (!transaction) {
            return res.status(404).json({
                success: false,
                message: 'Transaction not found'
            });
        }

        res.json({
            success: true,
            transaction
        });

    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: 'Failed to fetch transaction',
            error: error.message 
        });
    }
};

// @desc    Get all transactions for a student
// @route   GET /api/payments/student/:studentId
exports.getStudentTransactions = async (req, res) => {
    try {
        const transactions = await Transaction.find({ 
            studentId: req.params.studentId 
        }).sort({ createdAt: -1 });

        res.json({
            success: true,
            transactions
        });

    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: 'Failed to fetch transactions',
            error: error.message 
        });
    }
};

// @desc    Webhook handler for Razorpay events (optional)
// @route   POST /api/payments/webhook
exports.handleWebhook = async (req, res) => {
    try {
        const webhookSignature = req.headers['x-razorpay-signature'];
        const webhookBody = JSON.stringify(req.body);

        // Verify webhook signature
        const crypto = require('crypto');
        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(webhookBody)
            .digest('hex');

        if (expectedSignature !== webhookSignature) {
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid signature' 
            });
        }

        const event = req.body.event;
        const payload = req.body.payload;

        switch (event) {
            case 'payment.captured':
                // Handle successful payment
                console.log('Payment captured:', payload.payment.entity);
                break;
                
            case 'payment.failed':
                // Handle failed payment
                console.log('Payment failed:', payload.payment.entity);
                break;
                
            case 'order.paid':
                // Handle order paid
                console.log('Order paid:', payload.order.entity);
                break;
                
            default:
                console.log(`Unhandled event: ${event}`);
        }

        res.json({ received: true });

    } catch (error) {
        console.error('Webhook error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Webhook processing failed' 
        });
    }
};