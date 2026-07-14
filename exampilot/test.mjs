import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL || "http://localhost:54321", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "dummy");

async function run() {
  const { data, error } = await supabase
      .from("question_bank")
      .select("id, question, options, correct_index, subject, is_pyq, pyq_year, image_url")
      .eq("exam_target", "AFCAT")
      .eq("source_pool", "mock")
      .eq("is_pyq", true)
      .neq("subject", "Current Affairs")
      .limit(5);

  console.log("Error:", error);
}

run();
