const fs = require('fs');
const path = require('path');

const migrationsDir = 'd:/Downloads/Anti Gravity Projects/Edu Deptt Zone Peeri/igwemp/supabase/migrations';
const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql'));

files.forEach(file => {
  const content = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
  console.log(`\n--- ${file} ---`);
  
  const tables = [];
  let currentTable = null;
  const lines = content.split('\n');
  
  lines.forEach(line => {
    const tableMatch = line.match(/CREATE TABLE\s+(?:IF NOT EXISTS\s+)?(?:public\.)?([a-zA-Z0-9_]+)\s*\(/i);
    if (tableMatch) {
      currentTable = { name: tableMatch[1], hasTenantId: false, rlsEnabled: false };
      tables.push(currentTable);
    } else if (currentTable && line.includes(');')) {
      currentTable = null;
    } else if (currentTable && line.match(/tenant_id\s+uuid/i)) {
      currentTable.hasTenantId = true;
    }
    
    const rlsMatch = line.match(/ALTER TABLE\s+(?:public\.)?([a-zA-Z0-9_]+)\s+ENABLE ROW LEVEL SECURITY/i);
    if (rlsMatch) {
      const t = tables.find(x => x.name === rlsMatch[1]);
      if (t) t.rlsEnabled = true;
    }
  });

  tables.forEach(t => {
    console.log(`${t.name}: hasTenantId=${t.hasTenantId}, rlsEnabled=${t.rlsEnabled}`);
  });
});
