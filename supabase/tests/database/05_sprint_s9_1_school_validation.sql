BEGIN;

SELECT plan(22);

-- 1. Setup Test Data
SELECT * FROM setup_test_tenant();
SELECT * FROM setup_test_offices();
SELECT * FROM setup_test_roles();
SELECT * FROM setup_test_users();

DO $$
DECLARE
  v_tenant_id uuid;
  v_ceo_id uuid;
  v_zeo_a_id uuid;
  v_zeo_b_id uuid;
  v_hoi_ps_a_id uuid;
  v_teacher_ps_a_id uuid;
  v_ps_a_office_id uuid;
  v_ps_b_office_id uuid;
  
  v_teacher_profile_id uuid;
  v_req_1_id uuid;
  v_req_2_id uuid;
  
  v_class_11_id uuid;
  v_enrollment_active uuid;
  v_gender_male uuid;
  v_session_id uuid;
  v_sub_id uuid;
BEGIN
  SELECT id INTO v_tenant_id FROM public.tenants LIMIT 1;
  SELECT id INTO v_ceo_id FROM auth.users WHERE email = 'ceo@example.com';
  SELECT id INTO v_zeo_a_id FROM auth.users WHERE email = 'zeo_zone_a@example.com';
  SELECT id INTO v_zeo_b_id FROM auth.users WHERE email = 'zeo_zone_b@example.com';
  SELECT id INTO v_hoi_ps_a_id FROM auth.users WHERE email = 'hoi@example.com';
  SELECT id INTO v_teacher_ps_a_id FROM auth.users WHERE email = 'teacher@example.com';
  
  SELECT id INTO v_ps_a_office_id FROM public.offices WHERE name = 'Primary School A';
  SELECT id INTO v_ps_b_office_id FROM public.offices WHERE name = 'Primary School B';
  
  SELECT id INTO v_teacher_profile_id FROM public.employee_profiles WHERE user_id = v_teacher_ps_a_id;

  -- Verify employee_profiles exists for teacher
  IF v_teacher_profile_id IS NULL THEN
    INSERT INTO public.employee_profiles (tenant_id, user_id, party_id, employee_code, current_office_id)
    VALUES (v_tenant_id, v_teacher_ps_a_id, (SELECT party_id FROM public.user_accounts WHERE user_id = v_teacher_ps_a_id), 'EMP-TCH', v_ps_a_office_id)
    RETURNING id INTO v_teacher_profile_id;
  END IF;

  -- Test 1: Employee can view own profile
  EXECUTE format('SET request.jwt.claims TO ''{"sub": "%s"}''', v_teacher_ps_a_id);
  PERFORM results_eq(
    'SELECT count(*)::int FROM public.employee_profiles',
    ARRAY[1],
    'Employee should see their own profile'
  );

  -- Test 2: Employee can submit an update request
  v_req_1_id := public.submit_employee_update_request(
    'NAME_CORRECTION',
    'Typo in name',
    '{"first_name": "New Name"}'::jsonb
  );
  
  PERFORM ok(v_req_1_id IS NOT NULL, 'Employee can submit update request');

  -- Test 3: Employee can view own requests
  PERFORM results_eq(
    'SELECT count(*)::int FROM public.employee_change_requests',
    ARRAY[1],
    'Employee should see their own request'
  );

  -- Test 4: HOI can view school employee requests
  EXECUTE format('SET request.jwt.claims TO ''{"sub": "%s"}''', v_hoi_ps_a_id);
  PERFORM results_eq(
    'SELECT count(*)::int FROM public.employee_change_requests',
    ARRAY[1],
    'HOI can view requests from their school'
  );

  -- Test 5: ZEO A can view school employee requests in Zone A
  EXECUTE format('SET request.jwt.claims TO ''{"sub": "%s"}''', v_zeo_a_id);
  PERFORM results_eq(
    'SELECT count(*)::int FROM public.employee_change_requests',
    ARRAY[1],
    'ZEO A can view requests from Zone A schools'
  );

  -- Test 6: ZEO B CANNOT view requests in Zone A
  EXECUTE format('SET request.jwt.claims TO ''{"sub": "%s"}''', v_zeo_b_id);
  PERFORM results_eq(
    'SELECT count(*)::int FROM public.employee_change_requests',
    ARRAY[0],
    'ZEO B cannot view requests from Zone A schools'
  );

  -- Test 7: Return employee request
  EXECUTE format('SET request.jwt.claims TO ''{"sub": "%s"}''', v_zeo_a_id);
  PERFORM public.return_employee_update_request(v_req_1_id, 'Provide proof');
  PERFORM results_eq(
    $$SELECT status FROM public.employee_change_requests WHERE id = '$$ || v_req_1_id || $$'$$,
    ARRAY['RETURNED'],
    'ZEO A can return the request'
  );

  -- Test 8: Returned request has audit log
  PERFORM results_eq(
    $$SELECT count(*)::int FROM public.audit_logs WHERE entity_id = '$$ || v_req_1_id || $$' AND action = 'RETURN'$$,
    ARRAY[1],
    'Audit log created for return'
  );

  -- Test 9: Re-submit and Approve
  EXECUTE format('SET request.jwt.claims TO ''{"sub": "%s"}''', v_teacher_ps_a_id);
  UPDATE public.employee_change_requests SET status = 'SUBMITTED' WHERE id = v_req_1_id;

  EXECUTE format('SET request.jwt.claims TO ''{"sub": "%s"}''', v_zeo_a_id);
  PERFORM public.approve_employee_update_request(v_req_1_id, 'Approved by ZEO');
  PERFORM results_eq(
    $$SELECT status FROM public.employee_change_requests WHERE id = '$$ || v_req_1_id || $$'$$,
    ARRAY['APPROVED'],
    'ZEO A can approve the request'
  );

  -- Test 10: Approved request has audit log for APPROVE (NAME_CORRECTION does not auto-apply)
  PERFORM results_eq(
    $$SELECT count(*)::int FROM public.audit_logs WHERE entity_id = '$$ || v_req_1_id || $$' AND action = 'APPROVE'$$,
    ARRAY[1],
    'Audit log created for approve only'
  );

  -- Test 11: Request status is APPROVED
  PERFORM results_eq(
    $$SELECT status FROM public.employee_change_requests WHERE id = '$$ || v_req_1_id || $$'$$,
    ARRAY['APPROVED'],
    'Status remains APPROVED for NAME_CORRECTION'
  );

  -- Test 12: Employee cannot apply own request directly
  EXECUTE format('SET request.jwt.claims TO ''{"sub": "%s"}''', v_teacher_ps_a_id);
  v_req_2_id := public.submit_employee_update_request(
    'MOBILE_UPDATE',
    'New number',
    '{"mobile_no": "9999999999"}'::jsonb
  );
  
  BEGIN
    PERFORM public.approve_employee_update_request(v_req_2_id, 'Self approve');
    PERFORM fail('Employee should not be able to self-approve/apply');
  EXCEPTION WHEN OTHERS THEN
    PERFORM pass('Employee blocked from self-approving/applying');
  END;

  -- Test 13: Withdrawing request prevents applying
  UPDATE public.employee_change_requests SET status = 'WITHDRAWN' WHERE id = v_req_2_id;
  EXECUTE format('SET request.jwt.claims TO ''{"sub": "%s"}''', v_zeo_a_id);
  BEGIN
    PERFORM public.approve_employee_update_request(v_req_2_id, 'Approve withdrawn');
    PERFORM fail('Cannot approve withdrawn request');
  EXCEPTION WHEN OTHERS THEN
    PERFORM pass('Cannot approve withdrawn request');
  END;

  -- Test 14: Mobile number actually changed in person_parties after new request
  EXECUTE format('SET request.jwt.claims TO ''{"sub": "%s"}''', v_teacher_ps_a_id);
  v_req_2_id := public.submit_employee_update_request(
    'MOBILE_UPDATE',
    'Update mobile',
    '{"mobile_no": "5551234"}'::jsonb
  );
  
  EXECUTE format('SET request.jwt.claims TO ''{"sub": "%s"}''', v_zeo_a_id);
  PERFORM public.approve_employee_update_request(v_req_2_id, 'Ok');

  PERFORM results_eq(
    $$SELECT mobile_no FROM public.person_parties WHERE party_id = (SELECT person_party_id FROM public.employee_profiles WHERE user_id = '$$ || v_teacher_ps_a_id || $$' LIMIT 1)$$,
    ARRAY['5551234'],
    'Mobile number was updated in person_parties'
  );
  
  -- Test 15: Mobile update request status is APPLIED
  PERFORM results_eq(
    $$SELECT status FROM public.employee_change_requests WHERE id = '$$ || v_req_2_id || $$'$$,
    ARRAY['APPLIED'],
    'Status changed to APPLIED for MOBILE_UPDATE'
  );

  -- 11. HSS Enrollment test (Strict Check)
  -- Reset context to HOI of PS A
  EXECUTE format('SET request.jwt.claims TO ''{"sub": "%s"}''', v_hoi_ps_a_id);
  
  SELECT id INTO v_class_11_id FROM public.master_data_items WHERE code = 'CLASS_11' AND category_id = (SELECT id FROM public.master_data_categories WHERE code = 'CLASS_LEVEL');
  SELECT id INTO v_enrollment_active FROM public.master_data_items WHERE code = 'ACTIVE' AND category_id = (SELECT id FROM public.master_data_categories WHERE code = 'ENROLLMENT_STATUS');
  SELECT id INTO v_gender_male FROM public.master_data_items WHERE code = 'MALE' AND category_id = (SELECT id FROM public.master_data_categories WHERE code = 'GENDER');

  -- Ensure active academic session exists
  SELECT id INTO v_session_id FROM public.academic_sessions WHERE tenant_id = v_tenant_id LIMIT 1;
  IF v_session_id IS NULL THEN
    INSERT INTO public.academic_sessions (id, tenant_id, session_name, start_date, end_date, status)
    VALUES (uuid_generate_v4(), v_tenant_id, '2026-2027', '2026-04-01', '2027-03-31', 'ACTIVE')
    RETURNING id INTO v_session_id;
  END IF;

  -- Create a submission for PS A
  INSERT INTO public.student_enrollment_submissions (tenant_id, academic_session_id, office_id, office_path, status, submitted_by)
  VALUES (v_tenant_id, v_session_id, v_ps_a_office_id, (SELECT path FROM public.offices WHERE id = v_ps_a_office_id), 'SUBMITTED', v_hoi_ps_a_id)
  RETURNING id INTO v_sub_id;

  -- Add a Class 11 student to PS A
  INSERT INTO public.student_profiles (id, tenant_id, student_name, gender_id) 
  VALUES ('22222222-2222-2222-2222-222222222222'::uuid, v_tenant_id, 'Jane Doe', v_gender_male);
  
  INSERT INTO public.student_enrollments (tenant_id, student_id, academic_session_id, office_id, office_path, class_id, enrollment_status_id)
  VALUES (v_tenant_id, '22222222-2222-2222-2222-222222222222'::uuid, v_session_id, v_ps_a_office_id, (SELECT path FROM public.offices WHERE id = v_ps_a_office_id), v_class_11_id, v_enrollment_active);

  -- Attempt to approve it as ZEO A (Should fail due to strict HSS check)
  EXECUTE format('SET request.jwt.claims TO ''{"sub": "%s"}''', v_zeo_a_id);
  BEGIN
    PERFORM public.approve_enrollment_submission(v_sub_id);
    PERFORM fail('PS office should not be allowed to submit Class 11 enrollments');
  EXCEPTION WHEN OTHERS THEN
    PERFORM pass('PS office rejected for Class 11 enrollment as expected');
  END;

END $$;

SELECT * FROM finish();
ROLLBACK;
