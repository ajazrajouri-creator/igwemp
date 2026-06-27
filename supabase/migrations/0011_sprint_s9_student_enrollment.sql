-- Sprint S9: Student Enrollment & School Roll Management
-- Migration: 0011_sprint_s9_student_enrollment.sql

BEGIN;

-- ============================================================
-- 1. MASTER DATA CATEGORIES & SEED VALUES
-- ============================================================

-- SCHOOL_TYPE
INSERT INTO public.master_data_categories (id, tenant_id, code, name, description, is_active, created_at, updated_at)
VALUES (uuid_generate_v4(), (SELECT id FROM public.tenants LIMIT 1), 'SCHOOL_TYPE', 'School Type', 'Types of Schools', true, now(), now())
ON CONFLICT DO NOTHING;

INSERT INTO public.master_data_items (id, tenant_id, category_id, code, name, sort_order, metadata, is_active, effective_from, created_at, updated_at)
SELECT uuid_generate_v4(), c.tenant_id, c.id, v.code, v.name, v.sort_order, '{}'::jsonb, true, now(), now(), now()
FROM public.master_data_categories c,
(VALUES ('PS', 'Primary School', 1), ('MS', 'Middle School', 2), ('HS', 'High School', 3), ('HSS', 'Higher Secondary School', 4)) AS v(code, name, sort_order)
WHERE c.code = 'SCHOOL_TYPE'
ON CONFLICT DO NOTHING;

-- CLASS_LEVEL
INSERT INTO public.master_data_categories (id, tenant_id, code, name, description, is_active, created_at, updated_at)
VALUES (uuid_generate_v4(), (SELECT id FROM public.tenants LIMIT 1), 'CLASS_LEVEL', 'Class Level', 'Classes from Pre-Primary to 12', true, now(), now())
ON CONFLICT DO NOTHING;

INSERT INTO public.master_data_items (id, tenant_id, category_id, code, name, sort_order, metadata, is_active, effective_from, created_at, updated_at)
SELECT uuid_generate_v4(), c.tenant_id, c.id, v.code, v.name, v.sort_order, '{}'::jsonb, true, now(), now(), now()
FROM public.master_data_categories c,
(VALUES 
  ('PRE_PRIMARY', 'Pre-Primary', 0), ('CLASS_1', 'Class 1', 1), ('CLASS_2', 'Class 2', 2),
  ('CLASS_3', 'Class 3', 3), ('CLASS_4', 'Class 4', 4), ('CLASS_5', 'Class 5', 5),
  ('CLASS_6', 'Class 6', 6), ('CLASS_7', 'Class 7', 7), ('CLASS_8', 'Class 8', 8),
  ('CLASS_9', 'Class 9', 9), ('CLASS_10', 'Class 10', 10), ('CLASS_11', 'Class 11', 11),
  ('CLASS_12', 'Class 12', 12)
) AS v(code, name, sort_order)
WHERE c.code = 'CLASS_LEVEL'
ON CONFLICT DO NOTHING;

-- GENDER
INSERT INTO public.master_data_categories (id, tenant_id, code, name, description, is_active, created_at, updated_at)
VALUES (uuid_generate_v4(), (SELECT id FROM public.tenants LIMIT 1), 'GENDER', 'Gender', 'Gender Options', true, now(), now())
ON CONFLICT DO NOTHING;

INSERT INTO public.master_data_items (id, tenant_id, category_id, code, name, sort_order, metadata, is_active, effective_from, created_at, updated_at)
SELECT uuid_generate_v4(), c.tenant_id, c.id, v.code, v.name, v.sort_order, '{}'::jsonb, true, now(), now(), now()
FROM public.master_data_categories c,
(VALUES ('MALE', 'Male', 1), ('FEMALE', 'Female', 2), ('OTHER', 'Other', 3)) AS v(code, name, sort_order)
WHERE c.code = 'GENDER'
ON CONFLICT DO NOTHING;

-- ENROLLMENT_STATUS
INSERT INTO public.master_data_categories (id, tenant_id, code, name, description, is_active, created_at, updated_at)
VALUES (uuid_generate_v4(), (SELECT id FROM public.tenants LIMIT 1), 'ENROLLMENT_STATUS', 'Enrollment Status', 'Status of student enrollment', true, now(), now())
ON CONFLICT DO NOTHING;

INSERT INTO public.master_data_items (id, tenant_id, category_id, code, name, sort_order, metadata, is_active, effective_from, created_at, updated_at)
SELECT uuid_generate_v4(), c.tenant_id, c.id, v.code, v.name, v.sort_order, '{}'::jsonb, true, now(), now(), now()
FROM public.master_data_categories c,
(VALUES 
  ('ACTIVE', 'Active', 1), ('TRANSFERRED_OUT', 'Transferred Out', 2), 
  ('DROPPED_OUT', 'Dropped Out', 3), ('PASSED_OUT', 'Passed Out', 4), 
  ('PROMOTED', 'Promoted', 5), ('INACTIVE', 'Inactive', 6)
) AS v(code, name, sort_order)
WHERE c.code = 'ENROLLMENT_STATUS'
ON CONFLICT DO NOTHING;

-- EXIT_REASON
INSERT INTO public.master_data_categories (id, tenant_id, code, name, description, is_active, created_at, updated_at)
VALUES (uuid_generate_v4(), (SELECT id FROM public.tenants LIMIT 1), 'EXIT_REASON', 'Exit Reason', 'Reason for exit', true, now(), now())
ON CONFLICT DO NOTHING;

INSERT INTO public.master_data_items (id, tenant_id, category_id, code, name, sort_order, metadata, is_active, effective_from, created_at, updated_at)
SELECT uuid_generate_v4(), c.tenant_id, c.id, v.code, v.name, v.sort_order, '{}'::jsonb, true, now(), now(), now()
FROM public.master_data_categories c,
(VALUES 
  ('TRANSFER', 'Transfer', 1), ('DROPOUT', 'Dropout', 2), 
  ('PASSED_OUT', 'Passed Out', 3), ('DUPLICATE_ENTRY', 'Duplicate Entry', 4), 
  ('OTHER', 'Other', 5)
) AS v(code, name, sort_order)
WHERE c.code = 'EXIT_REASON'
ON CONFLICT DO NOTHING;

-- STUDENT_EVENT_TYPE
INSERT INTO public.master_data_categories (id, tenant_id, code, name, description, is_active, created_at, updated_at)
VALUES (uuid_generate_v4(), (SELECT id FROM public.tenants LIMIT 1), 'STUDENT_EVENT_TYPE', 'Student Event Type', 'Types of student history events', true, now(), now())
ON CONFLICT DO NOTHING;

INSERT INTO public.master_data_items (id, tenant_id, category_id, code, name, sort_order, metadata, is_active, effective_from, created_at, updated_at)
SELECT uuid_generate_v4(), c.tenant_id, c.id, v.code, v.name, v.sort_order, '{}'::jsonb, true, now(), now(), now()
FROM public.master_data_categories c,
(VALUES 
  ('ADMISSION', 'Admission', 1), ('PROMOTION', 'Promotion', 2), 
  ('TRANSFER_IN', 'Transfer In', 3), ('TRANSFER_OUT', 'Transfer Out', 4), 
  ('DROPOUT', 'Dropout', 5), ('PASS_OUT', 'Pass Out', 6), 
  ('CORRECTION', 'Correction', 7), ('REACTIVATION', 'Reactivation', 8)
) AS v(code, name, sort_order)
WHERE c.code = 'STUDENT_EVENT_TYPE'
ON CONFLICT DO NOTHING;

-- SENIOR_SECONDARY_STREAM
INSERT INTO public.master_data_categories (id, tenant_id, code, name, description, is_active, created_at, updated_at)
VALUES (uuid_generate_v4(), (SELECT id FROM public.tenants LIMIT 1), 'SENIOR_SECONDARY_STREAM', 'Stream', 'Class 11/12 Streams', true, now(), now())
ON CONFLICT DO NOTHING;

INSERT INTO public.master_data_items (id, tenant_id, category_id, code, name, sort_order, metadata, is_active, effective_from, created_at, updated_at)
SELECT uuid_generate_v4(), c.tenant_id, c.id, v.code, v.name, v.sort_order, '{}'::jsonb, true, now(), now(), now()
FROM public.master_data_categories c,
(VALUES 
  ('ARTS', 'Arts', 1), ('SCIENCE', 'Science', 2), 
  ('COMMERCE', 'Commerce', 3), ('VOCATIONAL', 'Vocational', 4), 
  ('OTHER', 'Other', 5)
) AS v(code, name, sort_order)
WHERE c.code = 'SENIOR_SECONDARY_STREAM'
ON CONFLICT DO NOTHING;

-- SUBJECT
INSERT INTO public.master_data_categories (id, tenant_id, code, name, description, is_active, created_at, updated_at)
VALUES (uuid_generate_v4(), (SELECT id FROM public.tenants LIMIT 1), 'SUBJECT', 'Subject', 'Subjects', true, now(), now())
ON CONFLICT DO NOTHING;

INSERT INTO public.master_data_items (id, tenant_id, category_id, code, name, sort_order, metadata, is_active, effective_from, created_at, updated_at)
SELECT uuid_generate_v4(), c.tenant_id, c.id, v.code, v.name, v.sort_order, '{}'::jsonb, true, now(), now(), now()
FROM public.master_data_categories c,
(VALUES 
  ('ENGLISH', 'English', 1), ('PHYSICS', 'Physics', 2), ('CHEMISTRY', 'Chemistry', 3), 
  ('MATHEMATICS', 'Mathematics', 4), ('BIOLOGY', 'Biology', 5), ('HISTORY', 'History', 6),
  ('POLITICAL_SCIENCE', 'Political Science', 7), ('ECONOMICS', 'Economics', 8), ('ACCOUNTANCY', 'Accountancy', 9)
) AS v(code, name, sort_order)
WHERE c.code = 'SUBJECT'
ON CONFLICT DO NOTHING;


-- ============================================================
-- 2. SCHEMA CREATION
-- ============================================================

-- academic_sessions
CREATE TABLE IF NOT EXISTS public.academic_sessions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  session_name text NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  status text NOT NULL CHECK (status IN ('DRAFT', 'ACTIVE', 'CLOSED', 'ARCHIVED')),
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (start_date <= end_date)
);

CREATE UNIQUE INDEX idx_academic_sessions_active ON public.academic_sessions (tenant_id) WHERE status = 'ACTIVE';

-- student_profiles
CREATE TABLE IF NOT EXISTS public.student_profiles (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  student_code text,
  admission_no text,
  student_name text NOT NULL,
  father_name text,
  mother_name text,
  guardian_name text,
  date_of_birth date,
  gender_id uuid REFERENCES public.master_data_items(id),
  mobile_no text,
  address_text text,
  village text,
  panchayat text,
  is_cwsn boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

-- student_enrollments
CREATE TABLE IF NOT EXISTS public.student_enrollments (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.student_profiles(id) ON DELETE CASCADE,
  academic_session_id uuid NOT NULL REFERENCES public.academic_sessions(id),
  office_id uuid NOT NULL REFERENCES public.offices(id),
  office_path ltree NOT NULL,
  class_id uuid NOT NULL REFERENCES public.master_data_items(id),
  section_name text,
  roll_no text,
  enrollment_status_id uuid NOT NULL REFERENCES public.master_data_items(id),
  enrollment_date date NOT NULL DEFAULT CURRENT_DATE,
  exit_date date,
  exit_reason_id uuid REFERENCES public.master_data_items(id),
  previous_school text,
  next_school text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE INDEX idx_student_enrollments_lookup ON public.student_enrollments (tenant_id, student_id, academic_session_id) 
WHERE deleted_at IS NULL;

-- student_enrollment_events
CREATE TABLE IF NOT EXISTS public.student_enrollment_events (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.student_profiles(id) ON DELETE CASCADE,
  enrollment_id uuid REFERENCES public.student_enrollments(id),
  event_type_id uuid NOT NULL REFERENCES public.master_data_items(id),
  event_date timestamptz NOT NULL DEFAULT now(),
  from_office_id uuid REFERENCES public.offices(id),
  to_office_id uuid REFERENCES public.offices(id),
  from_class_id uuid REFERENCES public.master_data_items(id),
  to_class_id uuid REFERENCES public.master_data_items(id),
  remarks text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- student_enrollment_submissions
CREATE TABLE IF NOT EXISTS public.student_enrollment_submissions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  academic_session_id uuid NOT NULL REFERENCES public.academic_sessions(id),
  office_id uuid NOT NULL REFERENCES public.offices(id),
  office_path ltree NOT NULL,
  status text NOT NULL CHECK (status IN ('DRAFT', 'SUBMITTED', 'IN_REVIEW', 'RETURNED', 'APPROVED', 'COMMITTED')),
  submitted_by uuid REFERENCES auth.users(id),
  submitted_at timestamptz,
  reviewed_by uuid REFERENCES auth.users(id),
  reviewed_at timestamptz,
  reviewer_remarks text,
  approved_by uuid REFERENCES auth.users(id),
  approved_at timestamptz,
  committed_at timestamptz,
  record_version integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  UNIQUE(tenant_id, academic_session_id, office_id)
);

-- student_enrollment_snapshots
CREATE TABLE IF NOT EXISTS public.student_enrollment_snapshots (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  academic_session_id uuid NOT NULL REFERENCES public.academic_sessions(id),
  office_id uuid NOT NULL REFERENCES public.offices(id),
  office_path ltree NOT NULL,
  source_submission_id uuid REFERENCES public.student_enrollment_submissions(id),
  class_id uuid NOT NULL REFERENCES public.master_data_items(id),
  section_name text,
  male_count integer NOT NULL DEFAULT 0 CHECK (male_count >= 0),
  female_count integer NOT NULL DEFAULT 0 CHECK (female_count >= 0),
  other_count integer NOT NULL DEFAULT 0 CHECK (other_count >= 0),
  total_count integer NOT NULL DEFAULT 0 CHECK (total_count >= 0),
  cwsn_count integer NOT NULL DEFAULT 0 CHECK (cwsn_count >= 0),
  approved_by uuid REFERENCES auth.users(id),
  approved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (total_count = male_count + female_count + other_count)
);

-- school_class_configurations
CREATE TABLE IF NOT EXISTS public.school_class_configurations (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  office_id uuid NOT NULL REFERENCES public.offices(id),
  office_path ltree NOT NULL,
  school_type_id uuid NOT NULL REFERENCES public.master_data_items(id),
  class_id uuid NOT NULL REFERENCES public.master_data_items(id),
  is_allowed boolean NOT NULL DEFAULT true,
  is_active boolean NOT NULL DEFAULT true,
  effective_from timestamptz NOT NULL DEFAULT now(),
  effective_to timestamptz,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_school_class_config_unique ON public.school_class_configurations (tenant_id, office_id, class_id) WHERE is_active = true AND effective_to IS NULL;

-- student_senior_secondary_enrollment_details
CREATE TABLE IF NOT EXISTS public.student_senior_secondary_enrollment_details (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  submission_id uuid NOT NULL REFERENCES public.student_enrollment_submissions(id) ON DELETE CASCADE,
  academic_session_id uuid NOT NULL REFERENCES public.academic_sessions(id),
  office_id uuid NOT NULL REFERENCES public.offices(id),
  office_path ltree NOT NULL,
  class_id uuid NOT NULL REFERENCES public.master_data_items(id),
  stream_id uuid NOT NULL REFERENCES public.master_data_items(id),
  subject_id uuid REFERENCES public.master_data_items(id),
  subject_group_name text,
  male_count integer NOT NULL DEFAULT 0 CHECK (male_count >= 0),
  female_count integer NOT NULL DEFAULT 0 CHECK (female_count >= 0),
  other_count integer NOT NULL DEFAULT 0 CHECK (other_count >= 0),
  total_count integer NOT NULL DEFAULT 0 CHECK (total_count >= 0),
  cwsn_count integer NOT NULL DEFAULT 0 CHECK (cwsn_count >= 0),
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  CHECK (total_count = male_count + female_count + other_count),
  CHECK (subject_id IS NOT NULL OR subject_group_name IS NOT NULL)
);

-- student_senior_secondary_enrollment_snapshots
CREATE TABLE IF NOT EXISTS public.student_senior_secondary_enrollment_snapshots (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  academic_session_id uuid NOT NULL REFERENCES public.academic_sessions(id),
  office_id uuid NOT NULL REFERENCES public.offices(id),
  office_path ltree NOT NULL,
  source_submission_id uuid REFERENCES public.student_enrollment_submissions(id),
  class_id uuid NOT NULL REFERENCES public.master_data_items(id),
  stream_id uuid NOT NULL REFERENCES public.master_data_items(id),
  subject_id uuid REFERENCES public.master_data_items(id),
  subject_group_name text,
  male_count integer NOT NULL DEFAULT 0 CHECK (male_count >= 0),
  female_count integer NOT NULL DEFAULT 0 CHECK (female_count >= 0),
  other_count integer NOT NULL DEFAULT 0 CHECK (other_count >= 0),
  total_count integer NOT NULL DEFAULT 0 CHECK (total_count >= 0),
  cwsn_count integer NOT NULL DEFAULT 0 CHECK (cwsn_count >= 0),
  approved_by uuid REFERENCES auth.users(id),
  approved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (total_count = male_count + female_count + other_count)
);


-- ============================================================
-- 3. TRIGGERS
-- ============================================================

CREATE TRIGGER trg_academic_sessions_updated_at BEFORE UPDATE ON public.academic_sessions FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_student_profiles_updated_at BEFORE UPDATE ON public.student_profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_student_enrollments_updated_at BEFORE UPDATE ON public.student_enrollments FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_student_enroll_submissions_updated_at BEFORE UPDATE ON public.student_enrollment_submissions FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_student_enroll_snapshots_updated_at BEFORE UPDATE ON public.student_enrollment_snapshots FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_school_class_config_updated_at BEFORE UPDATE ON public.school_class_configurations FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_student_senior_sec_details_updated_at BEFORE UPDATE ON public.student_senior_secondary_enrollment_details FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_student_senior_sec_snapshots_updated_at BEFORE UPDATE ON public.student_senior_secondary_enrollment_snapshots FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Audit logging triggers
CREATE TRIGGER trg_audit_academic_sessions AFTER INSERT OR UPDATE OR DELETE ON public.academic_sessions FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();
CREATE TRIGGER trg_audit_student_profiles AFTER INSERT OR UPDATE OR DELETE ON public.student_profiles FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();
CREATE TRIGGER trg_audit_student_enrollments AFTER INSERT OR UPDATE OR DELETE ON public.student_enrollments FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();
CREATE TRIGGER trg_audit_student_enrollment_submissions AFTER INSERT OR UPDATE OR DELETE ON public.student_enrollment_submissions FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();
CREATE TRIGGER trg_audit_school_class_configurations AFTER INSERT OR UPDATE OR DELETE ON public.school_class_configurations FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();


-- ============================================================
-- 4. VIEWS
-- ============================================================

CREATE OR REPLACE VIEW public.v_student_current_enrollment WITH (security_invoker = true) AS
SELECT 
  e.tenant_id,
  e.student_id,
  p.student_name,
  p.gender_id,
  e.academic_session_id,
  e.office_id,
  e.office_path,
  o.office_name,
  e.class_id,
  e.section_name,
  e.roll_no,
  e.enrollment_status_id
FROM public.student_enrollments e
JOIN public.student_profiles p ON e.student_id = p.id
JOIN public.offices o ON e.office_id = o.id
WHERE e.deleted_at IS NULL AND p.deleted_at IS NULL 
  AND e.enrollment_status_id IN (SELECT id FROM public.master_data_items WHERE code = 'ACTIVE');

CREATE OR REPLACE VIEW public.v_school_enrollment_summary WITH (security_invoker = true) AS
SELECT 
  s.tenant_id,
  s.academic_session_id,
  s.office_id,
  s.office_path,
  o.office_name,
  (SELECT school_type_id FROM public.school_class_configurations WHERE office_id = s.office_id LIMIT 1) as school_type_id,
  s.class_id,
  s.section_name,
  s.male_count,
  s.female_count,
  s.other_count,
  s.total_count,
  s.cwsn_count,
  s.updated_at as last_updated
FROM public.student_enrollment_snapshots s
JOIN public.offices o ON s.office_id = o.id;

CREATE OR REPLACE VIEW public.v_senior_secondary_enrollment_summary WITH (security_invoker = true) AS
SELECT 
  s.tenant_id,
  s.academic_session_id,
  s.office_id,
  s.office_path,
  o.office_name,
  s.class_id,
  s.stream_id,
  s.subject_id,
  s.subject_group_name,
  s.male_count,
  s.female_count,
  s.other_count,
  s.total_count,
  s.cwsn_count,
  s.updated_at as last_updated
FROM public.student_senior_secondary_enrollment_snapshots s
JOIN public.offices o ON s.office_id = o.id;


-- ============================================================
-- 5. RPCs
-- ============================================================

-- Submit Enrollment Submission
CREATE OR REPLACE FUNCTION public.submit_enrollment_submission(p_submission_id uuid)
RETURNS jsonb AS $$
DECLARE
  v_submission public.student_enrollment_submissions;
  v_uid uuid;
  v_tenant_id uuid;
  v_is_authorized boolean;
BEGIN
  v_uid := auth.uid();
  v_tenant_id := public.get_current_tenant_id();

  SELECT * INTO v_submission FROM public.student_enrollment_submissions
  WHERE id = p_submission_id AND tenant_id = v_tenant_id
  FOR UPDATE;

  IF NOT FOUND THEN RAISE EXCEPTION 'Submission not found'; END IF;
  IF v_submission.status NOT IN ('DRAFT', 'RETURNED') THEN
    RAISE EXCEPTION 'Invalid status for submission: %', v_submission.status;
  END IF;

  SELECT public.can_access_office(v_submission.office_id) INTO v_is_authorized;
  IF NOT v_is_authorized THEN RAISE EXCEPTION 'Unauthorized to submit'; END IF;

  UPDATE public.student_enrollment_submissions
  SET status = 'SUBMITTED', submitted_by = v_uid, submitted_at = now()
  WHERE id = p_submission_id;

  INSERT INTO public.audit_logs (id, tenant_id, entity_type, entity_id, action, new_values, performed_by, performed_at)
  VALUES (uuid_generate_v4(), v_tenant_id, 'student_enrollment_submission', p_submission_id, 'SUBMIT', jsonb_build_object('status', 'SUBMITTED'), v_uid, now());

  RETURN jsonb_build_object('success', true, 'message', 'Submission submitted successfully.', 'submission_id', p_submission_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';


-- Return Enrollment Submission
CREATE OR REPLACE FUNCTION public.return_enrollment_submission(p_submission_id uuid, p_remarks text)
RETURNS jsonb AS $$
DECLARE
  v_submission public.student_enrollment_submissions;
  v_uid uuid;
  v_tenant_id uuid;
  v_is_authorized boolean;
BEGIN
  v_uid := auth.uid();
  v_tenant_id := public.get_current_tenant_id();

  SELECT * INTO v_submission FROM public.student_enrollment_submissions
  WHERE id = p_submission_id AND tenant_id = v_tenant_id
  FOR UPDATE;

  IF NOT FOUND THEN RAISE EXCEPTION 'Submission not found'; END IF;
  IF v_submission.status NOT IN ('SUBMITTED', 'IN_REVIEW') THEN
    RAISE EXCEPTION 'Invalid status for return: %', v_submission.status;
  END IF;

  SELECT public.can_access_office(v_submission.office_id) INTO v_is_authorized;
  IF NOT v_is_authorized THEN RAISE EXCEPTION 'Unauthorized to return'; END IF;

  UPDATE public.student_enrollment_submissions
  SET status = 'RETURNED', reviewed_by = v_uid, reviewed_at = now(), reviewer_remarks = p_remarks
  WHERE id = p_submission_id;

  INSERT INTO public.audit_logs (id, tenant_id, entity_type, entity_id, action, new_values, performed_by, performed_at)
  VALUES (uuid_generate_v4(), v_tenant_id, 'student_enrollment_submission', p_submission_id, 'RETURN', jsonb_build_object('status', 'RETURNED', 'remarks', p_remarks), v_uid, now());

  RETURN jsonb_build_object('success', true, 'message', 'Submission returned successfully.', 'submission_id', p_submission_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';


-- Approve Enrollment Submission
CREATE OR REPLACE FUNCTION public.approve_enrollment_submission(p_submission_id uuid)
RETURNS jsonb AS $$
DECLARE
  v_submission public.student_enrollment_submissions;
  v_uid uuid;
  v_tenant_id uuid;
  v_is_authorized boolean;
  v_class_11_id uuid;
  v_class_12_id uuid;
  v_school_type text;
  v_class_invalid boolean;
  v_totals_mismatch boolean;
  
  -- Record types for iterating
  v_class_rec record;
  v_detail_sum record;
BEGIN
  v_uid := auth.uid();
  v_tenant_id := public.get_current_tenant_id();

  -- IDs for validation
  SELECT id INTO v_class_11_id FROM public.master_data_items WHERE category_id = (SELECT id FROM public.master_data_categories WHERE code = 'CLASS_LEVEL') AND code = 'CLASS_11';
  SELECT id INTO v_class_12_id FROM public.master_data_items WHERE category_id = (SELECT id FROM public.master_data_categories WHERE code = 'CLASS_LEVEL') AND code = 'CLASS_12';

  SELECT * INTO v_submission FROM public.student_enrollment_submissions
  WHERE id = p_submission_id AND tenant_id = v_tenant_id
  FOR UPDATE;

  IF NOT FOUND THEN RAISE EXCEPTION 'Submission not found'; END IF;
  IF v_submission.status NOT IN ('SUBMITTED', 'IN_REVIEW') THEN
    RAISE EXCEPTION 'Invalid status for approval: %', v_submission.status;
  END IF;

  SELECT public.can_access_office(v_submission.office_id) INTO v_is_authorized;
  IF NOT v_is_authorized THEN RAISE EXCEPTION 'Unauthorized to approve'; END IF;
  
  -- HOI cannot approve own submission
  IF v_submission.submitted_by = v_uid THEN RAISE EXCEPTION 'HOI cannot approve their own submission'; END IF;

  -- Validation 0 (NEW — S9.1): If any Class 11 or 12 students exist in this submission,
  -- the school MUST be type HSS. school_class_configurations alone is not sufficient.
  IF EXISTS (
    SELECT 1 FROM public.student_enrollments e
    WHERE e.tenant_id = v_tenant_id 
      AND e.academic_session_id = v_submission.academic_session_id 
      AND e.office_id = v_submission.office_id 
      AND e.deleted_at IS NULL
      AND e.class_id IN (v_class_11_id, v_class_12_id)
      AND e.enrollment_status_id IN (SELECT id FROM public.master_data_items WHERE code = 'ACTIVE')
  ) THEN
    -- Check that this office has at least one school_class_configuration with school_type = HSS
    IF NOT EXISTS (
      SELECT 1 FROM public.school_class_configurations scc
      JOIN public.master_data_items stype ON scc.school_type_id = stype.id
      JOIN public.master_data_categories scat ON stype.category_id = scat.id
      WHERE scc.office_id = v_submission.office_id
        AND scc.is_active = true
        AND scat.code = 'SCHOOL_TYPE'
        AND stype.code = 'HSS'
    ) THEN
      RAISE EXCEPTION 'Class 11/12 enrollment is only permitted for HSS schools. This school is not configured as HSS.';
    END IF;
  END IF;

  -- Validation 1: All submitted classes must be in school_class_configurations as allowed
  SELECT EXISTS (
    SELECT 1 FROM public.student_enrollments e
    WHERE e.tenant_id = v_tenant_id AND e.academic_session_id = v_submission.academic_session_id AND e.office_id = v_submission.office_id AND e.deleted_at IS NULL
    AND e.enrollment_status_id IN (SELECT id FROM public.master_data_items WHERE code = 'ACTIVE')
    AND NOT EXISTS (
      SELECT 1 FROM public.school_class_configurations scc
      WHERE scc.office_id = e.office_id AND scc.class_id = e.class_id AND scc.is_allowed = true AND scc.is_active = true
    )
  ) INTO v_class_invalid;

  IF v_class_invalid THEN
    RAISE EXCEPTION 'Submitted classes include classes not allowed for this school configuration.';
  END IF;


  -- Validation 2: Senior Secondary Details for Class 11/12 must equal the individual student roll counts.
  -- Actually, the prompt says "Class 11/12 class totals in student_enrollment_snapshots must equal the sum of senior-secondary rows."
  -- We will generate the snapshots by aggregating `student_enrollments`.
  
  -- Generate Standard Snapshots from individual enrollments
  INSERT INTO public.student_enrollment_snapshots (
    tenant_id, academic_session_id, office_id, office_path, source_submission_id,
    class_id, section_name, male_count, female_count, other_count, total_count, cwsn_count,
    approved_by, approved_at
  )
  SELECT 
    e.tenant_id, e.academic_session_id, e.office_id, e.office_path, p_submission_id,
    e.class_id, e.section_name,
    COUNT(CASE WHEN g.code = 'MALE' THEN 1 END) as male_count,
    COUNT(CASE WHEN g.code = 'FEMALE' THEN 1 END) as female_count,
    COUNT(CASE WHEN g.code = 'OTHER' THEN 1 END) as other_count,
    COUNT(*) as total_count,
    COUNT(CASE WHEN p.is_cwsn = true THEN 1 END) as cwsn_count,
    v_uid, now()
  FROM public.student_enrollments e
  JOIN public.student_profiles p ON e.student_id = p.id
  JOIN public.master_data_items g ON p.gender_id = g.id
  WHERE e.tenant_id = v_tenant_id AND e.academic_session_id = v_submission.academic_session_id AND e.office_id = v_submission.office_id
    AND e.deleted_at IS NULL AND p.deleted_at IS NULL
    AND e.enrollment_status_id IN (SELECT id FROM public.master_data_items WHERE code = 'ACTIVE')
  GROUP BY e.tenant_id, e.academic_session_id, e.office_id, e.office_path, e.class_id, e.section_name;

  -- Validate Class 11/12 Details if they exist in snapshots
  FOR v_class_rec IN (
    SELECT class_id, SUM(total_count) as total_enrollment
    FROM public.student_enrollment_snapshots
    WHERE source_submission_id = p_submission_id AND class_id IN (v_class_11_id, v_class_12_id)
    GROUP BY class_id
  ) LOOP
    SELECT COALESCE(SUM(total_count), 0) INTO v_detail_sum
    FROM public.student_senior_secondary_enrollment_details
    WHERE submission_id = p_submission_id AND class_id = v_class_rec.class_id AND deleted_at IS NULL;

    IF v_class_rec.total_enrollment != v_detail_sum.sum THEN
      RAISE EXCEPTION 'Class 11/12 total mismatch: Detail sum (%) does not match roll total (%)', v_detail_sum.sum, v_class_rec.total_enrollment;
    END IF;
  END LOOP;

  -- Generate Senior Secondary Snapshots
  INSERT INTO public.student_senior_secondary_enrollment_snapshots (
    tenant_id, academic_session_id, office_id, office_path, source_submission_id,
    class_id, stream_id, subject_id, subject_group_name,
    male_count, female_count, other_count, total_count, cwsn_count,
    approved_by, approved_at
  )
  SELECT 
    tenant_id, academic_session_id, office_id, office_path, submission_id,
    class_id, stream_id, subject_id, subject_group_name,
    male_count, female_count, other_count, total_count, cwsn_count,
    v_uid, now()
  FROM public.student_senior_secondary_enrollment_details
  WHERE submission_id = p_submission_id AND deleted_at IS NULL;

  -- Mark submission as COMMITTED
  UPDATE public.student_enrollment_submissions
  SET status = 'COMMITTED', approved_by = v_uid, approved_at = now(), committed_at = now()
  WHERE id = p_submission_id;

  INSERT INTO public.audit_logs (id, tenant_id, entity_type, entity_id, action, new_values, performed_by, performed_at)
  VALUES (uuid_generate_v4(), v_tenant_id, 'student_enrollment_submission', p_submission_id, 'APPROVE', jsonb_build_object('status', 'COMMITTED'), v_uid, now());

  RETURN jsonb_build_object('success', true, 'message', 'Submission successfully approved and committed.', 'submission_id', p_submission_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';


-- Promote Students
CREATE OR REPLACE FUNCTION public.promote_students(
  p_academic_session_id uuid,
  p_office_id uuid,
  p_from_class_id uuid,
  p_to_class_id uuid
)
RETURNS jsonb AS $$
DECLARE
  v_uid uuid;
  v_tenant_id uuid;
  v_is_authorized boolean;
  v_event_type_id uuid;
  v_promoted_count integer := 0;
BEGIN
  v_uid := auth.uid();
  v_tenant_id := public.get_current_tenant_id();

  SELECT public.can_access_office(p_office_id) INTO v_is_authorized;
  IF NOT v_is_authorized THEN RAISE EXCEPTION 'Unauthorized to promote students in this office'; END IF;

  SELECT id INTO v_event_type_id FROM public.master_data_items WHERE code = 'PROMOTION' AND category_id = (SELECT id FROM public.master_data_categories WHERE code = 'STUDENT_EVENT_TYPE');

  -- Update enrollments to promoted and insert events (Simplified batch logic)
  -- Real implementation would probably create NEW enrollments in the NEXT session, but here we just flag them as PROMOTED in the current session.
  WITH updated AS (
    UPDATE public.student_enrollments
    SET enrollment_status_id = (SELECT id FROM public.master_data_items WHERE code = 'PROMOTED' AND category_id = (SELECT id FROM public.master_data_categories WHERE code = 'ENROLLMENT_STATUS')),
        exit_date = now(),
        updated_at = now()
    WHERE tenant_id = v_tenant_id AND office_id = p_office_id AND class_id = p_from_class_id AND academic_session_id = p_academic_session_id
      AND enrollment_status_id = (SELECT id FROM public.master_data_items WHERE code = 'ACTIVE' AND category_id = (SELECT id FROM public.master_data_categories WHERE code = 'ENROLLMENT_STATUS'))
      AND deleted_at IS NULL
    RETURNING id, student_id
  )
  INSERT INTO public.student_enrollment_events (tenant_id, student_id, enrollment_id, event_type_id, event_date, from_office_id, from_class_id, to_class_id, created_by)
  SELECT v_tenant_id, student_id, id, v_event_type_id, now(), p_office_id, p_from_class_id, p_to_class_id, v_uid
  FROM updated;

  GET DIAGNOSTICS v_promoted_count = ROW_COUNT;

  INSERT INTO public.audit_logs (id, tenant_id, entity_type, entity_id, action, new_values, performed_by, performed_at)
  VALUES (uuid_generate_v4(), v_tenant_id, 'office', p_office_id, 'PROMOTE_STUDENTS', jsonb_build_object('from_class', p_from_class_id, 'to_class', p_to_class_id, 'count', v_promoted_count), v_uid, now());

  RETURN jsonb_build_object('success', true, 'message', 'Students promoted successfully', 'promoted_count', v_promoted_count);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';


-- Transfer Student
CREATE OR REPLACE FUNCTION public.transfer_student(
  p_student_id uuid,
  p_from_enrollment_id uuid,
  p_to_office_id uuid,
  p_to_class_id uuid,
  p_transfer_date date,
  p_remarks text
)
RETURNS jsonb AS $$
DECLARE
  v_uid uuid;
  v_tenant_id uuid;
  v_enrollment public.student_enrollments;
  v_is_authorized boolean;
  v_event_type_out uuid;
  v_event_type_in uuid;
  v_transferred_status uuid;
BEGIN
  v_uid := auth.uid();
  v_tenant_id := public.get_current_tenant_id();

  SELECT * INTO v_enrollment FROM public.student_enrollments
  WHERE id = p_from_enrollment_id AND student_id = p_student_id AND tenant_id = v_tenant_id FOR UPDATE;

  IF NOT FOUND THEN RAISE EXCEPTION 'Enrollment not found'; END IF;

  SELECT public.can_access_office(v_enrollment.office_id) INTO v_is_authorized;
  IF NOT v_is_authorized THEN RAISE EXCEPTION 'Unauthorized to transfer out from this office'; END IF;

  SELECT id INTO v_event_type_out FROM public.master_data_items WHERE code = 'TRANSFER_OUT' AND category_id = (SELECT id FROM public.master_data_categories WHERE code = 'STUDENT_EVENT_TYPE');
  SELECT id INTO v_transferred_status FROM public.master_data_items WHERE code = 'TRANSFERRED_OUT' AND category_id = (SELECT id FROM public.master_data_categories WHERE code = 'ENROLLMENT_STATUS');

  UPDATE public.student_enrollments
  SET enrollment_status_id = v_transferred_status,
      exit_date = p_transfer_date,
      exit_reason_id = (SELECT id FROM public.master_data_items WHERE code = 'TRANSFER' AND category_id = (SELECT id FROM public.master_data_categories WHERE code = 'EXIT_REASON')),
      next_school = (SELECT office_name FROM public.offices WHERE id = p_to_office_id),
      updated_at = now()
  WHERE id = p_from_enrollment_id;

  INSERT INTO public.student_enrollment_events (tenant_id, student_id, enrollment_id, event_type_id, event_date, from_office_id, to_office_id, from_class_id, remarks, created_by)
  VALUES (v_tenant_id, p_student_id, p_from_enrollment_id, v_event_type_out, now(), v_enrollment.office_id, p_to_office_id, v_enrollment.class_id, p_remarks, v_uid);

  INSERT INTO public.audit_logs (id, tenant_id, entity_type, entity_id, action, new_values, performed_by, performed_at)
  VALUES (uuid_generate_v4(), v_tenant_id, 'student_profile', p_student_id, 'TRANSFER_OUT', jsonb_build_object('from_office', v_enrollment.office_id, 'to_office', p_to_office_id), v_uid, now());

  RETURN jsonb_build_object('success', true, 'message', 'Student transferred out successfully');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';


-- ============================================================
-- 6. RLS POLICIES
-- ============================================================

-- academic_sessions
ALTER TABLE public.academic_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON public.academic_sessions FOR ALL USING (tenant_id = public.get_current_tenant_id());
CREATE POLICY "academic_sessions_select" ON public.academic_sessions FOR SELECT USING (true);
CREATE POLICY "academic_sessions_insert" ON public.academic_sessions FOR INSERT WITH CHECK (public.get_current_role() IN ('PLATFORM_ADMIN', 'TENANT_ADMIN'));
CREATE POLICY "academic_sessions_update" ON public.academic_sessions FOR UPDATE USING (public.get_current_role() IN ('PLATFORM_ADMIN', 'TENANT_ADMIN'));
CREATE POLICY "academic_sessions_delete" ON public.academic_sessions FOR DELETE USING (false);

-- student_profiles
ALTER TABLE public.student_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON public.student_profiles FOR ALL USING (tenant_id = public.get_current_tenant_id());
CREATE POLICY "student_profiles_select" ON public.student_profiles FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.student_enrollments e 
    WHERE e.student_id = student_profiles.id AND public.can_access_office(e.office_id)
  ) OR public.get_current_role() IN ('PLATFORM_ADMIN', 'TENANT_ADMIN')
);
-- We allow HOI to insert/update based on them creating the enrollment later, so we check if they belong to a school
CREATE POLICY "student_profiles_insert" ON public.student_profiles FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.role_assignments ra 
    JOIN public.user_accounts ua ON ra.user_id = ua.id 
    WHERE ua.supabase_auth_id = auth.uid() 
    AND ra.tenant_id = public.get_current_tenant_id()
  )
);
CREATE POLICY "student_profiles_update" ON public.student_profiles FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.student_enrollments e 
    WHERE e.student_id = student_profiles.id AND public.can_access_office(e.office_id)
  )
);
CREATE POLICY "student_profiles_delete" ON public.student_profiles FOR DELETE USING (false);

-- student_enrollments
ALTER TABLE public.student_enrollments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON public.student_enrollments FOR ALL USING (tenant_id = public.get_current_tenant_id());
CREATE POLICY "student_enrollments_select" ON public.student_enrollments FOR SELECT USING (public.can_access_office(office_id));
CREATE POLICY "student_enrollments_insert" ON public.student_enrollments FOR INSERT WITH CHECK (public.can_access_office(office_id));
CREATE POLICY "student_enrollments_update" ON public.student_enrollments FOR UPDATE USING (public.can_access_office(office_id));
CREATE POLICY "student_enrollments_delete" ON public.student_enrollments FOR DELETE USING (false);

-- student_enrollment_events
ALTER TABLE public.student_enrollment_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON public.student_enrollment_events FOR ALL USING (tenant_id = public.get_current_tenant_id());
CREATE POLICY "student_enrollment_events_select" ON public.student_enrollment_events FOR SELECT USING (
  public.can_access_office(from_office_id) OR public.can_access_office(to_office_id)
);
CREATE POLICY "student_enrollment_events_insert" ON public.student_enrollment_events FOR INSERT WITH CHECK (
  public.can_access_office(from_office_id) OR public.can_access_office(to_office_id)
);
CREATE POLICY "student_enrollment_events_update" ON public.student_enrollment_events FOR UPDATE USING (false);
CREATE POLICY "student_enrollment_events_delete" ON public.student_enrollment_events FOR DELETE USING (false);

-- student_enrollment_submissions
ALTER TABLE public.student_enrollment_submissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON public.student_enrollment_submissions FOR ALL USING (tenant_id = public.get_current_tenant_id());
CREATE POLICY "submissions_select" ON public.student_enrollment_submissions FOR SELECT USING (public.can_access_office(office_id));
CREATE POLICY "submissions_insert" ON public.student_enrollment_submissions FOR INSERT WITH CHECK (public.can_access_office(office_id));
CREATE POLICY "submissions_update" ON public.student_enrollment_submissions FOR UPDATE USING (public.can_access_office(office_id));
CREATE POLICY "submissions_delete" ON public.student_enrollment_submissions FOR DELETE USING (false);

-- student_enrollment_snapshots
ALTER TABLE public.student_enrollment_snapshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON public.student_enrollment_snapshots FOR ALL USING (tenant_id = public.get_current_tenant_id());
CREATE POLICY "snapshots_select" ON public.student_enrollment_snapshots FOR SELECT USING (public.can_access_office(office_id));
CREATE POLICY "snapshots_insert" ON public.student_enrollment_snapshots FOR INSERT WITH CHECK (false); -- RPC only
CREATE POLICY "snapshots_update" ON public.student_enrollment_snapshots FOR UPDATE USING (false); -- RPC only
CREATE POLICY "snapshots_delete" ON public.student_enrollment_snapshots FOR DELETE USING (false);

-- school_class_configurations
ALTER TABLE public.school_class_configurations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON public.school_class_configurations FOR ALL USING (tenant_id = public.get_current_tenant_id());
CREATE POLICY "class_config_select" ON public.school_class_configurations FOR SELECT USING (public.can_access_office(office_id));
CREATE POLICY "class_config_insert" ON public.school_class_configurations FOR INSERT WITH CHECK (
  public.can_access_office(office_id) AND (public.get_current_role() IN ('PLATFORM_ADMIN', 'TENANT_ADMIN', 'ZEO', 'CEO'))
);
CREATE POLICY "class_config_update" ON public.school_class_configurations FOR UPDATE USING (
  public.can_access_office(office_id) AND (public.get_current_role() IN ('PLATFORM_ADMIN', 'TENANT_ADMIN', 'ZEO', 'CEO'))
);
CREATE POLICY "class_config_delete" ON public.school_class_configurations FOR DELETE USING (false);

-- student_senior_secondary_enrollment_details
ALTER TABLE public.student_senior_secondary_enrollment_details ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON public.student_senior_secondary_enrollment_details FOR ALL USING (tenant_id = public.get_current_tenant_id());
CREATE POLICY "senior_sec_details_select" ON public.student_senior_secondary_enrollment_details FOR SELECT USING (public.can_access_office(office_id));
CREATE POLICY "senior_sec_details_insert" ON public.student_senior_secondary_enrollment_details FOR INSERT WITH CHECK (public.can_access_office(office_id));
CREATE POLICY "senior_sec_details_update" ON public.student_senior_secondary_enrollment_details FOR UPDATE USING (public.can_access_office(office_id));
CREATE POLICY "senior_sec_details_delete" ON public.student_senior_secondary_enrollment_details FOR DELETE USING (false);

-- student_senior_secondary_enrollment_snapshots
ALTER TABLE public.student_senior_secondary_enrollment_snapshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON public.student_senior_secondary_enrollment_snapshots FOR ALL USING (tenant_id = public.get_current_tenant_id());
CREATE POLICY "senior_sec_snapshots_select" ON public.student_senior_secondary_enrollment_snapshots FOR SELECT USING (public.can_access_office(office_id));
CREATE POLICY "senior_sec_snapshots_insert" ON public.student_senior_secondary_enrollment_snapshots FOR INSERT WITH CHECK (false);
CREATE POLICY "senior_sec_snapshots_update" ON public.student_senior_secondary_enrollment_snapshots FOR UPDATE USING (false);
CREATE POLICY "senior_sec_snapshots_delete" ON public.student_senior_secondary_enrollment_snapshots FOR DELETE USING (false);

COMMIT;
