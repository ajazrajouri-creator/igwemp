-- Sprint S8: School Infrastructure Management Migration
-- Covers Census Cycles, Submissions, Metrics, Evidence, Snapshots, Deficiency Views, and RPCs.

BEGIN;

-- 1. Create function to check office access (similar to can_access_employee)
CREATE OR REPLACE FUNCTION public.can_access_office(p_office_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_tenant_id uuid;
  v_target_path public.ltree;
  v_assignment RECORD;
BEGIN
  v_tenant_id := public.get_current_tenant_id();

  -- Get target office path
  SELECT path INTO v_target_path FROM public.offices WHERE id = p_office_id AND tenant_id = v_tenant_id;
  IF NOT FOUND THEN RETURN FALSE; END IF;

  -- 1. System Admin Bypass
  IF EXISTS (
    SELECT 1 FROM public.role_assignments ra 
    JOIN public.roles r ON ra.role_id = r.id 
    WHERE ra.user_id = auth.uid() AND r.code = 'SYSTEM_ADMIN'
  ) THEN
    RETURN TRUE;
  END IF;

  -- 2. Office Hierarchy Check
  FOR v_assignment IN 
    SELECT ra.office_id 
    FROM public.role_assignments ra
    WHERE ra.user_id = auth.uid()
      AND ra.tenant_id = v_tenant_id
      AND ra.effective_from <= CURRENT_DATE
      AND (ra.effective_to IS NULL OR ra.effective_to > CURRENT_DATE)
  LOOP
    IF EXISTS (
      SELECT 1 FROM public.offices o 
      WHERE o.id = v_assignment.office_id 
        AND v_target_path <@ o.path
    ) THEN
      RETURN TRUE;
    END IF;
  END LOOP;

  RETURN FALSE;
END;
$$;

-- 2. Seed Master Data Categories
INSERT INTO public.master_data_categories (id, tenant_id, code, name, description)
VALUES 
  (uuid_generate_v4(), public.get_current_tenant_id(), 'DRINKING_WATER_SOURCE', 'Drinking Water Source', 'Source of drinking water'),
  (uuid_generate_v4(), public.get_current_tenant_id(), 'BOUNDARY_WALL_TYPE', 'Boundary Wall Type', 'Type of boundary wall'),
  (uuid_generate_v4(), public.get_current_tenant_id(), 'BUILDING_CONDITION', 'Building Condition', 'Condition of building'),
  (uuid_generate_v4(), public.get_current_tenant_id(), 'TOILET_CONDITION', 'Toilet Condition', 'Condition of toilet'),
  (uuid_generate_v4(), public.get_current_tenant_id(), 'ELECTRICITY_STATUS', 'Electricity Status', 'Status of electricity'),
  (uuid_generate_v4(), public.get_current_tenant_id(), 'INTERNET_STATUS', 'Internet Status', 'Status of internet'),
  (uuid_generate_v4(), public.get_current_tenant_id(), 'DEFICIENCY_SEVERITY', 'Deficiency Severity', 'Severity of deficiency'),
  (uuid_generate_v4(), public.get_current_tenant_id(), 'EVIDENCE_CATEGORY', 'Evidence Category', 'Category of evidence')
ON CONFLICT DO NOTHING;

-- 3. Infrastructure Census Cycles
CREATE TABLE public.infrastructure_census_cycles (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  order_id text,
  status text NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'ACTIVE', 'CLOSED', 'CANCELLED')),
  starts_at timestamptz,
  due_at timestamptz,
  closed_at timestamptz,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_census_cycles_updated_at BEFORE UPDATE ON public.infrastructure_census_cycles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_audit_census_cycles AFTER INSERT OR UPDATE OR DELETE ON public.infrastructure_census_cycles FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

ALTER TABLE public.infrastructure_census_cycles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation_policy" ON public.infrastructure_census_cycles FOR ALL USING (tenant_id = public.get_current_tenant_id());

-- 4. School Infrastructure Submissions
CREATE TABLE public.school_infrastructure_submissions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  census_cycle_id uuid NOT NULL REFERENCES public.infrastructure_census_cycles(id) ON DELETE CASCADE,
  order_id text,
  case_id uuid,
  work_item_id uuid,
  office_id uuid NOT NULL REFERENCES public.offices(id) ON DELETE CASCADE,
  office_path public.ltree NOT NULL,
  status text NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'SUBMITTED', 'IN_REVIEW', 'RETURNED', 'APPROVED', 'COMMITTED')),
  submitted_by uuid REFERENCES auth.users(id),
  submitted_at timestamptz,
  reviewed_by uuid REFERENCES auth.users(id),
  reviewed_at timestamptz,
  reviewer_remarks text,
  approved_by uuid REFERENCES auth.users(id),
  approved_at timestamptz,
  committed_at timestamptz,
  record_version integer NOT NULL DEFAULT 1,
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, census_cycle_id, office_id)
);

CREATE OR REPLACE FUNCTION public.trg_populate_infrastructure_submission_path()
RETURNS trigger AS $$
BEGIN
  SELECT path INTO NEW.office_path FROM public.offices WHERE id = NEW.office_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_ins_school_infra_submission_path
  BEFORE INSERT OR UPDATE OF office_id ON public.school_infrastructure_submissions
  FOR EACH ROW EXECUTE FUNCTION public.trg_populate_infrastructure_submission_path();

CREATE TRIGGER trg_school_infra_submissions_updated_at BEFORE UPDATE ON public.school_infrastructure_submissions FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_audit_school_infra_submissions AFTER INSERT OR UPDATE OR DELETE ON public.school_infrastructure_submissions FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

ALTER TABLE public.school_infrastructure_submissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation_policy" ON public.school_infrastructure_submissions FOR ALL USING (tenant_id = public.get_current_tenant_id());

CREATE POLICY "infra_submission_select" ON public.school_infrastructure_submissions FOR SELECT USING (
  public.can_access_office(office_id)
);
CREATE POLICY "infra_submission_insert" ON public.school_infrastructure_submissions FOR INSERT WITH CHECK (
  public.can_access_office(office_id)
);
CREATE POLICY "infra_submission_update" ON public.school_infrastructure_submissions FOR UPDATE USING (
  public.can_access_office(office_id)
);

-- 5. School Infrastructure Metrics
CREATE TABLE public.school_infrastructure_metrics (
  submission_id uuid PRIMARY KEY REFERENCES public.school_infrastructure_submissions(id) ON DELETE CASCADE,
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  
  -- ROOMS
  total_rooms integer NOT NULL DEFAULT 0 CHECK (total_rooms >= 0),
  functional_classrooms integer NOT NULL DEFAULT 0 CHECK (functional_classrooms >= 0),
  classrooms_needing_minor_repair integer NOT NULL DEFAULT 0 CHECK (classrooms_needing_minor_repair >= 0),
  classrooms_dilapidated integer NOT NULL DEFAULT 0 CHECK (classrooms_dilapidated >= 0),
  staff_rooms integer NOT NULL DEFAULT 0 CHECK (staff_rooms >= 0),
  office_room_available boolean NOT NULL DEFAULT false,

  -- WASH
  boys_toilets integer NOT NULL DEFAULT 0 CHECK (boys_toilets >= 0),
  functional_boys_toilets integer NOT NULL DEFAULT 0 CHECK (functional_boys_toilets >= 0),
  girls_toilets integer NOT NULL DEFAULT 0 CHECK (girls_toilets >= 0),
  functional_girls_toilets integer NOT NULL DEFAULT 0 CHECK (functional_girls_toilets >= 0),
  cwsn_toilet_available boolean NOT NULL DEFAULT false,
  drinking_water_source_id uuid REFERENCES public.master_data_items(id),
  water_functional boolean NOT NULL DEFAULT false,

  -- FACILITIES
  electricity_available boolean NOT NULL DEFAULT false,
  electricity_functional boolean NOT NULL DEFAULT false,
  boundary_wall_type_id uuid REFERENCES public.master_data_items(id),
  playground_available boolean NOT NULL DEFAULT false,
  library_available boolean NOT NULL DEFAULT false,
  ict_lab_available boolean NOT NULL DEFAULT false,
  science_lab_available boolean NOT NULL DEFAULT false,
  internet_available boolean NOT NULL DEFAULT false,
  ramp_available boolean NOT NULL DEFAULT false,
  kitchen_shed_available boolean NOT NULL DEFAULT false,

  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  -- CHECK CONSTRAINTS
  CHECK (functional_classrooms <= total_rooms),
  CHECK (functional_boys_toilets <= boys_toilets),
  CHECK (functional_girls_toilets <= girls_toilets),
  UNIQUE (tenant_id, submission_id)
);

CREATE TRIGGER trg_school_infra_metrics_updated_at BEFORE UPDATE ON public.school_infrastructure_metrics FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_audit_school_infra_metrics AFTER INSERT OR UPDATE OR DELETE ON public.school_infrastructure_metrics FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

ALTER TABLE public.school_infrastructure_metrics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation_policy" ON public.school_infrastructure_metrics FOR ALL USING (tenant_id = public.get_current_tenant_id());
CREATE POLICY "infra_metrics_select" ON public.school_infrastructure_metrics FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.school_infrastructure_submissions s WHERE s.id = submission_id AND public.can_access_office(s.office_id))
);
CREATE POLICY "infra_metrics_insert" ON public.school_infrastructure_metrics FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.school_infrastructure_submissions s WHERE s.id = submission_id AND public.can_access_office(s.office_id))
);
CREATE POLICY "infra_metrics_update" ON public.school_infrastructure_metrics FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.school_infrastructure_submissions s WHERE s.id = submission_id AND public.can_access_office(s.office_id))
);

-- 6. School Infrastructure Evidence
CREATE TABLE public.school_infrastructure_evidence (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  submission_id uuid NOT NULL REFERENCES public.school_infrastructure_submissions(id) ON DELETE CASCADE,
  metric_key text NOT NULL,
  category_id uuid REFERENCES public.master_data_items(id),
  storage_bucket text NOT NULL,
  storage_path text NOT NULL,
  file_name text NOT NULL,
  mime_type text NOT NULL,
  file_size bigint NOT NULL,
  uploaded_by uuid NOT NULL REFERENCES auth.users(id),
  uploaded_at timestamptz NOT NULL DEFAULT now(),
  geo_lat numeric(10,8),
  geo_lng numeric(11,8),
  captured_at timestamptz,
  is_required boolean NOT NULL DEFAULT false,
  verification_status text NOT NULL DEFAULT 'PENDING',
  review_remarks text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_audit_school_infra_evidence AFTER INSERT OR UPDATE OR DELETE ON public.school_infrastructure_evidence FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

ALTER TABLE public.school_infrastructure_evidence ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation_policy" ON public.school_infrastructure_evidence FOR ALL USING (tenant_id = public.get_current_tenant_id());
CREATE POLICY "infra_evidence_select" ON public.school_infrastructure_evidence FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.school_infrastructure_submissions s WHERE s.id = submission_id AND public.can_access_office(s.office_id))
);
CREATE POLICY "infra_evidence_insert" ON public.school_infrastructure_evidence FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.school_infrastructure_submissions s WHERE s.id = submission_id AND public.can_access_office(s.office_id))
);
CREATE POLICY "infra_evidence_update" ON public.school_infrastructure_evidence FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.school_infrastructure_submissions s WHERE s.id = submission_id AND public.can_access_office(s.office_id))
);

-- 7. School Infrastructure Snapshots
CREATE TABLE public.school_infrastructure_snapshots (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  office_id uuid NOT NULL REFERENCES public.offices(id) ON DELETE CASCADE,
  office_path public.ltree NOT NULL,
  source_submission_id uuid NOT NULL REFERENCES public.school_infrastructure_submissions(id) ON DELETE CASCADE,
  census_cycle_id uuid NOT NULL REFERENCES public.infrastructure_census_cycles(id) ON DELETE CASCADE,
  approved_by uuid REFERENCES auth.users(id),
  approved_at timestamptz NOT NULL,
  
  total_rooms integer NOT NULL,
  functional_classrooms integer NOT NULL,
  classrooms_needing_minor_repair integer NOT NULL,
  classrooms_dilapidated integer NOT NULL,
  boys_toilets integer NOT NULL,
  functional_boys_toilets integer NOT NULL,
  girls_toilets integer NOT NULL,
  functional_girls_toilets integer NOT NULL,
  cwsn_toilet_available boolean NOT NULL,
  drinking_water_source_id uuid REFERENCES public.master_data_items(id),
  water_functional boolean NOT NULL,
  electricity_available boolean NOT NULL,
  electricity_functional boolean NOT NULL,
  boundary_wall_type_id uuid REFERENCES public.master_data_items(id),
  playground_available boolean NOT NULL,
  library_available boolean NOT NULL,
  ict_lab_available boolean NOT NULL,
  science_lab_available boolean NOT NULL,
  internet_available boolean NOT NULL,
  ramp_available boolean NOT NULL,
  kitchen_shed_available boolean NOT NULL,
  
  deficiency_summary jsonb NOT NULL DEFAULT '{}'::jsonb,
  record_version integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, census_cycle_id, office_id)
);

CREATE TRIGGER trg_school_infra_snapshots_updated_at BEFORE UPDATE ON public.school_infrastructure_snapshots FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_audit_school_infra_snapshots AFTER INSERT OR UPDATE OR DELETE ON public.school_infrastructure_snapshots FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

ALTER TABLE public.school_infrastructure_snapshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation_policy" ON public.school_infrastructure_snapshots FOR ALL USING (tenant_id = public.get_current_tenant_id());
CREATE POLICY "infra_snapshots_select" ON public.school_infrastructure_snapshots FOR SELECT USING (
  public.can_access_office(office_id)
);
-- Snapshots are only inserted/updated via RPC, so no direct DML policies are needed for normal users.
-- We can add a policy for system_admin if needed, but RPC runs as SECURITY DEFINER or bypasses standard if invoked securely.
-- Wait, the RPC runs with SET search_path = '' and we schema-qualify objects.
-- We'll add an admin bypass or just rely on RPC running with elevated privileges.
-- Actually, let's just make it readable to all within scope, and writable by none directly.
CREATE POLICY "infra_snapshots_insert_admin" ON public.school_infrastructure_snapshots FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.role_assignments ra 
    JOIN public.roles r ON ra.role_id = r.id 
    WHERE ra.user_id = auth.uid() AND r.code = 'SYSTEM_ADMIN'
  )
);
CREATE POLICY "infra_snapshots_update_admin" ON public.school_infrastructure_snapshots FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.role_assignments ra 
    JOIN public.roles r ON ra.role_id = r.id 
    WHERE ra.user_id = auth.uid() AND r.code = 'SYSTEM_ADMIN'
  )
);


-- 8. Deficiency View
CREATE OR REPLACE VIEW public.v_school_infrastructure_deficiency WITH (security_invoker = true) AS
WITH latest_snapshots AS (
  SELECT DISTINCT ON (office_id) *
  FROM public.school_infrastructure_snapshots
  ORDER BY office_id, approved_at DESC
)
SELECT 
  tenant_id,
  office_id,
  office_path,
  (SELECT name FROM public.offices WHERE id = s.office_id) as office_name,
  'NO_GIRLS_TOILET' as deficiency_type,
  'CRITICAL' as severity,
  id as latest_snapshot_id,
  approved_at as last_updated
FROM latest_snapshots s
WHERE functional_girls_toilets = 0

UNION ALL

SELECT 
  tenant_id,
  office_id,
  office_path,
  (SELECT name FROM public.offices WHERE id = s.office_id) as office_name,
  'NO_BOYS_TOILET' as deficiency_type,
  'CRITICAL' as severity,
  id as latest_snapshot_id,
  approved_at as last_updated
FROM latest_snapshots s
WHERE functional_boys_toilets = 0

UNION ALL

SELECT 
  tenant_id,
  office_id,
  office_path,
  (SELECT name FROM public.offices WHERE id = s.office_id) as office_name,
  'NO_DRINKING_WATER' as deficiency_type,
  'CRITICAL' as severity,
  id as latest_snapshot_id,
  approved_at as last_updated
FROM latest_snapshots s
WHERE NOT water_functional

UNION ALL

SELECT 
  tenant_id,
  office_id,
  office_path,
  (SELECT name FROM public.offices WHERE id = s.office_id) as office_name,
  'NO_ELECTRICITY' as deficiency_type,
  'HIGH' as severity,
  id as latest_snapshot_id,
  approved_at as last_updated
FROM latest_snapshots s
WHERE NOT electricity_functional

UNION ALL

SELECT 
  tenant_id,
  office_id,
  office_path,
  (SELECT name FROM public.offices WHERE id = s.office_id) as office_name,
  'NO_BOUNDARY_WALL' as deficiency_type,
  'MEDIUM' as severity,
  id as latest_snapshot_id,
  approved_at as last_updated
FROM latest_snapshots s
WHERE boundary_wall_type_id IS NULL -- Requires a boundary wall type to be considered complete

UNION ALL

SELECT 
  tenant_id,
  office_id,
  office_path,
  (SELECT name FROM public.offices WHERE id = s.office_id) as office_name,
  'NO_PLAYGROUND' as deficiency_type,
  'LOW' as severity,
  id as latest_snapshot_id,
  approved_at as last_updated
FROM latest_snapshots s
WHERE NOT playground_available

UNION ALL

SELECT 
  tenant_id,
  office_id,
  office_path,
  (SELECT name FROM public.offices WHERE id = s.office_id) as office_name,
  'NO_LIBRARY' as deficiency_type,
  'LOW' as severity,
  id as latest_snapshot_id,
  approved_at as last_updated
FROM latest_snapshots s
WHERE NOT library_available

UNION ALL

SELECT 
  tenant_id,
  office_id,
  office_path,
  (SELECT name FROM public.offices WHERE id = s.office_id) as office_name,
  'NO_ICT_LAB' as deficiency_type,
  'LOW' as severity,
  id as latest_snapshot_id,
  approved_at as last_updated
FROM latest_snapshots s
WHERE NOT ict_lab_available

UNION ALL

SELECT 
  tenant_id,
  office_id,
  office_path,
  (SELECT name FROM public.offices WHERE id = s.office_id) as office_name,
  'DILAPIDATED_CLASSROOMS' as deficiency_type,
  'HIGH' as severity,
  id as latest_snapshot_id,
  approved_at as last_updated
FROM latest_snapshots s
WHERE classrooms_dilapidated > 0

UNION ALL

SELECT 
  tenant_id,
  office_id,
  office_path,
  (SELECT name FROM public.offices WHERE id = s.office_id) as office_name,
  'INSUFFICIENT_CLASSROOMS' as deficiency_type,
  'HIGH' as severity,
  id as latest_snapshot_id,
  approved_at as last_updated
FROM latest_snapshots s
WHERE functional_classrooms < 3;


-- 9. Approve / Commit RPC
CREATE OR REPLACE FUNCTION public.approve_infrastructure_submission(
  p_submission_id uuid,
  p_remarks text DEFAULT NULL
)
RETURNS jsonb AS $$
DECLARE
  v_submission public.school_infrastructure_submissions;
  v_metrics public.school_infrastructure_metrics;
  v_uid uuid;
  v_tenant_id uuid;
  v_is_authorized boolean;
  v_missing_evidence text[];
BEGIN
  v_uid := auth.uid();
  v_tenant_id := public.get_current_tenant_id();

  -- Lock submission
  SELECT * INTO v_submission
  FROM public.school_infrastructure_submissions
  WHERE id = p_submission_id AND tenant_id = v_tenant_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Submission not found';
  END IF;

  IF v_submission.status NOT IN ('SUBMITTED', 'IN_REVIEW') THEN
    RAISE EXCEPTION 'Invalid status for approval: %', v_submission.status;
  END IF;

  -- Verify caller authority
  SELECT public.can_access_office(v_submission.office_id) INTO v_is_authorized;

  IF NOT v_is_authorized THEN
    RAISE EXCEPTION 'Unauthorized to approve this submission';
  END IF;

  -- Get metrics
  SELECT * INTO v_metrics
  FROM public.school_infrastructure_metrics
  WHERE submission_id = p_submission_id AND tenant_id = v_tenant_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Metrics not found for submission';
  END IF;

  -- Validate mandatory evidence
  v_missing_evidence := ARRAY[]::text[];
  
  IF v_metrics.boys_toilets > 0 AND NOT EXISTS (SELECT 1 FROM public.school_infrastructure_evidence WHERE submission_id = p_submission_id AND metric_key = 'boys_toilets') THEN
    v_missing_evidence := array_append(v_missing_evidence, 'boys_toilets');
  END IF;

  IF v_metrics.girls_toilets > 0 AND NOT EXISTS (SELECT 1 FROM public.school_infrastructure_evidence WHERE submission_id = p_submission_id AND metric_key = 'girls_toilets') THEN
    v_missing_evidence := array_append(v_missing_evidence, 'girls_toilets');
  END IF;

  IF v_metrics.water_functional AND NOT EXISTS (SELECT 1 FROM public.school_infrastructure_evidence WHERE submission_id = p_submission_id AND metric_key = 'drinking_water') THEN
    v_missing_evidence := array_append(v_missing_evidence, 'drinking_water');
  END IF;

  IF v_metrics.electricity_functional AND NOT EXISTS (SELECT 1 FROM public.school_infrastructure_evidence WHERE submission_id = p_submission_id AND metric_key = 'electricity') THEN
    v_missing_evidence := array_append(v_missing_evidence, 'electricity');
  END IF;

  IF v_metrics.boundary_wall_type_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.school_infrastructure_evidence WHERE submission_id = p_submission_id AND metric_key = 'boundary_wall') THEN
    v_missing_evidence := array_append(v_missing_evidence, 'boundary_wall');
  END IF;

  IF array_length(v_missing_evidence, 1) > 0 THEN
    RAISE EXCEPTION 'Mandatory evidence missing for: %', array_to_string(v_missing_evidence, ', ');
  END IF;

  -- Update submission status to COMMITTED directly (skipping APPROVED as per RPC commit role)
  UPDATE public.school_infrastructure_submissions
  SET 
    status = 'COMMITTED',
    approved_by = v_uid,
    approved_at = now(),
    committed_at = now(),
    reviewer_remarks = COALESCE(p_remarks, reviewer_remarks)
  WHERE id = p_submission_id;

  -- Create or Update Snapshot
  INSERT INTO public.school_infrastructure_snapshots (
    tenant_id, office_id, office_path, source_submission_id, census_cycle_id,
    approved_by, approved_at, total_rooms, functional_classrooms, classrooms_needing_minor_repair,
    classrooms_dilapidated, boys_toilets, functional_boys_toilets, girls_toilets, functional_girls_toilets,
    cwsn_toilet_available, drinking_water_source_id, water_functional, electricity_available,
    electricity_functional, boundary_wall_type_id, playground_available, library_available,
    ict_lab_available, science_lab_available, internet_available, ramp_available, kitchen_shed_available
  ) VALUES (
    v_tenant_id, v_submission.office_id, v_submission.office_path, v_submission.id, v_submission.census_cycle_id,
    v_uid, now(), v_metrics.total_rooms, v_metrics.functional_classrooms, v_metrics.classrooms_needing_minor_repair,
    v_metrics.classrooms_dilapidated, v_metrics.boys_toilets, v_metrics.functional_boys_toilets, v_metrics.girls_toilets, v_metrics.functional_girls_toilets,
    v_metrics.cwsn_toilet_available, v_metrics.drinking_water_source_id, v_metrics.water_functional, v_metrics.electricity_available,
    v_metrics.electricity_functional, v_metrics.boundary_wall_type_id, v_metrics.playground_available, v_metrics.library_available,
    v_metrics.ict_lab_available, v_metrics.science_lab_available, v_metrics.internet_available, v_metrics.ramp_available, v_metrics.kitchen_shed_available
  )
  ON CONFLICT (tenant_id, census_cycle_id, office_id) DO UPDATE SET
    source_submission_id = EXCLUDED.source_submission_id,
    approved_by = EXCLUDED.approved_by,
    approved_at = EXCLUDED.approved_at,
    total_rooms = EXCLUDED.total_rooms,
    functional_classrooms = EXCLUDED.functional_classrooms,
    classrooms_needing_minor_repair = EXCLUDED.classrooms_needing_minor_repair,
    classrooms_dilapidated = EXCLUDED.classrooms_dilapidated,
    boys_toilets = EXCLUDED.boys_toilets,
    functional_boys_toilets = EXCLUDED.functional_boys_toilets,
    girls_toilets = EXCLUDED.girls_toilets,
    functional_girls_toilets = EXCLUDED.functional_girls_toilets,
    cwsn_toilet_available = EXCLUDED.cwsn_toilet_available,
    drinking_water_source_id = EXCLUDED.drinking_water_source_id,
    water_functional = EXCLUDED.water_functional,
    electricity_available = EXCLUDED.electricity_available,
    electricity_functional = EXCLUDED.electricity_functional,
    boundary_wall_type_id = EXCLUDED.boundary_wall_type_id,
    playground_available = EXCLUDED.playground_available,
    library_available = EXCLUDED.library_available,
    ict_lab_available = EXCLUDED.ict_lab_available,
    science_lab_available = EXCLUDED.science_lab_available,
    internet_available = EXCLUDED.internet_available,
    ramp_available = EXCLUDED.ramp_available,
    kitchen_shed_available = EXCLUDED.kitchen_shed_available,
    updated_at = now();

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Infrastructure submission successfully approved and committed.',
    'submission_id', p_submission_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';


-- 10. Configure Storage Bucket
-- Ensure storage schema exists (Supabase typically has this built in, but we insert if missing)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('infrastructure_evidence', 'infrastructure_evidence', false)
ON CONFLICT (id) DO NOTHING;

-- Policies for storage.objects
-- HOI can upload
CREATE POLICY "infra_evidence_insert_storage" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'infrastructure_evidence' AND 
  auth.uid() = owner
);

-- Reviewers can read
CREATE POLICY "infra_evidence_select_storage" ON storage.objects FOR SELECT USING (
  bucket_id = 'infrastructure_evidence' AND 
  (auth.uid() = owner OR EXISTS (
    SELECT 1 FROM public.school_infrastructure_submissions s 
    WHERE (storage.objects.name LIKE '%' || s.id::text || '/%')
      AND public.can_access_office(s.office_id)
  ))
);

COMMIT;
