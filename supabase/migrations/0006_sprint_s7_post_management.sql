-- Sprint S7: Post Management & Sanctioned Strength (Schema & RLS)
-- Creates the authoritative row-per-post public.posts table and post census tables.

-- 1. Create public.posts (Row-per-post authoritative registry)
CREATE TABLE public.posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  office_id uuid NOT NULL REFERENCES public.offices(id),
  office_path ltree NOT NULL,
  post_number text NOT NULL,
  post_code text,
  post_serial_no int,
  designation_id uuid NOT NULL REFERENCES public.master_data_items(id),
  subject_id uuid REFERENCES public.master_data_items(id),
  post_nature_id uuid NOT NULL REFERENCES public.master_data_items(id),
  pay_scale_id uuid REFERENCES public.master_data_items(id),
  sanction_order_id uuid REFERENCES public.orders(id),
  status text NOT NULL CHECK (status IN ('ACTIVE', 'ABOLISHED', 'HELD_IN_ABEYANCE')),
  effective_from date NOT NULL,
  effective_to date,
  created_from_census_submission_id uuid,
  abolished_by uuid REFERENCES public.user_accounts(id),
  abolished_at timestamptz,
  abolition_order_id uuid REFERENCES public.orders(id),
  abolition_reason text,
  created_by uuid REFERENCES public.user_accounts(id),
  approved_by uuid REFERENCES public.user_accounts(id),
  approved_at timestamptz,
  record_version int NOT NULL DEFAULT 1,
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  
  -- Master data validation triggers handle designation_id, subject_id, etc.
  -- Add null-safe uniqueness for post_number
  CONSTRAINT uq_post_number UNIQUE NULLS NOT DISTINCT (tenant_id, office_id, designation_id, subject_id, post_nature_id, post_number)
);

-- Trigger to populate office_path
CREATE OR REPLACE FUNCTION public.trg_populate_post_office_path()
RETURNS trigger AS $$
BEGIN
  SELECT path INTO NEW.office_path FROM public.offices WHERE id = NEW.office_id AND tenant_id = NEW.tenant_id;
  IF NEW.office_path IS NULL THEN
    RAISE EXCEPTION 'Invalid office_id % for tenant %', NEW.office_id, NEW.tenant_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

CREATE TRIGGER trg_posts_office_path
  BEFORE INSERT OR UPDATE OF office_id ON public.posts
  FOR EACH ROW EXECUTE FUNCTION public.trg_populate_post_office_path();

-- 2. Master Data Validation Triggers for public.posts
CREATE OR REPLACE FUNCTION public.trg_validate_post_master_data()
RETURNS trigger AS $$
DECLARE
  v_category text;
BEGIN
  -- Check designation
  SELECT category INTO v_category FROM public.master_data_items WHERE id = NEW.designation_id;
  IF v_category != 'DESIGNATION' THEN
    RAISE EXCEPTION 'designation_id must point to a DESIGNATION item (found %)', v_category;
  END IF;
  
  -- Check subject
  IF NEW.subject_id IS NOT NULL THEN
    SELECT category INTO v_category FROM public.master_data_items WHERE id = NEW.subject_id;
    IF v_category != 'SUBJECT' THEN
      RAISE EXCEPTION 'subject_id must point to a SUBJECT item (found %)', v_category;
    END IF;
  END IF;

  -- Check post_nature
  SELECT category INTO v_category FROM public.master_data_items WHERE id = NEW.post_nature_id;
  IF v_category != 'POST_NATURE' THEN
    RAISE EXCEPTION 'post_nature_id must point to a POST_NATURE item (found %)', v_category;
  END IF;

  -- Check pay_scale
  IF NEW.pay_scale_id IS NOT NULL THEN
    SELECT category INTO v_category FROM public.master_data_items WHERE id = NEW.pay_scale_id;
    IF v_category != 'PAY_SCALE' THEN
      RAISE EXCEPTION 'pay_scale_id must point to a PAY_SCALE item (found %)', v_category;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_posts_validate_categories
  BEFORE INSERT OR UPDATE ON public.posts
  FOR EACH ROW EXECUTE FUNCTION public.trg_validate_post_master_data();

-- 3. Update employee_postings to link to public.posts
ALTER TABLE public.employee_postings ADD COLUMN substantive_post_id uuid REFERENCES public.posts(id);

-- Ensure post belongs to same tenant/office and is active via trigger
CREATE OR REPLACE FUNCTION public.trg_validate_employee_posting_link()
RETURNS trigger AS $$
DECLARE
  v_post RECORD;
BEGIN
  IF NEW.substantive_post_id IS NOT NULL THEN
    SELECT tenant_id, office_id, status, effective_from, effective_to INTO v_post 
    FROM public.posts WHERE id = NEW.substantive_post_id;
    
    IF v_post.tenant_id != NEW.tenant_id THEN
      RAISE EXCEPTION 'substantive_post_id belongs to a different tenant';
    END IF;
    
    IF v_post.office_id != NEW.office_id THEN
      RAISE EXCEPTION 'substantive_post_id belongs to a different office';
    END IF;

    IF v_post.status = 'ABOLISHED' THEN
      RAISE EXCEPTION 'Cannot post to an ABOLISHED post';
    END IF;
    
    IF v_post.status = 'HELD_IN_ABEYANCE' THEN
      RAISE EXCEPTION 'Cannot post to a HELD_IN_ABEYANCE post';
    END IF;

    -- Date logic checking
    IF CURRENT_DATE < v_post.effective_from OR (v_post.effective_to IS NOT NULL AND CURRENT_DATE >= v_post.effective_to) THEN
      RAISE EXCEPTION 'Cannot post to a currently ineffective post';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_validate_posting_post
  BEFORE INSERT OR UPDATE ON public.employee_postings
  FOR EACH ROW EXECUTE FUNCTION public.trg_validate_employee_posting_link();

-- Exclusion Constraint for Overlapping Occupancy
CREATE EXTENSION IF NOT EXISTS btree_gist;
ALTER TABLE public.employee_postings ADD CONSTRAINT exclude_overlapping_substantive_post_occupancy
EXCLUDE USING gist (
  tenant_id WITH =,
  substantive_post_id WITH =,
  daterange(effective_from, COALESCE(effective_to, 'infinity'::date), '[)') WITH &&
)
WHERE (
  substantive_post_id IS NOT NULL 
  AND posting_nature = 'SUBSTANTIVE' 
  AND status = 'ACTIVE'
);

-- 4. Post Census Tables
CREATE TABLE public.post_census_cycles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  order_id uuid REFERENCES public.orders(id),
  status text NOT NULL CHECK (status IN ('DRAFT', 'ACTIVE', 'CLOSED', 'CANCELLED')),
  starts_at timestamptz,
  due_at timestamptz,
  closed_at timestamptz,
  created_by uuid REFERENCES public.user_accounts(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.post_census_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  census_cycle_id uuid NOT NULL REFERENCES public.post_census_cycles(id) ON DELETE CASCADE,
  order_id uuid REFERENCES public.orders(id),
  case_id uuid,
  work_item_id uuid,
  office_id uuid NOT NULL REFERENCES public.offices(id),
  status text NOT NULL CHECK (status IN ('DRAFT', 'SUBMITTED', 'IN_REVIEW', 'RETURNED', 'APPROVED', 'COMMITTED')),
  submitted_by uuid REFERENCES public.user_accounts(id),
  submitted_at timestamptz,
  reviewed_by uuid REFERENCES public.user_accounts(id),
  reviewed_at timestamptz,
  review_remarks text,
  approved_by uuid REFERENCES public.user_accounts(id),
  approved_at timestamptz,
  committed_at timestamptz,
  record_version int NOT NULL DEFAULT 1,
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_census_submission UNIQUE (tenant_id, census_cycle_id, office_id)
);

CREATE TABLE public.post_census_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  submission_id uuid NOT NULL REFERENCES public.post_census_submissions(id) ON DELETE CASCADE,
  designation_id uuid NOT NULL REFERENCES public.master_data_items(id),
  subject_id uuid REFERENCES public.master_data_items(id),
  post_nature_id uuid NOT NULL REFERENCES public.master_data_items(id),
  sanctioned_count int NOT NULL CHECK (sanctioned_count >= 0),
  reported_filled_count int CHECK (reported_filled_count >= 0),
  remarks text,
  row_status text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.post_census_abolition_selections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  submission_id uuid NOT NULL REFERENCES public.post_census_submissions(id) ON DELETE CASCADE,
  census_item_id uuid NOT NULL REFERENCES public.post_census_items(id) ON DELETE CASCADE,
  post_id uuid NOT NULL REFERENCES public.posts(id),
  selected_by uuid NOT NULL REFERENCES public.user_accounts(id),
  selected_at timestamptz NOT NULL DEFAULT now(),
  remarks text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Master data validations for census items
CREATE OR REPLACE FUNCTION public.trg_validate_census_item_master_data()
RETURNS trigger AS $$
DECLARE
  v_category text;
BEGIN
  SELECT category INTO v_category FROM public.master_data_items WHERE id = NEW.designation_id;
  IF v_category != 'DESIGNATION' THEN RAISE EXCEPTION 'designation_id must point to a DESIGNATION item'; END IF;
  
  IF NEW.subject_id IS NOT NULL THEN
    SELECT category INTO v_category FROM public.master_data_items WHERE id = NEW.subject_id;
    IF v_category != 'SUBJECT' THEN RAISE EXCEPTION 'subject_id must point to a SUBJECT item'; END IF;
  END IF;

  SELECT category INTO v_category FROM public.master_data_items WHERE id = NEW.post_nature_id;
  IF v_category != 'POST_NATURE' THEN RAISE EXCEPTION 'post_nature_id must point to a POST_NATURE item'; END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_census_items_validate_categories
  BEFORE INSERT OR UPDATE ON public.post_census_items
  FOR EACH ROW EXECUTE FUNCTION public.trg_validate_census_item_master_data();

-- 5. Audit Logging Setup
CREATE OR REPLACE FUNCTION public.trg_audit_posts()
RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM public.write_audit_log(NEW.tenant_id, 'POST_CREATED', 'posts', NEW.id, NULL, row_to_json(NEW)::jsonb);
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.status != 'ABOLISHED' AND NEW.status = 'ABOLISHED' THEN
      PERFORM public.write_audit_log(NEW.tenant_id, 'POST_ABOLISHED', 'posts', NEW.id, row_to_json(OLD)::jsonb, row_to_json(NEW)::jsonb);
    ELSIF OLD.status != 'HELD_IN_ABEYANCE' AND NEW.status = 'HELD_IN_ABEYANCE' THEN
      PERFORM public.write_audit_log(NEW.tenant_id, 'POST_HELD_IN_ABEYANCE', 'posts', NEW.id, row_to_json(OLD)::jsonb, row_to_json(NEW)::jsonb);
    ELSE
      PERFORM public.write_audit_log(NEW.tenant_id, 'POST_UPDATED', 'posts', NEW.id, row_to_json(OLD)::jsonb, row_to_json(NEW)::jsonb);
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

CREATE TRIGGER trg_audit_posts_changes
  AFTER INSERT OR UPDATE ON public.posts
  FOR EACH ROW EXECUTE FUNCTION public.trg_audit_posts();

CREATE OR REPLACE FUNCTION public.trg_audit_census_submissions()
RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.status != NEW.status THEN
    PERFORM public.write_audit_log(NEW.tenant_id, 'SUBMISSION_STATUS_CHANGED', 'post_census_submissions', NEW.id, row_to_json(OLD)::jsonb, row_to_json(NEW)::jsonb);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

CREATE TRIGGER trg_audit_census_submissions_changes
  AFTER UPDATE ON public.post_census_submissions
  FOR EACH ROW EXECUTE FUNCTION public.trg_audit_census_submissions();

CREATE OR REPLACE FUNCTION public.trg_audit_employee_postings_link()
RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.substantive_post_id IS NOT NULL THEN
    PERFORM public.write_audit_log(NEW.tenant_id, 'EMPLOYEE_LINKED_TO_POST', 'employee_postings', NEW.id, NULL, row_to_json(NEW)::jsonb);
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.substantive_post_id IS DISTINCT FROM NEW.substantive_post_id THEN
      PERFORM public.write_audit_log(NEW.tenant_id, 'EMPLOYEE_SUBSTANTIVE_POST_CHANGED', 'employee_postings', NEW.id, row_to_json(OLD)::jsonb, row_to_json(NEW)::jsonb);
    END IF;
    IF OLD.status = 'ACTIVE' AND NEW.status = 'RELIEVED' THEN
      PERFORM public.write_audit_log(NEW.tenant_id, 'EMPLOYEE_RELIEVED_FROM_POST', 'employee_postings', NEW.id, row_to_json(OLD)::jsonb, row_to_json(NEW)::jsonb);
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

CREATE TRIGGER trg_audit_employee_postings_link_changes
  AFTER INSERT OR UPDATE ON public.employee_postings
  FOR EACH ROW EXECUTE FUNCTION public.trg_audit_employee_postings_link();

-- 6. Row Level Security

ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_census_cycles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_census_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_census_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_census_abolition_selections ENABLE ROW LEVEL SECURITY;

-- public.posts
CREATE POLICY "posts_select_tenant" ON public.posts FOR SELECT
USING (tenant_id = public.get_current_tenant_id() AND office_path <@ (SELECT path FROM public.offices WHERE id = public.get_current_office_id()));

CREATE POLICY "posts_insert_admin" ON public.posts FOR INSERT
WITH CHECK (tenant_id = public.get_current_tenant_id() AND public.get_current_role() IN ('SUPER_ADMIN', 'TENANT_ADMIN'));

CREATE POLICY "posts_update_admin" ON public.posts FOR UPDATE
USING (tenant_id = public.get_current_tenant_id() AND public.get_current_role() IN ('SUPER_ADMIN', 'TENANT_ADMIN'));

-- public.post_census_cycles
CREATE POLICY "cycles_select_tenant" ON public.post_census_cycles FOR SELECT
USING (tenant_id = public.get_current_tenant_id());

CREATE POLICY "cycles_insert_admin" ON public.post_census_cycles FOR INSERT
WITH CHECK (tenant_id = public.get_current_tenant_id() AND public.get_current_role() IN ('SUPER_ADMIN', 'TENANT_ADMIN'));

CREATE POLICY "cycles_update_admin" ON public.post_census_cycles FOR UPDATE
USING (tenant_id = public.get_current_tenant_id() AND public.get_current_role() IN ('SUPER_ADMIN', 'TENANT_ADMIN'));

-- public.post_census_submissions
CREATE POLICY "submissions_select_tenant" ON public.post_census_submissions FOR SELECT
USING (tenant_id = public.get_current_tenant_id() AND (
  office_id = public.get_current_office_id() OR
  office_id IN (SELECT id FROM public.offices WHERE path <@ (SELECT path FROM public.offices WHERE id = public.get_current_office_id()))
));

CREATE POLICY "submissions_insert_hoi" ON public.post_census_submissions FOR INSERT
WITH CHECK (tenant_id = public.get_current_tenant_id() AND office_id = public.get_current_office_id() AND status = 'DRAFT');

CREATE POLICY "submissions_update_tenant" ON public.post_census_submissions FOR UPDATE
USING (tenant_id = public.get_current_tenant_id() AND (
  -- HOI updating their own DRAFT submission
  (office_id = public.get_current_office_id() AND status IN ('DRAFT', 'RETURNED')) OR
  -- Reviewer updating submission in their hierarchy
  (office_id IN (SELECT id FROM public.offices WHERE path <@ (SELECT path FROM public.offices WHERE id = public.get_current_office_id())) AND status IN ('SUBMITTED', 'IN_REVIEW', 'APPROVED', 'RETURNED'))
));

CREATE POLICY "submissions_delete_hoi" ON public.post_census_submissions FOR DELETE
USING (tenant_id = public.get_current_tenant_id() AND office_id = public.get_current_office_id() AND status = 'DRAFT');

-- public.post_census_items
CREATE POLICY "items_select_tenant" ON public.post_census_items FOR SELECT
USING (tenant_id = public.get_current_tenant_id() AND submission_id IN (SELECT id FROM public.post_census_submissions));

CREATE POLICY "items_insert_hoi" ON public.post_census_items FOR INSERT
WITH CHECK (tenant_id = public.get_current_tenant_id() AND submission_id IN (
  SELECT id FROM public.post_census_submissions WHERE office_id = public.get_current_office_id() AND status = 'DRAFT'
));

CREATE POLICY "items_update_hoi" ON public.post_census_items FOR UPDATE
USING (tenant_id = public.get_current_tenant_id() AND submission_id IN (
  SELECT id FROM public.post_census_submissions WHERE office_id = public.get_current_office_id() AND status IN ('DRAFT', 'RETURNED')
));

CREATE POLICY "items_delete_hoi" ON public.post_census_items FOR DELETE
USING (tenant_id = public.get_current_tenant_id() AND submission_id IN (
  SELECT id FROM public.post_census_submissions WHERE office_id = public.get_current_office_id() AND status = 'DRAFT'
));

-- public.post_census_abolition_selections
CREATE POLICY "abolitions_select_tenant" ON public.post_census_abolition_selections FOR SELECT
USING (tenant_id = public.get_current_tenant_id() AND submission_id IN (SELECT id FROM public.post_census_submissions));

CREATE POLICY "abolitions_insert_reviewer" ON public.post_census_abolition_selections FOR INSERT
WITH CHECK (tenant_id = public.get_current_tenant_id() AND submission_id IN (
  SELECT id FROM public.post_census_submissions WHERE 
  office_id IN (SELECT id FROM public.offices WHERE path <@ (SELECT path FROM public.offices WHERE id = public.get_current_office_id())) AND 
  status IN ('SUBMITTED', 'IN_REVIEW')
));

CREATE POLICY "abolitions_update_reviewer" ON public.post_census_abolition_selections FOR UPDATE
USING (tenant_id = public.get_current_tenant_id() AND submission_id IN (
  SELECT id FROM public.post_census_submissions WHERE 
  office_id IN (SELECT id FROM public.offices WHERE path <@ (SELECT path FROM public.offices WHERE id = public.get_current_office_id())) AND 
  status IN ('SUBMITTED', 'IN_REVIEW')
));

CREATE POLICY "abolitions_delete_reviewer" ON public.post_census_abolition_selections FOR DELETE
USING (tenant_id = public.get_current_tenant_id() AND submission_id IN (
  SELECT id FROM public.post_census_submissions WHERE 
  office_id IN (SELECT id FROM public.offices WHERE path <@ (SELECT path FROM public.offices WHERE id = public.get_current_office_id())) AND 
  status IN ('SUBMITTED', 'IN_REVIEW')
));
