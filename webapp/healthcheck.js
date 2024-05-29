const http = require('http');

const options = {
  host: 'localhost',
  port: 3000,
  timeout: 2000,
};

const request = http.request(options, (res) => {
  console.log(`STATUS: ${res.statusCode}`);
  if (res.statusCode === 200) {
    process.exit(0); // Success
  } else {
    process.exit(1); // Failure
  }
});

request.on('error', (err) => {
  console.error('ERROR', err);
  process.exit(1); // Failure
});

request.end();
