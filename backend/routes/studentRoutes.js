const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');
const auth = require('../middleware/auth');

// All student routes require authentication
router.use(auth);

// Student routes
router.get('/fees', studentController.getMyFees);
router.get('/payments', studentController.getMyPayments);
router.get('/receipts', studentController.getMyReceipts);
router.get('/receipts/:receiptId/download', studentController.downloadReceipt);

module.exports = router;