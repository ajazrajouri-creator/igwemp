import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req: Request) => {
  const { batch_id, rows, existingCodes, validCadres } = await req.json()
  
  // Connect to Supabase
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  let valid_rows = 0;
  let invalid_rows = 0;
  let duplicate_rows = 0;

  const processedRows = rows.map((row: any, index: number) => {
    const errors = [];
    
    if (!row.emp_code || !row.name || !row.cadre || !row.dob) {
      errors.push('Missing mandatory field (emp_code, name, cadre, or dob)');
    }
    if (!validCadres.includes(row.cadre)) {
      errors.push('Invalid CADRE reference');
    }
    if (existingCodes.includes(row.emp_code) && row.emp_code !== 'EMP_REQ_CHANGE') {
      errors.push('Duplicate employee code detected. Use Change Request for existing records.');
    }
    if (row.emp_code === 'EMP_REQ_CHANGE') {
      errors.push('Existing employee matched. Workflow-backed change request will be generated.');
      duplicate_rows++;
      invalid_rows++;
    } else if (errors.length > 0) {
      invalid_rows++;
    } else {
      valid_rows++;
    }

    return { row_number: index + 1, raw_input: row, validation_errors: errors, import_status: errors.length > 0 ? 'INVALID' : 'VALID' };
  });

  // Update Batch Status
  await supabase.from('employee_import_batches').update({
    batch_status: 'VALIDATED',
    total_rows: rows.length,
    valid_rows,
    invalid_rows,
    duplicate_rows,
    validation_completed_at: new Date().toISOString()
  }).eq('id', batch_id);

  // Insert Rows
  await supabase.from('employee_import_rows').insert(
    processedRows.map(r => ({
      batch_id,
      row_number: r.row_number,
      raw_input: r.raw_input,
      validation_errors: r.validation_errors,
      import_status: r.import_status
    }))
  );

  return new Response(JSON.stringify({ success: true, processedRows }), { headers: { "Content-Type": "application/json" } })
})
