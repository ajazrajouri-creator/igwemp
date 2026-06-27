-- Sprint S9.1: School-Level End-to-End Validation Checkpoint
-- Migration: 0012_sprint_s9_1_employee_self_service.sql

BEGIN;

-- ============================================================
-- 1. EXTEND EMPLOYEE_CHANGE_REQUESTS
-- ============================================================

-- Add required fields while preserving existing data
ALTER TABLE public.employee_change_requests
  ADD COLUMN IF NOT EXISTS office_id uuid REFERENCES public.offices(id),
  ADD COLUMN IF NOT EXISTS office_path ltree,
  ADD COLUMN IF NOT EXISTS current_data jsonb,
  ADD COLUMN IF NOT EXISTS requested_data jsonb,
  ADD COLUMN IF NOT EXISTS attachment_document_id uuid REFERENCES public.documents(id),
  ADD COLUMN IF NOT EXISTS reviewer_remarks text,
  ADD COLUMN IF NOT EXISTS applied_at timestamptz,
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

-- Update the status check constraint to include RETURNED and WITHDRAWN
DO $$
DECLARE
  v_constraint_name text;
BEGIN
  SELECT conname INTO v_constraint_name
  FROM pg_constraint
  WHERE conrelid = 'public.employee_change_requests'::regclass
  AND pg_get_constraintdef(oid) LIKE '%CHECK (status %';

  IF v_constraint_name IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public.employee_change_requests DROP CONSTRAINT ' || v_constraint_name;
  END IF;
END $$;

ALTER TABLE public.employee_change_requests
  ADD CONSTRAINT chk_employee_change_requests_status 
  CHECK (status IN ('DRAFT', 'SUBMITTED', 'IN_REVIEW', 'APPROVED', 'REJECTED', 'CANCELLED', 'APPLIED', 'RETURNED', 'WITHDRAWN'));

-- Create indices for efficient filtering
CREATE INDEX IF NOT EXISTS idx_emp_change_req_office ON public.employee_change_requests(office_id);
CREATE INDEX IF NOT EXISTS idx_emp_change_req_path ON public.employee_change_requests USING GIST (office_path);

-- ============================================================
-- 2. UPDATE RLS POLICIES
-- ============================================================

-- Drop the old overly permissive tenant isolation policy if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'employee_change_requests' AND policyname = 'tenant_isolation_policy'
  ) THEN
    DROP POLICY "tenant_isolation_policy" ON public.employee_change_requests;
  END IF;
END $$;

-- 1. Base tenant isolation
CREATE POLICY "tenant_isolation" ON public.employee_change_requests
  FOR ALL USING (tenant_id = public.get_current_tenant_id());

-- 2. Select access: 
--    a) Requested by the user
--    b) User is HOI/ZEO and request belongs to an office in their hierarchy
CREATE POLICY "requests_select" ON public.employee_change_requests
  FOR SELECT USING (
    requested_by = auth.uid() OR
    (office_id IS NOT NULL AND public.can_access_office(office_id))
  );

-- No direct INSERT/UPDATE policies to prevent bypassing business logic (RPCs used instead)

-- ============================================================
-- 3. SECURE RPCS
-- ============================================================

-- 1. submit_employee_update_request
CREATE OR REPLACE FUNCTION public.submit_employee_update_request(
  p_request_type text,
  p_reason text,
  p_requested_data jsonb,
  p_attachment_id uuid DEFAULT NULL
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  v_tenant_id uuid;
  v_employee_id uuid;
  v_office_id uuid;
  v_office_path public.ltree;
  v_request_id uuid;
BEGIN
  -- Get context
  v_tenant_id := public.get_current_tenant_id();
  
  -- Resolve employee profile for the current user
  SELECT id, current_office_id INTO v_employee_id, v_office_id
  FROM public.employee_profiles
  WHERE user_id = auth.uid() AND tenant_id = v_tenant_id
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Employee profile not found for user';
  END IF;

  -- Resolve office path
  IF v_office_id IS NOT NULL THEN
    SELECT path INTO v_office_path FROM public.offices WHERE id = v_office_id AND tenant_id = v_tenant_id;
  END IF;

  -- Create request
  INSERT INTO public.employee_change_requests (
    tenant_id, employee_id, requested_by, request_type, reason, requested_data,
    attachment_document_id, office_id, office_path, status, submitted_at
  ) VALUES (
    v_tenant_id, v_employee_id, auth.uid(), p_request_type, p_reason, p_requested_data,
    p_attachment_id, v_office_id, v_office_path, 'SUBMITTED', now()
  ) RETURNING id INTO v_request_id;

  -- Log action
  NULL; -- Auditing handled by triggers

  RETURN v_request_id;
END;
$$;

-- 2. return_employee_update_request
CREATE OR REPLACE FUNCTION public.return_employee_update_request(
  p_request_id uuid,
  p_remarks text
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

  IF v_request.status NOT IN ('SUBMITTED', 'IN_REVIEW') THEN
    RAISE EXCEPTION 'Request must be SUBMITTED or IN_REVIEW to be returned';
  END IF;

  -- Verify authorization (must have access to the office)
  IF NOT public.can_access_office(v_request.office_id) THEN
    RAISE EXCEPTION 'Unauthorized to review requests for this office';
  END IF;

  -- Update request
  UPDATE public.employee_change_requests
  SET 
    status = 'RETURNED',
    reviewer_remarks = p_remarks,
    updated_at = now()
  WHERE id = p_request_id;

  -- Log action
  NULL; -- Auditing handled by triggers
END;
$$;

-- 3. approve_employee_update_request (delegates to apply_approved_employee_change_request eventually)
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

  -- Update request
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

  -- Note: apply_approved_employee_change_request from S6 can be called as a separate step or here.
  -- For now we just mark as APPROVED.
END;
$$;

COMMIT;
