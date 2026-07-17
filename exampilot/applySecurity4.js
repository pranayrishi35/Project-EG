const fs = require('fs');
const path = require('path');

const dir = 'd:/Project-EG/exampilot/src/app/actions';
const files = [
  'adminSeedQuestions.ts', 'deletePlan.ts', 'generateCheatSheet.ts', 
  'generateFlashcards.ts', 'generateNewsMCQs.ts', 'generateTestStrategy.ts', 
  'getLeaderboardMetrics.ts', 'getStreak.ts', 'mockAttempts.ts', 
  'mockAttemptsAdmin.ts', 'planner.ts', 'triggerNewsFetch.ts'
];

files.forEach(file => {
    const fullPath = path.join(dir, file);
    if (!fs.existsSync(fullPath)) return;
    
    let content = fs.readFileSync(fullPath, 'utf-8');
    
    // Replace different variations of getUser
    const variations = [
        /const\s+\{\s*data:\s*authData,\s*error:\s*authError\s*\}\s*=\s*await\s+supabase\.auth\.getUser\(\);/g,
        /const\s+\{\s*data:\s*\{\s*user\s*\}\s*\}\s*=\s*await\s+supabase\.auth\.getUser\(\);/g,
        /const\s+\{\s*data:\s*authData\s*\}\s*=\s*await\s+supabase\.auth\.getUser\(\);/g,
        /const\s+\{\s*data:\s*\{\s*user\s*\},\s*error:\s*userError\s*\}\s*=\s*await\s+supabase\.auth\.getUser\(\);/g,
        /const\s+\{\s*data:\s*\{\s*user\s*\},\s*error\s*\}\s*=\s*await\s+supabase\.auth\.getUser\(\);/g
    ];

    let modified = false;
    variations.forEach(regex => {
        if (regex.test(content)) {
            content = content.replace(regex, `const { data: { user }, error: authError } = await supabase.auth.getUser();\n  if (authError || !user) throw new Error("UNAUTHORIZED");`);
            modified = true;
        }
    });

    if (modified) {
        // Remove existing error throws that follow the getUser block to avoid double throwing
        content = content.replace(/if\s*\([^)]*(?:authError|user|userError|error|authData)[^)]*\)\s*(?:\{\s*)?throw\s+new\s+Error\([^)]+\);?(?:\s*\})?/g, '');
        // Run a clean up pass if it resulted in multiple throws
        fs.writeFileSync(fullPath, content);
        console.log('Fixed auth in', file);
    }
});
