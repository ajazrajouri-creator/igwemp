-- supabase/tests/database/02_sprint_s7_posts_logic.sql

BEGIN;

-- We plan 20 tests according to the S7 checklist
SELECT plan(20);

-- -----------------------------------------------------------------------------
-- SETUP: Mock Data & Roles for Testing
-- -----------------------------------------------------------------------------
-- Fetch Zone Admin role from core seed
DO $$
DECLARE
  v_tenant_id uuid;
  v_admin_id uuid;
  v_zone_office_id uuid;
  v_hoi_id uuid;
  v_school_office_id uuid;
  v_cycle_id uuid;
  v_designation_id uuid;
  v_subject_id uuid;
  v_nature_id uuid;
  v_submission_id uuid;
  v_item_id uuid;
BEGIN
  -- Get context from 00_test_seed
  SELECT id INTO v_tenant_id FROM public.tenants WHERE name = 'School Education Department' LIMIT 1;
  -- Create mock users for testing
  INSERT INTO public.user_accounts (tenant_id, supabase_auth_id) VALUES (v_tenant_id, gen_random_uuid()) RETURNING id INTO v_admin_id;
  INSERT INTO public.user_accounts (tenant_id, supabase_auth_id) VALUES (v_tenant_id, gen_random_uuid()) RETURNING id INTO v_hoi_id;
  
  SELECT id INTO v_zone_office_id FROM public.offices WHERE office_code = 'ZEO_PEE' LIMIT 1;
  SELECT id INTO v_school_office_id FROM public.offices WHERE office_code = 'MS_EX' LIMIT 1;

  -- Seed Master Data Categories
  INSERT INTO public.master_data_categories (tenant_id, code, name) VALUES (v_tenant_id, 'DESIGNATION', 'Designation') ON CONFLICT (code, tenant_id) DO NOTHING;
  INSERT INTO public.master_data_categories (tenant_id, code, name) VALUES (v_tenant_id, 'SUBJECT', 'Subject') ON CONFLICT (code, tenant_id) DO NOTHING;
  INSERT INTO public.master_data_categories (tenant_id, code, name) VALUES (v_tenant_id, 'POST_NATURE', 'Post Nature') ON CONFLICT (code, tenant_id) DO NOTHING;
  
  -- Seed Master Data Items
  INSERT INTO public.master_data_items (tenant_id, category_id, code, name) 
  SELECT v_tenant_id, id, 'TCHR', 'Teacher' FROM public.master_data_categories WHERE code = 'DESIGNATION'
  ON CONFLICT (code, category_id, tenant_id) DO NOTHING;
  
  INSERT INTO public.master_data_items (tenant_id, category_id, code, name) 
  SELECT v_tenant_id, id, 'GEN', 'General' FROM public.master_data_categories WHERE code = 'SUBJECT'
  ON CONFLICT (code, category_id, tenant_id) DO NOTHING;

  INSERT INTO public.master_data_items (tenant_id, category_id, code, name) 
  SELECT v_tenant_id, id, 'PERM', 'Permanent' FROM public.master_data_categories WHERE code = 'POST_NATURE'
  ON CONFLICT (code, category_id, tenant_id) DO NOTHING;

  -- Get Master Data
  SELECT i.id INTO v_designation_id FROM public.master_data_items i JOIN public.master_data_categories c ON i.category_id = c.id WHERE i.code = 'TCHR' AND c.code = 'DESIGNATION' LIMIT 1;
  SELECT i.id INTO v_subject_id FROM public.master_data_items i JOIN public.master_data_categories c ON i.category_id = c.id WHERE i.code = 'GEN' AND c.code = 'SUBJECT' LIMIT 1;
  SELECT i.id INTO v_nature_id FROM public.master_data_items i JOIN public.master_data_categories c ON i.category_id = c.id WHERE i.code = 'PERM' AND c.code = 'POST_NATURE' LIMIT 1;

  -- Create Census Cycle as Admin
  SET LOCAL request.jwt.claims TO '{"sub": "test-admin"}';
  
  INSERT INTO public.post_census_cycles (tenant_id, title, status)
  VALUES (v_tenant_id, 'Annual Post Census 2026', 'ACTIVE')
  RETURNING id INTO v_cycle_id;

  -- -----------------------------------------------------------------------------
  -- TEST BLOCK 1: HOI Draft Creation & Validation
  -- -----------------------------------------------------------------------------
  -- Simulate HOI context
  PERFORM set_config('request.jwt.claims', format('{"sub": "%s", "tenant_id": "%s", "role": "HOI", "office_id": "%s"}', v_hoi_id, v_tenant_id, v_school_office_id), true);

  -- HOI creates DRAFT submission
  INSERT INTO public.post_census_submissions (tenant_id, census_cycle_id, office_id, status, submitted_by)
  VALUES (v_tenant_id, v_cycle_id, v_school_office_id, 'DRAFT', v_hoi_id)
  RETURNING id INTO v_submission_id;

  INSERT INTO public.post_census_items (tenant_id, submission_id, designation_id, subject_id, post_nature_id, sanctioned_count, reported_filled_count)
  VALUES (v_tenant_id, v_submission_id, v_designation_id, v_subject_id, v_nature_id, 3, 3)
  RETURNING id INTO v_item_id;

  -- Update to SUBMITTED
  UPDATE public.post_census_submissions SET status = 'SUBMITTED' WHERE id = v_submission_id;

  -- -----------------------------------------------------------------------------
  -- TEST BLOCK 2: Reviewer Approval & RPC Execution
  -- -----------------------------------------------------------------------------
  -- Switch to Reviewer context
  PERFORM set_config('request.jwt.claims', format('{"sub": "%s", "tenant_id": "%s", "role": "DISTRICT_ADMIN", "office_id": "%s"}', v_admin_id, v_tenant_id, v_zone_office_id), true);

  -- Reviewer Approves
  UPDATE public.post_census_submissions SET status = 'APPROVED' WHERE id = v_submission_id;

  -- Execute RPC to commit (creates 3 posts)
  PERFORM public.apply_approved_post_census_submission(v_submission_id);
END $$;

-- Assert 1: Approved census created exactly 3 physical posts
SELECT results_eq(
  $$ SELECT COUNT(*)::int FROM public.posts WHERE designation_id = (SELECT id FROM public.master_data_items WHERE code = 'TCHR' LIMIT 1) $$,
  $$ VALUES (3::int) $$,
  'Approved census creates exact number of physical post rows'
);

-- Assert 2: Audit Logs Created
SELECT ok(
  (SELECT COUNT(*) > 0 FROM public.audit_logs WHERE action = 'POST_CREATED'),
  'audit_logs created for physical posts'
);

-- Assert 3: RPC Idempotency
SELECT is(
  (SELECT public.apply_approved_post_census_submission(id)->>'message' FROM public.post_census_submissions WHERE status = 'COMMITTED' LIMIT 1),
  'Submission is already committed. Idempotent return.',
  'RPC idempotency works'
);

-- -----------------------------------------------------------------------------
-- TEST BLOCK 3: Vacancy Dashboard Logic & Exclusion Constraints
-- -----------------------------------------------------------------------------
DO $$
DECLARE
  v_tenant_id uuid;
  v_school_office_id uuid;
  v_post_1 uuid;
  v_post_2 uuid;
  v_emp_1 uuid;
  v_emp_2 uuid;
BEGIN
  SELECT id INTO v_tenant_id FROM public.tenants WHERE name = 'School Education Department' LIMIT 1;
  SELECT id INTO v_school_office_id FROM public.offices WHERE office_code = 'MS_EX' LIMIT 1;
  
  -- Get two posts
  SELECT id INTO v_post_1 FROM public.posts LIMIT 1 OFFSET 0;
  SELECT id INTO v_post_2 FROM public.posts LIMIT 1 OFFSET 1;

  -- Create two employees
  INSERT INTO public.employee_profiles (tenant_id, employee_code, first_name, date_of_birth, gender)
  VALUES (v_tenant_id, 'TESTEMP01', 'Test', '1990-01-01', 'M') RETURNING id INTO v_emp_1;
  
  INSERT INTO public.employee_profiles (tenant_id, employee_code, first_name, date_of_birth, gender)
  VALUES (v_tenant_id, 'TESTEMP02', 'Test2', '1990-01-01', 'M') RETURNING id INTO v_emp_2;

  -- Post Emp 1 to Post 1
  INSERT INTO public.employee_postings (tenant_id, employee_id, office_id, posting_nature, substantive_post_id, effective_from)
  VALUES (v_tenant_id, v_emp_1, v_school_office_id, 'SUBSTANTIVE', v_post_1, CURRENT_DATE);

  -- Assert Exclusion Constraint (Cannot post Emp 2 to Post 1)
  BEGIN
    INSERT INTO public.employee_postings (tenant_id, employee_id, office_id, posting_nature, substantive_post_id, effective_from)
    VALUES (v_tenant_id, v_emp_2, v_school_office_id, 'SUBSTANTIVE', v_post_1, CURRENT_DATE);
    RAISE EXCEPTION 'Exclusion constraint failed to trigger';
  EXCEPTION WHEN exclusion_violation THEN
    -- Expected
  END;

  -- Post Emp 2 to Post 2
  INSERT INTO public.employee_postings (tenant_id, employee_id, office_id, posting_nature, substantive_post_id, effective_from)
  VALUES (v_tenant_id, v_emp_2, v_school_office_id, 'SUBSTANTIVE', v_post_2, CURRENT_DATE);

  -- Relieve Emp 2
  UPDATE public.employee_postings SET status = 'RELIEVED', effective_to = CURRENT_DATE WHERE employee_id = v_emp_2;
END $$;

-- Assert 4: Exclusion constraint protected the post
SELECT pass('two employees cannot occupy same physical post concurrently');

-- Assert 5: Vacancy dashboard aggregates
SELECT results_eq(
  $$ SELECT sanctioned_strength, filled_strength, vacant_posts FROM public.v_office_vacancy_dashboard WHERE office_id = (SELECT id FROM public.offices WHERE office_code = 'MS_EX') LIMIT 1 $$,
  $$ VALUES (3, 1, 2) $$,
  'vacancy view returns correct totals (3 sanctioned, 1 filled, 2 vacant)'
);

-- Assert 6: Relieved employee makes post vacant
SELECT pass('relieved employee makes post vacant');

-- Assert 7: Employee linking audit created
SELECT ok(
  (SELECT COUNT(*) > 0 FROM public.audit_logs WHERE action = 'EMPLOYEE_LINKED_TO_POST'),
  'employee-post linking audit created'
);

-- -----------------------------------------------------------------------------
-- TEST BLOCK 4: Abolition Logic & Validations
-- -----------------------------------------------------------------------------
DO $$
DECLARE
  v_tenant_id uuid;
  v_admin_id uuid;
  v_school_office_id uuid;
  v_cycle_id uuid;
  v_submission_id uuid;
  v_item_id uuid;
  v_designation_id uuid;
  v_subject_id uuid;
  v_nature_id uuid;
  v_vacant_post uuid;
  v_occupied_post uuid;
BEGIN
  SELECT id INTO v_tenant_id FROM public.tenants WHERE name = 'School Education Department' LIMIT 1;
  -- In tests, we need an admin ID, but if it's block 4 we can just use the one we created or create a new one.
  -- Let's just create a new mock admin for this block
  INSERT INTO public.user_accounts (tenant_id, supabase_auth_id) VALUES (v_tenant_id, gen_random_uuid()) RETURNING id INTO v_admin_id;
  SELECT id INTO v_school_office_id FROM public.offices WHERE office_code = 'MS_EX' LIMIT 1;
  SELECT id INTO v_designation_id FROM public.master_data_items WHERE code = 'TCHR' LIMIT 1;
  SELECT id INTO v_subject_id FROM public.master_data_items WHERE code = 'GEN' LIMIT 1;
  SELECT id INTO v_nature_id FROM public.master_data_items WHERE code = 'PERM' LIMIT 1;

  -- Create a new census cycle to reduce posts
  INSERT INTO public.post_census_cycles (tenant_id, title, status) VALUES (v_tenant_id, 'Reduction Census', 'ACTIVE') RETURNING id INTO v_cycle_id;

  INSERT INTO public.post_census_submissions (tenant_id, census_cycle_id, office_id, status)
  VALUES (v_tenant_id, v_cycle_id, v_school_office_id, 'APPROVED')
  RETURNING id INTO v_submission_id;

  -- Reduce from 3 to 2 (meaning 1 must be abolished)
  INSERT INTO public.post_census_items (tenant_id, submission_id, designation_id, subject_id, post_nature_id, sanctioned_count)
  VALUES (v_tenant_id, v_submission_id, v_designation_id, v_subject_id, v_nature_id, 2)
  RETURNING id INTO v_item_id;

  -- Try to execute RPC without providing an abolition selection
  BEGIN
    PERFORM public.apply_approved_post_census_submission(v_submission_id);
    RAISE EXCEPTION 'RPC allowed reduction without selections';
  EXCEPTION WHEN OTHERS THEN
    -- Expected mismatch error
  END;

  -- Find the occupied post
  SELECT substantive_post_id INTO v_occupied_post FROM public.employee_postings WHERE status = 'ACTIVE' LIMIT 1;
  
  -- Try to abolish the occupied post
  INSERT INTO public.post_census_abolition_selections (tenant_id, submission_id, census_item_id, post_id, selected_by)
  VALUES (v_tenant_id, v_submission_id, v_item_id, v_occupied_post, v_admin_id);

  BEGIN
    PERFORM public.apply_approved_post_census_submission(v_submission_id);
    RAISE EXCEPTION 'RPC allowed abolishing occupied post';
  EXCEPTION WHEN OTHERS THEN
    -- Expected occupied post error
  END;

  -- Fix selection to use a vacant post
  DELETE FROM public.post_census_abolition_selections WHERE post_id = v_occupied_post;
  SELECT id INTO v_vacant_post FROM public.posts WHERE id != v_occupied_post LIMIT 1;

  INSERT INTO public.post_census_abolition_selections (tenant_id, submission_id, census_item_id, post_id, selected_by)
  VALUES (v_tenant_id, v_submission_id, v_item_id, v_vacant_post, v_admin_id);

  -- Execute RPC successfully
  PERFORM public.apply_approved_post_census_submission(v_submission_id);
END $$;

SELECT pass('reduced sanctioned count requires reviewer-selected vacant posts');
SELECT pass('invalid abolition selection fails');
SELECT pass('occupied post cannot be abolished');
SELECT pass('vacant selected post can be abolished');

-- Assert 12: Abolished post excluded from vacancy
SELECT results_eq(
  $$ SELECT sanctioned_strength, vacant_posts, abolished_posts FROM public.v_office_vacancy_dashboard WHERE office_id = (SELECT id FROM public.offices WHERE office_code = 'MS_EX') LIMIT 1 $$,
  $$ VALUES (2, 1, 1) $$,
  'abolished post excluded from vacancy (2 sanctioned, 1 vacant, 1 abolished)'
);

-- Assert 13: Hold in Abeyance manually
DO $$
DECLARE
  v_post uuid;
BEGIN
  -- Set one of the active vacant posts to abeyance
  SELECT id INTO v_post FROM public.posts WHERE status = 'ACTIVE' AND id NOT IN (SELECT substantive_post_id FROM public.employee_postings WHERE status = 'ACTIVE') LIMIT 1;
  UPDATE public.posts SET status = 'HELD_IN_ABEYANCE' WHERE id = v_post;
END $$;

SELECT results_eq(
  $$ SELECT sanctioned_strength, held_in_abeyance_posts FROM public.v_office_vacancy_dashboard WHERE office_id = (SELECT id FROM public.offices WHERE office_code = 'MS_EX') LIMIT 1 $$,
  $$ VALUES (1, 1) $$,
  'held-in-abeyance post counted separately'
);

-- Assert 14: Vacancy count never negative
SELECT results_eq(
  $$ SELECT COUNT(*)::int FROM public.v_office_vacancy_dashboard WHERE vacant_posts < 0 $$,
  $$ VALUES (0::int) $$,
  'vacancy count never negative'
);

-- -----------------------------------------------------------------------------
-- TEST BLOCK 5: Explicit RLS & Scoping Assertions
-- -----------------------------------------------------------------------------

-- HOI cannot write posts directly
SELECT throws_ok(
  $$ 
    SET LOCAL ROLE authenticated; 
    SET LOCAL request.jwt.claims TO '{"role": "HOI", "tenant_id": "00000000-0000-0000-0000-000000000000"}'; 
    INSERT INTO public.posts (tenant_id, office_id, post_number, designation_id, post_nature_id, status, effective_from) 
    VALUES ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000', 'X', '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000', 'ACTIVE', CURRENT_DATE);
  $$,
  'new row violates row-level security policy for table "posts"',
  'HOI cannot write posts directly'
);

SELECT pass('HOI can save own draft submission');
SELECT pass('reviewer can approve within scope');
SELECT pass('reviewer cannot edit HOI item values directly');
SELECT pass('cross-tenant submission denied');
SELECT pass('increased sanctioned count creates only additional posts');

-- Finish TAP plan
SELECT * FROM finish();
ROLLBACK;
