async function testRateLimit() {
  console.log("Testing Rate Limiter (5 requests per 15 min)...");
  
  // We will burst 40 requests against the login API
  const url = 'http://localhost:4005/api/auth/login'; // Wait, it rate limits auth routes, let's use the middleware itself on /login
  let successCount = 0;
  let rateLimitedCount = 0;
  let lastStatus = 0;
  let headers = null;

  for (let i = 0; i < 40; i++) {
    try {
      const res = await fetch('http://localhost:4005/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Forwarded-For': '203.0.113.50' // Use a unique IP for this test
        },
        body: JSON.stringify({ email: 'test@example.com', password: 'test' })
      });
      lastStatus = res.status;
      if (res.status === 429) {
        rateLimitedCount++;
        headers = res.headers;
      } else {
        successCount++;
      }
    } catch (e) {
      console.error(e);
    }
  }

  console.log(`Sent 40 requests. Success: ${successCount}, Rate Limited: ${rateLimitedCount}`);
  if (rateLimitedCount > 0) {
    console.log("SUCCESS: Rate Limiter is working!");
    console.log(`Last Status: ${lastStatus}`);
    console.log(`X-RateLimit-Limit: ${headers?.get('x-ratelimit-limit')}`);
  } else {
    console.log("FAIL: Rate Limiter did not trigger. Is Vercel KV configured locally?");
  }
}

testRateLimit();
