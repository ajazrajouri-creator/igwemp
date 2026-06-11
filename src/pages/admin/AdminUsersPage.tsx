import React from 'react';
import { useUsers } from '../../hooks/queries/useIdentity';
import { UserPlus, Search, Filter } from 'lucide-react';

export function AdminUsersPage() {
  const { data: users, isLoading } = useUsers();

  if (isLoading) return <div className="p-8 text-ink-muted">Loading users...</div>;

  return (
    <div className="space-y-6 animate-enter">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink-primary">User Accounts</h1>
          <p className="text-sm text-ink-muted">Manage system identities, authentication access, and statuses.</p>
        </div>
        <button className="btn-primary btn-sm">
          <UserPlus size={16} /> New User Account
        </button>
      </div>

      <div className="flex gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-disabled" size={16} />
          <input 
            type="text" 
            placeholder="Search by username or party name..." 
            className="w-full pl-9 pr-4 py-2 bg-surface-2 border border-surface-4 rounded-lg focus:outline-none focus:border-brand/50 text-sm"
          />
        </div>
        <button className="btn-ghost btn-sm border border-surface-4">
          <Filter size={16} /> Filter
        </button>
      </div>

      <div className="card p-0 overflow-hidden border-surface-4">
        <table className="w-full text-left text-sm">
          <thead className="bg-surface-2 border-b border-surface-4 text-ink-secondary">
            <tr>
              <th className="px-6 py-3 font-medium">Username</th>
              <th className="px-6 py-3 font-medium">Linked Party (Person)</th>
              <th className="px-6 py-3 font-medium">Status</th>
              <th className="px-6 py-3 font-medium">Last Login</th>
              <th className="px-6 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-4">
            {users?.map((u) => (
              <tr key={u.id} className="hover:bg-surface-2/50 transition-colors">
                <td className="px-6 py-4 font-medium text-ink-primary">{u.username || 'Unassigned'}</td>
                <td className="px-6 py-4 text-ink-secondary">
                  {u.party ? (
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-brand/10 text-brand flex items-center justify-center text-xs font-bold">
                        {u.party.first_name?.[0] || 'U'}
                      </div>
                      <span>{u.party.first_name} {u.party.last_name}</span>
                    </div>
                  ) : (
                    <span className="text-ink-disabled italic">No Party Linked</span>
                  )}
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    u.status === 'ACTIVE' ? 'bg-green-500/10 text-green-500' :
                    u.status === 'LOCKED' ? 'bg-red-500/10 text-red-500' :
                    'bg-surface-4 text-ink-muted'
                  }`}>
                    {u.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-ink-secondary">
                  {u.last_login_at ? new Date(u.last_login_at).toLocaleDateString() : 'Never'}
                </td>
                <td className="px-6 py-4 text-right">
                  <button className="btn-ghost btn-sm text-brand hover:text-brand-light">Manage</button>
                </td>
              </tr>
            ))}
            {(!users || users.length === 0) && (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-ink-muted">
                  No users found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
