-- Sprint S7: Post Management Logic (RPCs & Views)

-- 1. Vacancy Dashboard View (Real-time database-side aggregate)
CREATE OR REPLACE VIEW public.v_office_vacancy_dashboard WITH (security_invoker = true) AS
WITH active_posts AS (
  SELECT 
    p.id,
    p.tenant_id,
    p.office_id,
    p.designation_id,
    p.subject_id,
    p.post_nature_id
  FROM public.posts p
  WHERE p.status = 'ACTIVE'
    AND p.deleted_at IS NULL
    AND p.effective_from <= CURRENT_DATE
    AND (p.effective_to IS NULL OR CURRENT_DATE < p.effective_to)
),
active_postings AS (
  SELECT ep.substantive_post_id
  FROM public.employee_postings ep
  WHERE ep.status = 'ACTIVE'
    AND ep.posting_nature = 'SUBSTANTIVE'
    AND ep.substantive_post_id IS NOT NULL
    AND ep.effective_from <= CURRENT_DATE
    AND (ep.effective_to IS NULL OR CURRENT_DATE < ep.effective_to)
),
abeyance_posts AS (
  SELECT 
    p.office_id,
    p.designation_id,
    p.subject_id,
    p.post_nature_id,
    COUNT(*) as held_in_abeyance_count
  FROM public.posts p
  WHERE p.status = 'HELD_IN_ABEYANCE' AND p.deleted_at IS NULL
  GROUP BY p.office_id, p.designation_id, p.subject_id, p.post_nature_id
),
abolished_posts AS (
  SELECT 
    p.office_id,
    p.designation_id,
    p.subject_id,
    p.post_nature_id,
    COUNT(*) as abolished_count
  FROM public.posts p
  WHERE p.status = 'ABOLISHED' AND p.deleted_at IS NULL
  GROUP BY p.office_id, p.designation_id, p.subject_id, p.post_nature_id
),
aggregated_active AS (
  SELECT 
    ap.office_id,
    ap.designation_id,
    ap.subject_id,
    ap.post_nature_id,
    COUNT(ap.id) AS sanctioned_strength,
    COUNT(ep.substantive_post_id) AS filled_strength
  FROM active_posts ap
  LEFT JOIN active_postings ep ON ap.id = ep.substantive_post_id
  GROUP BY ap.office_id, ap.designation_id, ap.subject_id, ap.post_nature_id
)
SELECT 
  COALESCE(agg.office_id, ab.office_id, abld.office_id) AS office_id,
  COALESCE(agg.designation_id, ab.designation_id, abld.designation_id) AS designation_id,
  COALESCE(agg.subject_id, ab.subject_id, abld.subject_id) AS subject_id,
  COALESCE(agg.post_nature_id, ab.post_nature_id, abld.post_nature_id) AS post_nature_id,
  COALESCE(agg.sanctioned_strength, 0)::int AS sanctioned_strength,
  COALESCE(agg.filled_strength, 0)::int AS filled_strength,
  GREATEST(COALESCE(agg.sanctioned_strength, 0) - COALESCE(agg.filled_strength, 0), 0)::int AS vacant_posts,
  COALESCE(ab.held_in_abeyance_count, 0)::int AS held_in_abeyance_posts,
  COALESCE(abld.abolished_count, 0)::int AS abolished_posts,
  CASE 
    WHEN COALESCE(agg.sanctioned_strength, 0) > 0 
    THEN ROUND((GREATEST(COALESCE(agg.sanctioned_strength, 0) - COALESCE(agg.filled_strength, 0), 0)::numeric / agg.sanctioned_strength::numeric) * 100, 2)
    ELSE 0.00
  END AS vacancy_rate
FROM aggregated_active agg
FULL OUTER JOIN abeyance_posts ab ON 
  agg.office_id = ab.office_id AND 
  agg.designation_id = ab.designation_id AND 
  agg.subject_id IS NOT DISTINCT FROM ab.subject_id AND 
  agg.post_nature_id = ab.post_nature_id
FULL OUTER JOIN abolished_posts abld ON 
  COALESCE(agg.office_id, ab.office_id) = abld.office_id AND 
  COALESCE(agg.designation_id, ab.designation_id) = abld.designation_id AND 
  COALESCE(agg.subject_id, ab.subject_id) IS NOT DISTINCT FROM abld.subject_id AND 
  COALESCE(agg.post_nature_id, ab.post_nature_id) = abld.post_nature_id;

-- 2. Concurrency-Safe Post Census Commit RPC
CREATE OR REPLACE FUNCTION public.apply_approved_post_census_submission(p_submission_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_submission RECORD;
  v_item RECORD;
  v_caller_id uuid;
  v_current_active_count int;
  v_new_rows_needed int;
  v_abolish_rows_needed int;
  v_created_ids uuid[] := '{}';
  v_abolished_ids uuid[] := '{}';
  v_next_serial int;
  v_lock_key bigint;
  v_abolition_sel RECORD;
  v_vacant_check uuid;
BEGIN
  -- Verify Caller
  v_caller_id := NULLIF(current_setting('request.jwt.claims', true)::jsonb->>'sub', '')::uuid;
  IF v_caller_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: Caller ID not found in JWT claims.';
  END IF;

  -- Lock submission row FOR UPDATE
  SELECT * INTO v_submission 
  FROM public.post_census_submissions 
  WHERE id = p_submission_id 
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Submission % not found', p_submission_id;
  END IF;

  -- Idempotency: If already committed, return early
  IF v_submission.status = 'COMMITTED' THEN
    RETURN jsonb_build_object(
      'success', true, 
      'message', 'Submission is already committed. Idempotent return.',
      'submission_id', p_submission_id
    );
  END IF;

  -- Enforce status prerequisite
  IF v_submission.status != 'APPROVED' THEN
    RAISE EXCEPTION 'Cannot commit submission in % status. Must be APPROVED.', v_submission.status;
  END IF;

  -- Iterate through items
  FOR v_item IN (SELECT * FROM public.post_census_items WHERE submission_id = p_submission_id) LOOP
    
    -- Generate deterministic lock key for the specific office/designation grouping to prevent race conditions
    v_lock_key := hashtext(v_item.tenant_id::text || v_submission.office_id::text || v_item.designation_id::text || COALESCE(v_item.subject_id::text, '') || v_item.post_nature_id::text);
    
    -- Acquire exclusive transaction-level lock for this group
    PERFORM pg_advisory_xact_lock(v_lock_key);

    -- Calculate current active effective posts for this grouping
    SELECT COUNT(*) INTO v_current_active_count
    FROM public.posts
    WHERE tenant_id = v_item.tenant_id
      AND office_id = v_submission.office_id
      AND designation_id = v_item.designation_id
      AND subject_id IS NOT DISTINCT FROM v_item.subject_id
      AND post_nature_id = v_item.post_nature_id
      AND status = 'ACTIVE'
      AND deleted_at IS NULL
      AND effective_from <= CURRENT_DATE
      AND (effective_to IS NULL OR CURRENT_DATE < effective_to);

    IF v_item.sanctioned_count > v_current_active_count THEN
      -- INCREASE: Create new post rows
      v_new_rows_needed := v_item.sanctioned_count - v_current_active_count;
      
      -- Get highest current serial to continue numbering
      SELECT COALESCE(MAX(post_serial_no), 0) INTO v_next_serial
      FROM public.posts
      WHERE tenant_id = v_item.tenant_id
        AND office_id = v_submission.office_id
        AND designation_id = v_item.designation_id
        AND subject_id IS NOT DISTINCT FROM v_item.subject_id
        AND post_nature_id = v_item.post_nature_id;

      FOR i IN 1..v_new_rows_needed LOOP
        v_next_serial := v_next_serial + 1;
        
        INSERT INTO public.posts (
          tenant_id,
          office_id,
          post_number,
          post_code,
          post_serial_no,
          designation_id,
          subject_id,
          post_nature_id,
          sanction_order_id,
          status,
          effective_from,
          created_from_census_submission_id,
          created_by
        ) VALUES (
          v_item.tenant_id,
          v_submission.office_id,
          'P' || LPAD(v_next_serial::text, 4, '0'),
          v_submission.office_id::text || '-' || v_item.designation_id::text || '-' || v_next_serial::text,
          v_next_serial,
          v_item.designation_id,
          v_item.subject_id,
          v_item.post_nature_id,
          v_submission.order_id,
          'ACTIVE',
          CURRENT_DATE,
          p_submission_id,
          v_caller_id
        ) RETURNING id INTO v_vacant_check;
        
        v_created_ids := array_append(v_created_ids, v_vacant_check);
      END LOOP;

    ELSIF v_item.sanctioned_count < v_current_active_count THEN
      -- DECREASE: Validate and execute abolition selections
      v_abolish_rows_needed := v_current_active_count - v_item.sanctioned_count;
      
      -- Verify selection count matches
      IF (SELECT COUNT(*) FROM public.post_census_abolition_selections WHERE census_item_id = v_item.id) != v_abolish_rows_needed THEN
        RAISE EXCEPTION 'Abolition selection count mismatch for item %. Required: %, Selected: %', 
          v_item.id, v_abolish_rows_needed, (SELECT COUNT(*) FROM public.post_census_abolition_selections WHERE census_item_id = v_item.id);
      END IF;

      -- Iterate selected posts
      FOR v_abolition_sel IN (SELECT * FROM public.post_census_abolition_selections WHERE census_item_id = v_item.id) LOOP
        -- Verify the selected post is completely valid for abolition
        SELECT id INTO v_vacant_check
        FROM public.posts p
        WHERE p.id = v_abolition_sel.post_id
          AND p.tenant_id = v_item.tenant_id
          AND p.office_id = v_submission.office_id
          AND p.designation_id = v_item.designation_id
          AND p.subject_id IS NOT DISTINCT FROM v_item.subject_id
          AND p.post_nature_id = v_item.post_nature_id
          AND p.status = 'ACTIVE'
          AND p.deleted_at IS NULL
          AND p.effective_from <= CURRENT_DATE
          AND (p.effective_to IS NULL OR CURRENT_DATE < p.effective_to)
          -- Ensure it is strictly VACANT
          AND NOT EXISTS (
            SELECT 1 FROM public.employee_postings ep 
            WHERE ep.substantive_post_id = p.id
              AND ep.status = 'ACTIVE'
              AND ep.posting_nature = 'SUBSTANTIVE'
              AND ep.effective_from <= CURRENT_DATE
              AND (ep.effective_to IS NULL OR CURRENT_DATE < ep.effective_to)
          )
        FOR UPDATE;

        IF NOT FOUND THEN
          RAISE EXCEPTION 'Selected post % is either invalid, occupied, or not matching item constraints. Cannot abolish.', v_abolition_sel.post_id;
        END IF;

        -- Apply abolition
        UPDATE public.posts 
        SET 
          status = 'ABOLISHED',
          effective_to = CURRENT_DATE,
          abolished_by = v_caller_id,
          abolished_at = now(),
          abolition_reason = v_abolition_sel.remarks
        WHERE id = v_abolition_sel.post_id;
        
        v_abolished_ids := array_append(v_abolished_ids, v_abolition_sel.post_id);
      END LOOP;
    END IF;
  END LOOP;

  -- Commit the submission
  UPDATE public.post_census_submissions
  SET 
    status = 'COMMITTED',
    committed_at = now()
  WHERE id = p_submission_id;

  -- Write final audit
  PERFORM public.write_audit_log(
    v_submission.tenant_id, 
    'CENSUS_COMMITTED', 
    'post_census_submissions', 
    p_submission_id, 
    jsonb_build_object('status', 'APPROVED'), 
    jsonb_build_object('status', 'COMMITTED', 'created_posts', array_length(v_created_ids, 1), 'abolished_posts', array_length(v_abolished_ids, 1))
  );

  RETURN jsonb_build_object(
    'success', true, 
    'submission_id', p_submission_id,
    'created_posts', v_created_ids,
    'abolished_posts', v_abolished_ids
  );
END;
$$;

-- Revoke public execute
REVOKE EXECUTE ON FUNCTION public.apply_approved_post_census_submission(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.apply_approved_post_census_submission(uuid) TO authenticated;
