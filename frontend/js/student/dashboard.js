// Check authentication
if (!requireAuth()) {
    // redirecting...
}

// Get current user
const user = getCurrentUser();
if (!user) {
    console.error('❌ No user found');
    window.location.href = '../login.html';
}

// Set user info in the dashboard
document.getElementById('studentName').textContent = user.name || 'Student';
document.getElementById('studentRoll').textContent = user.rollNumber || 'N/A';

// Set current date in header
const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
document.getElementById('currentDate').textContent = new Date().toLocaleDateString('en-US', options);

// Load dashboard data
async function loadDashboard() {
    try {
        console.log('📊 Loading student dashboard...');
        
        // Load fees
        const feesData = await apiCall('/student/fees');
        const pendingFees = feesData.fees ? feesData.fees.filter(f => f.status === 'PENDING') : [];
        
        // Load payments
        const paymentsData = await apiCall('/student/payments');
        const recentPayments = paymentsData.payments ? paymentsData.payments.slice(0, 5) : [];

        // Update stats
        const totalPaid = paymentsData.payments
            ? paymentsData.payments.filter(p => p.status === 'SUCCESS').reduce((sum, p) => sum + p.amount, 0)
            : 0;
        
        const dueAmount = pendingFees.reduce((sum, f) => sum + f.amount, 0);

        document.getElementById('totalPaid').textContent = `₹${totalPaid.toLocaleString()}`;
        document.getElementById('pendingCount').textContent = pendingFees.length;
        document.getElementById('dueAmount').textContent = `₹${dueAmount.toLocaleString()}`;
        
        // Get receipt count
        try {
            const receiptsData = await apiCall('/student/receipts');
            document.getElementById('receiptCount').textContent = receiptsData.receipts ? receiptsData.receipts.length : 0;
        } catch (e) {
            document.getElementById('receiptCount').textContent = '0';
        }

        // Display pending fees
        const pendingTable = document.getElementById('pendingFeesTable');
        if (pendingFees.length === 0) {
            pendingTable.innerHTML = '<tr><td colspan="6" class="text-center">✨ No pending fees</td></tr>';
        } else {
            pendingTable.innerHTML = pendingFees.map(fee => {
                const dueDate = new Date(fee.dueDate);
                const today = new Date();
                const isOverdue = dueDate < today;
                
                return `
                <tr>
                    <td><strong>${fee.feeType}</strong></td>
                    <td>${fee.description || '—'}</td>
                    <td class="${isOverdue ? 'amount-due' : ''}">₹${fee.amount.toLocaleString()}</td>
                    <td>${dueDate.toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'short', 
                        day: 'numeric' 
                    })}</td>
                    <td><span class="badge ${isOverdue ? 'danger' : 'warning'}">${isOverdue ? 'Overdue' : fee.status}</span></td>
                    <td>
                        <button class="btn-pay" onclick="payFee('${fee._id}', ${fee.amount}, '${fee.feeType}')">
                            Pay Now
                        </button>
                    </td>
                </tr>
            `}).join('');
        }

        // Display recent payments - WITHOUT receipt button
const recentTable = document.getElementById('recentPaymentsTable');
if (recentPayments.length === 0) {
    recentTable.innerHTML = `
        <tr>
            <td colspan="4" class="text-center">
                <div class="empty-state">
                    <span>💳</span>
                    <p>No payments yet</p>
                    <small>Your payment history will appear here</small>
                </div>
            </td>
        </tr>
    `;
} else {
    recentTable.innerHTML = recentPayments.map(p => `
        <tr>
            <td>${new Date(p.createdAt).toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'short', 
                day: 'numeric' 
            })}</td>
            <td>${p.serviceName || p.serviceType}</td>
            <td class="amount paid">₹${p.amount.toLocaleString()}</td>
            <td><span class="badge success">Paid</span></td>
        </tr>
    `).join('');
}
    } catch (error) {
        console.error('❌ Error loading dashboard:', error);
        
        // Show error in tables
        document.getElementById('pendingFeesTable').innerHTML = 
            '<tr><td colspan="6" class="text-center" style="color: #e74c3c;">❌ Failed to load data</td></tr>';
        document.getElementById('recentPaymentsTable').innerHTML = `
    <tr>
        <td colspan="4" class="text-center" style="color: #e74c3c; padding: 40px;">
            ❌ Failed to load data. Please refresh.
        </td>
    </tr>
`;
    }
}

// Pay fee
async function payFee(feeId, amount, feeType) {
    try {
        console.log('💰 Initiating payment for:', feeType);
        
        const userPhone = user.phone || '';
        
        const orderData = await apiCall('/payments/create-order', {
            method: 'POST',
            body: JSON.stringify({
                amount: amount,
                studentId: user.rollNumber,
                studentName: user.name,
                studentEmail: user.email,
                studentPhone: userPhone,
                serviceType: feeType,
                serviceName: feeType,
                feeId: feeId
            })
        });

        console.log('✅ Order created:', orderData);

        const options = {
            key: orderData.keyId,
            amount: orderData.amount,
            currency: orderData.currency,
            name: 'Campus Payment',
            description: `Payment for ${feeType}`,
            order_id: orderData.orderId,
            handler: async function(response) {
                console.log('✅ Payment response:', response);
                
                try {
                    const verifyData = await apiCall('/payments/verify-payment', {
                        method: 'POST',
                        body: JSON.stringify({
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                            transactionId: orderData.transactionId,
                            feeId: feeId
                        })
                    });

                    console.log('✅ Payment verified:', verifyData);
                    alert('✅ Payment successful!');
                    loadDashboard();

                } catch (error) {
                    console.error('❌ Verification error:', error);
                    alert('❌ Payment verification failed: ' + error.message);
                }
            },
            modal: {
                ondismiss: function() {
                    console.log('Payment cancelled by user');
                }
            },
            prefill: {
                name: user.name,
                email: user.email,
                contact: userPhone
            },
            theme: {
                color: '#667eea'
            }
        };

        const razorpay = new Razorpay(options);
        razorpay.open();

    } catch (error) {
        console.error('❌ Payment initiation error:', error);
        alert('❌ Failed to initiate payment: ' + error.message);
    }
}
// Load dashboard on page load
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Student dashboard initializing...');
    loadDashboard();
});