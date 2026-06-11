import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || 'http://127.0.0.1:54321';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'test-anon-key';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function runTest() {
  console.log('--- CI EDGE FUNCTION INTEGRATION TEST ---');
  
  const rawCsvRows = [
    { emp_code: 'NEW001', name: 'Valid Employee', cadre: 'TEACHER', dob: '1990-01-01' },
    { emp_code: 'EXISTING01', name: 'Duplicate Code', cadre: 'MASTER', dob: '1985-05-12' },
    { emp_code: 'NEW002', name: 'Invalid Cadre Demo', cadre: 'UNKNOWN_CADRE_TYPE', dob: '1992-08-20' },
    { emp_code: 'NEW003', name: 'Missing Field', cadre: 'TEACHER', dob: '' },
    { emp_code: 'EMP_REQ_CHANGE', name: 'Existing Valid Employee', cadre: 'PRINCIPAL', dob: '1980-11-11' }
  ];

  try {
    const { data, error } = await supabase.functions.invoke('employee-import', {
      body: {
        batch_id: '00000000-0000-0000-0000-000000000000',
        rows: rawCsvRows,
        existingCodes: ['EXISTING01', 'EMP_REQ_CHANGE'],
        validCadres: ['TEACHER', 'MASTER', 'PRINCIPAL']
      }
    });

    if (error) {
      console.error('Edge function failed:', error);
      process.exit(1);
    }

    console.log('Edge function response:', JSON.stringify(data, null, 2));
    console.log('CI Integration test completed successfully!');
  } catch (err) {
    console.error('Error hitting edge function:', err);
    process.exit(1);
  }
}

runTest();
