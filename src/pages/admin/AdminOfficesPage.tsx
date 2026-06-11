import React from 'react';
import { useOfficeHierarchy } from '../../hooks/queries/useOffices';
import { Plus, ChevronRight, Building } from 'lucide-react';
import type { Office } from '../../types';

export function AdminOfficesPage() {
  const { data: offices, isLoading } = useOfficeHierarchy();

  if (isLoading) return <div className="text-ink-muted">Loading offices...</div>;

  return (
    <div className="space-y-6 animate-enter">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink-primary">Offices Directory</h1>
          <p className="text-sm text-ink-muted">Manage the organizational structure and offices.</p>
        </div>
        <button className="btn-primary btn-sm">
          <Plus size={16} /> New Office
        </button>
      </div>

      <div className="card p-0 overflow-hidden border-surface-4">
        {offices && offices.length > 0 ? (
          <div className="p-4 space-y-2">
            {offices.map((office) => (
              <OfficeNode key={office.office_id} office={office} />
            ))}
          </div>
        ) : (
          <div className="p-8 text-center text-ink-muted border border-dashed border-surface-4 m-4 rounded-lg">
            No offices found in the hierarchy.
          </div>
        )}
      </div>
    </div>
  );
}

function OfficeNode({ office, depth = 0 }: { office: Office; depth?: number }) {
  // In a real implementation with true nested tree, this would recurse.
  // We indent based on the depth (simulated by ltree path segments length minus 1).
  const pathDepth = office.path ? office.path.split('.').length - 1 : depth;
  
  return (
    <div 
      className="flex items-center gap-2 p-2 hover:bg-surface-2 rounded-lg group transition-colors"
      style={{ paddingLeft: `${pathDepth * 1.5 + 0.5}rem` }}
    >
      <button className="text-ink-disabled hover:text-ink-primary p-1 rounded transition-colors">
        <ChevronRight size={16} />
      </button>
      <Building size={16} className="text-brand-muted" />
      <div className="flex flex-col">
        <span className="text-sm font-medium text-ink-primary">{office.office_name}</span>
        <span className="text-xs text-ink-muted">{office.level?.level_name || 'Level'} • {office.office_code}</span>
      </div>
      <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
        <button className="btn-ghost btn-sm h-7 text-xs">Edit</button>
      </div>
    </div>
  );
}
