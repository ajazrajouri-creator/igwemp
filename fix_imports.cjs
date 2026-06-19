const fs = require('fs');
const log = fs.readFileSync('tsc_errors.txt', 'utf8');
const lines = log.split('\n');

const filesToProcess = new Set();
const unusedVarsByFile = new Map();

lines.forEach(line => {
  const match = line.match(/^(src\/.*?\.tsx?)\(\d+,\d+\): error (TS6133|TS6196): '(.*?)' is declared/);
  if (match) {
    const file = match[1];
    const varName = match[3];
    filesToProcess.add(file);
    if (!unusedVarsByFile.has(file)) {
      unusedVarsByFile.set(file, []);
    }
    unusedVarsByFile.get(file).push(varName);
  }
});

filesToProcess.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  const vars = unusedVarsByFile.get(file);
  
  if (vars.includes('React')) {
    content = content.replace(/import\s+React\s+from\s+['"]react['"];?\r?\n/g, '');
    content = content.replace(/import\s+React\s*,\s*\{/g, 'import {');
  }
  
  vars.forEach(v => {
    if (v !== 'React') {
      // Very simple regex to remove unused icons or hooks from imports
      // e.g. import { ChevronRight, Filter }
      const regex = new RegExp(`\\b${v}\\b\\s*,?`, 'g');
      content = content.replace(regex, (match, offset, string) => {
        // Only replace if inside import statement loosely
        const before = string.substring(Math.max(0, offset - 100), offset);
        if (before.includes('import')) {
          return '';
        }
        return match;
      });
      // Cleanup empty import {}
      content = content.replace(/import\s*\{\s*\}\s*from\s+['"][^'"]+['"];?\r?\n/g, '');
      // Cleanup trailing commas in imports like { Icon, }
      content = content.replace(/,\s*\}/g, '}');
    }
  });

  fs.writeFileSync(file, content);
});

console.log('Removed unused imports from ' + filesToProcess.size + ' files');
