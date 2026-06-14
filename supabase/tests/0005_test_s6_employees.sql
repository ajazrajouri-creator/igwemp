-- ============================================================================
-- IGWEMP Sprint S6 - Automated Tests for Employees
-- ============================================================================

DO $$
DECLARE
  v_tenant_id uuid;
  v_party_id uuid;
  v_employee_id uuid;
  v_req_id uuid;
  v_item_id uuid;
  v_version int;
BEGIN
  -- Setup dummy tenant
  INSERT INTO public.tenants (code, name) VALUES ('TEST_S6', 'Test Tenant S6') RETURNING id INTO v_tenant_id;
  
  -- Test 1: Employee Person Party UNIQUE constraint
  BEGIN
    INSERT INTO public.parties (tenant_id, party_type, display_name) VALUES (v_tenant_id, 'PERSON', 'Test Person') RETURNING id INTO v_party_id;
    INSERT INTO public.person_parties (party_id, first_name) VALUES (v_party_id, 'Test');
    
    INSERT INTO public.employee_profiles (tenant_id, person_party_id, employee_code) VALUES (v_tenant_id, v_party_id, 'EMP001') RETURNING id INTO v_employee_id;
    
    -- Second insert for the same person_party_id should fail
    INSERT INTO public.employee_profiles (tenant_id, person_party_id, employee_code) VALUES (v_tenant_id, v_party_id, 'EMP002');
    
    RAISE EXCEPTION 'TEST FAILED: Unique constraint on (tenant_id, person_party_id) did not fire.';
  EXCEPTION WHEN unique_violation THEN
    -- Passed
  END;

  -- Test 2: Change Request Optimistic Locking
  BEGIN
    -- Create dummy user for request
    INSERT INTO public.user_accounts (tenant_id, username, status) VALUES (v_tenant_id, 'testuser', 'ACTIVE');
    
    -- Insert Change Request
    INSERT INTO public.employee_change_requests (tenant_id, employee_id, requested_by, request_type, status)
      VALUES (v_tenant_id, v_employee_id, (SELECT id FROM public.user_accounts WHERE username = 'testuser'), 'PROFILE_UPDATE', 'APPROVED')
      RETURNING id INTO v_req_id;
      
    -- Get current version of profile
    SELECT record_version INTO v_version FROM public.employee_profiles WHERE id = v_employee_id;
    
    -- Insert Item with STALE version
    INSERT INTO public.employee_change_request_items (tenant_id, change_request_id, target_entity_type, target_record_id, operation, proposed_values, existing_record_version)
      VALUES (v_tenant_id, v_req_id, 'PROFILE', v_employee_id, 'UPDATE', '{"employment_status":"RETIRED"}', v_version - 1);
      
    -- Apply should throw exception due to optimistic lock
    PERFORM public.apply_approved_employee_change_request(v_req_id);
    
    RAISE EXCEPTION 'TEST FAILED: Optimistic locking did not prevent stale update.';
  EXCEPTION WHEN OTHERS THEN
    IF SQLERRM LIKE '%Optimistic locking failure%' THEN
      -- Passed
    ELSE
      RAISE EXCEPTION 'TEST FAILED: Wrong exception thrown: %', SQLERRM;
    END IF;
  END;

  -- Cleanup
  DELETE FROM public.tenants WHERE id = v_tenant_id;
  
  RAISE NOTICE '✅ Sprint S6 Employee Automated Tests Passed Successfully.';
END $$;
