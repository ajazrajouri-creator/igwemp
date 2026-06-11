-- ============================================================================
-- IGWEMP Sprint S5 - Governance Workflow Foundation
-- ============================================================================

-- 1. Document Foundation
CREATE TABLE public.documents (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  title text NOT NULL,
  document_type text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.document_versions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id uuid NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  version_number int NOT NULL,
  file_path text NOT NULL,
  file_size bigint NOT NULL,
  mime_type text NOT NULL,
  uploaded_by uuid REFERENCES public.user_accounts(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(document_id, version_number)
);

CREATE TABLE public.document_links (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id uuid NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  linked_entity_type text NOT NULL,
  linked_entity_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_documents_updated_at BEFORE UPDATE ON public.documents FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- 2. Workflow Engine
CREATE TABLE public.workflow_definitions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  code text NOT NULL,
  name text NOT NULL,
  module text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, code)
);

CREATE TABLE public.workflow_versions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  workflow_id uuid NOT NULL REFERENCES public.workflow_definitions(id) ON DELETE CASCADE,
  version_number int NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(workflow_id, version_number)
);

CREATE TABLE public.workflow_states (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  workflow_version_id uuid NOT NULL REFERENCES public.workflow_versions(id) ON DELETE CASCADE,
  name text NOT NULL,
  state_type text NOT NULL CHECK (state_type IN ('START', 'IN_PROGRESS', 'WAITING', 'END')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.workflow_transitions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  workflow_version_id uuid NOT NULL REFERENCES public.workflow_versions(id) ON DELETE CASCADE,
  from_state_id uuid NOT NULL REFERENCES public.workflow_states(id) ON DELETE CASCADE,
  to_state_id uuid NOT NULL REFERENCES public.workflow_states(id) ON DELETE CASCADE,
  action_name text NOT NULL,
  required_role_id uuid REFERENCES public.roles(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_workflow_defs_updated_at BEFORE UPDATE ON public.workflow_definitions FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- 3. Order Engine
CREATE TABLE public.orders (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  order_number text NOT NULL,
  order_type_id uuid NOT NULL REFERENCES public.master_data_items(id),
  issue_date date NOT NULL,
  effective_date date,
  priority text NOT NULL DEFAULT 'NORMAL' CHECK (priority IN ('LOW', 'NORMAL', 'HIGH', 'URGENT')),
  status text NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'PUBLISHED', 'SUPERSEDED', 'WITHDRAWN')),
  issuing_office_id uuid NOT NULL REFERENCES public.offices(id),
  issuing_user_id uuid NOT NULL REFERENCES public.user_accounts(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, order_number)
);

CREATE TRIGGER trg_orders_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- 4. Case Engine & Queue
CREATE TABLE public.cases (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  parent_case_id uuid REFERENCES public.cases(id) ON DELETE CASCADE,
  parent_order_id uuid REFERENCES public.orders(id) ON DELETE CASCADE,
  case_type_id uuid NOT NULL REFERENCES public.master_data_items(id),
  workflow_version_id uuid REFERENCES public.workflow_versions(id),
  current_state_id uuid REFERENCES public.workflow_states(id),
  status text NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'IN_PROGRESS', 'PENDING_APPROVAL', 'RETURNED', 'ESCALATED', 'CLOSED', 'REJECTED')),
  due_date timestamptz,
  priority text NOT NULL DEFAULT 'NORMAL' CHECK (priority IN ('LOW', 'NORMAL', 'HIGH', 'URGENT')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.work_items (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  case_id uuid NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
  assigned_user_id uuid REFERENCES public.user_accounts(id),
  assigned_section_id uuid REFERENCES public.sections(id),
  assigned_office_id uuid REFERENCES public.offices(id),
  status text NOT NULL DEFAULT 'INBOX' CHECK (status IN ('INBOX', 'IN_PROGRESS', 'PENDING_APPROVAL', 'COMPLETED', 'ESCALATED')),
  due_date timestamptz,
  picked_up_by uuid REFERENCES public.user_accounts(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  -- Exactly one assignee must be set
  CONSTRAINT chk_work_item_assignee CHECK (
    (assigned_user_id IS NOT NULL AND assigned_section_id IS NULL AND assigned_office_id IS NULL) OR
    (assigned_user_id IS NULL AND assigned_section_id IS NOT NULL AND assigned_office_id IS NULL) OR
    (assigned_user_id IS NULL AND assigned_section_id IS NULL AND assigned_office_id IS NOT NULL)
  )
);

CREATE TRIGGER trg_cases_updated_at BEFORE UPDATE ON public.cases FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_work_items_updated_at BEFORE UPDATE ON public.work_items FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- 5. Action Taken Reports (ATRs)
CREATE TABLE public.action_taken_reports (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  case_id uuid NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
  work_item_id uuid REFERENCES public.work_items(id) ON DELETE CASCADE,
  submitted_by uuid NOT NULL REFERENCES public.user_accounts(id),
  narrative text NOT NULL,
  submission_date timestamptz NOT NULL DEFAULT now(),
  atr_status text NOT NULL DEFAULT 'SUBMITTED' CHECK (atr_status IN ('DRAFT', 'SUBMITTED', 'VERIFIED', 'APPROVED', 'RETURNED')),
  verification_remarks text,
  approved_by uuid REFERENCES public.user_accounts(id),
  approved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_atrs_updated_at BEFORE UPDATE ON public.action_taken_reports FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- 6. Escalation Rule Engine
CREATE TABLE public.escalation_rules (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  case_type_id uuid REFERENCES public.master_data_items(id),
  priority text CHECK (priority IN ('LOW', 'NORMAL', 'HIGH', 'URGENT')),
  rule_type text NOT NULL CHECK (rule_type IN ('REMINDER', 'ESCALATION')),
  trigger_days int NOT NULL,
  escalation_level int NOT NULL DEFAULT 1,
  escalate_to_role_id uuid REFERENCES public.roles(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.escalations (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  case_id uuid NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
  work_item_id uuid NOT NULL REFERENCES public.work_items(id) ON DELETE CASCADE,
  rule_id uuid NOT NULL REFERENCES public.escalation_rules(id),
  escalated_by_system boolean NOT NULL DEFAULT true,
  escalated_to_user_id uuid REFERENCES public.user_accounts(id),
  reason text NOT NULL,
  status text NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'RESOLVED', 'IGNORED')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_escalation_rules_updated_at BEFORE UPDATE ON public.escalation_rules FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_escalations_updated_at BEFORE UPDATE ON public.escalations FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- 7. Notification Template Engine
CREATE TABLE public.notification_templates (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  code text NOT NULL,
  channel text NOT NULL CHECK (channel IN ('IN_APP', 'EMAIL', 'SMS', 'WHATSAPP')),
  subject_template text NOT NULL,
  body_template text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, code, channel)
);

CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.user_accounts(id) ON DELETE CASCADE,
  template_id uuid REFERENCES public.notification_templates(id),
  content text NOT NULL,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_notification_templates_updated_at BEFORE UPDATE ON public.notification_templates FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- 8. Dynamic Form Foundation
CREATE TABLE public.form_templates (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  code text NOT NULL,
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, code)
);

CREATE TABLE public.form_fields (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  form_template_id uuid NOT NULL REFERENCES public.form_templates(id) ON DELETE CASCADE,
  field_name text NOT NULL,
  field_type text NOT NULL CHECK (field_type IN ('TEXT', 'NUMBER', 'DATE', 'BOOLEAN', 'SELECT', 'MULTI_SELECT', 'FILE')),
  is_required boolean NOT NULL DEFAULT false,
  validation_rules jsonb,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_form_templates_updated_at BEFORE UPDATE ON public.form_templates FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- 9. Assignment Templates
CREATE TABLE public.assignment_templates (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  workflow_id uuid REFERENCES public.workflow_definitions(id),
  generated_order_type_id uuid REFERENCES public.master_data_items(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.template_tasks (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  template_id uuid NOT NULL REFERENCES public.assignment_templates(id) ON DELETE CASCADE,
  task_name text NOT NULL,
  default_assignee_role_id uuid REFERENCES public.roles(id),
  sla_days int,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_assignment_templates_updated_at BEFORE UPDATE ON public.assignment_templates FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- Apply RLS and Audit Triggers to all S5 tables
DO $$
DECLARE
  table_name text;
  tables text[] := ARRAY[
    'documents', 'document_versions', 'document_links',
    'workflow_definitions', 'workflow_versions', 'workflow_states', 'workflow_transitions',
    'orders', 'cases', 'work_items', 'action_taken_reports',
    'escalation_rules', 'escalations',
    'notification_templates', 'notifications',
    'form_templates', 'form_fields',
    'assignment_templates', 'template_tasks'
  ];
BEGIN
  FOREACH table_name IN ARRAY tables LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', table_name);
    
    -- Documents, versions, links shouldn't strictly require tenant_id for linking purposes but our tables have it or rely on parent
    IF table_name NOT IN ('document_versions', 'document_links', 'workflow_states', 'workflow_transitions', 'form_fields', 'template_tasks') THEN
      EXECUTE format('CREATE POLICY "tenant_isolation_policy" ON public.%I FOR ALL USING (tenant_id = get_current_tenant_id());', table_name);
    END IF;

    EXECUTE format('CREATE TRIGGER trg_audit_%I AFTER INSERT OR UPDATE OR DELETE ON public.%I FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();', table_name, table_name);
  END LOOP;
END $$;
