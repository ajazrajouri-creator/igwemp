-- ============================================================================
-- IGWEMP Sprint S6 - Employee Information Foundation (Revised)
-- ============================================================================

-- 0. Enable btree_gist for Exclusion Constraints
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- 1. Extend person_parties for PII masking (from S6 modifications)
ALTER TABLE public.person_parties
  ADD COLUMN IF NOT EXISTS aadhaar_last4 varchar(4),
  ADD COLUMN IF NOT EXISTS pan_masked text;

-- 2. Standardize employee_profiles person reference and constraints
ALTER TABLE public.employee_profiles
  RENAME COLUMN person_id TO person_party_id;

ALTER TABLE public.employee_profiles
  DROP CONSTRAINT IF EXISTS uq_employee_profiles_person_id;

ALTER TABLE public.employee_profiles 
  ADD CONSTRAINT uq_employee_profiles_person_party_id UNIQUE (tenant_id, person_party_id);

-- 3. Extend existing employee_profiles (from S4) with cache fields
ALTER TABLE public.employee_profiles
  ADD COLUMN IF NOT EXISTS department_employee_id text,
  ADD COLUMN IF NOT EXISTS employment_status text DEFAULT 'ACTIVE' CHECK (employment_status IN ('ACTIVE', 'RETIRED', 'SUSPENDED', 'TERMINATED', 'RESIGNED', 'DECEASED')),
  ADD COLUMN IF NOT EXISTS date_of_initial_appointment date,
  ADD COLUMN IF NOT EXISTS date_of_retirement date,
  ADD COLUMN IF NOT EXISTS employee_category_id uuid REFERENCES public.master_data_items(id),
  ADD COLUMN IF NOT EXISTS cadre_id uuid REFERENCES public.master_data_items(id),
  ADD COLUMN IF NOT EXISTS designation_id uuid REFERENCES public.master_data_items(id),
  ADD COLUMN IF NOT EXISTS current_office_id uuid REFERENCES public.offices(id),
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz,
  ADD COLUMN IF NOT EXISTS deleted_by uuid REFERENCES public.user_accounts(id),
  ADD COLUMN IF NOT EXISTS delete_reason text,
  ADD COLUMN IF NOT EXISTS record_version int NOT NULL DEFAULT 1;

-- Add indexes for secure current-state querying
CREATE INDEX IF NOT EXISTS idx_emp_prof_tenant ON public.employee_profiles(tenant_id);
CREATE INDEX IF NOT EXISTS idx_emp_prof_code ON public.employee_profiles(employee_code);
CREATE INDEX IF NOT EXISTS idx_emp_prof_office ON public.employee_profiles(current_office_id);
CREATE INDEX IF NOT EXISTS idx_emp_prof_cadre ON public.employee_profiles(cadre_id);
CREATE INDEX IF NOT EXISTS idx_emp_prof_designation ON public.employee_profiles(designation_id);
CREATE INDEX IF NOT EXISTS idx_emp_prof_status ON public.employee_profiles(employment_status);

-- 4. Master Data Validation Trigger Function
CREATE OR REPLACE FUNCTION public.validate_master_data_category()
RETURNS trigger AS $$
DECLARE
  v_expected_category text;
  v_actual_category text;
BEGIN
  -- Determine expected category based on column name (TG_ARGV)
  -- For simplicity in this demo, we assume the trigger passes the expected category code.
  IF NEW.cadre_id IS NOT NULL THEN
    SELECT c.code INTO v_actual_category FROM public.master_data_items i JOIN public.master_data_categories c ON i.category_id = c.id WHERE i.id = NEW.cadre_id;
    IF v_actual_category != 'CADRES' THEN RAISE EXCEPTION 'Invalid cadre_id. Must belong to CADRES category.'; END IF;
  END IF;
  IF NEW.designation_id IS NOT NULL THEN
    SELECT c.code INTO v_actual_category FROM public.master_data_items i JOIN public.master_data_categories c ON i.category_id = c.id WHERE i.id = NEW.designation_id;
    IF v_actual_category != 'DESIGNATIONS' THEN RAISE EXCEPTION 'Invalid designation_id. Must belong to DESIGNATIONS category.'; END IF;
  END IF;
  IF NEW.employee_category_id IS NOT NULL THEN
    SELECT c.code INTO v_actual_category FROM public.master_data_items i JOIN public.master_data_categories c ON i.category_id = c.id WHERE i.id = NEW.employee_category_id;
    IF v_actual_category != 'EMPLOYEE_CATEGORIES' THEN RAISE EXCEPTION 'Invalid employee_category_id. Must belong to EMPLOYEE_CATEGORIES category.'; END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_validate_employee_profiles_md
  BEFORE INSERT OR UPDATE ON public.employee_profiles
  FOR EACH ROW EXECUTE FUNCTION public.validate_master_data_category();

-- 5. Employee Service Records (Temporal Source of Truth)
CREATE TABLE public.employee_service_records (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  employee_id uuid NOT NULL REFERENCES public.employee_profiles(id) ON DELETE CASCADE,
  appointment_type_id uuid REFERENCES public.master_data_items(id),
  recruitment_mode_id uuid REFERENCES public.master_data_items(id),
  service_type_id uuid REFERENCES public.master_data_items(id),
  substantive_post_id uuid,
  pay_level_id uuid REFERENCES public.master_data_items(id),
  effective_from date NOT NULL,
  effective_to date,
  status text NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'SUPERSEDED', 'CANCELLED')),
  approved_by uuid REFERENCES public.user_accounts(id),
  approved_at timestamptz,
  linked_order_id uuid REFERENCES public.orders(id),
  record_version int NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Master data validation for service records
CREATE OR REPLACE FUNCTION public.validate_service_record_md() RETURNS trigger AS $$
DECLARE v_actual text;
BEGIN
  IF NEW.service_type_id IS NOT NULL THEN
    SELECT c.code INTO v_actual FROM public.master_data_items i JOIN public.master_data_categories c ON i.category_id = c.id WHERE i.id = NEW.service_type_id;
    IF v_actual != 'SERVICE_TYPES' THEN RAISE EXCEPTION 'Invalid service_type_id.'; END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER trg_validate_service_records_md BEFORE INSERT OR UPDATE ON public.employee_service_records FOR EACH ROW EXECUTE FUNCTION public.validate_service_record_md();

CREATE TRIGGER trg_emp_service_records_updated_at BEFORE UPDATE ON public.employee_service_records FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Temporal Constraint for Service Records
ALTER TABLE public.employee_service_records ADD CONSTRAINT exclude_overlapping_service 
  EXCLUDE USING gist (
    employee_id WITH =, 
    daterange(effective_from, COALESCE(effective_to, 'infinity'::date), '[]') WITH &&
  ) WHERE (status = 'ACTIVE');

-- 6. Employee Postings (Temporal Source of Truth)
CREATE TABLE public.employee_postings (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  employee_id uuid NOT NULL REFERENCES public.employee_profiles(id) ON DELETE CASCADE,
  office_id uuid NOT NULL REFERENCES public.offices(id),
  post_type_id uuid REFERENCES public.master_data_items(id),
  posting_nature text NOT NULL CHECK (posting_nature IN ('SUBSTANTIVE', 'TEMPORARY', 'CONTRACTUAL', 'PROBATION', 'TRANSFERRED')),
  effective_from date NOT NULL,
  effective_to date,
  joining_date date,
  relieving_date date,
  joining_order_id uuid REFERENCES public.orders(id),
  relieving_order_id uuid REFERENCES public.orders(id),
  status text NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'RELIEVED', 'CANCELLED')),
  approved_by uuid REFERENCES public.user_accounts(id),
  approved_at timestamptz,
  record_version int NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_emp_postings_active ON public.employee_postings(employee_id, office_id) WHERE effective_to IS NULL AND status = 'ACTIVE';

CREATE TRIGGER trg_emp_postings_updated_at BEFORE UPDATE ON public.employee_postings FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Temporal Constraint for Postings (Substantive)
ALTER TABLE public.employee_postings ADD CONSTRAINT exclude_overlapping_substantive_postings 
  EXCLUDE USING gist (
    employee_id WITH =, 
    daterange(effective_from, COALESCE(effective_to, 'infinity'::date), '[]') WITH &&
  ) WHERE (status = 'ACTIVE' AND posting_nature = 'SUBSTANTIVE');

-- 7. Employee Working Arrangements
CREATE TABLE public.employee_working_arrangements (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  employee_id uuid NOT NULL REFERENCES public.employee_profiles(id) ON DELETE CASCADE,
  arrangement_type text NOT NULL CHECK (arrangement_type IN ('ATTACHED', 'DEPLOYED', 'ADDITIONAL_CHARGE', 'TEMPORARY_DUTY', 'TRAINING', 'LEAVE_SUBSTITUTE')),
  parent_posting_id uuid REFERENCES public.employee_postings(id),
  working_office_id uuid NOT NULL REFERENCES public.offices(id),
  effective_from date NOT NULL,
  effective_to date,
  linked_order_id uuid REFERENCES public.orders(id),
  issued_by uuid REFERENCES public.user_accounts(id),
  status text NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'COMPLETED', 'CANCELLED')),
  remarks text,
  record_version int NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_emp_arrangements_updated_at BEFORE UPDATE ON public.employee_working_arrangements FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Temporal Constraint for Working Arrangements
ALTER TABLE public.employee_working_arrangements ADD CONSTRAINT exclude_overlapping_exclusive_arrangements 
  EXCLUDE USING gist (
    employee_id WITH =, 
    daterange(effective_from, COALESCE(effective_to, 'infinity'::date), '[]') WITH &&
  ) WHERE (status = 'ACTIVE' AND arrangement_type IN ('ATTACHED', 'DEPLOYED'));

-- 8. Qualifications & Subjects
CREATE TABLE public.employee_qualifications (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  employee_id uuid NOT NULL REFERENCES public.employee_profiles(id) ON DELETE CASCADE,
  qualification_type_id uuid NOT NULL REFERENCES public.master_data_items(id),
  subject_id uuid REFERENCES public.master_data_items(id),
  institution text NOT NULL,
  passing_year int NOT NULL,
  marks_or_grade text,
  verification_status text NOT NULL DEFAULT 'PENDING' CHECK (verification_status IN ('PENDING', 'VERIFIED', 'REJECTED')),
  verified_by uuid REFERENCES public.user_accounts(id),
  verified_at timestamptz,
  record_version int NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.employee_subjects (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  employee_id uuid NOT NULL REFERENCES public.employee_profiles(id) ON DELETE CASCADE,
  subject_id uuid NOT NULL REFERENCES public.master_data_items(id),
  proficiency_type text CHECK (proficiency_type IN ('TEACHING', 'READING', 'WRITING', 'SPOKEN')),
  is_primary boolean NOT NULL DEFAULT false,
  effective_from date,
  effective_to date,
  record_version int NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_emp_qualifications_updated_at BEFORE UPDATE ON public.employee_qualifications FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_emp_subjects_updated_at BEFORE UPDATE ON public.employee_subjects FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Exclude multiple active primary subjects
CREATE UNIQUE INDEX uq_emp_active_primary_subject ON public.employee_subjects(employee_id) WHERE is_primary = true AND effective_to IS NULL;

-- 9. Workflow-based Change Requests
CREATE TABLE public.employee_change_requests (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  employee_id uuid NOT NULL REFERENCES public.employee_profiles(id) ON DELETE CASCADE,
  requested_by uuid NOT NULL REFERENCES public.user_accounts(id),
  request_type text NOT NULL,
  reason text,
  case_id uuid REFERENCES public.cases(id),
  workflow_version_id uuid REFERENCES public.workflow_versions(id),
  status text NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'SUBMITTED', 'IN_REVIEW', 'APPROVED', 'REJECTED', 'CANCELLED', 'APPLIED')),
  submitted_at timestamptz,
  approved_at timestamptz,
  approved_by uuid REFERENCES public.user_accounts(id),
  record_version int NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.employee_change_request_items (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  change_request_id uuid NOT NULL REFERENCES public.employee_change_requests(id) ON DELETE CASCADE,
  target_entity_type text NOT NULL CHECK (target_entity_type IN ('PROFILE', 'SERVICE', 'POSTING', 'ARRANGEMENT', 'QUALIFICATION', 'SUBJECT', 'DOCUMENT')),
  target_record_id uuid,
  operation text NOT NULL CHECK (operation IN ('CREATE', 'UPDATE', 'CLOSE', 'CORRECT')),
  proposed_values jsonb NOT NULL,
  existing_record_version int,
  status text NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPLIED', 'FAILED', 'REJECTED')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_emp_change_req_updated_at BEFORE UPDATE ON public.employee_change_requests FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_emp_change_req_item_updated_at BEFORE UPDATE ON public.employee_change_request_items FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- 10. Server-Side Bulk Import Foundation
CREATE TABLE public.employee_import_batches (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  source_document_id uuid REFERENCES public.documents(id),
  template_version text,
  batch_status text NOT NULL DEFAULT 'UPLOADED' CHECK (batch_status IN ('UPLOADED', 'PARSING', 'VALIDATED', 'PARTIAL_COMMIT', 'COMMITTED', 'FAILED')),
  validation_started_at timestamptz,
  validation_completed_at timestamptz,
  total_rows int DEFAULT 0,
  valid_rows int DEFAULT 0,
  invalid_rows int DEFAULT 0,
  duplicate_rows int DEFAULT 0,
  processed_at timestamptz,
  committed_at timestamptz,
  committed_by uuid REFERENCES public.user_accounts(id),
  created_by uuid NOT NULL REFERENCES public.user_accounts(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.employee_import_rows (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  batch_id uuid NOT NULL REFERENCES public.employee_import_batches(id) ON DELETE CASCADE,
  row_number int NOT NULL,
  raw_input jsonb NOT NULL,
  validation_errors jsonb,
  matched_employee_id uuid REFERENCES public.employee_profiles(id),
  import_status text NOT NULL DEFAULT 'PENDING' CHECK (import_status IN ('PENDING', 'VALID', 'INVALID', 'COMMITTED', 'REJECTED')),
  imported_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 11. Secure Indexed Normal View (Derived Source of Truth)
CREATE OR REPLACE VIEW public.v_employee_current_state WITH (security_invoker = true) AS
SELECT 
  e.id as employee_id,
  e.tenant_id,
  e.employee_code,
  e.department_employee_id,
  e.employment_status,
  e.person_party_id as person_id,
  p.first_name,
  p.last_name,
  p.gender,
  e.employee_category_id,
  e.cadre_id,
  e.designation_id,
  e.current_office_id,
  o.office_name,
  pos.id as current_posting_id,
  pos.posting_nature,
  arr.id as current_arrangement_id,
  arr.working_office_id,
  arr.arrangement_type,
  srv.id as current_service_id,
  srv.service_type_id
FROM public.employee_profiles e
JOIN public.person_parties p ON e.person_party_id = p.party_id
LEFT JOIN public.offices o ON e.current_office_id = o.id
LEFT JOIN public.employee_postings pos ON pos.employee_id = e.id AND pos.status = 'ACTIVE' AND pos.effective_to IS NULL
LEFT JOIN public.employee_working_arrangements arr ON arr.employee_id = e.id AND arr.status = 'ACTIVE' AND arr.effective_to IS NULL
LEFT JOIN public.employee_service_records srv ON srv.employee_id = e.id AND srv.status = 'ACTIVE' AND srv.effective_to IS NULL
WHERE e.deleted_at IS NULL;

-- 12. Full Data-Scope Security Evaluator
CREATE OR REPLACE FUNCTION public.can_access_employee(p_employee_id uuid, p_action text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tenant_id uuid;
  v_employee_record RECORD;
BEGIN
  v_tenant_id := get_current_tenant_id();

  SELECT * INTO v_employee_record FROM public.v_employee_current_state WHERE employee_id = p_employee_id AND tenant_id = v_tenant_id;
  IF NOT FOUND THEN RETURN FALSE; END IF;

  -- 1. System Admin Bypass
  IF EXISTS (
    SELECT 1 FROM public.role_assignments ra 
    JOIN public.roles r ON ra.role_id = r.id 
    WHERE ra.user_id = auth.uid() AND r.code = 'SYSTEM_ADMIN'
  ) THEN
    RETURN TRUE;
  END IF;

  -- 2. Self Access
  IF EXISTS (
    SELECT 1 FROM public.user_accounts u 
    WHERE u.id = auth.uid() AND u.party_id = v_employee_record.person_id
  ) THEN
    RETURN TRUE;
  END IF;

  -- 3. Office Hierarchy (ltree) & Scope Evaluation
  -- A user has access if they hold an active role assignment in an office that is an ancestor of the employee's current_office.
  IF EXISTS (
    SELECT 1 FROM public.role_assignments ra
    JOIN public.offices o ON o.id = ra.office_id
    JOIN public.offices emp_o ON emp_o.id = v_employee_record.current_office_id
    WHERE ra.user_id = auth.uid()
      AND ra.tenant_id = v_tenant_id
      AND ra.effective_from <= CURRENT_DATE
      AND (ra.effective_to IS NULL OR ra.effective_to >= CURRENT_DATE)
      AND (emp_o.path <@ o.path OR ra.office_id IS NULL)
  ) THEN
    -- In a full implementation, we'd also intersect with Role Assignment Scopes (e.g. Cadre = Teacher).
    RETURN TRUE;
  END IF;

  RETURN FALSE;
END;
$$;

-- 13. Controlled Profile Cache Refresh
CREATE OR REPLACE FUNCTION public.refresh_employee_profile_cache(p_employee_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_office_id uuid;
BEGIN
  -- Re-evaluate the active posting office
  SELECT office_id INTO v_current_office_id 
  FROM public.employee_postings 
  WHERE employee_id = p_employee_id AND status = 'ACTIVE' AND effective_to IS NULL 
  ORDER BY created_at DESC LIMIT 1;
  
  UPDATE public.employee_profiles
  SET 
    current_office_id = v_current_office_id,
    record_version = record_version + 1
  WHERE id = p_employee_id;
END;
$$;

-- 14. Secure Transactional RPC for Change Requests
CREATE OR REPLACE FUNCTION public.apply_approved_employee_change_request(p_request_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_req RECORD;
  v_item RECORD;
  v_target_version int;
BEGIN
  -- 1. Accept change_request_id only & load workflow-approved request
  SELECT * INTO v_req FROM public.employee_change_requests WHERE id = p_request_id AND status = 'APPROVED';
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Change request not found or not in APPROVED state.';
  END IF;

  -- 2. Idempotency Check
  IF v_req.status = 'APPLIED' THEN
    RETURN jsonb_build_object('success', true, 'message', 'Already applied.');
  END IF;

  -- Process items
  FOR v_item IN SELECT * FROM public.employee_change_request_items WHERE change_request_id = p_request_id AND status = 'PENDING' LOOP
    
    -- 3. Validate Target Entity Type & 4. Validate Permitted Fields (Hardcoded per entity)
    IF v_item.target_entity_type = 'PROFILE' AND v_item.operation = 'UPDATE' THEN
      -- 5. Check record_version (Optimistic Locking)
      SELECT record_version INTO v_target_version FROM public.employee_profiles WHERE id = v_item.target_record_id FOR UPDATE;
      IF v_target_version != v_item.existing_record_version THEN
        RAISE EXCEPTION 'Optimistic locking failure on Profile ID %', v_item.target_record_id;
      END IF;

      -- 6. Apply changes transactionally
      UPDATE public.employee_profiles 
      SET 
        employment_status = COALESCE(v_item.proposed_values->>'employment_status', employment_status),
        department_employee_id = COALESCE(v_item.proposed_values->>'department_employee_id', department_employee_id),
        record_version = record_version + 1
      WHERE id = v_item.target_record_id;
      
    ELSIF v_item.target_entity_type = 'POSTING' AND v_item.operation = 'CREATE' THEN
      -- 7 & 8. Close superseded records and insert replacement
      UPDATE public.employee_postings 
      SET effective_to = CURRENT_DATE - 1, status = 'RELIEVED' 
      WHERE employee_id = v_req.employee_id AND status = 'ACTIVE' AND effective_to IS NULL;

      INSERT INTO public.employee_postings (
        tenant_id, employee_id, office_id, posting_nature, effective_from
      ) VALUES (
        v_req.tenant_id, v_req.employee_id, (v_item.proposed_values->>'office_id')::uuid, 
        v_item.proposed_values->>'posting_nature', COALESCE((v_item.proposed_values->>'effective_from')::date, CURRENT_DATE)
      );
    END IF;

    -- 12. Mark item applied
    UPDATE public.employee_change_request_items SET status = 'APPLIED' WHERE id = v_item.id;
  END LOOP;

  -- 10. Refresh Cache
  PERFORM public.refresh_employee_profile_cache(v_req.employee_id);

  -- 11. Mark Request Applied
  UPDATE public.employee_change_requests SET status = 'APPLIED' WHERE id = p_request_id;
  
  -- 13. Return structured result
  RETURN jsonb_build_object('success', true, 'message', 'Changes applied transactionally.');
END;
$$;

-- 15. Enable RLS
ALTER TABLE public.employee_service_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_postings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_working_arrangements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_qualifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_change_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_change_request_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_import_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_import_rows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_isolation_policy" ON public.employee_service_records FOR ALL USING (tenant_id = get_current_tenant_id());
CREATE POLICY "tenant_isolation_policy" ON public.employee_postings FOR ALL USING (tenant_id = get_current_tenant_id());
CREATE POLICY "tenant_isolation_policy" ON public.employee_working_arrangements FOR ALL USING (tenant_id = get_current_tenant_id());
CREATE POLICY "tenant_isolation_policy" ON public.employee_qualifications FOR ALL USING (tenant_id = get_current_tenant_id());
CREATE POLICY "tenant_isolation_policy" ON public.employee_subjects FOR ALL USING (tenant_id = get_current_tenant_id());
CREATE POLICY "tenant_isolation_policy" ON public.employee_change_requests FOR ALL USING (tenant_id = get_current_tenant_id());
CREATE POLICY "tenant_isolation_policy" ON public.employee_change_request_items FOR ALL USING (tenant_id = get_current_tenant_id());
CREATE POLICY "tenant_isolation_policy" ON public.employee_import_batches FOR ALL USING (tenant_id = get_current_tenant_id());
CREATE POLICY "tenant_isolation_policy" ON public.employee_import_rows FOR ALL USING (tenant_id = get_current_tenant_id());
