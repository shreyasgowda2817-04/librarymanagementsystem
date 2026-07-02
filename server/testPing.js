const https = require('https');

https.get('https://librarymanagementsystem-4355.onrender.com/api/config/features', (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    console.log(`Status: ${res.statusCode}`);
    console.log(`Headers:`, res.headers);
    console.log(`Body: ${data}`);
  });
}).on('error', (err) => {
  console.log('Error:', err.message);
});
