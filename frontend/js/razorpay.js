// RazorPay configuration and helper functions
const RAZORPAY_CONFIG = {
    key: '', // Will be set dynamically from backend
    amount: 0,
    currency: 'INR',
    name: 'Campus Payment System',
    description: 'Campus Services Payment',
    image: 'https://campus.edu/logo.png',
    handler: function(response) {
        // This will be overridden
    },
    prefill: {
        name: '',
        email: '',
        contact: ''
    },
    notes: {},
    theme: {
        color: '#667eea'
    },
    modal: {
        ondismiss: function() {
            console.log('Payment modal closed');
            hideLoading();
        }
    }
};

// Open RazorPay checkout
function openRazorPay(options) {
    return new Promise((resolve, reject) => {
        const razorpayOptions = {
            ...RAZORPAY_CONFIG,
            key: options.key,
            amount: options.amount,
            currency: options.currency,
            order_id: options.orderId,
            name: 'Campus Payment System',
            description: options.description || 'Campus Services Payment',
            prefill: {
                name: options.studentName,
                email: options.studentEmail,
                contact: options.studentPhone
            },
            notes: options.notes || {},
            handler: function(response) {
                resolve(response);
            },
            modal: {
                ondismiss: function() {
                    reject(new Error('Payment cancelled by user'));
                    hideLoading();
                }
            }
        };

        const razorpay = new Razorpay(razorpayOptions);
        razorpay.open();
    });
}