import React from 'react';
import { useRoleAssignments } from '../../hooks/queries/useRoles';
import { Plus, Link } from 'lucide-react';

export function AdminRoleAssignmentsPage() {
  const { data: assignments, isLoading } = useRoleAssignments();

  if (isLoading) return <div className="p-8 text-ink-muted">Loading role assignments...</div>;

  return (
    <div className="space-y-6 animate-enter">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink-primary">Role Assignments</h1>
          <p className="text-sm text-ink-muted">Manage user roles and their associated data scopes.</p>
        </div>
        <button className="btn-primary btn-sm">
          <Plus size={16} /> Assign Role
        </button>
      </div>

      <div className="card p-0 overflow-hidden border-surface-4">
        <table className="w-full text-left text-sm">
          <thead className="bg-surface-2 border-b border-surface-4 text-ink-secondary">
            <tr>
              <th className="px-6 py-3 font-medium">User ID</th>
              <th className="px-6 py-3 font-medium">Role</th>
              <th className="px-6 py-3 font-medium">Data Scopes</th>
              <th className="px-6 py-3 font-medium">Effective Dates</th>
              <th className="px-6 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-4">
            {assignments?.map((assignment) => (
              <tr key={assignment.id} className="hover:bg-surface-2/50 transition-colors">
                <td className="px-6 py-4 font-mono text-xs text-ink-secondary">
                  {assignment.user_id.substring(0, 8)}...
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-col">
                    <span className="font-medium text-ink-primary">{assignment.role?.name || 'Unknown Role'}</span>
                    {assignment.assignment_reason && (
                      <span className="text-[10px] text-ink-muted italic mt-0.5">{assignment.assignment_reason}</span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-wrap gap-1">
                    {assignment.scopes && assignment.scopes.length > 0 ? (
                      assignment.scopes.map(scope => (
                        <span key={scope.id} className="bg-surface-3 border border-surface-4 px-2 py-0.5 rounded text-xs text-ink-secondary flex items-center gap-1">
                          <Link size={10} /> {scope.item?.name || 'Unknown Scope'}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-ink-disabled italic">Global Scope</span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 text-xs text-ink-secondary">
                  <div>From: {assignment.effective_from}</div>
                  {assignment.effective_to && <div>To: {assignment.effective_to}</div>}
                </td>
                <td className="px-6 py-4 text-right">
                  <button className="btn-ghost btn-sm text-brand hover:text-brand-light">Edit</button>
                </td>
              </tr>
            ))}
            {(!assignments || assignments.length === 0) && (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-ink-muted">
                  No role assignments found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
