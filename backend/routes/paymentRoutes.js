const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const auth = require('../middleware/auth');

// Public routes (for payment processing)
router.post('/create-order', paymentController.createOrder);
router.post('/verify-payment', paymentController.verifyPayment);
router.post('/webhook', paymentController.handleWebhook);

// Protected routes (require authentication)
router.get('/transaction/:transactionId', auth, paymentController.getTransaction);
router.get('/student/:studentId', auth, paymentController.getStudentTransactions);

module.exports = router;