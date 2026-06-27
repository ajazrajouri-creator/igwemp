-- Sprint S9.1: School-Level End-to-End Validation Checkpoint
-- Migration: 0013_sprint_s9_1_hss_validation.sql

BEGIN;

-- Redeclare approve_enrollment_submission to include strict S9.1 HSS Class 11/12 validation
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

  -- =====================================================================================
  -- S9.1 VALIDATION: HSS STRICT CHECK FOR CLASS 11/12
  -- =====================================================================================
  IF EXISTS (
    SELECT 1 FROM public.student_enrollments e
    WHERE e.tenant_id = v_tenant_id 
      AND e.academic_session_id = v_submission.academic_session_id 
      AND e.office_id = v_submission.office_id 
      AND e.deleted_at IS NULL
      AND e.class_id IN (v_class_11_id, v_class_12_id)
      AND e.enrollment_status_id IN (SELECT id FROM public.master_data_items WHERE code = 'ACTIVE')
  ) THEN
    -- Verify explicitly that the school_type of the submitting office is 'HSS'
    -- Do not rely on school_class_configurations alone.
    IF NOT EXISTS (
      SELECT 1 
      FROM public.offices o
      JOIN public.master_data_items stype ON o.office_type_id = stype.id
      JOIN public.master_data_categories scat ON stype.category_id = scat.id
      WHERE o.id = v_submission.office_id
        AND o.is_active = true
        AND scat.code = 'SCHOOL_TYPE'
        AND stype.code = 'HSS'
    ) THEN
      RAISE EXCEPTION 'Class 11/12 enrollment is strictly permitted for HSS schools only. This school is not configured as HSS at the office level.';
    END IF;
  END IF;
  -- =====================================================================================

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

  RETURN jsonb_build_object('success', true, 'message', 'Submission approved and committed successfully.', 'submission_id', p_submission_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

COMMIT;
