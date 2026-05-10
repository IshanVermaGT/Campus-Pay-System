const Fee = require('../models/Fee');
const Transaction = require('../models/Transaction');
const Receipt = require('../models/Receipt');

// Get student's fees
exports.getMyFees = async (req, res) => {
    try {
        const fees = await Fee.find({ 
            studentRollNumber: req.user.rollNumber 
        }).sort({ dueDate: 1 });

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

// Get student's payment history
exports.getMyPayments = async (req, res) => {
    try {
        const payments = await Transaction.find({ 
            studentId: req.user.rollNumber 
        })
        .sort({ createdAt: -1 })
        .limit(50);

        res.json({
            success: true,
            payments
        });

    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: 'Failed to fetch payments' 
        });
    }
};

// Get student's receipts
exports.getMyReceipts = async (req, res) => {
    try {
        const receipts = await Receipt.find({ 
            studentRollNumber: req.user.rollNumber 
        })
        .populate('transactionId')
        .sort({ createdAt: -1 });

        res.json({
            success: true,
            receipts
        });

    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: 'Failed to fetch receipts' 
        });
    }
};

// Download receipt as PDF
// Download receipt as PDF
exports.downloadReceipt = async (req, res) => {
    try {
        // Get token from header OR query parameter
        let token = req.headers['x-auth-token'] || req.query.token;
        
        if (!token) {
            return res.status(401).json({ 
                success: false, 
                message: 'No token, authorization denied' 
            });
        }

        // Verify token
        const jwt = require('jsonwebtoken');
        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET);
        } catch (err) {
            return res.status(401).json({ 
                success: false, 
                message: 'Invalid token' 
            });
        }

        const id = req.params.receiptId;
        
        // Find receipt
        let receipt = await Receipt.findById(id).populate('transactionId');
        
        if (!receipt) {
            receipt = await Receipt.findOne({ transactionId: id }).populate('transactionId');
        }

        if (!receipt) {
            return res.status(404).json({ 
                success: false, 
                message: 'Receipt not found' 
            });
        }

        // Verify ownership
        if (receipt.studentRollNumber !== decoded.rollNumber) {
            return res.status(403).json({ 
                success: false, 
                message: 'Unauthorized access to receipt' 
            });
        }

        // Generate PDF
        const PDFDocument = require('pdfkit');
        const doc = new PDFDocument({ 
            margin: 50,
            size: 'A4',
            layout: 'portrait'
        });
        
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=receipt-${receipt.receiptNumber}.pdf`);
        
        doc.pipe(res);
        
        // ============================================================
        // PROFESSIONAL RECEIPT DESIGN
        // ============================================================
        
        // Color definitions
        const primaryColor = '#667eea';
        const secondaryColor = '#764ba2';
        const accentColor = '#10b981';
        const textDark = '#1e293b';
        const textGray = '#64748b';
        const borderColor = '#e2e8f0';
        
        // ===== HEADER SECTION =====
        
        // Top gradient bar
        doc.rect(0, 0, doc.page.width, 8)
           .fill(primaryColor);
        
        // Second accent bar
        doc.rect(0, 8, doc.page.width, 4)
           .fill(secondaryColor);
        
        // College Name
        doc.fontSize(24)
           .font('Helvetica-Bold')
           .fillColor(textDark)
           .text('CAMPUS PAYMENT SYSTEM', 50, 45, { align: 'center' });
        
        doc.fontSize(11)
           .font('Helvetica')
           .fillColor(textGray)
           .text('Chandigarh Engineering College, Mohali, Punjab, India', 50, 78, { align: 'center' });
        
        // Decorative line
        doc.moveTo(50, 100)
           .lineTo(doc.page.width - 50, 100)
           .lineWidth(1.5)
           .strokeColor(primaryColor)
           .stroke();
        
        // ===== RECEIPT TITLE SECTION =====
        
        // Receipt title background
        doc.roundedRect(150, 115, doc.page.width - 300, 40, 8)
           .fill(primaryColor);
        
        doc.fontSize(18)
           .font('Helvetica-Bold')
           .fillColor('#ffffff')
           .text('PAYMENT RECEIPT', 150, 125, { align: 'center', width: doc.page.width - 300 });
        
        // ===== RECEIPT HEADER INFO (Right side) =====
        
        doc.fontSize(10)
           .font('Helvetica')
           .fillColor(textGray);
        
        // Receipt Number box
        doc.rect(doc.page.width - 160, 115, 130, 35)
           .strokeColor(borderColor)
           .lineWidth(1)
           .stroke();
        
        doc.fillColor(textGray)
           .text('RECEIPT NO.', doc.page.width - 155, 120, { width: 120, align: 'center' });
        
        doc.font('Helvetica-Bold')
           .fillColor(textDark)
           .text(receipt.receiptNumber, doc.page.width - 155, 135, { width: 120, align: 'center', fontSize: 10 });
        
        // ===== TWO COLUMN LAYOUT =====
        
        const leftCol = 70;
        const rightCol = doc.page.width / 2 + 50;
        let yPos = 180;
        
        // Section: PAYMENT INFORMATION
        doc.font('Helvetica-Bold')
           .fillColor(primaryColor)
           .fontSize(12)
           .text('PAYMENT INFORMATION', leftCol, yPos);
        
        doc.moveTo(leftCol, yPos + 15)
           .lineTo(leftCol + 200, yPos + 15)
           .lineWidth(1)
           .strokeColor(primaryColor)
           .stroke();
        
        yPos += 30;
        
        // Payment Details Table
        doc.font('Helvetica-Bold')
           .fillColor(textGray)
           .fontSize(10);
        
        doc.text('Date:', leftCol, yPos);
        doc.text('Transaction ID:', leftCol, yPos + 25);
        doc.text('Payment Method:', leftCol, yPos + 50);
        doc.text('Status:', leftCol, yPos + 75);
        
        doc.font('Helvetica')
           .fillColor(textDark);
        
        doc.text(new Date(receipt.createdAt).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        }), leftCol + 120, yPos);
        
        doc.text(receipt.razorpayPaymentId || 'N/A', leftCol + 120, yPos + 25);
        doc.text('Razorpay (Online Payment)', leftCol + 120, yPos + 50);
        
        // Status with green color
        doc.fillColor(accentColor)
           .font('Helvetica-Bold')
           .text('SUCCESS', leftCol + 120, yPos + 75);
        
        // ===== STUDENT INFORMATION SECTION =====
        yPos = 180;
        
        doc.font('Helvetica-Bold')
           .fillColor(primaryColor)
           .fontSize(12)
           .text('STUDENT INFORMATION', rightCol, yPos);
        
        doc.moveTo(rightCol, yPos + 15)
           .lineTo(rightCol + 200, yPos + 15)
           .lineWidth(1)
           .strokeColor(primaryColor)
           .stroke();
        
        yPos += 30;
        
        doc.font('Helvetica-Bold')
           .fillColor(textGray)
           .fontSize(10);
        
        doc.text('Student Name:', rightCol, yPos);
        doc.text('Roll Number:', rightCol, yPos + 25);
        doc.text('Course:', rightCol, yPos + 50);
        doc.text('Batch:', rightCol, yPos + 75);
        
        doc.font('Helvetica')
           .fillColor(textDark);
        
        doc.text(receipt.studentName, rightCol + 120, yPos);
        doc.text(receipt.studentRollNumber, rightCol + 120, yPos + 25);
        doc.text(receipt.transactionId?.serviceType || 'TUITION', rightCol + 120, yPos + 50);
        doc.text(new Date().getFullYear() + '-' + (new Date().getFullYear() + 1), rightCol + 120, yPos + 75);
        
        // ===== PAYMENT SUMMARY TABLE =====
        yPos = 320;
        
        doc.font('Helvetica-Bold')
           .fillColor(primaryColor)
           .fontSize(12)
           .text('PAYMENT SUMMARY', leftCol, yPos);
        
        doc.moveTo(leftCol, yPos + 15)
           .lineTo(doc.page.width - 50, yPos + 15)
           .lineWidth(1)
           .strokeColor(borderColor)
           .stroke();
        
        yPos += 35;
        
        // Table Headers
        doc.rect(leftCol, yPos, doc.page.width - 100, 25)
           .fill('#f8fafc')
           .strokeColor(borderColor)
           .stroke();
        
        doc.font('Helvetica-Bold')
           .fillColor(textGray)
           .fontSize(10)
           .text('Description', leftCol + 10, yPos + 8);
        doc.text('Amount', leftCol + 300, yPos + 8);
        doc.text('Due Date', leftCol + 380, yPos + 8);
        
        yPos += 25;
        
        // Table Row
        doc.rect(leftCol, yPos, doc.page.width - 100, 35)
           .strokeColor(borderColor)
           .stroke();
        
        doc.font('Helvetica')
           .fillColor(textDark)
           .fontSize(10)
           .text(receipt.transactionId?.serviceName || 'Tuition Fee Payment', leftCol + 10, yPos + 12);
        
        doc.font('Helvetica-Bold')
           .fillColor(accentColor)
           .text(`₹${receipt.amount.toLocaleString()}`, leftCol + 300, yPos + 12);
        
        doc.font('Helvetica')
           .fillColor(textGray)
           .text('Immediate', leftCol + 380, yPos + 12);
        
        yPos += 35;
        
        // Total Row
        doc.rect(leftCol, yPos, doc.page.width - 100, 30)
           .fill('#f1f5f9')
           .strokeColor(borderColor)
           .stroke();
        
        doc.font('Helvetica-Bold')
           .fillColor(textDark)
           .fontSize(11)
           .text('TOTAL AMOUNT', leftCol + 10, yPos + 10);
        
        doc.font('Helvetica-Bold')
           .fillColor(accentColor)
           .fontSize(14)
           .text(`₹${receipt.amount.toLocaleString()}`, leftCol + 380, yPos + 8);
        
        // ===== FOOTER SECTION =====
        
        // Razorpay Logo and Powered By text
        const footerY = doc.page.height - 100;
        
        doc.moveTo(50, footerY - 20)
           .lineTo(doc.page.width - 50, footerY - 20)
           .lineWidth(1)
           .strokeColor(borderColor)
           .stroke();
        
        // Razorpay styled text (logo replacement)
        doc.fontSize(14)
           .font('Helvetica-Bold')
           .fillColor('#0d9488')
           .text('razorpay', 50, footerY, { continued: true });
        doc.fontSize(10)
           .font('Helvetica')
           .fillColor(textGray)
           .text('  •  Payment Gateway', { continued: false });
        
        // Powered by text
        doc.fontSize(9)
           .font('Helvetica')
           .fillColor(textGray)
           .text('Payment processed securely through Razorpay', 50, footerY + 15);
        
        // Thank you message
        doc.fontSize(11)
           .font('Helvetica-Bold')
           .fillColor(primaryColor)
           .text('Thank you for your payment!', doc.page.width / 2, footerY, { align: 'center' });
        
        // Footer note
        doc.fontSize(8)
           .font('Helvetica')
           .fillColor(textGray)
           .text('This is a digitally generated receipt • Valid without signature', doc.page.width / 2, footerY + 20, { align: 'center' });
        
        // Page number
        doc.fontSize(8)
           .fillColor(textGray)
           .text(`Generated on ${new Date().toLocaleString()}`, 50, doc.page.height - 40);
        
        doc.text(`Page 1 of 1`, doc.page.width - 100, doc.page.height - 40);
        
        doc.end();

    } catch (error) {
        console.error('❌ Receipt download error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to download receipt' 
        });
    }
};