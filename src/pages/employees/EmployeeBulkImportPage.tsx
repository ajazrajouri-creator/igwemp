import React, { useState } from 'react';
import { Upload, FileUp, CheckCircle, AlertCircle, X, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function EmployeeBulkImportPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<'UPLOAD' | 'DRY_RUN' | 'COMMITTED'>('UPLOAD');
  
  // Mock Data
  const mockRows = [
    { row: 2, code: 'EMP1023', name: 'Abdul Majid', status: 'VALID', errors: [] },
    { row: 3, code: 'EMP1024', name: 'Farooq Ahmad', status: 'INVALID', errors: ['Designation ID not found in Master Data'] },
    { row: 4, code: 'EMP1025', name: 'Zahida Bano', status: 'INVALID', errors: ['Employee Code already exists. Requires Change Request.'] },
    { row: 5, code: 'EMP1026', name: 'Rameez Raja', status: 'VALID', errors: [] },
  ];

  return (
    <div className="space-y-4 sm:space-y-6 animate-enter max-w-5xl mx-auto">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-surface-3 rounded-lg text-ink-muted transition-colors">
          <ChevronRight className="rotate-180" size={18} />
        </button>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-ink-primary">Bulk Import Employees</h1>
          <p className="text-xs sm:text-sm text-ink-muted">Upload a spreadsheet to import or update employee records.</p>
        </div>
      </div>

      {step === 'UPLOAD' && (
        <div className="card p-8 sm:p-12 flex flex-col items-center justify-center border-dashed border-2 bg-surface-1">
          <div className="w-16 h-16 bg-brand/10 text-brand rounded-full flex items-center justify-center mb-4">
            <Upload size={24} />
          </div>
          <h3 className="text-lg font-bold text-ink-primary mb-2">Upload Excel or CSV</h3>
          <p className="text-sm text-ink-muted text-center max-w-md mb-6">
            Drag and drop your file here, or click to browse. Ensure you are using the latest version of the official template.
          </p>
          <div className="flex gap-4">
            <button className="btn-secondary btn-sm">Download Template</button>
            <button className="btn-primary btn-sm" onClick={() => setStep('DRY_RUN')}>Browse Files</button>
          </div>
        </div>
      )}

      {step === 'DRY_RUN' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="card bg-surface-2 p-4">
              <div className="text-xs text-ink-muted mb-1">Total Rows</div>
              <div className="text-2xl font-bold text-ink-primary">142</div>
            </div>
            <div className="card bg-green-500/10 border-green-500/20 p-4">
              <div className="text-xs text-green-600 mb-1">Ready to Commit</div>
              <div className="text-2xl font-bold text-green-500">140</div>
            </div>
            <div className="card bg-red-500/10 border-red-500/20 p-4">
              <div className="text-xs text-red-600 mb-1">Validation Errors</div>
              <div className="text-2xl font-bold text-red-500">2</div>
            </div>
          </div>

          <div className="card p-0 overflow-hidden border-surface-4">
            <div className="p-4 border-b border-surface-4 bg-surface-2 font-medium text-sm">Dry Run Results (Preview)</div>
            <table className="w-full text-left text-sm">
              <thead className="bg-surface-3 border-b border-surface-4 text-ink-secondary text-xs">
                <tr>
                  <th className="px-4 py-2 font-medium">Row</th>
                  <th className="px-4 py-2 font-medium">Emp Code</th>
                  <th className="px-4 py-2 font-medium">Name</th>
                  <th className="px-4 py-2 font-medium">Status</th>
                  <th className="px-4 py-2 font-medium">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-4">
                {mockRows.map(r => (
                  <tr key={r.row} className={r.status === 'INVALID' ? 'bg-red-500/5' : ''}>
                    <td className="px-4 py-3 text-ink-secondary">#{r.row}</td>
                    <td className="px-4 py-3 font-mono text-xs">{r.code}</td>
                    <td className="px-4 py-3 font-medium text-ink-primary">{r.name}</td>
                    <td className="px-4 py-3">
                      {r.status === 'VALID' ? (
                        <span className="flex items-center gap-1 text-green-500 text-xs font-bold"><CheckCircle size={14} /> Valid</span>
                      ) : (
                        <span className="flex items-center gap-1 text-red-500 text-xs font-bold"><AlertCircle size={14} /> Error</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-ink-muted">
                      {r.errors.map((e, i) => <div key={i} className="text-red-500">{e}</div>)}
                      {r.errors.length === 0 && <span className="text-green-500">Ready for insert</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-surface-4">
            <button className="btn-ghost" onClick={() => setStep('UPLOAD')}>Cancel</button>
            <button className="btn-secondary" onClick={() => alert('Download Error Report')}>Export Errors</button>
            <button className="btn-primary" onClick={() => setStep('COMMITTED')}>Commit Valid Rows (140)</button>
          </div>
        </div>
      )}

      {step === 'COMMITTED' && (
        <div className="card p-12 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center mb-4">
            <CheckCircle size={32} />
          </div>
          <h3 className="text-2xl font-bold text-ink-primary mb-2">Import Successful</h3>
          <p className="text-ink-muted max-w-sm mb-6">
            140 employee records have been successfully validated and imported into the system.
          </p>
          <button className="btn-primary" onClick={() => navigate('/employees')}>Return to Directory</button>
        </div>
      )}
    </div>
  );
}
