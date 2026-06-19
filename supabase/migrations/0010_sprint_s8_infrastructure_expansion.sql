-- Sprint S8 Expansion: Land, Building, Classroom, HS/HSS, Toilet, Electricity, Drinking Water
-- Migration: 0010_sprint_s8_infrastructure_expansion.sql

BEGIN;

-- ============================================================
-- 1. MASTER DATA CATEGORIES & SEED VALUES
-- ============================================================

-- LAND_STATUS
INSERT INTO public.master_data_categories (id, tenant_id, code, name, description, is_active, created_at, updated_at)
VALUES (uuid_generate_v4(), (SELECT id FROM public.tenants LIMIT 1), 'LAND_STATUS', 'Land Status', 'Legal status of school land', true, now(), now())
ON CONFLICT DO NOTHING;

INSERT INTO public.master_data_items (id, tenant_id, category_id, code, name, sort_order, metadata, is_active, effective_from, created_at, updated_at)
SELECT uuid_generate_v4(), c.tenant_id, c.id, v.code, v.name, v.sort_order, '{}'::jsonb, true, now(), now(), now()
FROM public.master_data_categories c,
(VALUES ('DONATED_LAND', 'Donated Land', 1), ('STATE_LAND', 'State Land', 2), ('FOREST_LAND', 'Forest Land', 3), ('OTHER', 'Other', 4)) AS v(code, name, sort_order)
WHERE c.code = 'LAND_STATUS'
ON CONFLICT DO NOTHING;

-- BUILDING_STATUS
INSERT INTO public.master_data_categories (id, tenant_id, code, name, description, is_active, created_at, updated_at)
VALUES (uuid_generate_v4(), (SELECT id FROM public.tenants LIMIT 1), 'BUILDING_STATUS', 'Building Status', 'Condition status of a building', true, now(), now())
ON CONFLICT DO NOTHING;

INSERT INTO public.master_data_items (id, tenant_id, category_id, code, name, sort_order, metadata, is_active, effective_from, created_at, updated_at)
SELECT uuid_generate_v4(), c.tenant_id, c.id, v.code, v.name, v.sort_order, '{}'::jsonb, true, now(), now(), now()
FROM public.master_data_categories c,
(VALUES ('FUNCTIONAL', 'Functional', 1), ('NON_FUNCTIONAL', 'Non-Functional', 2), ('NEEDS_REPAIR', 'Needs Repair', 3), ('DILAPIDATED', 'Dilapidated', 4)) AS v(code, name, sort_order)
WHERE c.code = 'BUILDING_STATUS'
ON CONFLICT DO NOTHING;

-- DRINKING_WATER_SOURCE (expand if not fully seeded)
INSERT INTO public.master_data_items (id, tenant_id, category_id, code, name, sort_order, metadata, is_active, effective_from, created_at, updated_at)
SELECT uuid_generate_v4(), c.tenant_id, c.id, v.code, v.name, v.sort_order, '{}'::jsonb, true, now(), now(), now()
FROM public.master_data_categories c,
(VALUES ('TAP_WATER', 'Tap Water', 1), ('HAND_PUMP', 'Hand Pump', 2), ('BOREWELL', 'Borewell', 3), ('SPRING', 'Spring', 4), ('WELL', 'Well', 5), ('TANK_SUPPLY', 'Tank Supply', 6), ('OTHER', 'Other', 7)) AS v(code, name, sort_order)
WHERE c.code = 'DRINKING_WATER_SOURCE'
ON CONFLICT DO NOTHING;


-- ============================================================
-- 2. ALTER school_infrastructure_metrics — ADD NEW COLUMNS
-- ============================================================

-- LAND fields
ALTER TABLE public.school_infrastructure_metrics
  ADD COLUMN IF NOT EXISTS land_status_id uuid REFERENCES public.master_data_items(id),
  ADD COLUMN IF NOT EXISTS land_measurement_kanal numeric(10,2) DEFAULT 0 CHECK (land_measurement_kanal >= 0),
  ADD COLUMN IF NOT EXISTS land_measurement_marla numeric(10,2) CHECK (land_measurement_marla IS NULL OR land_measurement_marla >= 0),
  ADD COLUMN IF NOT EXISTS land_remarks text;

-- BUILDING fields
ALTER TABLE public.school_infrastructure_metrics
  ADD COLUMN IF NOT EXISTS building_available boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS total_buildings integer NOT NULL DEFAULT 0 CHECK (total_buildings >= 0),
  ADD COLUMN IF NOT EXISTS building_remarks text;

-- CLASSROOM fields (rename/add as needed)
ALTER TABLE public.school_infrastructure_metrics
  ADD COLUMN IF NOT EXISTS total_classrooms integer NOT NULL DEFAULT 0 CHECK (total_classrooms >= 0),
  ADD COLUMN IF NOT EXISTS non_functional_classrooms integer NOT NULL DEFAULT 0 CHECK (non_functional_classrooms >= 0),
  ADD COLUMN IF NOT EXISTS classrooms_needing_repair integer NOT NULL DEFAULT 0;

-- HS/HSS SPECIAL ROOMS
ALTER TABLE public.school_infrastructure_metrics
  ADD COLUMN IF NOT EXISTS computer_room_available boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS computer_room_functional boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS library_room_available boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS library_room_functional boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS laboratory_room_available boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS laboratory_room_functional boolean NOT NULL DEFAULT false;

-- STAFF TOILETS
ALTER TABLE public.school_infrastructure_metrics
  ADD COLUMN IF NOT EXISTS staff_toilets integer NOT NULL DEFAULT 0 CHECK (staff_toilets >= 0),
  ADD COLUMN IF NOT EXISTS staff_toilets_functional integer NOT NULL DEFAULT 0 CHECK (staff_toilets_functional >= 0),
  ADD COLUMN IF NOT EXISTS toilet_remarks text;

-- Rename functional toilet columns for consistency
-- boys_toilets_functional / girls_toilets_functional
ALTER TABLE public.school_infrastructure_metrics
  ADD COLUMN IF NOT EXISTS boys_toilets_functional integer NOT NULL DEFAULT 0 CHECK (boys_toilets_functional >= 0),
  ADD COLUMN IF NOT EXISTS girls_toilets_functional integer NOT NULL DEFAULT 0 CHECK (girls_toilets_functional >= 0);

-- ELECTRICITY
ALTER TABLE public.school_infrastructure_metrics
  ADD COLUMN IF NOT EXISTS electricity_remarks text;

-- DRINKING WATER
ALTER TABLE public.school_infrastructure_metrics
  ADD COLUMN IF NOT EXISTS drinking_water_available boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS drinking_water_functional boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS drinking_water_source_expanded_id uuid REFERENCES public.master_data_items(id),
  ADD COLUMN IF NOT EXISTS drinking_water_remarks text;

-- CHECK CONSTRAINTS for new fields
ALTER TABLE public.school_infrastructure_metrics
  ADD CONSTRAINT chk_staff_toilets_functional CHECK (staff_toilets_functional <= staff_toilets),
  ADD CONSTRAINT chk_boys_toilets_func CHECK (boys_toilets_functional <= boys_toilets),
  ADD CONSTRAINT chk_girls_toilets_func CHECK (girls_toilets_functional <= girls_toilets),
  ADD CONSTRAINT chk_classrooms_func CHECK (functional_classrooms + non_functional_classrooms <= total_classrooms OR total_classrooms = 0),
  ADD CONSTRAINT chk_classrooms_repair CHECK (classrooms_needing_repair <= total_classrooms);


-- ============================================================
-- 3. CREATE school_infrastructure_buildings TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS public.school_infrastructure_buildings (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  submission_id uuid NOT NULL REFERENCES public.school_infrastructure_submissions(id) ON DELETE CASCADE,
  building_no integer NOT NULL,
  building_name text,
  total_rooms integer NOT NULL DEFAULT 0 CHECK (total_rooms >= 0),
  functional_rooms integer NOT NULL DEFAULT 0 CHECK (functional_rooms >= 0),
  non_functional_rooms integer NOT NULL DEFAULT 0 CHECK (non_functional_rooms >= 0),
  building_status_id uuid REFERENCES public.master_data_items(id),
  remarks text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  CHECK (functional_rooms + non_functional_rooms <= total_rooms)
);

CREATE TRIGGER trg_school_infra_buildings_updated_at BEFORE UPDATE ON public.school_infrastructure_buildings FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_audit_school_infra_buildings AFTER INSERT OR UPDATE OR DELETE ON public.school_infrastructure_buildings FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

ALTER TABLE public.school_infrastructure_buildings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation_buildings" ON public.school_infrastructure_buildings FOR ALL USING (tenant_id = public.get_current_tenant_id());
CREATE POLICY "infra_buildings_select" ON public.school_infrastructure_buildings FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.school_infrastructure_submissions s WHERE s.id = submission_id AND public.can_access_office(s.office_id))
);
CREATE POLICY "infra_buildings_insert" ON public.school_infrastructure_buildings FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.school_infrastructure_submissions s WHERE s.id = submission_id AND public.can_access_office(s.office_id))
);
CREATE POLICY "infra_buildings_update" ON public.school_infrastructure_buildings FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.school_infrastructure_submissions s WHERE s.id = submission_id AND public.can_access_office(s.office_id))
);
-- DELETE denied for operational records
CREATE POLICY "infra_buildings_delete" ON public.school_infrastructure_buildings FOR DELETE USING (false);


-- ============================================================
-- 4. ALTER school_infrastructure_snapshots — ADD NEW COLUMNS
-- ============================================================

ALTER TABLE public.school_infrastructure_snapshots
  ADD COLUMN IF NOT EXISTS land_status_id uuid REFERENCES public.master_data_items(id),
  ADD COLUMN IF NOT EXISTS land_measurement_kanal numeric(10,2),
  ADD COLUMN IF NOT EXISTS land_measurement_marla numeric(10,2),
  ADD COLUMN IF NOT EXISTS land_remarks text,
  ADD COLUMN IF NOT EXISTS building_available boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS total_buildings integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS building_remarks text,
  ADD COLUMN IF NOT EXISTS total_classrooms integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS non_functional_classrooms integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS computer_room_available boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS computer_room_functional boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS library_room_available boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS library_room_functional boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS laboratory_room_available boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS laboratory_room_functional boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS staff_toilets integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS staff_toilets_functional integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS boys_toilets_functional integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS girls_toilets_functional integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS toilet_remarks text,
  ADD COLUMN IF NOT EXISTS electricity_remarks text,
  ADD COLUMN IF NOT EXISTS drinking_water_available boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS drinking_water_functional boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS drinking_water_remarks text;


-- ============================================================
-- 5. RECREATE DEFICIENCY VIEW
-- ============================================================

CREATE OR REPLACE VIEW public.v_school_infrastructure_deficiency WITH (security_invoker = true) AS
WITH latest_snapshots AS (
  SELECT DISTINCT ON (office_id) *
  FROM public.school_infrastructure_snapshots
  ORDER BY office_id, approved_at DESC
)
-- NO_LAND_STATUS
SELECT tenant_id, office_id, office_path,
  (SELECT office_name FROM public.offices WHERE id = s.office_id) as office_name,
  'NO_LAND_STATUS' as deficiency_type, 'HIGH' as severity,
  id as latest_snapshot_id, approved_at as last_updated
FROM latest_snapshots s WHERE land_status_id IS NULL

UNION ALL
-- LAND_MEASUREMENT_MISSING
SELECT tenant_id, office_id, office_path,
  (SELECT office_name FROM public.offices WHERE id = s.office_id),
  'LAND_MEASUREMENT_MISSING', 'MEDIUM', id, approved_at
FROM latest_snapshots s WHERE land_measurement_kanal IS NULL OR land_measurement_kanal = 0

UNION ALL
-- NO_BUILDING
SELECT tenant_id, office_id, office_path,
  (SELECT office_name FROM public.offices WHERE id = s.office_id),
  'NO_BUILDING', 'CRITICAL', id, approved_at
FROM latest_snapshots s WHERE NOT building_available

UNION ALL
-- BUILDING_DILAPIDATED (any dilapidated buildings)
SELECT tenant_id, office_id, office_path,
  (SELECT office_name FROM public.offices WHERE id = s.office_id),
  'DILAPIDATED_BUILDING', 'CRITICAL', id, approved_at
FROM latest_snapshots s WHERE classrooms_dilapidated > 0

UNION ALL
-- NO_CLASSROOM
SELECT tenant_id, office_id, office_path,
  (SELECT office_name FROM public.offices WHERE id = s.office_id),
  'NO_CLASSROOM', 'CRITICAL', id, approved_at
FROM latest_snapshots s WHERE total_classrooms = 0

UNION ALL
-- NO_FUNCTIONAL_CLASSROOM
SELECT tenant_id, office_id, office_path,
  (SELECT office_name FROM public.offices WHERE id = s.office_id),
  'NO_FUNCTIONAL_CLASSROOM', 'CRITICAL', id, approved_at
FROM latest_snapshots s WHERE total_classrooms > 0 AND functional_classrooms = 0

UNION ALL
-- INSUFFICIENT_FUNCTIONAL_CLASSROOMS
SELECT tenant_id, office_id, office_path,
  (SELECT office_name FROM public.offices WHERE id = s.office_id),
  'INSUFFICIENT_FUNCTIONAL_CLASSROOMS', 'HIGH', id, approved_at
FROM latest_snapshots s WHERE functional_classrooms > 0 AND functional_classrooms < 3

UNION ALL
-- CLASSROOMS_NEEDING_REPAIR
SELECT tenant_id, office_id, office_path,
  (SELECT office_name FROM public.offices WHERE id = s.office_id),
  'CLASSROOMS_NEEDING_REPAIR', 'MEDIUM', id, approved_at
FROM latest_snapshots s WHERE classrooms_needing_minor_repair > 0

UNION ALL
-- NO_BOYS_TOILET
SELECT tenant_id, office_id, office_path,
  (SELECT office_name FROM public.offices WHERE id = s.office_id),
  'NO_BOYS_TOILET', 'CRITICAL', id, approved_at
FROM latest_snapshots s WHERE boys_toilets = 0

UNION ALL
-- NO_FUNCTIONAL_BOYS_TOILET
SELECT tenant_id, office_id, office_path,
  (SELECT office_name FROM public.offices WHERE id = s.office_id),
  'NO_FUNCTIONAL_BOYS_TOILET', 'CRITICAL', id, approved_at
FROM latest_snapshots s WHERE boys_toilets > 0 AND boys_toilets_functional = 0

UNION ALL
-- NO_GIRLS_TOILET
SELECT tenant_id, office_id, office_path,
  (SELECT office_name FROM public.offices WHERE id = s.office_id),
  'NO_GIRLS_TOILET', 'CRITICAL', id, approved_at
FROM latest_snapshots s WHERE girls_toilets = 0

UNION ALL
-- NO_FUNCTIONAL_GIRLS_TOILET
SELECT tenant_id, office_id, office_path,
  (SELECT office_name FROM public.offices WHERE id = s.office_id),
  'NO_FUNCTIONAL_GIRLS_TOILET', 'CRITICAL', id, approved_at
FROM latest_snapshots s WHERE girls_toilets > 0 AND girls_toilets_functional = 0

UNION ALL
-- NO_STAFF_TOILET
SELECT tenant_id, office_id, office_path,
  (SELECT office_name FROM public.offices WHERE id = s.office_id),
  'NO_STAFF_TOILET', 'HIGH', id, approved_at
FROM latest_snapshots s WHERE staff_toilets = 0

UNION ALL
-- NO_FUNCTIONAL_STAFF_TOILET
SELECT tenant_id, office_id, office_path,
  (SELECT office_name FROM public.offices WHERE id = s.office_id),
  'NO_FUNCTIONAL_STAFF_TOILET', 'HIGH', id, approved_at
FROM latest_snapshots s WHERE staff_toilets > 0 AND staff_toilets_functional = 0

UNION ALL
-- NO_ELECTRICITY
SELECT tenant_id, office_id, office_path,
  (SELECT office_name FROM public.offices WHERE id = s.office_id),
  'NO_ELECTRICITY', 'HIGH', id, approved_at
FROM latest_snapshots s WHERE NOT electricity_available

UNION ALL
-- ELECTRICITY_NON_FUNCTIONAL
SELECT tenant_id, office_id, office_path,
  (SELECT office_name FROM public.offices WHERE id = s.office_id),
  'ELECTRICITY_NON_FUNCTIONAL', 'HIGH', id, approved_at
FROM latest_snapshots s WHERE electricity_available AND NOT electricity_functional

UNION ALL
-- NO_DRINKING_WATER
SELECT tenant_id, office_id, office_path,
  (SELECT office_name FROM public.offices WHERE id = s.office_id),
  'NO_DRINKING_WATER', 'CRITICAL', id, approved_at
FROM latest_snapshots s WHERE NOT drinking_water_available

UNION ALL
-- DRINKING_WATER_NON_FUNCTIONAL
SELECT tenant_id, office_id, office_path,
  (SELECT office_name FROM public.offices WHERE id = s.office_id),
  'DRINKING_WATER_NON_FUNCTIONAL', 'CRITICAL', id, approved_at
FROM latest_snapshots s WHERE drinking_water_available AND NOT drinking_water_functional

UNION ALL
-- WATER_SOURCE_NOT_RECORDED
SELECT tenant_id, office_id, office_path,
  (SELECT office_name FROM public.offices WHERE id = s.office_id),
  'WATER_SOURCE_NOT_RECORDED', 'MEDIUM', id, approved_at
FROM latest_snapshots s WHERE drinking_water_available AND drinking_water_source_id IS NULL

UNION ALL
-- HS/HSS WITHOUT COMPUTER ROOM
SELECT tenant_id, office_id, office_path,
  (SELECT office_name FROM public.offices WHERE id = s.office_id),
  'HS_HSS_NO_COMPUTER_ROOM', 'HIGH', id, approved_at
FROM latest_snapshots s
WHERE EXISTS (SELECT 1 FROM public.offices o WHERE o.id = s.office_id AND o.office_subtype = 'SCHOOL' AND o.office_name ~* '(HS|HSS|High School|Higher Secondary)')
  AND NOT computer_room_available

UNION ALL
-- HS/HSS WITHOUT LIBRARY
SELECT tenant_id, office_id, office_path,
  (SELECT office_name FROM public.offices WHERE id = s.office_id),
  'HS_HSS_NO_LIBRARY_ROOM', 'HIGH', id, approved_at
FROM latest_snapshots s
WHERE EXISTS (SELECT 1 FROM public.offices o WHERE o.id = s.office_id AND o.office_subtype = 'SCHOOL' AND o.office_name ~* '(HS|HSS|High School|Higher Secondary)')
  AND NOT library_room_available

UNION ALL
-- HS/HSS WITHOUT LABORATORY
SELECT tenant_id, office_id, office_path,
  (SELECT office_name FROM public.offices WHERE id = s.office_id),
  'HS_HSS_NO_LABORATORY_ROOM', 'HIGH', id, approved_at
FROM latest_snapshots s
WHERE EXISTS (SELECT 1 FROM public.offices o WHERE o.id = s.office_id AND o.office_subtype = 'SCHOOL' AND o.office_name ~* '(HS|HSS|High School|Higher Secondary)')
  AND NOT laboratory_room_available;


-- ============================================================
-- 6. UPDATE approve_infrastructure_submission RPC
-- ============================================================

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
  v_building_count integer;
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

  -- Ensure caller is NOT the HOI who submitted (HOI cannot approve own)
  IF v_submission.submitted_by = v_uid THEN
    RAISE EXCEPTION 'HOI cannot approve their own submission';
  END IF;

  -- Get metrics
  SELECT * INTO v_metrics
  FROM public.school_infrastructure_metrics
  WHERE submission_id = p_submission_id AND tenant_id = v_tenant_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Metrics not found for submission';
  END IF;

  -- Validate building rows if building_available
  IF v_metrics.building_available THEN
    SELECT COUNT(*) INTO v_building_count
    FROM public.school_infrastructure_buildings
    WHERE submission_id = p_submission_id AND deleted_at IS NULL;
    
    IF v_building_count = 0 THEN
      RAISE EXCEPTION 'At least one building row required when building is available';
    END IF;
  END IF;

  -- Validate mandatory evidence
  v_missing_evidence := ARRAY[]::text[];

  IF v_metrics.boys_toilets > 0 AND NOT EXISTS (SELECT 1 FROM public.school_infrastructure_evidence WHERE submission_id = p_submission_id AND metric_key = 'boys_toilets') THEN
    v_missing_evidence := array_append(v_missing_evidence, 'boys_toilets');
  END IF;

  IF v_metrics.girls_toilets > 0 AND NOT EXISTS (SELECT 1 FROM public.school_infrastructure_evidence WHERE submission_id = p_submission_id AND metric_key = 'girls_toilets') THEN
    v_missing_evidence := array_append(v_missing_evidence, 'girls_toilets');
  END IF;

  IF v_metrics.electricity_available AND NOT EXISTS (SELECT 1 FROM public.school_infrastructure_evidence WHERE submission_id = p_submission_id AND metric_key = 'electricity') THEN
    v_missing_evidence := array_append(v_missing_evidence, 'electricity');
  END IF;

  IF v_metrics.drinking_water_available AND NOT EXISTS (SELECT 1 FROM public.school_infrastructure_evidence WHERE submission_id = p_submission_id AND metric_key = 'drinking_water') THEN
    v_missing_evidence := array_append(v_missing_evidence, 'drinking_water');
  END IF;

  IF array_length(v_missing_evidence, 1) > 0 THEN
    RAISE EXCEPTION 'Mandatory evidence missing for: %', array_to_string(v_missing_evidence, ', ');
  END IF;

  -- Update submission status to COMMITTED
  UPDATE public.school_infrastructure_submissions
  SET 
    status = 'COMMITTED',
    approved_by = v_uid,
    approved_at = now(),
    committed_at = now(),
    reviewer_remarks = COALESCE(p_remarks, reviewer_remarks)
  WHERE id = p_submission_id;

  -- Create or Update Snapshot with all expanded fields
  INSERT INTO public.school_infrastructure_snapshots (
    tenant_id, office_id, office_path, source_submission_id, census_cycle_id,
    approved_by, approved_at,
    -- Original fields
    total_rooms, functional_classrooms, classrooms_needing_minor_repair,
    classrooms_dilapidated, boys_toilets, functional_boys_toilets, girls_toilets, functional_girls_toilets,
    cwsn_toilet_available, drinking_water_source_id, water_functional, electricity_available,
    electricity_functional, boundary_wall_type_id, playground_available, library_available,
    ict_lab_available, science_lab_available, internet_available, ramp_available, kitchen_shed_available,
    -- New expansion fields
    land_status_id, land_measurement_kanal, land_measurement_marla, land_remarks,
    building_available, total_buildings, building_remarks,
    total_classrooms, non_functional_classrooms,
    computer_room_available, computer_room_functional,
    library_room_available, library_room_functional,
    laboratory_room_available, laboratory_room_functional,
    staff_toilets, staff_toilets_functional,
    boys_toilets_functional, girls_toilets_functional,
    toilet_remarks, electricity_remarks,
    drinking_water_available, drinking_water_functional, drinking_water_remarks
  ) VALUES (
    v_tenant_id, v_submission.office_id, v_submission.office_path, v_submission.id, v_submission.census_cycle_id,
    v_uid, now(),
    v_metrics.total_rooms, v_metrics.functional_classrooms, v_metrics.classrooms_needing_minor_repair,
    v_metrics.classrooms_dilapidated, v_metrics.boys_toilets, v_metrics.functional_boys_toilets, v_metrics.girls_toilets, v_metrics.functional_girls_toilets,
    v_metrics.cwsn_toilet_available, v_metrics.drinking_water_source_id, v_metrics.water_functional, v_metrics.electricity_available,
    v_metrics.electricity_functional, v_metrics.boundary_wall_type_id, v_metrics.playground_available, v_metrics.library_available,
    v_metrics.ict_lab_available, v_metrics.science_lab_available, v_metrics.internet_available, v_metrics.ramp_available, v_metrics.kitchen_shed_available,
    v_metrics.land_status_id, v_metrics.land_measurement_kanal, v_metrics.land_measurement_marla, v_metrics.land_remarks,
    v_metrics.building_available, v_metrics.total_buildings, v_metrics.building_remarks,
    v_metrics.total_classrooms, v_metrics.non_functional_classrooms,
    v_metrics.computer_room_available, v_metrics.computer_room_functional,
    v_metrics.library_room_available, v_metrics.library_room_functional,
    v_metrics.laboratory_room_available, v_metrics.laboratory_room_functional,
    v_metrics.staff_toilets, v_metrics.staff_toilets_functional,
    v_metrics.boys_toilets_functional, v_metrics.girls_toilets_functional,
    v_metrics.toilet_remarks, v_metrics.electricity_remarks,
    v_metrics.drinking_water_available, v_metrics.drinking_water_functional, v_metrics.drinking_water_remarks
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
    -- expansion fields
    land_status_id = EXCLUDED.land_status_id,
    land_measurement_kanal = EXCLUDED.land_measurement_kanal,
    land_measurement_marla = EXCLUDED.land_measurement_marla,
    land_remarks = EXCLUDED.land_remarks,
    building_available = EXCLUDED.building_available,
    total_buildings = EXCLUDED.total_buildings,
    building_remarks = EXCLUDED.building_remarks,
    total_classrooms = EXCLUDED.total_classrooms,
    non_functional_classrooms = EXCLUDED.non_functional_classrooms,
    computer_room_available = EXCLUDED.computer_room_available,
    computer_room_functional = EXCLUDED.computer_room_functional,
    library_room_available = EXCLUDED.library_room_available,
    library_room_functional = EXCLUDED.library_room_functional,
    laboratory_room_available = EXCLUDED.laboratory_room_available,
    laboratory_room_functional = EXCLUDED.laboratory_room_functional,
    staff_toilets = EXCLUDED.staff_toilets,
    staff_toilets_functional = EXCLUDED.staff_toilets_functional,
    boys_toilets_functional = EXCLUDED.boys_toilets_functional,
    girls_toilets_functional = EXCLUDED.girls_toilets_functional,
    toilet_remarks = EXCLUDED.toilet_remarks,
    electricity_remarks = EXCLUDED.electricity_remarks,
    drinking_water_available = EXCLUDED.drinking_water_available,
    drinking_water_functional = EXCLUDED.drinking_water_functional,
    drinking_water_remarks = EXCLUDED.drinking_water_remarks,
    updated_at = now();

  -- Write audit log
  INSERT INTO public.audit_logs (id, tenant_id, entity_type, entity_id, action, new_values, performed_by, performed_at)
  VALUES (
    uuid_generate_v4(), v_tenant_id, 'school_infrastructure_submission', p_submission_id,
    'APPROVE_COMMIT',
    jsonb_build_object('status', 'COMMITTED', 'approved_by', v_uid, 'remarks', p_remarks),
    v_uid, now()
  );

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Infrastructure submission successfully approved and committed.',
    'submission_id', p_submission_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';


-- ============================================================
-- 7. STORAGE BUCKET (safe re-insert)
-- ============================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'infrastructure_evidence',
  'infrastructure_evidence',
  false,
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
)
ON CONFLICT (id) DO UPDATE SET
  allowed_mime_types = EXCLUDED.allowed_mime_types,
  file_size_limit = EXCLUDED.file_size_limit;


COMMIT;
