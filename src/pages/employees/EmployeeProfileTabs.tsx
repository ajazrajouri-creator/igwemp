import { Settings,   Award, Shield, FileText } from 'lucide-react';

export function EmployeePostingTimeline({ postings }: { postings: any[] }) {
  if (!postings || postings.length === 0) {
    return <div className="text-sm text-ink-muted text-center py-8">No posting history available.</div>;
  }
  return (
    <div className="space-y-4">
      {postings.map(p => (
        <div key={p.id} className="p-4 border border-surface-4 rounded-lg bg-surface-1">
          <div className="flex justify-between items-start mb-2">
            <div className="font-bold text-ink-primary text-sm">{p.office?.office_name}</div>
            <span className={`text-[10px] px-2 py-0.5 rounded-full ${p.status === 'ACTIVE' ? 'bg-green-500/10 text-green-500' : 'bg-surface-4 text-ink-muted'}`}>
              {p.status}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div><span className="text-ink-muted">Nature:</span> {p.posting_nature}</div>
            <div><span className="text-ink-muted">From:</span> {p.effective_from}</div>
            <div><span className="text-ink-muted">To:</span> {p.effective_to || 'Present'}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function EmployeeWorkingArrangements() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[30vh] text-ink-muted">
      <Settings size={32} className="mb-4 opacity-50" />
      <p className="text-sm">Working arrangements configuration is under development.</p>
    </div>
  );
}

export function EmployeeQualifications() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[30vh] text-ink-muted">
      <Award size={32} className="mb-4 opacity-50" />
      <p className="text-sm">Qualifications timeline is under development.</p>
    </div>
  );
}

export function EmployeeResponsibilities() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[30vh] text-ink-muted">
      <Shield size={32} className="mb-4 opacity-50" />
      <p className="text-sm">Active responsibilities view is under development.</p>
    </div>
  );
}

export function EmployeeDocuments() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[30vh] text-ink-muted">
      <FileText size={32} className="mb-4 opacity-50" />
      <p className="text-sm">Document vault is under development.</p>
    </div>
  );
}
