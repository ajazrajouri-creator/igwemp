const fs = require('fs');
let content = fs.readFileSync('src/pages/infrastructure/InfrastructureCensusForm.tsx', 'utf8');
content = content.replace(/\s+metricKey="[^"]+"/g, '');
fs.writeFileSync('src/pages/infrastructure/InfrastructureCensusForm.tsx', content);
