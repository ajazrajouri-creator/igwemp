-- =========================================================================================
-- Sprint S7: Atomic Post Census Approval RPC
-- Fixes Abolition Selection integration to be 100% backend-authoritative and atomic
-- =========================================================================================

-- Drop the old one just to keep schema clean (optional, but good practice if we're replacing it)
DROP FUNCTION IF EXISTS public.apply_approved_post_census_submission(uuid);

-- Create the new enhanced RPC
CREATE OR REPLACE FUNCTION public.approve_post_census_submission(
  p_submission_id uuid,
  p_abolition_post_ids uuid[] DEFAULT ARRAY[]::uuid[]
)
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
  v_vacant_check uuid;
  v_post_id uuid;
  v_post_record RECORD;
  v_census_item_id uuid;
  v_matched_count int;
BEGIN
  -- 1. Verify Caller Authority
  v_caller_id := NULLIF(current_setting('request.jwt.claims', true)::jsonb->>'sub', '')::uuid;
  IF v_caller_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: Caller ID not found in JWT claims.';
  END IF;

  -- 2. Lock submission row FOR UPDATE
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

  -- 3. Verify submission is in an approvable state
  -- We allow transitioning from SUBMITTED directly to COMMITTED in one atomic operation
  -- (or APPROVED to COMMITTED if the front-end marks it APPROVED first, but doing it atomic is better).
  IF v_submission.status NOT IN ('SUBMITTED', 'APPROVED') THEN
    RAISE EXCEPTION 'Cannot approve and commit submission in % status. Must be SUBMITTED or APPROVED.', v_submission.status;
  END IF;

  -- Clear any previously saved abolition selections for this submission to ensure strict idempotency
  DELETE FROM public.post_census_abolition_selections WHERE submission_id = p_submission_id;

  -- 4. Validate and Insert Abolition Selections
  FOREACH v_post_id IN ARRAY p_abolition_post_ids LOOP
    -- Lock and verify the selected post
    SELECT p.* INTO v_post_record
    FROM public.posts p
    WHERE p.id = v_post_id FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Post % does not exist', v_post_id;
    END IF;

    -- Verify post matches tenant and office
    IF v_post_record.tenant_id != v_submission.tenant_id THEN
      RAISE EXCEPTION 'Cross-tenant post % cannot be selected for abolition.', v_post_id;
    END IF;
    IF v_post_record.office_id != v_submission.office_id THEN
      RAISE EXCEPTION 'Post % does not belong to the submission office.', v_post_id;
    END IF;

    -- Verify post is ACTIVE and currently effective
    IF v_post_record.status != 'ACTIVE' THEN
      RAISE EXCEPTION 'Post % is not ACTIVE.', v_post_id;
    END IF;
    IF v_post_record.effective_from > CURRENT_DATE OR (v_post_record.effective_to IS NOT NULL AND v_post_record.effective_to <= CURRENT_DATE) THEN
      RAISE EXCEPTION 'Post % is not currently effective.', v_post_id;
    END IF;

    -- Verify post is strictly VACANT (no active substantive posting)
    -- Using the exact schema of employee_postings
    IF EXISTS (
      SELECT 1 FROM public.employee_postings ep 
      WHERE ep.substantive_post_id = v_post_id
        AND ep.status = 'ACTIVE'
        AND ep.posting_nature = 'SUBSTANTIVE'
        AND ep.effective_from <= CURRENT_DATE
        AND (ep.effective_to IS NULL OR CURRENT_DATE < ep.effective_to)
    ) THEN
      RAISE EXCEPTION 'Occupied post % cannot be abolished.', v_post_id;
    END IF;

    -- Find matching census item
    SELECT id INTO v_census_item_id
    FROM public.post_census_items ci
    WHERE ci.submission_id = p_submission_id
      AND ci.designation_id = v_post_record.designation_id
      AND ci.subject_id IS NOT DISTINCT FROM v_post_record.subject_id
      AND ci.post_nature_id = v_post_record.post_nature_id;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Post % has designation/subject that does not match any item in this census submission.', v_post_id;
    END IF;

    -- Insert row into public.post_census_abolition_selections
    INSERT INTO public.post_census_abolition_selections (
      tenant_id, submission_id, census_item_id, post_id, selected_by, selected_at, remarks
    ) VALUES (
      v_submission.tenant_id, p_submission_id, v_census_item_id, v_post_id, v_caller_id, now(), 'Atomic approval abolition'
    );
  END LOOP;

  -- 5. Execute Census Commit Logic
  FOR v_item IN (
    SELECT * FROM public.post_census_items WHERE submission_id = p_submission_id
  ) LOOP
    -- Calculate active physical posts for this specific item configuration
    SELECT count(*) INTO v_current_active_count
    FROM public.posts p
    WHERE p.office_id = v_submission.office_id
      AND p.designation_id = v_item.designation_id
      AND p.subject_id IS NOT DISTINCT FROM v_item.subject_id
      AND p.post_nature_id = v_item.post_nature_id
      AND p.status = 'ACTIVE'
      AND p.deleted_at IS NULL
      AND p.effective_from <= CURRENT_DATE
      AND (p.effective_to IS NULL OR CURRENT_DATE < p.effective_to);

    IF v_item.sanctioned_count > v_current_active_count THEN
      -- INCREASE: Create new posts
      v_new_rows_needed := v_item.sanctioned_count - v_current_active_count;
      
      FOR i IN 1..v_new_rows_needed LOOP
        -- Next serial for the office/designation combination
        SELECT COALESCE(MAX(designation_serial), 0) + 1 INTO v_next_serial
        FROM public.posts
        WHERE office_id = v_submission.office_id 
          AND designation_id = v_item.designation_id;

        INSERT INTO public.posts (
          tenant_id,
          office_id,
          post_code,
          post_title,
          designation_serial,
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
      
      -- Verify selection count matches EXACTLY what was inserted
      SELECT COUNT(*) INTO v_matched_count 
      FROM public.post_census_abolition_selections 
      WHERE census_item_id = v_item.id;

      IF v_matched_count != v_abolish_rows_needed THEN
        RAISE EXCEPTION 'Abolition selection count mismatch for item %. Required reduction: %, Provided: %', 
          v_item.id, v_abolish_rows_needed, v_matched_count;
      END IF;

      -- Apply abolition for the selected posts
      FOR v_post_id IN (
        SELECT post_id FROM public.post_census_abolition_selections WHERE census_item_id = v_item.id
      ) LOOP
        UPDATE public.posts 
        SET 
          status = 'ABOLISHED',
          effective_to = CURRENT_DATE,
          abolished_by = v_caller_id,
          abolished_at = now(),
          abolition_reason = 'Abolished during census approval'
        WHERE id = v_post_id;
        
        v_abolished_ids := array_append(v_abolished_ids, v_post_id);
      END LOOP;
    END IF;
  END LOOP;

  -- 6. Commit the submission
  UPDATE public.post_census_submissions
  SET 
    status = 'COMMITTED',
    approved_by = v_caller_id,
    approved_at = now(),
    updated_at = now(),
    updated_by = v_caller_id
  WHERE id = p_submission_id;

  -- 7. Write to audit logs
  INSERT INTO public.audit_logs (
    tenant_id, user_id, action, entity_type, entity_id, new_data
  ) VALUES (
    v_submission.tenant_id,
    v_caller_id,
    'COMMIT',
    'POST_CENSUS_SUBMISSION',
    p_submission_id,
    jsonb_build_object(
      'created_posts', v_created_ids,
      'abolished_posts', v_abolished_ids
    )
  );

  -- Return structured JSON
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Post Census successfully approved and physical posts created/abolished.',
    'submission_id', p_submission_id,
    'posts_created', array_length(v_created_ids, 1),
    'posts_abolished', array_length(v_abolished_ids, 1)
  );
END;
$$;

-- Permissions
REVOKE EXECUTE ON FUNCTION public.approve_post_census_submission(uuid, uuid[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.approve_post_census_submission(uuid, uuid[]) TO authenticated;
