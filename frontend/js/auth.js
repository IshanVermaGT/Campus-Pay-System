// Auth helper functions

// Check if user is logged in
function isAuthenticated() {
    return localStorage.getItem('token') !== null;
}

// Get current user
function getCurrentUser() {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
}

// Get auth token
function getToken() {
    return localStorage.getItem('token');
}

// Logout function
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '../login.html';
}

// API helper with auth header
async function apiCall(url, options = {}) {
    const token = getToken();
    
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers
    };
    
    if (token) {
        headers['x-auth-token'] = token;
    }

    try {
        console.log(`🌐 Making API call to: http://localhost:5000/api${url}`);
        const response = await fetch(`http://localhost:5000/api${url}`, {
            ...options,
            headers
        });

        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || 'API call failed');
        }
        
        return data;
    } catch (error) {
        console.error('❌ API call error:', error);
        throw error;
    }
}

// Redirect if not authenticated
function requireAuth() {
    if (!isAuthenticated()) {
        console.log('❌ Not authenticated, redirecting to login');
        window.location.href = '../login.html';
        return false;
    }
    return true;
}

// Redirect based on role
function redirectToDashboard() {
    const user = getCurrentUser();
    if (user) {
        if (user.role === 'admin') {
            window.location.href = '../admin/dashboard.html';
        } else {
            window.location.href = '../student/dashboard.html';
        }
    } else {
        window.location.href = '../login.html';
    }
}