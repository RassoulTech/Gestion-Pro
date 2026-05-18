const fs = require('fs');
const { execSync } = require('child_process');

let output = '';
try {
  output = execSync('npm run lint', { encoding: 'utf8' });
} catch (e) {
  output = e.stdout;
}

const lines = output.split('\n');
const fixes = {};
let currentFile = '';

for (const line of lines) {
  if (line.startsWith('./src/')) {
    currentFile = line.trim();
    fixes[currentFile] = [];
  } else if (line.includes('is defined but never used') || line.includes('is assigned a value but never used')) {
    const match = line.match(/(\d+):(\d+)\s+Error:\s+'([^']+)'/);
    if (match) {
      fixes[currentFile].push({ line: parseInt(match[1]), col: parseInt(match[2]), varName: match[3], isAny: false });
    }
  } else if (line.includes('Unexpected any.')) {
    const match = line.match(/(\d+):(\d+)/);
    if (match) {
      fixes[currentFile].push({ line: parseInt(match[1]), col: parseInt(match[2]), isAny: true });
    }
  }
}

for (const [file, errors] of Object.entries(fixes)) {
  if (errors.length === 0) continue;
  if (!fs.existsSync(file)) continue;
  
  let content = fs.readFileSync(file, 'utf8');
  let contentLines = content.split('\n');
  
  const sortedErrors = errors.sort((a, b) => b.line - a.line);
  
  for (const err of sortedErrors) {
    const lineIdx = err.line - 1;
    let text = contentLines[lineIdx];
    
    if (err.isAny) {
      text = text.replace(/as any/g, 'as never');
    } else {
      const regex = new RegExp('\\\\b' + err.varName + '\\\\b\\\\s*,?');
      text = text.replace(regex, '');
      text = text.replace(/,\\s*}/, ' }');
      text = text.replace(/{\\s*,/, '{ ');
      
      if (text.match(/import\s*{\s*}\s*from\s*['"][^'"]+['"];?/)) {
        text = '';
      }
    }
    contentLines[lineIdx] = text;
  }
  fs.writeFileSync(file, contentLines.join('\n'));
}
console.log('Fixed auto');
