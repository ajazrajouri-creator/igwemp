import { useResponsibilityTypes, usePersonResponsibilities } from '../../hooks/queries/useResponsibilities';
import { Plus, Award } from 'lucide-react';

export function AdminResponsibilitiesPage() {
  const { data: types, isLoading: loadingTypes } = useResponsibilityTypes();
  const { data: responsibilities, isLoading: loadingResp } = usePersonResponsibilities();

  if (loadingTypes || loadingResp) return <div className="p-8 text-ink-muted">Loading responsibilities...</div>;

  return (
    <div className="space-y-6 animate-enter">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink-primary">Responsibilities</h1>
          <p className="text-sm text-ink-muted">Manage additional duties, charges, and role-agnostic assignments.</p>
        </div>
        <div className="flex gap-2">
          <button className="btn-ghost btn-sm border border-surface-4">
            New Type
          </button>
          <button className="btn-primary btn-sm">
            <Plus size={16} /> Assign Responsibility
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-1 space-y-4">
          <h2 className="text-lg font-semibold text-ink-primary px-1">Types</h2>
          <div className="card p-0 overflow-hidden border-surface-4">
            <div className="divide-y divide-surface-4">
              {types?.map(type => (
                <div key={type.id} className="p-3 hover:bg-surface-2 transition-colors flex justify-between items-center">
                  <div>
                    <div className="font-medium text-sm text-ink-primary flex items-center gap-2">
                      <Award size={14} className="text-brand-muted" />
                      {type.name}
                    </div>
                    <div className="text-[10px] text-ink-muted font-mono mt-1">{type.code}</div>
                  </div>
                  {type.is_exclusive && (
                    <span className="text-[10px] bg-red-500/10 text-red-500 px-1.5 py-0.5 rounded uppercase font-bold tracking-wider">
                      Exclusive
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="col-span-2 space-y-4">
          <h2 className="text-lg font-semibold text-ink-primary px-1">Active Assignments</h2>
          <div className="card p-0 overflow-hidden border-surface-4">
            <table className="w-full text-left text-sm">
              <thead className="bg-surface-2 border-b border-surface-4 text-ink-secondary">
                <tr>
                  <th className="px-6 py-3 font-medium">Person ID</th>
                  <th className="px-6 py-3 font-medium">Responsibility</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                  <th className="px-6 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-4">
                {responsibilities?.map((resp) => (
                  <tr key={resp.id} className="hover:bg-surface-2/50 transition-colors">
                    <td className="px-6 py-4 font-mono text-xs text-ink-secondary">
                      {resp.person_id.substring(0, 8)}...
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-ink-primary">{resp.responsibility_type?.name}</div>
                      <div className="text-xs text-ink-muted mt-0.5">Priority: {resp.priority}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        resp.status === 'ACTIVE' ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 
                        'bg-surface-4 text-ink-muted'
                      }`}>
                        {resp.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="btn-ghost btn-sm text-brand hover:text-brand-light">Manage</button>
                    </td>
                  </tr>
                ))}
                {(!responsibilities || responsibilities.length === 0) && (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-ink-muted">
                      No active responsibilities found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
