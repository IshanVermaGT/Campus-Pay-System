const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const bodyParser = require('body-parser');

// Load environment variables FIRST
console.log('📁 Loading environment variables...');
const result = dotenv.config();

if (result.error) {
    console.error('❌ Error loading .env file:', result.error);
    process.exit(1);
}

console.log('✅ .env file loaded successfully');

// Debug: Check what variables are loaded (without exposing full values)
console.log('📊 Environment variables check:');
console.log('   PORT:', process.env.PORT ? '✅ Set' : '❌ Missing');
console.log('   MONGODB_URI:', process.env.MONGODB_URI ? '✅ Set' : '❌ Missing');
console.log('   RAZORPAY_KEY_ID:', process.env.RAZORPAY_KEY_ID ? '✅ Set' : '❌ Missing');
console.log('   RAZORPAY_KEY_SECRET:', process.env.RAZORPAY_KEY_SECRET ? '✅ Set' : '❌ Missing');

// Show first few characters of MONGODB_URI to verify format (safely)
if (process.env.MONGODB_URI) {
    const uri = process.env.MONGODB_URI;
    console.log('🔌 MongoDB URI starts with:', uri.substring(0, 30) + '...');
    console.log('🔌 Contains @ symbol:', uri.includes('@') ? '✅ Yes' : '❌ No');
    console.log('🔌 Contains database name:', uri.includes('campus_payments') ? '✅ Yes' : '❌ No');
}

// If MONGODB_URI is missing, stop here
if (!process.env.MONGODB_URI) {
    console.error('❌ MONGODB_URI is not defined in .env file');
    console.log('📝 Please check your .env file and make sure it contains:');
    console.log('   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/dbname');
    process.exit(1);
}

const app = express();

// ============ FIXED CORS CONFIGURATION ============
// Allow all common Live Server ports and include x-auth-token
const allowedOrigins = [
    'http://127.0.0.1:3000', 
    'http://localhost:3000', 
    'http://127.0.0.1:5500', 
    'http://localhost:5500',
    'http://127.0.0.1:5501', 
    'http://localhost:5501',
    'http://127.0.0.1:5502', 
    'http://localhost:5502',
    'http://127.0.0.1:5503', 
    'http://localhost:5503',
    'http://127.0.0.1:5504', 
    'http://localhost:5504',
    'http://127.0.0.1:5505', 
    'http://localhost:5505',
    'http://127.0.0.1:5506', 
    'http://localhost:5506',
    'http://127.0.0.1:5507', 
    'http://localhost:5507',
    'http://127.0.0.1:5508', 
    'http://localhost:5508',
    'http://127.0.0.1:5509', 
    'http://localhost:5509'
];

// CORS middleware - FIXED to include x-auth-token
app.use(cors({
    origin: function(origin, callback) {
        // Allow requests with no origin (like mobile apps or curl)
        if (!origin) return callback(null, true);
        
        if (allowedOrigins.indexOf(origin) === -1) {
            // For development, you can also allow all localhost origins
            if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
                return callback(null, true);
            }
            const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
            return callback(new Error(msg), false);
        }
        return callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-auth-token', 'X-Requested-With']
}));

// Handle preflight requests
app.options('*', cors());

// ============ BODY PARSER (ONCE) ============
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// ============ CSP HEADERS ============
app.use((req, res, next) => {
    res.setHeader(
        'Content-Security-Policy',
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://checkout.razorpay.com https://*.razorpay.com; frame-src https://*.razorpay.com; connect-src 'self' http://localhost:5000 http://127.0.0.1:3000 http://localhost:3000 http://127.0.0.1:5500 http://localhost:5500 http://127.0.0.1:5508 http://localhost:5508;"
    );
    next();
});

// ============ MANUAL CORS HEADERS (BACKUP) ============
app.use((req, res, next) => {
    const origin = req.headers.origin;
    // Allow any localhost origin
    if (origin && (origin.includes('localhost') || origin.includes('127.0.0.1'))) {
        res.header('Access-Control-Allow-Origin', origin);
    }
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, x-auth-token, Authorization');
    
    // Handle preflight
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    next();
});

// ============ MONGODB CONNECTION ============
const connectDB = async () => {
    try {
        console.log('🔄 Attempting to connect to MongoDB Atlas...');
        
        const conn = await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        });
        
        console.log(`✅ MongoDB Atlas connected successfully!`);
        console.log(`📊 Database: ${conn.connection.name}`);
        console.log(`🌍 Host: ${conn.connection.host}`);
        
        // Handle connection events
        mongoose.connection.on('error', (err) => {
            console.error('❌ MongoDB connection error:', err);
        });
        
        mongoose.connection.on('disconnected', () => {
            console.log('⚠️ MongoDB disconnected');
        });
        
    } catch (error) {
        console.error('❌ MongoDB connection error:');
        
        // Provide specific error messages
        if (error.name === 'MongoParseError') {
            console.error('📌 Parse Error: Your connection string is malformed');
            console.error('📌 Expected format: mongodb+srv://username:password@cluster.mongodb.net/dbname');
            console.error('📌 Your URI starts with:', process.env.MONGODB_URI.substring(0, 50) + '...');
        } else if (error.name === 'MongoServerError') {
            if (error.code === 18) {
                console.error('📌 Authentication failed: Check username and password');
            } else {
                console.error('📌 Server error:', error.message);
            }
        } else if (error.name === 'MongooseServerSelectionError') {
            console.error('📌 Network error: Check if IP is whitelisted in Atlas');
            console.error('📌 Make sure your IP is added in Network Access in MongoDB Atlas');
        } else {
            console.error('📌 Error details:', error.message);
        }
        
        process.exit(1);
    }
};

// Call the connection function
connectDB();

// ============ TEST ROUTE ============
app.get('/api/test-db', async (req, res) => {
    try {
        const state = mongoose.connection.readyState;
        const states = {
            0: 'disconnected',
            1: 'connected',
            2: 'connecting',
            3: 'disconnecting'
        };
        
        if (state === 1) {
            res.json({ 
                success: true, 
                status: states[state],
                message: '✅ Database is connected',
                database: mongoose.connection.name
            });
        } else {
            res.json({ 
                success: false, 
                status: states[state],
                message: '❌ Database is not connected'
            });
        }
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// ============ ROUTES (ONCE) ============
app.use('/api/payments', require('./routes/paymentRoutes'));
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/student', require('./routes/studentRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));

// TEMPORARY DEBUG ROUTE - Add this after your other routes
app.get('/api/debug-auth', (req, res) => {
    const token = req.header('x-auth-token');
    console.log('🔍 Debug Auth - Token received:', token ? 'Yes' : 'No');
    
    if (!token) {
        return res.json({ 
            success: false, 
            message: 'No token provided',
            headers: req.headers 
        });
    }

    try {
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        res.json({ 
            success: true, 
            message: 'Token is valid',
            decoded,
            secretExists: !!process.env.JWT_SECRET
        });
    } catch (error) {
        res.json({ 
            success: false, 
            message: 'Token invalid',
            error: error.message,
            secretExists: !!process.env.JWT_SECRET
        });
    }
});

// ============ BASIC ROUTE ============
app.get('/', (req, res) => {
    res.json({ 
        message: 'Campus Payment API is running',
        status: 'Server is up',
        database: mongoose.connection.readyState === 1 ? '✅ Connected' : '❌ Disconnected'
    });
});

// ============ ERROR HANDLING ============
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ 
        success: false, 
        message: 'Something went wrong!',
        error: err.message 
    });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});