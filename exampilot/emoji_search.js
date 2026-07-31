const fs = require('fs');
const path = require('path');
const emojiRegex = /[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu;

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(function(file) {
    file = dir + '/' + file;
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory() && !file.includes('node_modules') && !file.includes('.next') && !file.includes('.git')) {
      results = results.concat(walk(file));
    } else if (!stat.isDirectory()) {
      try {
        const content = fs.readFileSync(file, 'utf8');
        let match;
        while ((match = emojiRegex.exec(content)) !== null) {
          results.push({ file, emoji: match[0], index: match.index });
        }
      } catch(e) {}
    }
  });
  return results;
}

const emojis = walk('p:/Project-EG/exampilot/src');
console.log("Emojis found:", emojis.length);
if (emojis.length > 0) {
    emojis.slice(0, 10).forEach(e => console.log(`${e.file}: ${e.emoji}`));
}
