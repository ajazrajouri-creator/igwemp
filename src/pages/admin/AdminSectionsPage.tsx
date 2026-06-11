import React from 'react';
import { useOfficeSections } from '../../hooks/queries/useSections';
import { Plus, Users } from 'lucide-react';

export function AdminSectionsPage() {
  // For demo, we might select an office. Let's assume a hardcoded officeId for now or null
  const { data: sections, isLoading } = useOfficeSections(null);

  if (isLoading) return <div className="text-ink-muted">Loading sections...</div>;

  return (
    <div className="space-y-6 animate-enter">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink-primary">Office Sections</h1>
          <p className="text-sm text-ink-muted">Manage operational sections within offices.</p>
        </div>
        <button className="btn-primary btn-sm">
          <Plus size={16} /> New Section
        </button>
      </div>

      <div className="card p-0 overflow-hidden border-surface-4">
        <table className="w-full text-left text-sm">
          <thead className="bg-surface-2 border-b border-surface-4 text-ink-secondary">
            <tr>
              <th className="px-6 py-3 font-medium">Section Name</th>
              <th className="px-6 py-3 font-medium">Type</th>
              <th className="px-6 py-3 font-medium">Queue Enabled</th>
              <th className="px-6 py-3 font-medium">Head</th>
              <th className="px-6 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-4">
            {sections?.map((section) => (
              <tr key={section.section_id} className="hover:bg-surface-2/50 transition-colors">
                <td className="px-6 py-4 font-medium text-ink-primary">{section.section_name}</td>
                <td className="px-6 py-4 text-ink-secondary">
                  <span className="px-2 py-1 bg-surface-3 rounded text-xs font-mono">
                    {section.section_type}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    section.queue_enabled ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'bg-surface-4 text-ink-muted'
                  }`}>
                    {section.queue_enabled ? 'Enabled' : 'Disabled'}
                  </span>
                </td>
                <td className="px-6 py-4 text-ink-secondary">
                  {section.head ? (
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-surface-4 flex items-center justify-center text-xs">
                        {section.head.username.charAt(0).toUpperCase()}
                      </div>
                      <span>{section.head.username}</span>
                    </div>
                  ) : (
                    <span className="text-ink-disabled italic">Unassigned</span>
                  )}
                </td>
                <td className="px-6 py-4 text-right space-x-2">
                  <button className="btn-ghost btn-sm px-2 text-ink-secondary hover:text-brand" title="Manage Members">
                    <Users size={16} />
                  </button>
                  <button className="btn-ghost btn-sm px-2">Edit</button>
                </td>
              </tr>
            ))}
            {(!sections || sections.length === 0) && (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-ink-muted">
                  Please select an office to view its sections.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
