const fs = require('fs');
const path = require('path');

const dir = 'd:/Project-EG/exampilot/src/app/actions';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.ts'));

files.forEach(file => {
    const fullPath = path.join(dir, file);
    let content = fs.readFileSync(fullPath, 'utf-8');
    let changed = false;

    // Standardize auth guard
    if (content.includes('supabase.auth.getUser()')) {
        // Find existing guard checks and replace them
        const guardRegex = /const\s+\{\s*data:\s*\{\s*user\s*\}[\s\S]*?await\s+supabase\.auth\.getUser\(\);[\s\S]*?(?:if\s*\([^)]*\)\s*throw\s+new\s+Error\([^)]+\);|if\s*\([^)]*\)\s*\{\s*throw\s+new\s+Error\([^)]+\);\s*\})/g;
        
        const strictGuard = `const { data: { user }, error: authError } = await supabase.auth.getUser();\n  if (authError || !user) throw new Error("UNAUTHORIZED");`;
        
        const newContent = content.replace(guardRegex, strictGuard);
        if (newContent !== content) {
            content = newContent;
            changed = true;
        } else {
            // fallback, just try to replace the call and the if statement if they are separate
        }
    }

    if (changed) {
        fs.writeFileSync(fullPath, content);
        console.log('Standardized auth in', file);
    }
});
