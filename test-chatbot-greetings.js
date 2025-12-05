import http from 'http';

const testMessages = ['hello', 'hey', 'greetings', 'good morning'];

async function testMessage(msg) {
  return new Promise((resolve) => {
    const data = JSON.stringify({ message: msg, userId: null, conversationHistory: [] });
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: '/api/chatbot/message',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
      }
    };
    const req = http.request(options, (res) => {
      let responseData = '';
      res.on('data', (chunk) => { responseData += chunk; });
      res.on('end', () => {
        const parsed = JSON.parse(responseData);
        console.log(`Message: "${msg}" → Intent: "${parsed.type}"`);
        resolve();
      });
    });
    req.write(data);
    req.end();
  });
}

async function runTests() {
  for (const msg of testMessages) {
    await testMessage(msg);
  }
}

runTests();
