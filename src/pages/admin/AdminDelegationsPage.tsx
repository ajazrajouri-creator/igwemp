import { useDelegations } from '../../hooks/queries/useDelegations';
import { Plus, ArrowRightLeft } from 'lucide-react';

export function AdminDelegationsPage() {
  const { data: delegations, isLoading } = useDelegations();

  if (isLoading) return <div className="p-8 text-ink-muted">Loading delegations...</div>;

  return (
    <div className="space-y-6 animate-enter">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink-primary">Delegations of Authority</h1>
          <p className="text-sm text-ink-muted">Manage temporary power delegations between users.</p>
        </div>
        <button className="btn-primary btn-sm">
          <Plus size={16} /> New Delegation
        </button>
      </div>

      <div className="card p-0 overflow-hidden border-surface-4">
        <table className="w-full text-left text-sm">
          <thead className="bg-surface-2 border-b border-surface-4 text-ink-secondary">
            <tr>
              <th className="px-6 py-3 font-medium">Delegation Route</th>
              <th className="px-6 py-3 font-medium">Type</th>
              <th className="px-6 py-3 font-medium">Status</th>
              <th className="px-6 py-3 font-medium">Period</th>
              <th className="px-6 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-4">
            {delegations?.map((doa) => (
              <tr key={doa.id} className="hover:bg-surface-2/50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <span className="font-medium text-ink-primary">{doa.delegator?.username || 'Unknown'}</span>
                    <ArrowRightLeft size={14} className="text-brand-muted" />
                    <span className="font-medium text-ink-primary">{doa.delegate?.username || 'Unknown'}</span>
                  </div>
                  {doa.scopes && doa.scopes.length > 0 && (
                    <div className="mt-1 text-[10px] text-ink-secondary">
                      {doa.scopes.length} custom scope(s)
                    </div>
                  )}
                </td>
                <td className="px-6 py-4">
                  <span className="px-2 py-1 bg-surface-3 rounded text-xs font-mono text-ink-secondary">
                    {doa.delegation_type}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    doa.status === 'ACTIVE' ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 
                    doa.status === 'PENDING' ? 'bg-yellow-500/10 text-yellow-600 border border-yellow-500/20' : 
                    'bg-surface-4 text-ink-muted'
                  }`}>
                    {doa.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-xs text-ink-secondary">
                  <div>{new Date(doa.effective_from).toLocaleDateString()} to</div>
                  <div>{new Date(doa.effective_to).toLocaleDateString()}</div>
                </td>
                <td className="px-6 py-4 text-right">
                  <button className="btn-ghost btn-sm text-brand hover:text-brand-light">Review</button>
                </td>
              </tr>
            ))}
            {(!delegations || delegations.length === 0) && (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-ink-muted">
                  No active delegations found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
