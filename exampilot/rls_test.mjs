import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !anonKey || !serviceKey) {
  console.error("Missing Supabase credentials in .env.local");
  process.exit(1);
}

const anonClient = createClient(supabaseUrl, anonKey);
const serviceClient = createClient(supabaseUrl, serviceKey);

async function runTests() {
  console.log("--- STARTING RLS TESTS ---");

  // TEST 1: Anonymous access to mock_leaderboards
  console.log("\n[TEST 1] Testing anonymous GET on mock_leaderboards...");
  const { data: leaderboards, error: leaderboardsErr } = await anonClient
    .from('mock_leaderboards')
    .select('*');

  if (leaderboardsErr) {
    console.log("SUCCESS: Anonymous access rejected as expected.");
    console.log("Response:", JSON.stringify(leaderboardsErr));
  } else {
    console.log("FAIL: Anonymous access succeeded! Found rows:", leaderboards?.length);
    console.log(JSON.stringify(leaderboards).substring(0, 200));
  }

  // TEST 2: Authenticated PATCH on study_plans.exam_name
  console.log("\n[TEST 2] Testing authenticated PATCH on study_plans...");
  
  // Create a temporary user via admin API
  const email = `audit_${Date.now()}@test.com`;
  console.log(`Creating temp user: ${email}`);
  const { data: user, error: userErr } = await serviceClient.auth.admin.createUser({
    email,
    password: 'securepassword123',
    email_confirm: true
  });

  if (userErr || !user.user) {
    console.error("Failed to create temp user:", userErr);
    return;
  }
  const userId = user.user.id;
  console.log(`Temp user created: ${userId}`);

  try {
    // Authenticate the anon client as this user
    await anonClient.auth.signInWithPassword({ email, password: 'securepassword123' });
    
    // Attempt to insert a study plan (legitimate)
    console.log("Inserting a legitimate study plan...");
    const planId = '11111111-1111-1111-1111-111111111111'; // Dummy UUID
    const { data: insertData, error: insertErr } = await anonClient
      .from('study_plans')
      .insert({
        id: planId,
        user_id: userId,
        exam_name: 'NDA',
        exam_date: '2027-01-01',
        generated_plan: { msg: "Valid plan" }
      })
      .select();

    if (insertErr) {
      console.log("Failed to insert study plan (setup failed):", insertErr);
    } else {
      console.log("Successfully inserted study plan.");
      
      // Attempt unauthorized PATCH on exam_name
      console.log("Attempting malicious PATCH on exam_name...");
      const { data: patchData, error: patchErr } = await anonClient
        .from('study_plans')
        .update({ exam_name: 'AFCAT_HACKED' })
        .eq('id', planId)
        .select();

      if (patchErr) {
        console.log("SUCCESS: Malicious PATCH rejected.");
        console.log("Response:", JSON.stringify(patchErr));
      } else {
        console.log("FAIL: Malicious PATCH succeeded!", JSON.stringify(patchData));
      }

      // Attempt legitimate PATCH on generated_plan
      console.log("Attempting legitimate PATCH on generated_plan...");
      const { data: legPatchData, error: legPatchErr } = await anonClient
        .from('study_plans')
        .update({ generated_plan: { msg: "Updated valid plan" } })
        .eq('id', planId)
        .select();

      if (legPatchErr) {
        console.log("FAIL: Legitimate PATCH rejected:", JSON.stringify(legPatchErr));
      } else {
        console.log("SUCCESS: Legitimate PATCH succeeded.");
        console.log(JSON.stringify(legPatchData));
      }
    }
  } finally {
    // TEARDOWN
    console.log("\n--- TEARDOWN ---");
    console.log(`Deleting temp user ${userId} and cascading data...`);
    const { error: delErr } = await serviceClient.auth.admin.deleteUser(userId);
    if (delErr) {
      console.error("Failed to delete temp user:", delErr);
    } else {
      console.log("Temp user deleted successfully.");
    }
  }
}

runTests();
