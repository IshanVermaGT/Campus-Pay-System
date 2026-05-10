const User = require('../models/User');
const Fee = require('../models/Fee');
const Transaction = require('../models/Transaction');

// Get all students
exports.getAllStudents = async (req, res) => {
    try {
        const students = await User.find({ role: 'student' })
            .select('-password')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            students
        });

    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: 'Failed to fetch students' 
        });
    }
};

// Assign fee to student
exports.assignFee = async (req, res) => {
    try {
        const { rollNumber, feeType, amount, dueDate, description } = req.body;

        // Check if student exists
        const student = await User.findOne({ 
            rollNumber, 
            role: 'student' 
        });

        if (!student) {
            return res.status(404).json({ 
                success: false, 
                message: 'Student not found' 
            });
        }

        // Create fee
        const fee = new Fee({
            studentRollNumber: rollNumber,
            feeType,
            amount,
            dueDate,
            description,
            assignedBy: req.user.rollNumber,
            status: 'PENDING'
        });

        await fee.save();

        res.status(201).json({
            success: true,
            message: 'Fee assigned successfully',
            fee
        });

    } catch (error) {
        console.error('Assign fee error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to assign fee' 
        });
    }
};

// Get all fees with filters
exports.getAllFees = async (req, res) => {
    try {
        const { status, rollNumber, feeType } = req.query;
        
        let query = {};
        if (status) query.status = status;
        if (rollNumber) query.studentRollNumber = rollNumber;
        if (feeType) query.feeType = feeType;

        const fees = await Fee.find(query)
            .sort({ dueDate: 1 })
            .limit(100);

        res.json({
            success: true,
            fees
        });

    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: 'Failed to fetch fees' 
        });
    }
};

// Get payment reports
exports.getReports = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        let dateFilter = {};
        if (startDate && endDate) {
            dateFilter = {
                createdAt: {
                    $gte: new Date(startDate),
                    $lte: new Date(endDate)
                }
            };
        }

        const payments = await Transaction.find({
            status: 'SUCCESS',
            ...dateFilter
        });

        const totalAmount = payments.reduce((sum, p) => sum + p.amount, 0);
        
        // Group by service type
        const byService = {};
        payments.forEach(p => {
            byService[p.serviceType] = (byService[p.serviceType] || 0) + p.amount;
        });

        res.json({
            success: true,
            report: {
                totalTransactions: payments.length,
                totalAmount,
                byService,
                payments
            }
        });

    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: 'Failed to generate report' 
        });
    }
};

// Update fee status (mark as waived, etc.)
exports.updateFee = async (req, res) => {
    try {
        const { feeId } = req.params;
        const { status, remarks } = req.body;

        const fee = await Fee.findByIdAndUpdate(
            feeId,
            { status, remarks },
            { new: true }
        );

        res.json({
            success: true,
            message: 'Fee updated successfully',
            fee
        });

    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: 'Failed to update fee' 
        });
    }
};