-- Sprint S9.1: CI Test Helpers & Schema Corrections
-- Migration: 0015_sprint_s9_1_ci_test_helpers.sql
-- 
-- This migration:
-- 1. Adds user_id to employee_profiles (needed by submit_employee_update_request)
-- 2. Creates test helper functions used by pgTAP tests 03-05

BEGIN;

-- ============================================================
-- 1. ADD user_id TO employee_profiles
-- ============================================================
-- Required by submit_employee_update_request and test helpers
ALTER TABLE public.employee_profiles
  ADD COLUMN IF NOT EXISTS user_id uuid;

-- ============================================================
-- 2. TEST HELPER FUNCTIONS
-- ============================================================

-- setup_test_tenant: Create a test tenant
CREATE OR REPLACE FUNCTION public.setup_test_tenant()
RETURNS SETOF text AS $$
BEGIN
  INSERT INTO public.tenants (id, name, code)
  VALUES ('a0000000-0000-4000-b000-000000000001', 'Test Education Department', 'TEST_ED')
  ON CONFLICT (id) DO NOTHING;
  
  -- Create hierarchy levels
  INSERT INTO public.hierarchy_levels (id, tenant_id, level_code, level_name, sort_order) VALUES
  ('a1000000-0000-4000-b000-000000000001', 'a0000000-0000-4000-b000-000000000001', 'STATE', 'State Level', 10),
  ('a1000000-0000-4000-b000-000000000002', 'a0000000-0000-4000-b000-000000000001', 'DISTRICT', 'District Level', 20),
  ('a1000000-0000-4000-b000-000000000003', 'a0000000-0000-4000-b000-000000000001', 'ZONE', 'Zone Level', 30),
  ('a1000000-0000-4000-b000-000000000004', 'a0000000-0000-4000-b000-000000000001', 'SCHOOL', 'School Level', 40)
  ON CONFLICT (id) DO NOTHING;

  -- Create master data categories needed for tests
  INSERT INTO public.master_data_categories (id, tenant_id, code, name) VALUES
  ('a2000000-0000-4000-b000-000000000001', 'a0000000-0000-4000-b000-000000000001', 'CLASS_LEVEL', 'Class Level'),
  ('a2000000-0000-4000-b000-000000000002', 'a0000000-0000-4000-b000-000000000001', 'ENROLLMENT_STATUS', 'Enrollment Status'),
  ('a2000000-0000-4000-b000-000000000003', 'a0000000-0000-4000-b000-000000000001', 'GENDER', 'Gender'),
  ('a2000000-0000-4000-b000-000000000004', 'a0000000-0000-4000-b000-000000000001', 'SCHOOL_TYPE', 'School Type'),
  ('a2000000-0000-4000-b000-000000000005', 'a0000000-0000-4000-b000-000000000001', 'SENIOR_SECONDARY_STREAM', 'Senior Secondary Stream'),
  ('a2000000-0000-4000-b000-000000000006', 'a0000000-0000-4000-b000-000000000001', 'SUBJECT', 'Subject')
  ON CONFLICT (id) DO NOTHING;

  -- Create master data items
  INSERT INTO public.master_data_items (id, category_id, tenant_id, code, name) VALUES
  -- Class levels
  ('a3000000-0000-4000-b000-000000000001', 'a2000000-0000-4000-b000-000000000001', 'a0000000-0000-4000-b000-000000000001', 'CLASS_1', 'Class 1'),
  ('a3000000-0000-4000-b000-000000000002', 'a2000000-0000-4000-b000-000000000001', 'a0000000-0000-4000-b000-000000000001', 'CLASS_5', 'Class 5'),
  ('a3000000-0000-4000-b000-000000000003', 'a2000000-0000-4000-b000-000000000001', 'a0000000-0000-4000-b000-000000000001', 'CLASS_6', 'Class 6'),
  ('a3000000-0000-4000-b000-000000000004', 'a2000000-0000-4000-b000-000000000001', 'a0000000-0000-4000-b000-000000000001', 'CLASS_9', 'Class 9'),
  ('a3000000-0000-4000-b000-000000000005', 'a2000000-0000-4000-b000-000000000001', 'a0000000-0000-4000-b000-000000000001', 'CLASS_11', 'Class 11'),
  ('a3000000-0000-4000-b000-000000000006', 'a2000000-0000-4000-b000-000000000001', 'a0000000-0000-4000-b000-000000000001', 'CLASS_12', 'Class 12'),
  -- Enrollment status
  ('a3000000-0000-4000-b000-000000000010', 'a2000000-0000-4000-b000-000000000002', 'a0000000-0000-4000-b000-000000000001', 'ACTIVE', 'Active'),
  -- Gender
  ('a3000000-0000-4000-b000-000000000020', 'a2000000-0000-4000-b000-000000000003', 'a0000000-0000-4000-b000-000000000001', 'MALE', 'Male'),
  ('a3000000-0000-4000-b000-000000000021', 'a2000000-0000-4000-b000-000000000003', 'a0000000-0000-4000-b000-000000000001', 'FEMALE', 'Female'),
  -- School types
  ('a3000000-0000-4000-b000-000000000030', 'a2000000-0000-4000-b000-000000000004', 'a0000000-0000-4000-b000-000000000001', 'PS', 'Primary School'),
  ('a3000000-0000-4000-b000-000000000031', 'a2000000-0000-4000-b000-000000000004', 'a0000000-0000-4000-b000-000000000001', 'MS', 'Middle School'),
  ('a3000000-0000-4000-b000-000000000032', 'a2000000-0000-4000-b000-000000000004', 'a0000000-0000-4000-b000-000000000001', 'HSS', 'Higher Secondary School'),
  -- Streams
  ('a3000000-0000-4000-b000-000000000040', 'a2000000-0000-4000-b000-000000000005', 'a0000000-0000-4000-b000-000000000001', 'SCIENCE', 'Science'),
  -- Subjects
  ('a3000000-0000-4000-b000-000000000050', 'a2000000-0000-4000-b000-000000000006', 'a0000000-0000-4000-b000-000000000001', 'PHYSICS', 'Physics')
  ON CONFLICT (id) DO NOTHING;

  RETURN;
END;
$$ LANGUAGE plpgsql;

-- setup_test_offices: Create test office hierarchy
CREATE OR REPLACE FUNCTION public.setup_test_offices()
RETURNS SETOF text AS $$
BEGIN
  INSERT INTO public.offices (id, tenant_id, office_code, office_name, level_id, parent_office_id, path) VALUES
  -- State
  ('b0000000-0000-4000-b000-000000000001', 'a0000000-0000-4000-b000-000000000001', 'DIR', 'Directorate', 'a1000000-0000-4000-b000-000000000001', NULL, 'DIR'),
  -- CEO / District
  ('b0000000-0000-4000-b000-000000000002', 'a0000000-0000-4000-b000-000000000001', 'CEO_RAJ', 'CEO Rajouri', 'a1000000-0000-4000-b000-000000000002', 'b0000000-0000-4000-b000-000000000001', 'DIR.CEO_RAJ'),
  -- Zone A
  ('b0000000-0000-4000-b000-000000000003', 'a0000000-0000-4000-b000-000000000001', 'ZEO_A', 'ZEO Zone A', 'a1000000-0000-4000-b000-000000000003', 'b0000000-0000-4000-b000-000000000002', 'DIR.CEO_RAJ.ZEO_A'),
  -- Zone B  
  ('b0000000-0000-4000-b000-000000000004', 'a0000000-0000-4000-b000-000000000001', 'ZEO_B', 'ZEO Zone B', 'a1000000-0000-4000-b000-000000000003', 'b0000000-0000-4000-b000-000000000002', 'DIR.CEO_RAJ.ZEO_B'),
  -- Schools under Zone A
  ('b0000000-0000-4000-b000-000000000005', 'a0000000-0000-4000-b000-000000000001', 'PS_A', 'Primary School A', 'a1000000-0000-4000-b000-000000000004', 'b0000000-0000-4000-b000-000000000003', 'DIR.CEO_RAJ.ZEO_A.PS_A'),
  ('b0000000-0000-4000-b000-000000000006', 'a0000000-0000-4000-b000-000000000001', 'PS_B', 'Primary School B', 'a1000000-0000-4000-b000-000000000004', 'b0000000-0000-4000-b000-000000000003', 'DIR.CEO_RAJ.ZEO_A.PS_B'),
  -- Middle School under Zone A
  ('b0000000-0000-4000-b000-000000000007', 'a0000000-0000-4000-b000-000000000001', 'MS_ZA', 'Middle School Zone A', 'a1000000-0000-4000-b000-000000000004', 'b0000000-0000-4000-b000-000000000003', 'DIR.CEO_RAJ.ZEO_A.MS_ZA'),
  -- HSS under Zone B
  ('b0000000-0000-4000-b000-000000000008', 'a0000000-0000-4000-b000-000000000001', 'HSS_ZB', 'HSS Zone B', 'a1000000-0000-4000-b000-000000000004', 'b0000000-0000-4000-b000-000000000004', 'DIR.CEO_RAJ.ZEO_B.HSS_ZB')
  ON CONFLICT (id) DO NOTHING;

  RETURN;
END;
$$ LANGUAGE plpgsql;

-- setup_test_roles: Create test roles
CREATE OR REPLACE FUNCTION public.setup_test_roles()
RETURNS SETOF text AS $$
BEGIN
  INSERT INTO public.roles (id, tenant_id, code, name) VALUES
  ('c0000000-0000-4000-b000-000000000001', 'a0000000-0000-4000-b000-000000000001', 'CEO', 'Chief Education Officer'),
  ('c0000000-0000-4000-b000-000000000002', 'a0000000-0000-4000-b000-000000000001', 'ZEO', 'Zonal Education Officer'),
  ('c0000000-0000-4000-b000-000000000003', 'a0000000-0000-4000-b000-000000000001', 'HOI', 'Head of Institution'),
  ('c0000000-0000-4000-b000-000000000004', 'a0000000-0000-4000-b000-000000000001', 'TEACHER', 'Teacher')
  ON CONFLICT (id) DO NOTHING;

  RETURN;
END;
$$ LANGUAGE plpgsql;

-- setup_test_users: Create test auth users, parties, user_accounts, role_assignments and employee_profiles
CREATE OR REPLACE FUNCTION public.setup_test_users()
RETURNS SETOF text AS $$
DECLARE
  v_tenant_id uuid := 'a0000000-0000-4000-b000-000000000001';
  v_ceo_auth_id uuid := 'd0000000-0000-4000-b000-000000000001';
  v_zeo_a_auth_id uuid := 'd0000000-0000-4000-b000-000000000002';
  v_zeo_b_auth_id uuid := 'd0000000-0000-4000-b000-000000000003';
  v_hoi_auth_id uuid := 'd0000000-0000-4000-b000-000000000004';
  v_teacher_auth_id uuid := 'd0000000-0000-4000-b000-000000000005';
  v_ua_ceo uuid;
  v_ua_zeo_a uuid;
  v_ua_zeo_b uuid;
  v_ua_hoi uuid;
  v_ua_teacher uuid;
  v_party_ceo uuid;
  v_party_zeo_a uuid;
  v_party_zeo_b uuid;
  v_party_hoi uuid;
  v_party_teacher uuid;
BEGIN
  -- Create auth users
  INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, instance_id, aud, role, created_at, updated_at)
  VALUES
    (v_ceo_auth_id, 'ceo@example.com', crypt('password123', gen_salt('bf')), now(), '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', now(), now()),
    (v_zeo_a_auth_id, 'zeo_zone_a@example.com', crypt('password123', gen_salt('bf')), now(), '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', now(), now()),
    (v_zeo_b_auth_id, 'zeo_zone_b@example.com', crypt('password123', gen_salt('bf')), now(), '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', now(), now()),
    (v_hoi_auth_id, 'hoi@example.com', crypt('password123', gen_salt('bf')), now(), '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', now(), now()),
    (v_teacher_auth_id, 'teacher@example.com', crypt('password123', gen_salt('bf')), now(), '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', now(), now())
  ON CONFLICT (id) DO NOTHING;

  -- Create parties
  INSERT INTO public.parties (id, tenant_id, party_type, display_name) VALUES
    (v_ceo_auth_id, v_tenant_id, 'PERSON', 'CEO User'),
    (v_zeo_a_auth_id, v_tenant_id, 'PERSON', 'ZEO Zone A User'),
    (v_zeo_b_auth_id, v_tenant_id, 'PERSON', 'ZEO Zone B User'),
    (v_hoi_auth_id, v_tenant_id, 'PERSON', 'HOI User'),
    (v_teacher_auth_id, v_tenant_id, 'PERSON', 'Teacher User')
  ON CONFLICT (id) DO NOTHING;

  -- Create person_parties
  INSERT INTO public.person_parties (party_id, first_name, last_name) VALUES
    (v_ceo_auth_id, 'CEO', 'User'),
    (v_zeo_a_auth_id, 'ZEO_A', 'User'),
    (v_zeo_b_auth_id, 'ZEO_B', 'User'),
    (v_hoi_auth_id, 'HOI', 'User'),
    (v_teacher_auth_id, 'Teacher', 'User')
  ON CONFLICT (party_id) DO NOTHING;

  -- Create user_accounts  
  INSERT INTO public.user_accounts (id, tenant_id, supabase_auth_id, party_id) VALUES
    (v_ceo_auth_id, v_tenant_id, v_ceo_auth_id, v_ceo_auth_id),
    (v_zeo_a_auth_id, v_tenant_id, v_zeo_a_auth_id, v_zeo_a_auth_id),
    (v_zeo_b_auth_id, v_tenant_id, v_zeo_b_auth_id, v_zeo_b_auth_id),
    (v_hoi_auth_id, v_tenant_id, v_hoi_auth_id, v_hoi_auth_id),
    (v_teacher_auth_id, v_tenant_id, v_teacher_auth_id, v_teacher_auth_id)
  ON CONFLICT (id) DO NOTHING;

  -- Create role assignments
  INSERT INTO public.role_assignments (id, tenant_id, user_id, role_id, office_id) VALUES
    -- CEO at CEO office
    (uuid_generate_v4(), v_tenant_id, v_ceo_auth_id, 'c0000000-0000-4000-b000-000000000001', 'b0000000-0000-4000-b000-000000000002'),
    -- ZEO A at Zone A
    (uuid_generate_v4(), v_tenant_id, v_zeo_a_auth_id, 'c0000000-0000-4000-b000-000000000002', 'b0000000-0000-4000-b000-000000000003'),
    -- ZEO B at Zone B
    (uuid_generate_v4(), v_tenant_id, v_zeo_b_auth_id, 'c0000000-0000-4000-b000-000000000002', 'b0000000-0000-4000-b000-000000000004'),
    -- HOI at Primary School A
    (uuid_generate_v4(), v_tenant_id, v_hoi_auth_id, 'c0000000-0000-4000-b000-000000000003', 'b0000000-0000-4000-b000-000000000005'),
    -- Teacher at Primary School A
    (uuid_generate_v4(), v_tenant_id, v_teacher_auth_id, 'c0000000-0000-4000-b000-000000000004', 'b0000000-0000-4000-b000-000000000005')
  ON CONFLICT (id) DO NOTHING;

  -- Create employee profiles for teacher
  INSERT INTO public.employee_profiles (id, tenant_id, person_party_id, employee_code, current_office_id, user_id)
  VALUES (
    'e0000000-0000-4000-b000-000000000001',
    v_tenant_id,
    v_teacher_auth_id,
    'EMP-TEACHER-01',
    'b0000000-0000-4000-b000-000000000005',
    v_teacher_auth_id
  ) ON CONFLICT (id) DO NOTHING;

  RETURN;
END;
$$ LANGUAGE plpgsql;

COMMIT;
