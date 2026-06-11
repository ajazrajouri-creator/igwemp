console.log('--- IGWEMP SERVER-SIDE BULK IMPORT PIPELINE DEMONSTRATION ---');
console.log('Simulating CSV Upload -> Document parsing -> Edge Function Execution');

const rawCsvRows = [
  { row: 1, emp_code: 'NEW001', name: 'Valid Employee', cadre: 'TEACHER', dob: '1990-01-01' },
  { row: 2, emp_code: 'EXISTING01', name: 'Duplicate Code', cadre: 'MASTER', dob: '1985-05-12' },
  { row: 3, emp_code: 'NEW002', name: 'Invalid Cadre Demo', cadre: 'UNKNOWN_CADRE_TYPE', dob: '1992-08-20' },
  { row: 4, emp_code: 'NEW003', name: 'Missing Field', cadre: 'TEACHER', dob: '' }, // Missing mandatory DOB
  { row: 5, emp_code: 'EMP_REQ_CHANGE', name: 'Existing Valid Employee', cadre: 'PRINCIPAL', dob: '1980-11-11' }
];

// Mock Database State
const dbState = {
  existingCodes: ['EXISTING01', 'EMP_REQ_CHANGE'],
  validCadres: ['TEACHER', 'MASTER', 'PRINCIPAL']
};

let valid_rows = 0;
let invalid_rows = 0;
let duplicate_rows = 0;

const processedRows = rawCsvRows.map(row => {
  const errors = [];
  
  // 1. Mandatory Field Check
  if (!row.emp_code || !row.name || !row.cadre || !row.dob) {
    errors.push('Missing mandatory field (emp_code, name, cadre, or dob)');
  }
  
  // 2. Invalid Master Data Category Check
  if (!dbState.validCadres.includes(row.cadre)) {
    errors.push('Invalid CADRE reference');
  }

  // 3. Duplicate Code Check
  if (dbState.existingCodes.includes(row.emp_code) && row.emp_code !== 'EMP_REQ_CHANGE') {
    errors.push('Duplicate employee code detected. Use Change Request for existing records.');
  }

  // 4. Existing Employee requiring Change Request
  if (row.emp_code === 'EMP_REQ_CHANGE') {
    // Simulated valid flow for creating a change request instead of blind overwrite
    errors.push('Existing employee matched. Workflow-backed change request will be generated.');
    duplicate_rows++;
    invalid_rows++; // We classify it as invalid for direct blind insert, requires workflow
  } else if (errors.length > 0) {
    invalid_rows++;
  } else {
    valid_rows++;
  }

  return { ...row, errors, status: errors.length > 0 ? 'INVALID' : 'VALID' };
});

console.log('\n[BATCH SUMMARY]');
console.log(`Total Rows: ${rawCsvRows.length}`);
console.log(`Valid Rows: ${valid_rows}`);
console.log(`Invalid Rows: ${invalid_rows}`);
console.log(`Duplicate Rows: ${duplicate_rows}`);

console.log('\n[ROW LEVEL OUTCOMES]');
processedRows.forEach(r => {
  console.log(`Row #${r.row} [${r.emp_code}]: ${r.status}`);
  if (r.errors.length > 0) console.log(`  -> Errors: ${r.errors.join(', ')}`);
});
