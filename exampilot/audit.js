const fs = require('fs');
const path = require('path');

const actionsDir = 'd:/Project-EG/exampilot/src/app/actions';
const files = fs.readdirSync(actionsDir).filter(f => f.endsWith('.ts'));

const report = [];

files.forEach(file => {
    const content = fs.readFileSync(path.join(actionsDir, file), 'utf-8');
    
    // Check if protected
    const hasAuth = content.includes('supabase.auth.getUser') || content.includes('supabase.auth.getSession');
    const hasZod = content.includes('z.object');
    
    // Extract exported functions
    const functionRegex = /export\s+(?:async\s+)?function\s+(\w+)\s*\((.*?)\)/g;
    const arrowRegex = /export\s+const\s+(\w+)\s*=\s*(?:async\s+)?(?:\([^)]*\)|[^=]*)\s*=>|export\s+const\s+(\w+)\s*=\s*unstable_cache\((?:async\s+)?\((.*?)\)/g;

    const functions = [];
    let match;
    while ((match = functionRegex.exec(content)) !== null) {
        functions.push({ name: match[1], params: match[2] });
    }
    
    // Quick parse for arrow functions/unstable_cache
    let arrowMatch;
    while ((arrowMatch = arrowRegex.exec(content)) !== null) {
        const name = arrowMatch[1] || arrowMatch[2];
        const params = arrowMatch[3] || '...';
        functions.push({ name, params });
    }

    report.push({
        file,
        hasAuth,
        hasZod,
        functions
    });
});

console.log(JSON.stringify(report, null, 2));
