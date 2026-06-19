const fs = require('fs');

const testData = `
-- 8. Change Request Optimistic Locking
SELECT throws_ok(
  $$
    DO $blk$
    DECLARE
      v_tenant_id uuid := '00000000-0000-4000-a000-000000000001';
      v_party_id uuid;
      v_employee_id uuid;
      v_req_id uuid;
      v_version int;
    BEGIN
      INSERT INTO public.parties (tenant_id, party_type, display_name) VALUES (v_tenant_id, 'PERSON', 'Test Person') RETURNING id INTO v_party_id;
      INSERT INTO public.person_parties (party_id, first_name) VALUES (v_party_id, 'Test');
      INSERT INTO public.employee_profiles (tenant_id, person_party_id, employee_code) VALUES (v_tenant_id, v_party_id, 'EMP_OPT_1') RETURNING id INTO v_employee_id;
      
      INSERT INTO public.user_accounts (tenant_id, username, status) VALUES (v_tenant_id, 'testuser_opt', 'ACTIVE');
      
      INSERT INTO public.employee_change_requests (tenant_id, employee_id, requested_by, request_type, status)
        VALUES (v_tenant_id, v_employee_id, (SELECT id FROM public.user_accounts WHERE username = 'testuser_opt'), 'PROFILE_UPDATE', 'APPROVED')
        RETURNING id INTO v_req_id;
        
      SELECT record_version INTO v_version FROM public.employee_profiles WHERE id = v_employee_id;
      
      INSERT INTO public.employee_change_request_items (tenant_id, change_request_id, target_entity_type, target_record_id, operation, proposed_values, existing_record_version)
        VALUES (v_tenant_id, v_req_id, 'PROFILE', v_employee_id, 'UPDATE', '{"employment_status":"RETIRED"}', v_version - 1);
        
      PERFORM public.apply_approved_employee_change_request(v_req_id);
    END $blk$;
  $$,
  'P0001',
  '%Optimistic locking failure%',
  'Optimistic locking did not prevent stale update.'
);
`;

const filePath = 'd:/Downloads/Anti Gravity Projects/Edu Deptt Zone Peeri/igwemp/supabase/tests/database/01_sprint_s6_employee_logic.sql';
let content = fs.readFileSync(filePath, 'utf8');

// The plan number needs to be updated from 19 to 20
content = content.replace('SELECT plan(19);', 'SELECT plan(20);');

const finishIndex = content.indexOf('SELECT * FROM finish();');
if (finishIndex !== -1) {
  content = content.slice(0, finishIndex) + testData + '\n' + content.slice(finishIndex);
  fs.writeFileSync(filePath, content);
  console.log("Tests updated successfully!");
} else {
  console.error("Could not find finish block!");
}
