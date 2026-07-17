import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase URL or Key");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function exportData() {
  try {
    console.log("Fetching question_bank...");
    const { data: qbData, error: qbError } = await supabase.from('question_bank').select('*');
    if (qbError) throw qbError;

    console.log("Fetching mock_attempts...");
    const { data: maData, error: maError } = await supabase.from('mock_attempts').select('*');
    if (maError) throw maError;

    const backup = {
      question_bank: qbData,
      mock_attempts: maData,
      timestamp: new Date().toISOString()
    };

    fs.writeFileSync('../database_backup.json', JSON.stringify(backup, null, 2));
    console.log("Backup completed successfully! Saved to ../database_backup.json");
  } catch (error) {
    console.error("Error during backup:", error);
  }
}

exportData();
