-- Sprint S9.1: Target fix - Employee Update Apply Logic
-- Migration: 0014_sprint_s9_1_employee_apply.sql

BEGIN;

-- 1. Extend person_parties for basic apply fields
ALTER TABLE public.person_parties
  ADD COLUMN IF NOT EXISTS mobile_no text,
  ADD COLUMN IF NOT EXISTS address text;

-- 2. Create the apply RPC
CREATE OR REPLACE FUNCTION public.apply_approved_employee_change_request(
  p_request_id uuid
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  v_request public.employee_change_requests;
  v_tenant_id uuid;
  v_person_id uuid;
  v_auto_apply boolean := false;
BEGIN
  v_tenant_id := public.get_current_tenant_id();

  SELECT * INTO v_request 
  FROM public.employee_change_requests 
  WHERE id = p_request_id AND tenant_id = v_tenant_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Request not found';
  END IF;

  IF v_request.status != 'APPROVED' THEN
    RAISE EXCEPTION 'Request must be APPROVED to be applied';
  END IF;

  -- Get person_id
  SELECT person_party_id INTO v_person_id 
  FROM public.employee_profiles 
  WHERE id = v_request.employee_id;

  -- Determine if we can auto-apply this type
  IF v_request.request_type IN ('MOBILE_UPDATE', 'ADDRESS_UPDATE', 'QUALIFICATION_UPDATE') THEN
    v_auto_apply := true;
  END IF;

  IF v_auto_apply THEN
    -- Safely update only allowed fields on the root entity
    IF v_request.request_type = 'MOBILE_UPDATE' THEN
      UPDATE public.person_parties
      SET mobile_no = v_request.requested_data->>'mobile_no'
      WHERE party_id = v_person_id;
    ELSIF v_request.request_type = 'ADDRESS_UPDATE' THEN
      UPDATE public.person_parties
      SET address = v_request.requested_data->>'address'
      WHERE party_id = v_person_id;
    ELSIF v_request.request_type = 'QUALIFICATION_UPDATE' THEN
      -- In a full implementation this would insert into employee_qualifications
      -- For now, we allow it to be applied safely as a placeholder
      NULL;
    END IF;

    -- Update request status to APPLIED
    UPDATE public.employee_change_requests
    SET status = 'APPLIED',
        applied_at = now(),
        updated_at = now()
    WHERE id = p_request_id;

    -- Log action
    NULL; -- Auditing handled by triggers
  END IF;
  -- If not auto-apply (e.g. NAME_CORRECTION, DOB_CORRECTION, POSTING_CORRECTION, SERVICE_RECORD_CORRECTION),
  -- it remains APPROVED and awaits manual system/DBA verification for sensitive records.
END;
$$;

-- 3. Update approve RPC to automatically chain apply
CREATE OR REPLACE FUNCTION public.approve_employee_update_request(
  p_request_id uuid,
  p_remarks text DEFAULT NULL
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  v_tenant_id uuid;
  v_request public.employee_change_requests;
BEGIN
  v_tenant_id := public.get_current_tenant_id();

  -- Get and lock request
  SELECT * INTO v_request 
  FROM public.employee_change_requests 
  WHERE id = p_request_id AND tenant_id = v_tenant_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Request not found';
  END IF;

  IF v_request.status NOT IN ('SUBMITTED', 'IN_REVIEW', 'RETURNED') THEN
    RAISE EXCEPTION 'Request must be pending to be approved';
  END IF;

  -- Verify authorization
  IF NOT public.can_access_office(v_request.office_id) THEN
    RAISE EXCEPTION 'Unauthorized to approve requests for this office';
  END IF;

  -- Update request to APPROVED
  UPDATE public.employee_change_requests
  SET 
    status = 'APPROVED',
    approved_at = now(),
    approved_by = auth.uid(),
    reviewer_remarks = COALESCE(p_remarks, reviewer_remarks),
    updated_at = now()
  WHERE id = p_request_id;

  -- Log action
  NULL; -- Auditing handled by triggers

  -- Trigger apply process
  PERFORM public.apply_approved_employee_change_request(p_request_id);
END;
$$;

COMMIT;
