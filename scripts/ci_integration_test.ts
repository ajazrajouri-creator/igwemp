const SUPABASE_URL = process.env.SUPABASE_URL || 'http://127.0.0.1:54321';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'test-anon-key';

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
    const response = await fetch(`${SUPABASE_URL}/functions/v1/employee-import`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({
        batch_id: '00000000-0000-0000-0000-000000000000',
        rows: rawCsvRows,
        existingCodes: ['EXISTING01', 'EMP_REQ_CHANGE'],
        validCadres: ['TEACHER', 'MASTER', 'PRINCIPAL']
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error(`Edge function failed with status ${response.status}:`, errText);
      process.exit(1);
    }

    const data = await response.json();
    console.log('Edge function response:', JSON.stringify(data, null, 2));
    console.log('CI Integration test completed successfully!');
  } catch (err) {
    console.error('Error hitting edge function:', err);
    process.exit(1);
  }
}

runTest();
