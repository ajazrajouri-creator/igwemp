-- ============================================================================
-- IGWEMP Sprint S3 - Organization Foundation Layer
-- Tenants, Offices, Sections, Master Data, Audit
-- ============================================================================

-- 1. Enable Required Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "ltree";

-- 2. Core Functions
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- 3. Tenants
CREATE TABLE public.tenants (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Note: Tenants table is platform-level, RLS restricts to platform admins
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Platform Admins can manage tenants"
  ON public.tenants
  FOR ALL
  -- Allow read for now, lock down later when admin roles exist
  USING (true);

-- 4. User Accounts Stub (Needed for FKs and RLS)
CREATE TABLE public.user_accounts (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  supabase_auth_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT user_accounts_auth_id_key UNIQUE (supabase_auth_id)
);

-- RLS Helper: Get Tenant ID for current session
CREATE OR REPLACE FUNCTION get_current_tenant_id()
RETURNS uuid AS $$
  SELECT COALESCE(
    (current_setting('request.jwt.claims', true)::jsonb ->> 'tenant_id')::uuid,
    (SELECT tenant_id FROM public.user_accounts WHERE supabase_auth_id = auth.uid() LIMIT 1)
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

ALTER TABLE public.user_accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation_policy" ON public.user_accounts
  FOR ALL USING (tenant_id = get_current_tenant_id());

-- 5. Audit Framework
CREATE TABLE public.audit_logs (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE,
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  action text NOT NULL,
  old_values jsonb,
  new_values jsonb,
  performed_by uuid REFERENCES public.user_accounts(id),
  performed_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation_policy" ON public.audit_logs
  FOR ALL USING (tenant_id = get_current_tenant_id());

-- Generic Audit Trigger Function
CREATE OR REPLACE FUNCTION audit_trigger_func()
RETURNS TRIGGER AS $$
DECLARE
  v_tenant_id uuid;
  v_user_id uuid;
  v_old jsonb := NULL;
  v_new jsonb := NULL;
BEGIN
  v_user_id := (SELECT id FROM public.user_accounts WHERE supabase_auth_id = auth.uid() LIMIT 1);
  
  IF TG_OP = 'INSERT' THEN
    v_new := row_to_json(NEW);
    v_tenant_id := COALESCE(get_current_tenant_id(), (v_new->>'tenant_id')::uuid);
  ELSIF TG_OP = 'UPDATE' THEN
    v_old := row_to_json(OLD);
    v_new := row_to_json(NEW);
    v_tenant_id := COALESCE(get_current_tenant_id(), (v_new->>'tenant_id')::uuid);
  ELSIF TG_OP = 'DELETE' THEN
    v_old := row_to_json(OLD);
    v_tenant_id := COALESCE(get_current_tenant_id(), (v_old->>'tenant_id')::uuid);
  END IF;

  INSERT INTO public.audit_logs (tenant_id, entity_type, entity_id, action, old_values, new_values, performed_by)
  VALUES (
    v_tenant_id, 
    TG_TABLE_NAME, 
    COALESCE(NEW.id, OLD.id), 
    TG_OP, 
    v_old, 
    v_new, 
    v_user_id
  );

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 6. Hierarchy Levels
CREATE TABLE public.hierarchy_levels (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  level_code text NOT NULL,
  level_name text NOT NULL,
  sort_order int NOT NULL,
  parent_level_id uuid REFERENCES public.hierarchy_levels(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, level_code)
);

CREATE TRIGGER trg_hierarchy_levels_updated_at BEFORE UPDATE ON public.hierarchy_levels FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_audit_hierarchy_levels AFTER INSERT OR UPDATE OR DELETE ON public.hierarchy_levels FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

ALTER TABLE public.hierarchy_levels ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation_policy" ON public.hierarchy_levels FOR ALL USING (tenant_id = get_current_tenant_id());


-- 7. Offices (with ltree path)
CREATE TABLE public.offices (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  office_code text NOT NULL,
  office_name text NOT NULL,
  level_id uuid NOT NULL REFERENCES public.hierarchy_levels(id),
  parent_office_id uuid REFERENCES public.offices(id),
  path ltree,
  office_subtype text NOT NULL DEFAULT 'DEFAULT',
  is_active boolean NOT NULL DEFAULT true,
  address text,
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, office_code)
);

CREATE INDEX idx_offices_path ON public.offices USING GIST (path);

-- Trigger to maintain ltree path
CREATE OR REPLACE FUNCTION update_office_path()
RETURNS TRIGGER AS $$
DECLARE
  parent_path ltree;
BEGIN
  IF NEW.parent_office_id IS NULL THEN
    NEW.path = replace(NEW.id::text, '-', '_')::ltree;
  ELSE
    SELECT path INTO parent_path FROM public.offices WHERE id = NEW.parent_office_id;
    IF parent_path IS NULL THEN
      RAISE EXCEPTION 'Invalid parent office path';
    END IF;
    NEW.path = parent_path || replace(NEW.id::text, '-', '_')::ltree;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_office_path BEFORE INSERT OR UPDATE OF parent_office_id ON public.offices FOR EACH ROW EXECUTE FUNCTION update_office_path();
CREATE TRIGGER trg_offices_updated_at BEFORE UPDATE ON public.offices FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_audit_offices AFTER INSERT OR UPDATE OR DELETE ON public.offices FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

ALTER TABLE public.offices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation_policy" ON public.offices FOR ALL USING (tenant_id = get_current_tenant_id());


-- 8. Sections (with queue_enabled)
CREATE TABLE public.sections (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  office_id uuid NOT NULL REFERENCES public.offices(id) ON DELETE CASCADE,
  section_type text NOT NULL,
  section_name text NOT NULL,
  head_user_id uuid REFERENCES public.user_accounts(id),
  queue_enabled boolean NOT NULL DEFAULT true,
  is_active boolean NOT NULL DEFAULT true,
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (office_id, section_type)
);

CREATE TRIGGER trg_sections_updated_at BEFORE UPDATE ON public.sections FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_audit_sections AFTER INSERT OR UPDATE OR DELETE ON public.sections FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

ALTER TABLE public.sections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation_policy" ON public.sections FOR ALL USING (tenant_id = get_current_tenant_id());


-- 9. Section Memberships
CREATE TABLE public.section_memberships (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  section_id uuid NOT NULL REFERENCES public.sections(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.user_accounts(id) ON DELETE CASCADE,
  section_role text NOT NULL,
  effective_from date NOT NULL DEFAULT CURRENT_DATE,
  effective_to date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_section_memberships_updated_at BEFORE UPDATE ON public.section_memberships FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_audit_section_memberships AFTER INSERT OR UPDATE OR DELETE ON public.section_memberships FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

ALTER TABLE public.section_memberships ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation_policy" ON public.section_memberships FOR ALL USING (tenant_id = get_current_tenant_id());


-- 10. Hybrid Reference Data Engine (Master Data)
CREATE TABLE public.master_data_categories (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  code text NOT NULL,
  name text NOT NULL,
  description text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, code)
);

CREATE TABLE public.master_data_items (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  category_id uuid NOT NULL REFERENCES public.master_data_categories(id) ON DELETE CASCADE,
  parent_item_id uuid REFERENCES public.master_data_items(id),
  code text NOT NULL,
  name text NOT NULL,
  sort_order int NOT NULL DEFAULT 0,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  effective_from date NOT NULL DEFAULT CURRENT_DATE,
  effective_to date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (category_id, code)
);

CREATE TRIGGER trg_mdc_updated_at BEFORE UPDATE ON public.master_data_categories FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_audit_mdc AFTER INSERT OR UPDATE OR DELETE ON public.master_data_categories FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();
ALTER TABLE public.master_data_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation_policy" ON public.master_data_categories FOR ALL USING (tenant_id = get_current_tenant_id());

CREATE TRIGGER trg_mdi_updated_at BEFORE UPDATE ON public.master_data_items FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_audit_mdi AFTER INSERT OR UPDATE OR DELETE ON public.master_data_items FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();
ALTER TABLE public.master_data_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation_policy" ON public.master_data_items FOR ALL USING (tenant_id = get_current_tenant_id());
