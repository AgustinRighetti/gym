const fs = require('fs');
const content = fs.readFileSync('src/pages/Admin.jsx', 'utf8');

let stack = [];
let lineNum = 1;
for (let i = 0; i < content.length; i++) {
  if (content[i] === '\n') lineNum++;
  if (content[i] === '{' || content[i] === '[' || content[i] === '(') {
    stack.push({ char: content[i], line: lineNum, col: i });
  } else if (content[i] === '}' || content[i] === ']' || content[i] === ')') {
    if (stack.length === 0) {
      console.log(`Unmatched closing ${content[i]} at line ${lineNum}`);
      process.exit(1);
    }
    const last = stack.pop();
    const pairs = { '}': '{', ']': '[', ')': '(' };
    if (last.char !== pairs[content[i]]) {
      console.log(`Mismatched ${content[i]} at line ${lineNum}, expected closing for ${last.char} from line ${last.line}`);
      process.exit(1);
    }
  }
}
if (stack.length > 0) {
  console.log(`Unclosed symbols:`);
  for (const s of stack.slice(-10)) console.log(`  ${s.char} at line ${s.line}`);
} else {
  console.log('No bracket mismatches found (basic check)');
}
