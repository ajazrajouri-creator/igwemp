const fs = require('fs');

const testData = `
-- 7. Child-Table Cross-Tenant Isolation Tests (RLS)
-- Mock SED User
SELECT set_config('request.jwt.claims', '{"tenant_id": "00000000-0000-4000-a000-000000000001"}', true);

SELECT results_eq(
  'SELECT id FROM public.document_versions',
  ARRAY['90000000-0000-4000-a000-000000000001'::uuid],
  'SED user should only see SED document_versions'
);

SELECT results_eq(
  'SELECT id FROM public.workflow_versions',
  ARRAY['b0000000-0000-4000-a000-000000000001'::uuid],
  'SED user should only see SED workflow_versions'
);

-- Mock Health User
SELECT set_config('request.jwt.claims', '{"tenant_id": "00000000-0000-4000-a000-000000000002"}', true);

SELECT results_eq(
  'SELECT id FROM public.document_versions',
  ARRAY['90000000-0000-4000-a000-000000000002'::uuid],
  'Health user should only see Health document_versions'
);

SELECT results_eq(
  'SELECT id FROM public.workflow_versions',
  ARRAY['b0000000-0000-4000-a000-000000000002'::uuid],
  'Health user should only see Health workflow_versions'
);

-- Reset config
SELECT set_config('request.jwt.claims', '', true);
`;

// Read the file, replace the ROLLBACK/finish block with the tests then append the block back
const filePath = 'd:/Downloads/Anti Gravity Projects/Edu Deptt Zone Peeri/igwemp/supabase/tests/database/01_sprint_s6_employee_logic.sql';
let content = fs.readFileSync(filePath, 'utf8');

// The plan number needs to be updated. It was 15, we added 4 tests so it's 19.
content = content.replace('SELECT plan(15);', 'SELECT plan(19);');

// Insert before the finish block
const finishIndex = content.indexOf('SELECT * FROM finish();');
if (finishIndex !== -1) {
  content = content.slice(0, finishIndex) + testData + '\n' + content.slice(finishIndex);
  fs.writeFileSync(filePath, content);
  console.log("Tests appended successfully!");
} else {
  console.error("Could not find finish block!");
}
