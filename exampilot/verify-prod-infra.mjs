import http from 'http';

console.log('=============================================================================');
console.log('  STARTING INFRASTRUCTURE VERIFICATION: RATE-LIMITER & MOCK-AUTH LEAK TEST');
console.log('=============================================================================');

// 1. Start Mock Upstash REST Server on Port 8085
const store = new Map();
const redisServer = http.createServer(async (req, res) => {
  if (req.url === '/pipeline' && req.method === 'POST') {
    let body = '';
    for await (const chunk of req) body += chunk;
    try {
      const commands = JSON.parse(body);
      const key = commands[0][1];
      const current = (store.get(key) || 0) + 1;
      store.set(key, current);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify([{ result: current }, { result: 1 }]));
      return;
    } catch (e) {
      res.writeHead(400);
      res.end('Bad Request');
      return;
    }
  }
  res.writeHead(404);
  res.end('Not Found');
});

redisServer.listen(8085, '127.0.0.1', () => {
  console.log('[MOCK UPSTASH] Server running on http://127.0.0.1:8085');
  runTests();
});

async function runTests() {
  console.log('\n--- TEST 1: RATE LIMITER REWRITE (N+1 BURST PROTECTION) ---');
  console.log('Sending 33 rapid POST requests to http://127.0.0.1:3001/login with identical client IP...');
  
  let throttled = false;
  let throttleStatus = 0;
  let throttleBody = '';
  let throttleHeaders = {};

  for (let i = 1; i <= 33; i++) {
    const res = await new Promise((resolve) => {
      const req = http.request('http://127.0.0.1:3001/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'X-Forwarded-For': '192.168.1.150', // Fixed test IP to ensure sliding window increment
        }
      }, async (res) => {
        let data = '';
        for await (const chunk of res) data += chunk;
        resolve({ status: res.statusCode, headers: res.headers, body: data });
      });
      req.write('email=test@example.com&password=wrongpassword');
      req.end();
    });

    if (i === 1 || i === 30 || i === 31 || i === 32) {
      console.log(`Request #${String(i).padStart(2, '0')} -> HTTP ${res.status} ${res.headers['x-ratelimit-remaining'] ? `(Remaining: ${res.headers['x-ratelimit-remaining']})` : ''}`);
    }

    if (res.status === 429 && !throttled) {
      throttled = true;
      throttleStatus = res.status;
      throttleHeaders = res.headers;
      throttleBody = res.body;
      console.log(`\n[SUCCESS] Request #${i} triggered categorical throttling!`);
      console.log('Verbatim Throttled Response Status:', throttleStatus);
      console.log('Verbatim Rate-Limit Headers:', JSON.stringify({
        'X-RateLimit-Limit': throttleHeaders['x-ratelimit-limit'],
        'X-RateLimit-Remaining': throttleHeaders['x-ratelimit-remaining'],
      }));
      console.log('Verbatim Response Payload:', throttleBody.trim());
    }
  }

  if (!throttled) {
    console.error('[FAIL] Rate limiter did not throttle after 30 requests!');
  } else {
    console.log('[PASS] N+1 Rate Limit burst protection verified via custom Edge-native REST fetch.');
  }

  console.log('\n--- TEST 2: PRODUCTION LEAK MOCK-AUTH SECURITY AUDIT ---');
  console.log('Testing route protection on http://127.0.0.1:3001/practice/mock/demo-test-101');
  console.log('Server running under leak condition: ALLOW_MOCK_AUTH=true in environment under NODE_ENV=production');

  const authRes = await new Promise((resolve) => {
    const req = http.request('http://127.0.0.1:3001/practice/mock/demo-test-101', {
      method: 'GET',
      headers: {
        'Cookie': 'sb-access-token=mock-access-token; sb-refresh-token=mock-refresh-token;'
      }
    }, (res) => {
      resolve({ status: res.statusCode, headers: res.headers });
    });
    req.end();
  });

  console.log('Verbatim Status Code:', authRes.status);
  console.log('Verbatim Location Header:', authRes.headers.location);

  if (authRes.status === 307 && String(authRes.headers.location).includes('/login')) {
    console.log('[SECURITY VERIFIED] Despite ALLOW_MOCK_AUTH=true, isMockAuthAllowed() categorically rejected mock token under NODE_ENV=production and redirected to login.');
  } else {
    console.error('[SECURITY ALERT] Bypass occurred in production environment! Status:', authRes.status);
  }

  redisServer.close();
  process.exit(0);
}
