-- ============================================================================
-- IGWEMP Sprint S4 - Identity & Roles Layer
-- ============================================================================

-- 1. Party Engine (Class Table Inheritance)
CREATE TABLE public.parties (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  party_type text NOT NULL CHECK (party_type IN ('PERSON', 'ORG', 'OFFICE', 'SCHOOL', 'COMMITTEE')),
  display_name text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.person_parties (
  party_id uuid PRIMARY KEY REFERENCES public.parties(id) ON DELETE CASCADE,
  first_name text NOT NULL,
  last_name text,
  dob date,
  gender text CHECK (gender IN ('MALE', 'FEMALE', 'OTHER')),
  aadhaar_hash text,
  pan_hash text
);

CREATE TABLE public.org_parties (
  party_id uuid PRIMARY KEY REFERENCES public.parties(id) ON DELETE CASCADE,
  org_type text NOT NULL,
  registration_number text
);

CREATE TRIGGER trg_parties_updated_at BEFORE UPDATE ON public.parties FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_audit_parties AFTER INSERT OR UPDATE OR DELETE ON public.parties FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

ALTER TABLE public.parties ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation_policy" ON public.parties FOR ALL USING (tenant_id = get_current_tenant_id());
ALTER TABLE public.person_parties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.org_parties ENABLE ROW LEVEL SECURITY;

-- 2. Employee Profile Foundation
CREATE TABLE public.employee_profiles (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  person_id uuid NOT NULL REFERENCES public.person_parties(party_id) ON DELETE CASCADE,
  employee_code text NOT NULL,
  joining_date date,
  status text NOT NULL DEFAULT 'ACTIVE',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, employee_code)
);

CREATE TRIGGER trg_employee_profiles_updated_at BEFORE UPDATE ON public.employee_profiles FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_audit_employee_profiles AFTER INSERT OR UPDATE OR DELETE ON public.employee_profiles FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

ALTER TABLE public.employee_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation_policy" ON public.employee_profiles FOR ALL USING (tenant_id = get_current_tenant_id());

-- 3. Identity Engine Updates
ALTER TABLE public.user_accounts 
  ADD COLUMN party_id uuid REFERENCES public.parties(id),
  ADD COLUMN status text NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE', 'SUSPENDED', 'LOCKED')),
  ADD COLUMN username text,
  ADD COLUMN last_login_at timestamptz;

CREATE TABLE public.user_preferences (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.user_accounts(id) ON DELETE CASCADE,
  email_notifications boolean NOT NULL DEFAULT true,
  in_app_notifications boolean NOT NULL DEFAULT true,
  queue_alerts boolean NOT NULL DEFAULT true,
  escalation_alerts boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id)
);

CREATE TRIGGER trg_user_preferences_updated_at BEFORE UPDATE ON public.user_preferences FOR EACH ROW EXECUTE FUNCTION set_updated_at();
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation_policy" ON public.user_preferences FOR ALL USING (tenant_id = get_current_tenant_id());

-- 4. Role & Policy Engine
CREATE TABLE public.roles (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  code text NOT NULL,
  name text NOT NULL,
  description text,
  is_system boolean NOT NULL DEFAULT false,
  hierarchy_weight int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, code)
);

CREATE TABLE public.policies (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  code text NOT NULL,
  description text,
  module text NOT NULL,
  action text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, code)
);

CREATE TABLE public.role_policies (
  role_id uuid REFERENCES public.roles(id) ON DELETE CASCADE,
  policy_id uuid REFERENCES public.policies(id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, policy_id)
);

CREATE TABLE public.role_assignments (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.user_accounts(id) ON DELETE CASCADE,
  role_id uuid NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
  office_id uuid REFERENCES public.offices(id) ON DELETE CASCADE,
  section_id uuid REFERENCES public.sections(id) ON DELETE CASCADE,
  effective_from date NOT NULL DEFAULT CURRENT_DATE,
  effective_to date,
  assigned_by uuid REFERENCES public.user_accounts(id),
  assignment_reason text,
  assigned_order_id uuid, -- Will reference orders table later
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.role_assignment_scopes (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  assignment_id uuid NOT NULL REFERENCES public.role_assignments(id) ON DELETE CASCADE,
  scope_category_id uuid NOT NULL REFERENCES public.master_data_categories(id),
  scope_item_id uuid NOT NULL REFERENCES public.master_data_items(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_roles_updated_at BEFORE UPDATE ON public.roles FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_policies_updated_at BEFORE UPDATE ON public.policies FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_role_assignments_updated_at BEFORE UPDATE ON public.role_assignments FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_audit_roles AFTER INSERT OR UPDATE OR DELETE ON public.roles FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();
CREATE TRIGGER trg_audit_role_assignments AFTER INSERT OR UPDATE OR DELETE ON public.role_assignments FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_assignment_scopes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_isolation_policy" ON public.roles FOR ALL USING (tenant_id = get_current_tenant_id());
CREATE POLICY "tenant_isolation_policy" ON public.policies FOR ALL USING (tenant_id = get_current_tenant_id());
CREATE POLICY "tenant_isolation_policy" ON public.role_assignments FOR ALL USING (tenant_id = get_current_tenant_id());
CREATE POLICY "tenant_isolation_policy" ON public.role_assignment_scopes FOR ALL USING (tenant_id = get_current_tenant_id());

-- 5. Delegation Engine
CREATE TABLE public.delegations_of_authority (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  delegated_by uuid NOT NULL REFERENCES public.user_accounts(id),
  delegated_to uuid NOT NULL REFERENCES public.user_accounts(id),
  delegation_type text NOT NULL CHECK (delegation_type IN ('FULL', 'PARTIAL', 'APPROVAL_ONLY', 'SIGNING_ONLY', 'CUSTOM')),
  effective_from timestamptz NOT NULL DEFAULT now(),
  effective_to timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('PENDING', 'ACTIVE', 'EXPIRED', 'REVOKED')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.delegation_scopes (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  delegation_id uuid NOT NULL REFERENCES public.delegations_of_authority(id) ON DELETE CASCADE,
  module text NOT NULL,
  action text NOT NULL,
  scope_item_id uuid REFERENCES public.master_data_items(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_doa_updated_at BEFORE UPDATE ON public.delegations_of_authority FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_audit_doa AFTER INSERT OR UPDATE OR DELETE ON public.delegations_of_authority FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

ALTER TABLE public.delegations_of_authority ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delegation_scopes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation_policy" ON public.delegations_of_authority FOR ALL USING (tenant_id = get_current_tenant_id());
CREATE POLICY "tenant_isolation_policy" ON public.delegation_scopes FOR ALL USING (tenant_id = get_current_tenant_id());

-- 6. Responsibility Engine
CREATE TABLE public.responsibility_types (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  code text NOT NULL,
  name text NOT NULL,
  category text NOT NULL,
  is_exclusive boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, code)
);

CREATE TABLE public.person_responsibilities (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  person_id uuid NOT NULL REFERENCES public.person_parties(party_id) ON DELETE CASCADE,
  resp_type_id uuid NOT NULL REFERENCES public.responsibility_types(id) ON DELETE CASCADE,
  office_id uuid REFERENCES public.offices(id) ON DELETE CASCADE,
  effective_from date NOT NULL DEFAULT CURRENT_DATE,
  effective_to date,
  status text NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'EXPIRED', 'REVOKED', 'SUSPENDED')),
  assigned_by uuid REFERENCES public.user_accounts(id),
  linked_order_id uuid, -- Will reference orders table
  remarks text,
  priority int NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_resp_types_updated_at BEFORE UPDATE ON public.responsibility_types FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_person_resp_updated_at BEFORE UPDATE ON public.person_responsibilities FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_audit_person_resp AFTER INSERT OR UPDATE OR DELETE ON public.person_responsibilities FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

ALTER TABLE public.responsibility_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.person_responsibilities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation_policy" ON public.responsibility_types FOR ALL USING (tenant_id = get_current_tenant_id());
CREATE POLICY "tenant_isolation_policy" ON public.person_responsibilities FOR ALL USING (tenant_id = get_current_tenant_id());
