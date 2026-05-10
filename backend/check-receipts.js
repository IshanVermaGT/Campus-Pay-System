const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const Receipt = require('./models/Receipt');
const Transaction = require('./models/Transaction');

async function checkReceipts() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB\n');

        // Check all receipts
        const allReceipts = await Receipt.find({});
        console.log(`📊 Total receipts in database: ${allReceipts.length}`);
        
        if (allReceipts.length > 0) {
            console.log('\n📋 All receipts:');
            allReceipts.forEach((receipt, index) => {
                console.log(`\n--- Receipt ${index + 1} ---`);
                console.log('ID:', receipt._id.toString());
                console.log('Receipt Number:', receipt.receiptNumber);
                console.log('Student Roll:', receipt.studentRollNumber);
                console.log('Student Name:', receipt.studentName);
                console.log('Amount:', receipt.amount);
                console.log('Transaction ID:', receipt.transactionId);
                console.log('Razorpay Payment ID:', receipt.razorpayPaymentId);
            });
        }

        // Check specifically for the ID we're looking for
        const targetId = '69a54e5626c4c95de18efd7e';
        console.log(`\n🔍 Searching for receipt with ID: ${targetId}`);
        
        const receipt = await Receipt.findById(targetId);
        if (receipt) {
            console.log('✅ Receipt found!');
            console.log('Receipt details:', receipt);
        } else {
            console.log('❌ Receipt not found with that ID');
            
            // Try to find by transactionId
            console.log(`\n🔍 Searching for receipt with transactionId: ${targetId}`);
            const receiptByTransaction = await Receipt.findOne({ transactionId: targetId });
            if (receiptByTransaction) {
                console.log('✅ Receipt found by transactionId!');
                console.log('Receipt ID:', receiptByTransaction._id.toString());
                console.log('Transaction ID:', receiptByTransaction.transactionId);
            } else {
                console.log('❌ No receipt found with that transactionId either');
            }
        }

        // Check if there's a transaction with this ID
        console.log(`\n🔍 Searching for transaction with ID: ${targetId}`);
        const transaction = await Transaction.findById(targetId);
        if (transaction) {
            console.log('✅ Transaction found!');
            console.log('Transaction details:', {
                id: transaction._id.toString(),
                studentId: transaction.studentId,
                amount: transaction.amount,
                status: transaction.status
            });
        } else {
            console.log('❌ No transaction found with that ID');
        }

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('\n👋 Disconnected from MongoDB');
    }
}

checkReceipts();