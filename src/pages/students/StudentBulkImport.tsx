import React, { useState } from 'react';
import { ArrowLeft, Upload, FileType, CheckCircle, AlertCircle, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Papa from 'papaparse';
import { csvRowSchema } from '../../lib/validations/students';

export const StudentBulkImport = () => {
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<{data: any, valid: boolean, errors: string[]}[]>([]);
  const [isImporting, setIsImporting] = useState(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      Papa.parse(selectedFile, {
        header: true,
        skipEmptyLines: true,
        complete: (results: any) => {
          const validated = results.data.map((row: any) => {
            if (Object.keys(row).some(k => k.toLowerCase().includes('aadhaar'))) {
              return { data: row, valid: false, errors: ['Aadhaar column is strictly prohibited'] };
            }
            const res = csvRowSchema.safeParse(row);
            if (!res.success) {
              return { data: row, valid: false, errors: res.error.issues.map((e: any) => e.message) };
            }
            return { data: res.data, valid: true, errors: [] };
          });
          setParsedRows(validated);
        }
      });
    }
  };

  const handleImport = async () => {
    const validRows = parsedRows.filter(r => r.valid);
    if (validRows.length === 0) return;
    
    setIsImporting(true);
    // Simulate API call for bulk insert
    setTimeout(() => {
      setIsImporting(false);
      navigate('/students');
    }, 1500);
  };

  const validCount = parsedRows.filter(r => r.valid).length;
  const errorCount = parsedRows.filter(r => !r.valid).length;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 animate-enter">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => navigate('/students')} className="btn-ghost p-2 h-10 w-10">
          <ArrowLeft className="h-5 w-5 text-ink-muted" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-ink-primary">Bulk Import Students</h1>
          <p className="text-sm text-ink-muted">Upload a CSV file to batch enroll students for the current session.</p>
        </div>
      </div>

      <div className="card p-6 mb-6 border-surface-4">
        <div className="border-2 border-dashed border-surface-4 rounded-lg p-8 text-center bg-surface-2 relative hover:bg-surface-3 transition-colors">
          <input
            type="file"
            accept=".csv"
            onChange={handleFileUpload}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          <FileType className="h-10 w-10 text-ink-muted mx-auto mb-3" />
          <p className="text-sm font-medium text-ink-primary">Click or drag CSV file to upload</p>
          <p className="text-xs text-ink-muted mt-1">Expected headers: student_name, admission_no, date_of_birth, gender, class, etc.</p>
          <p className="text-xs text-red-500 font-medium mt-2">Do NOT include Aadhaar numbers.</p>
        </div>
        
        {file && (
          <div className="mt-4 flex items-center justify-between p-3 bg-surface-1 border border-surface-4 rounded-md">
            <div className="flex items-center gap-3">
              <FileType className="h-5 w-5 text-brand-500" />
              <span className="text-sm font-medium text-ink-primary">{file.name}</span>
            </div>
            <button onClick={() => { setFile(null); setParsedRows([]); }} className="text-red-500 hover:bg-red-50 p-2 rounded-md">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {parsedRows.length > 0 && (
        <div className="card p-0 overflow-hidden border-surface-4">
          <div className="p-4 bg-surface-2 border-b border-surface-4 flex justify-between items-center">
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span className="text-sm font-medium text-ink-primary">{validCount} Valid</span>
              </div>
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-red-500" />
                <span className="text-sm font-medium text-ink-primary">{errorCount} Errors</span>
              </div>
            </div>
            <button 
              className="btn-primary"
              onClick={handleImport} 
              disabled={validCount === 0 || isImporting}
            >
              <Upload className="h-4 w-4 mr-2" />
              {isImporting ? 'Importing...' : `Import ${validCount} Valid Rows`}
            </button>
          </div>
          
          <div className="overflow-x-auto max-h-[500px]">
            <table className="w-full text-left text-sm">
              <thead className="bg-surface-2 border-b border-surface-4 text-ink-secondary sticky top-0">
                <tr>
                  <th className="px-6 py-3 font-medium">Status</th>
                  <th className="px-6 py-3 font-medium">Name</th>
                  <th className="px-6 py-3 font-medium">Adm No</th>
                  <th className="px-6 py-3 font-medium">Class</th>
                  <th className="px-6 py-3 font-medium">DOB</th>
                  <th className="px-6 py-3 font-medium">Details / Errors</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-4">
                {parsedRows.map((row, idx) => (
                  <tr key={idx} className={row.valid ? 'hover:bg-surface-2/50' : 'bg-red-50/50 hover:bg-red-50'}>
                    <td className="px-6 py-4">
                      {row.valid ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-green-500/10 text-green-500 border border-green-500/20">Valid</span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-red-500/10 text-red-500 border border-red-500/20">Error</span>
                      )}
                    </td>
                    <td className="px-6 py-4 font-medium text-ink-primary">
                      {row.data.student_name || '-'}
                    </td>
                    <td className="px-6 py-4 text-ink-secondary">
                      {row.data.admission_no || '-'}
                    </td>
                    <td className="px-6 py-4 text-ink-secondary">
                      {row.data.class || '-'}
                    </td>
                    <td className="px-6 py-4 text-ink-secondary">
                      {row.data.date_of_birth || '-'}
                    </td>
                    <td className="px-6 py-4">
                      {!row.valid && (
                        <ul className="list-disc list-inside text-red-600 text-xs">
                          {row.errors.map((e, i) => <li key={i}>{e}</li>)}
                        </ul>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
