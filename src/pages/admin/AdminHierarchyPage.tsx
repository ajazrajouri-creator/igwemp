import { useHierarchyLevels } from '../../hooks/queries/useOffices';
import { Plus, GripVertical } from 'lucide-react';

export function AdminHierarchyPage() {
  const { data: levels, isLoading } = useHierarchyLevels();

  if (isLoading) return <div className="text-ink-muted">Loading hierarchy...</div>;

  return (
    <div className="space-y-6 animate-enter">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink-primary">Hierarchy Builder</h1>
          <p className="text-sm text-ink-muted">Define the organizational structure levels.</p>
        </div>
        <button className="btn-primary btn-sm">
          <Plus size={16} /> New Level
        </button>
      </div>

      <div className="card max-w-2xl">
        <div className="space-y-2">
          {levels?.map((level) => (
            <div 
              key={level.level_id} 
              className="flex items-center justify-between p-3 rounded-lg border border-surface-4 bg-surface-2 hover:border-brand/30 transition-colors"
            >
              <div className="flex items-center gap-3">
                <button className="text-ink-disabled hover:text-ink-secondary cursor-grab active:cursor-grabbing">
                  <GripVertical size={16} />
                </button>
                <div className="flex flex-col">
                  <span className="font-medium text-sm text-ink-primary">{level.level_name}</span>
                  <span className="text-xs text-ink-muted">Code: {level.level_code}</span>
                </div>
              </div>
              <div className="text-xs text-ink-secondary font-mono bg-surface-3 px-2 py-1 rounded">
                Order: {level.sort_order}
              </div>
            </div>
          ))}
          {(!levels || levels.length === 0) && (
            <div className="p-8 text-center text-ink-muted border border-dashed border-surface-4 rounded-lg">
              No hierarchy levels defined.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
