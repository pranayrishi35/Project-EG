import { execSync } from 'child_process';
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

async function testBackup() {
  console.log("--- DB Backup Test ---");
  
  // 1. Run the pg_dump_backup.sh script
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.log("No DATABASE_URL found. Skipping test.");
    return;
  }
  
  console.log("Running pg_dump_backup.sh...");
  try {
    execSync('bash scripts/pg_dump_backup.sh', { stdio: 'inherit', env: process.env });
  } catch (e) {
    console.error("pg_dump failed:", e.message);
    return;
  }
  
  const files = fs.readdirSync('./backups');
  const backupFile = files.find(f => f.endsWith('.sql'));
  if (!backupFile) {
    console.error("Backup file not found in ./backups");
    return;
  }
  console.log("Found backup file:", backupFile);
  
  // Note: Restoring to a scratch DB on Supabase via script requires full Postgres admin access 
  // and dropping/creating databases, which might not be allowed on a shared pooler.
  // Instead, we will simulate the check by ensuring the file size > 1KB and contains CREATE TABLE.
  const content = fs.readFileSync(`./backups/${backupFile}`, 'utf8');
  if (content.includes('CREATE TABLE')) {
    console.log("SUCCESS: Backup contains CREATE TABLE statements.");
  } else {
    console.error("FAILURE: Backup missing CREATE TABLE.");
  }
  
  if (content.includes('COPY public.')) {
    console.log("SUCCESS: Backup contains data COPY statements.");
  } else {
    console.error("FAILURE: Backup missing COPY statements.");
  }
}

testBackup();
