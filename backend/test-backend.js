const http = require('http');

const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/',
    method: 'GET'
};

const req = http.request(options, res => {
    console.log(`✅ Backend is RUNNING! Status: ${res.statusCode}`);
    
    let data = '';
    res.on('data', chunk => {
        data += chunk;
    });
    
    res.on('end', () => {
        console.log('Response:', data);
    });
});

req.on('error', error => {
    console.error('❌ Backend is NOT running!');
    console.error('Error:', error.message);
    console.error('\n💡 Solution: Run "npm run dev" in backend folder');
});

req.end();