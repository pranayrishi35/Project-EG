const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing credentials");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkNDA() {
  const { count: mathCount } = await supabase
    .from('question_bank')
    .select('*', { count: 'exact', head: true })
    .eq('exam_target', 'NDA_MATH');

  const { count: gatCount } = await supabase
    .from('question_bank')
    .select('*', { count: 'exact', head: true })
    .eq('exam_target', 'NDA_GAT');

  console.log(`NDA_MATH questions: ${mathCount}`);
  console.log(`NDA_GAT questions: ${gatCount}`);
}

checkNDA().catch(console.error);
