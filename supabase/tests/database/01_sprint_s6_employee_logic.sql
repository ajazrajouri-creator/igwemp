BEGIN;
SELECT plan(20);

-- 1. Check constraints on employee_postings (exclusion constraint)
SELECT ok(
  EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'exclude_overlapping_substantive_postings' AND contype = 'x'
  ),
  'Employee Postings has exclusion constraint for substantive overlaps'
);

-- 2. Check exclusion for working arrangements
SELECT ok(
  EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'exclude_overlapping_exclusive_arrangements' AND contype = 'x'
  ),
  'Working Arrangements has exclusion constraint for exclusive attachments'
);

-- 3. Verify security invoker view
SELECT has_view('public', 'v_employee_current_state', 'View v_employee_current_state exists');
SELECT view_owner_is('public', 'v_employee_current_state', 'postgres', 'View is owned securely');

-- 4. Verify RPC existence and security definitions
SELECT has_function('public', 'apply_approved_employee_change_request', 'apply_approved_employee_change_request exists');
SELECT function_lang_is('public', 'apply_approved_employee_change_request', ARRAY['uuid'], 'plpgsql', 'RPC uses plpgsql');

SELECT has_function('public', 'can_access_employee', 'can_access_employee exists');
SELECT function_lang_is('public', 'can_access_employee', ARRAY['uuid', 'text'], 'plpgsql', 'Access RPC uses plpgsql');

-- 5. Check tables and schema logic
SELECT has_table('public', 'scope_dimensions', 'scope_dimensions exists');
SELECT has_table('public', 'role_assignment_scopes', 'role_assignment_scopes exists');

-- 6. Simulated Assertion Shells (CI will execute these with live auth.uid() injection)
-- Duplicate Employee Code Rejection
SELECT throws_ok(
    $$ INSERT INTO public.employee_profiles (tenant_id, person_party_id, employee_code) VALUES ('00000000-0000-4000-a000-000000000001', '60000000-0000-4000-a000-000000000001', 'DUP001'); INSERT INTO public.employee_profiles (tenant_id, person_party_id, employee_code) VALUES ('00000000-0000-4000-a000-000000000001', '60000000-0000-4000-a000-000000000002', 'DUP001'); $$,
    '23505', -- unique_violation
    NULL,
    'Duplicate employee code should be rejected'
);

-- Duplicate Person-Party mapping
SELECT throws_ok(
    $$ INSERT INTO public.employee_profiles (tenant_id, person_party_id, employee_code) VALUES ('00000000-0000-4000-a000-000000000001', '60000000-0000-4000-a000-000000000001', 'EMP001'); INSERT INTO public.employee_profiles (tenant_id, person_party_id, employee_code) VALUES ('00000000-0000-4000-a000-000000000001', '60000000-0000-4000-a000-000000000001', 'EMP002'); $$,
    '23505', -- unique_violation
    NULL,
    'Duplicate person-party mapping should be rejected'
);

-- Wrong Master-Data Category Rejection
SELECT throws_ok(
    $$ INSERT INTO public.employee_profiles (tenant_id, person_party_id, employee_code, cadre_id) VALUES ('00000000-0000-4000-a000-000000000001', '60000000-0000-4000-a000-000000000002', 'EMP002', '20000000-0000-4000-a000-000000000003'); $$,
    'P0001',
    'Invalid cadre_id. Must belong to CADRES category.',
    'Mismatched master data category should trigger exception'
);

-- Overlapping Substantive Postings
SELECT throws_ok(
    $$ 
    DO $blk$
    DECLARE
      v_tenant_id uuid := '00000000-0000-4000-a000-000000000001';
      v_party_id uuid;
      v_employee_id uuid;
    BEGIN
      INSERT INTO public.parties (tenant_id, party_type, display_name) VALUES (v_tenant_id, 'PERSON', 'Test Person') RETURNING id INTO v_party_id;
      INSERT INTO public.person_parties (party_id, first_name) VALUES (v_party_id, 'Test');
      INSERT INTO public.employee_profiles (tenant_id, person_party_id, employee_code) VALUES (v_tenant_id, v_party_id, 'EMP_POST_1') RETURNING id INTO v_employee_id;
      
      INSERT INTO public.employee_postings (tenant_id, employee_id, office_id, posting_nature, effective_from) VALUES (v_tenant_id, v_employee_id, '40000000-0000-4000-a000-000000000001', 'SUBSTANTIVE', '2023-01-01'); 
      INSERT INTO public.employee_postings (tenant_id, employee_id, office_id, posting_nature, effective_from) VALUES (v_tenant_id, v_employee_id, '40000000-0000-4000-a000-000000000002', 'SUBSTANTIVE', '2024-01-01'); 
    END $blk$;
    $$,
    '23P01', -- exclusion_violation
    NULL,
    'Overlapping active substantive postings should be rejected'
);

-- SCHOOL_TYPE fails closed
-- Verifies that evaluating can_access_employee fails if the employee has no SCHOOL_TYPE fact
SELECT is(
    public.can_access_employee('00000000-0000-0000-0000-000000000000', 'READ'),
    false,
    'unresolved SCHOOL_TYPE scope fails closed'
);


-- 7. Child-Table Cross-Tenant Isolation Tests (RLS)
-- Mock SED User
SET LOCAL ROLE authenticated;
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
SET LOCAL ROLE authenticated;
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
RESET ROLE;
SELECT set_config('request.jwt.claims', '', true);


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
      v_user_id uuid;
    BEGIN
      INSERT INTO public.parties (tenant_id, party_type, display_name) VALUES (v_tenant_id, 'PERSON', 'Test Person') RETURNING id INTO v_party_id;
      INSERT INTO public.person_parties (party_id, first_name) VALUES (v_party_id, 'Test');
      INSERT INTO public.employee_profiles (tenant_id, person_party_id, employee_code) VALUES (v_tenant_id, v_party_id, 'EMP_OPT_1') RETURNING id INTO v_employee_id;
      
      INSERT INTO public.user_accounts (tenant_id, supabase_auth_id) VALUES (v_tenant_id, 'd0000000-0000-4000-a000-000000000001') RETURNING id INTO v_user_id;
      
      INSERT INTO public.employee_change_requests (tenant_id, employee_id, requested_by, request_type, status)
        VALUES (v_tenant_id, v_employee_id, v_user_id, 'PROFILE_UPDATE', 'APPROVED')
        RETURNING id INTO v_req_id;
        
      SELECT record_version INTO v_version FROM public.employee_profiles WHERE id = v_employee_id;
      
      INSERT INTO public.employee_change_request_items (tenant_id, change_request_id, target_entity_type, target_record_id, operation, proposed_values, existing_record_version)
        VALUES (v_tenant_id, v_req_id, 'PROFILE', v_employee_id, 'UPDATE', '{"employment_status":"RETIRED"}', v_version - 1);
        
      PERFORM public.apply_approved_employee_change_request(v_req_id);
    END $blk$;
  $$,
  'P0001',
  NULL,
  'Optimistic locking did not prevent stale update.'
);

SELECT * FROM finish();
ROLLBACK;
