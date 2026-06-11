import React from 'react';
import { useCases } from '../../hooks/queries/useCases';
import { Briefcase, AlertCircle, ChevronRight, Filter } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function CasesListPage() {
  const { data: cases, isLoading } = useCases();
  const navigate = useNavigate();

  if (isLoading) return <div className="p-4 sm:p-8 text-ink-muted">Loading cases...</div>;

  return (
    <div className="space-y-4 sm:space-y-6 animate-enter">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-ink-primary">Governance Cases</h1>
          <p className="text-xs sm:text-sm text-ink-muted">Track the lifecycle of actionable tasks, verifications, and approvals.</p>
        </div>
        <button className="btn-secondary btn-sm self-start sm:self-auto flex items-center gap-2">
          <Filter size={16} /> Filter
        </button>
      </div>

      <div className="card p-0 overflow-hidden border-surface-4">
        {/* Desktop Table */}
        <table className="hidden sm:table w-full text-left text-sm">
          <thead className="bg-surface-2 border-b border-surface-4 text-ink-secondary">
            <tr>
              <th className="px-6 py-3 font-medium">Case ID</th>
              <th className="px-6 py-3 font-medium">Type</th>
              <th className="px-6 py-3 font-medium">Current State</th>
              <th className="px-6 py-3 font-medium">Due Date</th>
              <th className="px-6 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-4">
            {cases?.map(c => (
              <tr key={c.id} className="hover:bg-surface-2/50 transition-colors cursor-pointer" onClick={() => navigate(`/cases/${c.id}`)}>
                <td className="px-6 py-4">
                  <div className="font-mono text-xs text-brand flex items-center gap-2">
                    <Briefcase size={14} />
                    {c.id.substring(0, 8).toUpperCase()}
                  </div>
                  {c.parent_order && (
                    <div className="text-[10px] text-ink-muted mt-1 truncate max-w-[150px]">
                      Ord: {c.parent_order.order_number}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 text-ink-primary font-medium">{c.case_type?.name}</td>
                <td className="px-6 py-4 text-ink-secondary">
                  <span className="bg-surface-3 px-2 py-1 rounded text-xs">
                    {c.current_state?.name || 'Uninitialized'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  {c.due_date ? (
                    <div className={`text-xs ${new Date(c.due_date) < new Date() ? 'text-red-500 font-bold flex items-center gap-1' : 'text-ink-secondary'}`}>
                      {new Date(c.due_date) < new Date() && <AlertCircle size={12} />}
                      {new Date(c.due_date).toLocaleDateString()}
                    </div>
                  ) : <span className="text-ink-disabled italic">No deadline</span>}
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-[10px] sm:text-xs font-medium ${
                    c.status === 'CLOSED' ? 'bg-green-500/10 text-green-500' :
                    c.status === 'ESCALATED' ? 'bg-red-500/10 text-red-500' :
                    c.status === 'IN_PROGRESS' ? 'bg-blue-500/10 text-blue-500' :
                    'bg-surface-4 text-ink-muted'
                  }`}>
                    {c.status}
                  </span>
                </td>
              </tr>
            ))}
            {(!cases || cases.length === 0) && (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-ink-muted">
                  No cases found.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Mobile Card List */}
        <div className="sm:hidden flex flex-col divide-y divide-surface-4">
          {cases?.map(c => (
            <div 
              key={c.id} 
              className="p-4 active:bg-surface-2 transition-colors cursor-pointer"
              onClick={() => navigate(`/cases/${c.id}`)}
            >
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                  <Briefcase size={14} className="text-brand" />
                  <span className="font-mono text-xs font-bold text-brand">{c.id.substring(0, 8).toUpperCase()}</span>
                </div>
                <span className={`px-2 py-1 rounded-full text-[10px] font-medium ${
                  c.status === 'CLOSED' ? 'bg-green-500/10 text-green-500' :
                  c.status === 'ESCALATED' ? 'bg-red-500/10 text-red-500' :
                  c.status === 'IN_PROGRESS' ? 'bg-blue-500/10 text-blue-500' :
                  'bg-surface-4 text-ink-muted'
                }`}>
                  {c.status}
                </span>
              </div>
              <div className="font-medium text-ink-primary text-sm mb-1">{c.case_type?.name}</div>
              <div className="flex justify-between items-end mt-3">
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] text-ink-secondary bg-surface-3 px-2 py-0.5 rounded w-max">
                    {c.current_state?.name || 'Uninitialized'}
                  </span>
                  {c.due_date && (
                    <div className={`text-[10px] ${new Date(c.due_date) < new Date() ? 'text-red-500 font-bold flex items-center gap-1' : 'text-ink-secondary'}`}>
                      {new Date(c.due_date) < new Date() && <AlertCircle size={10} />}
                      Due: {new Date(c.due_date).toLocaleDateString()}
                    </div>
                  )}
                </div>
                <ChevronRight size={16} className="text-ink-disabled" />
              </div>
            </div>
          ))}
          {(!cases || cases.length === 0) && (
            <div className="p-8 text-center text-ink-muted text-sm">
              No cases found.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
