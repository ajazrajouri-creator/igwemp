import React from 'react';
import { useTenants } from '../../hooks/queries/useTenants';
import { Plus } from 'lucide-react';

export function AdminOrganizationsPage() {
  const { data: tenants, isLoading } = useTenants();

  if (isLoading) return <div className="text-ink-muted">Loading organizations...</div>;

  return (
    <div className="space-y-6 animate-enter">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink-primary">Organizations</h1>
          <p className="text-sm text-ink-muted">Manage platform tenants and departments.</p>
        </div>
        <button className="btn-primary btn-sm">
          <Plus size={16} /> New Organization
        </button>
      </div>

      <div className="card p-0 overflow-hidden border-surface-4">
        <table className="w-full text-left text-sm">
          <thead className="bg-surface-2 border-b border-surface-4 text-ink-secondary">
            <tr>
              <th className="px-6 py-3 font-medium">Code</th>
              <th className="px-6 py-3 font-medium">Name</th>
              <th className="px-6 py-3 font-medium">Status</th>
              <th className="px-6 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-4">
            {tenants?.map((t) => (
              <tr key={t.tenant_id} className="hover:bg-surface-2/50 transition-colors">
                <td className="px-6 py-4 font-medium text-ink-primary">{t.tenant_code}</td>
                <td className="px-6 py-4 text-ink-secondary">{t.tenant_name}</td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    t.is_active ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-surface-4 text-ink-muted'
                  }`}>
                    {t.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <button className="btn-ghost btn-sm">Configure</button>
                </td>
              </tr>
            ))}
            {(!tenants || tenants.length === 0) && (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-ink-muted">
                  No organizations found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
