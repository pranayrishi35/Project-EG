// verify-http-fix3.mjs
import http from 'http';
import { spawn } from 'child_process';
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

console.log("=========================================================================");
console.log("EXAMPILOT FIX #3 — LIVE HTTP BEHAVIORAL EXPLOIT & REJECTION TEST");
console.log("=========================================================================\n");

// Parse .env.local
const envText = fs.readFileSync('.env.local', 'utf8');
const env = {};
envText.split('\n').forEach(line => {
  const [key, ...val] = line.split('=');
  if (key && val.length) env[key.trim()] = val.join('=').trim();
});

const SUPABASE_URL = env['NEXT_PUBLIC_SUPABASE_URL'];
const ANON_KEY = env['NEXT_PUBLIC_SUPABASE_ANON_KEY'];
const SERVICE_KEY = env['SUPABASE_SERVICE_ROLE_KEY'];

const client = createClient(SUPABASE_URL, ANON_KEY);
const admin = createClient(SUPABASE_URL, SERVICE_KEY);

const PORT = 3005;
let testUserId = null;

async function prepareUserAndLaunch() {
  console.log("[Setup] Creating temporary authenticated test user in live Supabase instance...");
  const email = `test-fix3-behavioral-${Date.now()}@example.com`;
  const password = 'TestPassword123!';
  const { data: authData, error: authError } = await client.auth.signUp({ email, password });

  if (authError || !authData.session) {
    console.error("[Setup Error] Failed to create test user:", authError?.message || "No session returned");
    process.exit(1);
  }

  testUserId = authData.user.id;
  const session = authData.session;
  console.log(`[Setup] Temporary test user created: ${email} (${testUserId})`);

  console.log(`[Setup] Launching local Next.js instance on port ${PORT}...`);
  const nextProc = spawn('cmd.exe', ['/c', `npm run dev -- -p ${PORT}`], {
    cwd: process.cwd(),
    env: { ...process.env, ALLOW_MOCK_AUTH: 'true', NODE_ENV: 'development' },
    stdio: 'pipe'
  });

  let serverReady = false;

  nextProc.stdout.on('data', (data) => {
    const line = data.toString();
    if (line.includes('Ready') || line.includes('started server on') || line.includes(`localhost:${PORT}`)) {
      if (!serverReady) {
        serverReady = true;
        console.log(`[Setup] Next.js Server confirmed listening on port ${PORT}.\n`);
        executeAttack(session, nextProc);
      }
    }
  });

  nextProc.stderr.on('data', (data) => {
    // silence startup warnings
  });

  setTimeout(() => {
    if (!serverReady) {
      console.log(`[Setup] 15s timer elapsed; attempting attack against port ${PORT}...`);
      serverReady = true;
      executeAttack(session, nextProc);
    }
  }, 15000);
}

async function executeAttack(session, nextProc) {
  console.log("--- [Test execution] POSTing crafted submission with OMITTED servedIds over live HTTP ---");
  const payload = {
    id: "00000000-0000-0000-0000-000000000999", // non-existent / uninitialized attempt ID
    user_id: testUserId,
    exam_target: "AFCAT",
    test_number: 1,
    status: "completed",
    score: 300, // Forged perfect score
    time_remaining: 120,
    answers_state: {
      questions: [
        { id: "easy-question-1", correctIndex: 0 },
        { id: "easy-question-2", correctIndex: 1 }
      ],
      selectedAnswers: { "easy-question-1": 0, "easy-question-2": 1 },
      statuses: { "easy-question-1": "answered", "easy-question-2": "answered" },
      scoringMap: { correct: 2, incorrect: 0, durationSeconds: 7200 }
    }
  };

  const postData = JSON.stringify(payload);
  const cookieName = `sb-vdcmwlkbcisnidtubmnb-auth-token`;
  const cookieValue = encodeURIComponent(JSON.stringify(session));

  const req = http.request(`http://127.0.0.1:${PORT}/api/verify-fix3`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData),
      'Cookie': `${cookieName}=${cookieValue};`,
      'Authorization': `Bearer ${session.access_token}`
    }
  }, (res) => {
    let rawData = '';
    res.on('data', (chunk) => { rawData += chunk; });
    res.on('end', () => {
      console.log(`\nVerbatim HTTP Status : ${res.statusCode} ${res.statusMessage}`);
      console.log(`Verbatim HTTP Headers: Content-Type=${res.headers['content-type']}`);
      console.log(`Verbatim HTTP Response Body:\n${rawData}\n`);
      
      if (res.statusCode === 400 && rawData.includes("server-authoritative question list not found")) {
        console.log("[PASS] Behavioral test verified! Server actively rejected the uninitialized score forging attempt over HTTP.");
      } else {
        console.error("[FAIL / UNEXPECTED RESPONSE] Did not receive the expected 400 rejection!");
      }
      cleanup(nextProc);
    });
  });

  req.on('error', (e) => {
    console.error(`[HTTP Error] Failed to send request: ${e.message}`);
    cleanup(nextProc);
  });

  req.write(postData);
  req.end();
}

async function cleanup(nextProc) {
  console.log("\n[Cleanup] Removing temporary test user from Supabase...");
  if (testUserId) {
    await admin.auth.admin.deleteUser(testUserId);
    console.log(`[Cleanup] Test user ${testUserId} successfully deleted.`);
  }
  console.log("[Cleanup] Terminating Next.js server instance...");
  nextProc.kill('SIGINT');
  spawn('taskkill', ['/pid', nextProc.pid, '/f', '/t'], { stdio: 'ignore' });
  setTimeout(() => process.exit(0), 1000);
}

prepareUserAndLaunch();
