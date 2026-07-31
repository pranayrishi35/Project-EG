async function testMockAuth() {
  console.log("Testing Mock Auth Bypass against running server...");
  try {
    const res = await fetch('http://localhost:4005/practice', {
      headers: {
        'Cookie': 'sb-mock-auth=some_value' // Adjust based on how mock auth sets cookie
      },
      redirect: 'manual'
    });

    console.log(`Response Status: ${res.status}`);
    const location = res.headers.get('location');
    if (res.status === 307 || res.status === 308 || res.status === 302) {
      console.log(`Redirect Location: ${location}`);
      if (location && location.includes('/login')) {
        console.log("SUCCESS: Access denied. Mock auth bypassed rejected.");
      } else {
        console.log("FAIL: Redirected somewhere else! Location:", location);
      }
    } else if (res.status === 200) {
      console.log("FAIL: Access granted to /practice with mock auth cookie!");
    } else {
      console.log(`UNKNOWN: Got status ${res.status}`);
    }
  } catch (err) {
    console.error("Fetch failed:", err);
  }
}

testMockAuth();
