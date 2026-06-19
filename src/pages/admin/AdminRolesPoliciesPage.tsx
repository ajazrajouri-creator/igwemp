import { useRoles, usePolicies } from '../../hooks/queries/useRoles';
import {  Shield, KeyRound } from 'lucide-react';

export function AdminRolesPoliciesPage() {
  const { data: roles, isLoading: rolesLoading } = useRoles();
  const { data: policies, isLoading: policiesLoading } = usePolicies();

  if (rolesLoading || policiesLoading) return <div className="p-8 text-ink-muted">Loading roles & policies...</div>;

  return (
    <div className="space-y-6 animate-enter">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink-primary">Roles & Policies</h1>
          <p className="text-sm text-ink-muted">Define global roles and map action policies to them.</p>
        </div>
        <div className="flex gap-2">
          <button className="btn-ghost btn-sm border border-surface-4">
            <KeyRound size={16} /> New Policy
          </button>
          <button className="btn-primary btn-sm">
            <Shield size={16} /> New Role
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-1 space-y-4">
          <h2 className="text-lg font-semibold text-ink-primary px-1">Configured Roles</h2>
          <div className="space-y-2">
            {roles?.map((role) => (
              <div key={role.id} className="card p-4 hover:border-brand/30 cursor-pointer transition-colors">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-ink-primary">{role.name}</h3>
                  {role.is_system && (
                    <span className="bg-blue-500/10 text-blue-500 text-[10px] px-2 py-0.5 rounded-full uppercase font-bold tracking-wider">
                      System
                    </span>
                  )}
                </div>
                <p className="text-xs text-ink-secondary mb-3">{role.description}</p>
                <div className="text-xs font-mono text-ink-muted bg-surface-2 inline-block px-2 py-1 rounded">
                  Weight: {role.hierarchy_weight}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="col-span-2 space-y-4">
          <h2 className="text-lg font-semibold text-ink-primary px-1">Policy Matrix</h2>
          <div className="card p-0 overflow-hidden border-surface-4">
             <table className="w-full text-left text-sm">
               <thead className="bg-surface-2 border-b border-surface-4 text-ink-secondary">
                 <tr>
                   <th className="px-6 py-3 font-medium">Module</th>
                   <th className="px-6 py-3 font-medium">Action</th>
                   <th className="px-6 py-3 font-medium">Description</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-surface-4">
                 {policies?.map((policy) => (
                   <tr key={policy.id} className="hover:bg-surface-2/50 transition-colors">
                     <td className="px-6 py-3 font-medium text-ink-primary">
                       <span className="px-2 py-1 bg-surface-3 rounded text-xs uppercase tracking-wider">{policy.module}</span>
                     </td>
                     <td className="px-6 py-3 font-mono text-xs text-brand">{policy.action}</td>
                     <td className="px-6 py-3 text-ink-secondary text-xs">{policy.description}</td>
                   </tr>
                 ))}
                 {(!policies || policies.length === 0) && (
                    <tr>
                      <td colSpan={3} className="px-6 py-8 text-center text-ink-muted">
                        No policies defined.
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
