console.log('🔥🔥🔥 APP.JS IS RUNNING!');
console.log('Current time:', new Date().toLocaleTimeString());
console.log('Frontend URL:', window.location.href);

// API Configuration
const API_BASE_URL = 'http://localhost:5000/api';

// Test backend connection
async function testBackendConnection() {
    try {
        console.log('📡 Testing connection to backend...');
        const response = await fetch('http://localhost:5000/api/test-db', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
            mode: 'cors',
            credentials: 'include'
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('✅ Backend connected:', data);
        return true;
    } catch (error) {
        console.error('❌ Backend connection failed:', error);
        console.error('Make sure backend server is running on port 5000');
        return false;
    }
}

// Campus services data
const CAMPUS_SERVICES = [
    {
        id: 'tuition',
        name: 'Tuition Fee',
        type: 'TUITION',
        description: 'Pay your semester tuition fees securely',
        amount: 25000,
        icon: '📚'
    },
    {
        id: 'hostel',
        name: 'Hostel Fee',
        type: 'HOSTEL',
        description: 'Accommodation and mess charges',
        amount: 15000,
        icon: '🏠'
    },
    {
        id: 'library',
        name: 'Library Fee',
        type: 'LIBRARY',
        description: 'Library membership and late fines',
        amount: 2000,
        icon: '📖'
    },
    {
        id: 'event',
        name: 'Event Registration',
        type: 'EVENT',
        description: 'Register for campus events and workshops',
        amount: 500,
        icon: '🎉'
    }
];

// State management
let currentState = {
    selectedService: null,
    transactionId: null,
    orderId: null
};

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    console.log('📄 DOM fully loaded');
    loadServices();
    setupEventListeners();
    testBackendConnection();
});

// Load services into grid
function loadServices() {
    console.log('Loading services...');
    const serviceGrid = document.getElementById('serviceGrid');
    
    if (!serviceGrid) {
        console.error('Service grid element not found!');
        return;
    }
    
    CAMPUS_SERVICES.forEach(service => {
        const card = createServiceCard(service);
        serviceGrid.appendChild(card);
    });
    console.log(`✅ Loaded ${CAMPUS_SERVICES.length} services`);
}

// Create service card element
function createServiceCard(service) {
    const card = document.createElement('div');
    card.className = 'service-card';
    card.dataset.serviceId = service.id;
    card.innerHTML = `
        <div class="service-icon">${service.icon}</div>
        <h3>${service.name}</h3>
        <p class="service-description">${service.description}</p>
        <p class="service-price">₹${service.amount.toLocaleString()}</p>
    `;
    
    card.addEventListener('click', () => selectService(service));
    
    return card;
}

// Handle service selection
function selectService(service) {
    console.log('Selected service:', service.name);
    
    // Remove previous selection
    document.querySelectorAll('.service-card').forEach(card => {
        card.classList.remove('selected');
    });
    
    // Add selection to clicked card
    const selectedCard = document.querySelector(`[data-service-id="${service.id}"]`);
    if (selectedCard) {
        selectedCard.classList.add('selected');
    }
    
    // Update state
    currentState.selectedService = service;
    
    // Show payment details
    showPaymentDetails(service);

    validateForm();
}

// Show payment details section
function showPaymentDetails(service) {
    const paymentDetails = document.getElementById('paymentDetails');
    const selectedService = document.getElementById('selectedService');
    const displayAmount = document.getElementById('displayAmount');
    
    if (!paymentDetails || !selectedService || !displayAmount) {
        console.error('Payment details elements not found');
        return;
    }
    
    selectedService.innerHTML = `
        <h3>${service.name}</h3>
        <p>${service.description}</p>
    `;
    
    displayAmount.textContent = `₹${service.amount.toLocaleString()}`;
    paymentDetails.style.display = 'block';
    
    // Scroll to payment section
    paymentDetails.scrollIntoView({ behavior: 'smooth' });
}

// Setup event listeners
function setupEventListeners() {
    console.log('Setting up event listeners...');
    
    const payButton = document.getElementById('payButton');
    if (payButton) {
        payButton.addEventListener('click', handlePayment);
        console.log('✅ Pay button listener added');
    } else {
        console.error('❌ Pay button not found');
    }
    
    // Form validation on input - validate on ANY change
    const formInputs = ['studentId', 'studentName', 'studentEmail', 'studentPhone'];
    formInputs.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener('input', validateForm);
            // Also validate on blur (when leaving the field)
            element.addEventListener('blur', validateForm);
        } else {
            console.error(`Element #${id} not found`);
        }
    });
    
    // Initial validation to set button state correctly
    validateForm();
}
// Validate form before payment
function validateForm() {
    const studentId = document.getElementById('studentId')?.value || '';
    const studentName = document.getElementById('studentName')?.value || '';
    const studentEmail = document.getElementById('studentEmail')?.value || '';
    const studentPhone = document.getElementById('studentPhone')?.value || '';
    const payButton = document.getElementById('payButton');
    
    // Check if all fields are filled AND a service is selected
    const isFormValid = studentId.trim() !== '' && 
                        studentName.trim() !== '' && 
                        studentEmail.trim() !== '' && 
                        studentPhone.trim() !== '';
    
    const isServiceSelected = currentState.selectedService !== null;
    
    const shouldEnable = isFormValid && isServiceSelected;
    
    console.log('Form validation:', { 
        isFormValid, 
        isServiceSelected, 
        shouldEnable,
        studentId: !!studentId,
        studentName: !!studentName,
        studentEmail: !!studentEmail,
        studentPhone: !!studentPhone
    });
    
    if (payButton) {
        payButton.disabled = !shouldEnable;
    }
    
    return shouldEnable;
}

// Handle payment button click
async function handlePayment() {
    console.log('🔄 Payment button clicked');
    
    if (!validateForm()) {
        alert('Please fill all student details and select a service');
        return;
    }
    
    try {
        showLoading();
        
        // Get form data
        const studentData = {
            studentId: document.getElementById('studentId').value,
            studentName: document.getElementById('studentName').value,
            studentEmail: document.getElementById('studentEmail').value,
            studentPhone: document.getElementById('studentPhone').value,
            serviceType: currentState.selectedService.type,
            serviceName: currentState.selectedService.name,
            amount: currentState.selectedService.amount,
            description: currentState.selectedService.description
        };
        
        console.log('📤 Sending order request:', studentData);
        
        // Step 1: Create order on backend
        const orderResponse = await createOrder(studentData);
        console.log('📥 Order response:', orderResponse);
        
        if (!orderResponse.success) {
            throw new Error(orderResponse.message || 'Failed to create order');
        }
        
        // Step 2: Store transaction info
        currentState.transactionId = orderResponse.transactionId;
        currentState.orderId = orderResponse.orderId;
        
        // Step 3: Open RazorPay checkout
        console.log('💰 Opening RazorPay checkout...');
        
        const options = {
            key: orderResponse.keyId,
            amount: orderResponse.amount,
            currency: orderResponse.currency,
            name: 'Campus Payment System',
            description: `Payment for ${studentData.serviceName}`,
            order_id: orderResponse.orderId,
            handler: function(response) {
                console.log('✅ Payment successful:', response);
                verifyPayment({
                    razorpay_order_id: response.razorpay_order_id,
                    razorpay_payment_id: response.razorpay_payment_id,
                    razorpay_signature: response.razorpay_signature,
                    transactionId: currentState.transactionId
                });
            },
            prefill: {
                name: studentData.studentName,
                email: studentData.studentEmail,
                contact: studentData.studentPhone
            },
            theme: {
                color: '#667eea'
            },
            modal: {
                ondismiss: function() {
                    console.log('Payment cancelled by user');
                    hideLoading();
                }
            }
        };
        
        const razorpay = new Razorpay(options);
        razorpay.open();
        
    } catch (error) {
        console.error('❌ Payment error:', error);
        hideLoading();
        alert('Payment failed: ' + error.message);
        window.location.href = `failure.html?error=${encodeURIComponent(error.message)}`;
    }
}

// API Calls
async function createOrder(studentData) {
    const response = await fetch(`${API_BASE_URL}/payments/create-order`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        mode: 'cors',
        credentials: 'include',
        body: JSON.stringify(studentData)
    });
    
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
}

async function verifyPayment(paymentData) {
    try {
        console.log('🔐 Verifying payment:', paymentData);
        
        const response = await fetch(`${API_BASE_URL}/payments/verify-payment`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            mode: 'cors',
            credentials: 'include',
            body: JSON.stringify(paymentData)
        });
        
        const data = await response.json();
        console.log('📥 Verification response:', data);
        
        if (!data.success) {
            throw new Error(data.message || 'Payment verification failed');
        }
        
        // Redirect to success page
        window.location.href = `success.html?transactionId=${paymentData.transactionId}&orderId=${paymentData.razorpay_order_id}&paymentId=${paymentData.razorpay_payment_id}&amount=${currentState.selectedService.amount}&service=${encodeURIComponent(currentState.selectedService.name)}`;
        
    } catch (error) {
        console.error('❌ Verification error:', error);
        hideLoading();
        window.location.href = `failure.html?error=${encodeURIComponent(error.message)}`;
    }
}

// Loading indicator
function showLoading() {
    const loading = document.getElementById('loading');
    if (loading) {
        loading.style.display = 'flex';
    }
}

function hideLoading() {
    const loading = document.getElementById('loading');
    if (loading) {
        loading.style.display = 'none';
    }
}