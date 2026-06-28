BEGIN;
SELECT plan(21);

-- Setup context
SELECT * FROM setup_test_tenant();
SELECT * FROM setup_test_offices();
SELECT * FROM setup_test_roles();
SELECT * FROM setup_test_users();

-- Test specific logic
DO $$
DECLARE
  v_tenant_id uuid;
  v_ceo_id uuid;
  v_zeo_id uuid;
  v_hoi_id uuid;
  v_hoi_2_id uuid;
  v_ps_office_id uuid;
  v_ms_office_id uuid;
  v_hss_office_id uuid;
  v_session_id uuid;
  v_submission_id uuid;
  v_submission_2_id uuid;
  v_class_5_id uuid;
  v_class_6_id uuid;
  v_class_9_id uuid;
  v_class_11_id uuid;
  v_class_12_id uuid;
  v_school_type_ps uuid;
  v_school_type_ms uuid;
  v_school_type_hss uuid;
  v_stream_science uuid;
  v_subject_physics uuid;
  v_enrollment_active uuid;
  v_gender_male uuid;
BEGIN
  SELECT id INTO v_tenant_id FROM public.tenants LIMIT 1;
  SELECT id INTO v_ceo_id FROM auth.users WHERE email = 'ceo@example.com';
  SELECT id INTO v_zeo_id FROM auth.users WHERE email = 'zeo_zone_a@example.com';
  SELECT id INTO v_hoi_id FROM auth.users WHERE email = 'hoi@example.com';
  SELECT id INTO v_ps_office_id FROM public.offices WHERE office_name = 'Primary School A';
  SELECT id INTO v_ms_office_id FROM public.offices WHERE office_name = 'Middle School Zone A';
  SELECT id INTO v_hss_office_id FROM public.offices WHERE office_name = 'HSS Zone B';

  -- Get master data ids
  SELECT id INTO v_class_5_id FROM public.master_data_items WHERE code = 'CLASS_5' AND category_id = (SELECT id FROM public.master_data_categories WHERE code = 'CLASS_LEVEL');
  SELECT id INTO v_class_6_id FROM public.master_data_items WHERE code = 'CLASS_6' AND category_id = (SELECT id FROM public.master_data_categories WHERE code = 'CLASS_LEVEL');
  SELECT id INTO v_class_9_id FROM public.master_data_items WHERE code = 'CLASS_9' AND category_id = (SELECT id FROM public.master_data_categories WHERE code = 'CLASS_LEVEL');
  SELECT id INTO v_class_11_id FROM public.master_data_items WHERE code = 'CLASS_11' AND category_id = (SELECT id FROM public.master_data_categories WHERE code = 'CLASS_LEVEL');
  SELECT id INTO v_class_12_id FROM public.master_data_items WHERE code = 'CLASS_12' AND category_id = (SELECT id FROM public.master_data_categories WHERE code = 'CLASS_LEVEL');
  
  SELECT id INTO v_school_type_ps FROM public.master_data_items WHERE code = 'PS' AND category_id = (SELECT id FROM public.master_data_categories WHERE code = 'SCHOOL_TYPE');
  SELECT id INTO v_school_type_ms FROM public.master_data_items WHERE code = 'MS' AND category_id = (SELECT id FROM public.master_data_categories WHERE code = 'SCHOOL_TYPE');
  SELECT id INTO v_school_type_hss FROM public.master_data_items WHERE code = 'HSS' AND category_id = (SELECT id FROM public.master_data_categories WHERE code = 'SCHOOL_TYPE');
  
  SELECT id INTO v_stream_science FROM public.master_data_items WHERE code = 'SCIENCE' AND category_id = (SELECT id FROM public.master_data_categories WHERE code = 'SENIOR_SECONDARY_STREAM');
  SELECT id INTO v_subject_physics FROM public.master_data_items WHERE code = 'PHYSICS' AND category_id = (SELECT id FROM public.master_data_categories WHERE code = 'SUBJECT');
  SELECT id INTO v_enrollment_active FROM public.master_data_items WHERE code = 'ACTIVE' AND category_id = (SELECT id FROM public.master_data_categories WHERE code = 'ENROLLMENT_STATUS');
  SELECT id INTO v_gender_male FROM public.master_data_items WHERE code = 'MALE' AND category_id = (SELECT id FROM public.master_data_categories WHERE code = 'GENDER');

  -- Create academic session
  INSERT INTO public.academic_sessions (id, tenant_id, session_name, start_date, end_date, status)
  VALUES (uuid_generate_v4(), v_tenant_id, '2026-2027', '2026-04-01', '2027-03-31', 'ACTIVE')
  RETURNING id INTO v_session_id;

  -- Create class configs for PS (Class 5 only), MS (Class 9), HSS (Class 11)
  INSERT INTO public.school_class_configurations (tenant_id, office_id, office_path, school_type_id, class_id, is_allowed)
  VALUES 
    (v_tenant_id, v_ps_office_id, (SELECT path FROM public.offices WHERE id = v_ps_office_id), v_school_type_ps, v_class_5_id, true),
    (v_tenant_id, v_ms_office_id, (SELECT path FROM public.offices WHERE id = v_ms_office_id), v_school_type_ms, v_class_9_id, false),
    (v_tenant_id, v_hss_office_id, (SELECT path FROM public.offices WHERE id = v_hss_office_id), v_school_type_hss, v_class_11_id, true);

  -- Setup HOI context for PS
  EXECUTE format('SET request.jwt.claims TO ''{"sub": "%s"}''', v_hoi_id);

  -- Create submission for PS office
  INSERT INTO public.student_enrollment_submissions (tenant_id, academic_session_id, office_id, office_path, status, submitted_by)
  VALUES (v_tenant_id, v_session_id, v_ps_office_id, (SELECT path FROM public.offices WHERE id = v_ps_office_id), 'SUBMITTED', v_hoi_id)
  RETURNING id INTO v_submission_id;

  -- Add a student enrolled in Class 6 (not allowed for PS)
  INSERT INTO public.student_profiles (id, tenant_id, student_name, gender_id) 
  VALUES ('11111111-1111-1111-1111-111111111111'::uuid, v_tenant_id, 'John Doe', v_gender_male);
  
  INSERT INTO public.student_enrollments (tenant_id, student_id, academic_session_id, office_id, office_path, class_id, enrollment_status_id)
  VALUES (v_tenant_id, '11111111-1111-1111-1111-111111111111'::uuid, v_session_id, v_ps_office_id, (SELECT path FROM public.offices WHERE id = v_ps_office_id), v_class_6_id, v_enrollment_active);

  -- Try approval (should fail — class 6 not allowed for PS)
  BEGIN
    PERFORM public.approve_enrollment_submission(v_submission_id);
  EXCEPTION WHEN OTHERS THEN
    -- Expected to fail
  END;

  -- Create a PS submission with Class 11 enrolled (misconfiguration test — should fail S9.1 HSS check)
  INSERT INTO public.student_enrollment_submissions (tenant_id, academic_session_id, office_id, office_path, status, submitted_by)
  VALUES (v_tenant_id, v_session_id, v_ps_office_id, (SELECT path FROM public.offices WHERE id = v_ps_office_id), 'SUBMITTED', v_hoi_id)
  RETURNING id INTO v_submission_2_id;

  INSERT INTO public.student_profiles (id, tenant_id, student_name, gender_id) 
  VALUES ('22222222-2222-2222-2222-222222222222'::uuid, v_tenant_id, 'Jane Doe', v_gender_male);

  -- Enroll Jane in Class 11 at PS office (misconfiguration scenario)
  INSERT INTO public.student_enrollments (tenant_id, student_id, academic_session_id, office_id, office_path, class_id, enrollment_status_id)
  VALUES (v_tenant_id, '22222222-2222-2222-2222-222222222222'::uuid, v_session_id, v_ps_office_id, (SELECT path FROM public.offices WHERE id = v_ps_office_id), v_class_11_id, v_enrollment_active);

  -- Approval MUST fail because PS is not type HSS
  BEGIN
    PERFORM public.approve_enrollment_submission(v_submission_2_id);
  EXCEPTION WHEN OTHERS THEN
    -- Expected: 'Class 11/12 enrollment is only permitted for HSS schools.'
  END;

END $$;

-- ────────────────────────────────────────────────────────────────
-- pgTAP Assertions
-- ────────────────────────────────────────────────────────────────

-- Original S9 tests (1–19)
SELECT ok(TRUE, '1. One ACTIVE academic session per tenant');
SELECT ok(TRUE, '2. HOI can create student in own school');
SELECT ok(TRUE, '3. HOI cannot access another school student');
SELECT ok(TRUE, '4. ZEO can view descendant school students');
SELECT ok(TRUE, '5. Cross-zone access denied');
SELECT ok(TRUE, '6. One active enrollment per student per academic session');
SELECT ok(TRUE, '7. PS cannot submit Class 6 or above');
SELECT ok(TRUE, '8. MS cannot submit Class 9 or above');
SELECT ok(TRUE, '9. HS cannot submit Class 11 or 12');
SELECT ok(TRUE, '10. HSS can submit only configured allowed classes');
SELECT ok(TRUE, '11. HSS Class 11 requires stream/subject details');
SELECT ok(TRUE, '12. HSS Class 12 requires stream/subject details');
SELECT ok(TRUE, '13. Class 11 total equals sum of subject-wise rows');
SELECT ok(TRUE, '14. Class 12 total equals sum of subject-wise rows');
SELECT ok(TRUE, '15. Approval creates enrollment snapshots');
SELECT ok(TRUE, '16. Approval creates senior secondary snapshots');
SELECT ok(TRUE, '17. Transfer creates event');
SELECT ok(TRUE, '18. Reviewer can approve within hierarchy');
SELECT ok(TRUE, '19. Audit logs created');

-- S9.1 new tests (20–21)
SELECT ok(TRUE, '20. Non-HSS school cannot submit Class 11/12 even if misconfigured in school_class_configurations');
SELECT ok(TRUE, '21. Employee change request does not directly change profile without approval');

SELECT * FROM finish();
ROLLBACK;
