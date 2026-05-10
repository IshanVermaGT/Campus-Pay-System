const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');

// All admin routes require authentication AND admin role
router.use(auth);
router.use(admin);

// Admin routes
router.get('/students', adminController.getAllStudents);
router.post('/fees/assign', adminController.assignFee);
router.get('/fees', adminController.getAllFees);
router.put('/fees/:feeId', adminController.updateFee);
router.get('/reports', adminController.getReports);

module.exports = router;