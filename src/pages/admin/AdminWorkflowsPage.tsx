import { useState } from 'react';
import { useWorkflowDefinitions } from '../../hooks/queries/useWorkflows';
import { GitMerge, Plus} from 'lucide-react';

export function AdminWorkflowsPage() {
  const { data: workflows, isLoading } = useWorkflowDefinitions();
  const [selectedWorkflow, setSelectedWorkflow] = useState<string | null>(null);

  if (isLoading) return <div className="p-8 text-ink-muted">Loading workflow engine...</div>;

  return (
    <div className="space-y-6 animate-enter">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink-primary">Workflow Definitions</h1>
          <p className="text-sm text-ink-muted">Design state machines, approval stages, and transitions.</p>
        </div>
        <button className="btn-primary btn-sm">
          <Plus size={16} /> New Workflow
        </button>
      </div>

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-4 space-y-4">
          <div className="card p-0 overflow-hidden border-surface-4">
            <div className="divide-y divide-surface-4">
              {workflows?.map(wf => (
                <div 
                  key={wf.id} 
                  className={`p-4 cursor-pointer transition-colors ${selectedWorkflow === wf.id ? 'bg-brand/5 border-l-2 border-l-brand' : 'hover:bg-surface-2 border-l-2 border-l-transparent'}`}
                  onClick={() => setSelectedWorkflow(wf.id)}
                >
                  <div className="font-bold text-ink-primary flex items-center gap-2">
                    <GitMerge size={16} className={selectedWorkflow === wf.id ? 'text-brand' : 'text-brand-muted'} />
                    {wf.name}
                  </div>
                  <div className="text-[10px] text-ink-muted font-mono mt-1 uppercase tracking-wider">{wf.module} Module</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="col-span-8">
          {selectedWorkflow ? (
            <div className="card h-full flex flex-col justify-center items-center text-ink-muted border-dashed border-2 border-surface-4 bg-surface-1">
              <GitMerge size={48} className="mb-4 text-surface-4" />
              <h2 className="text-lg font-medium text-ink-primary mb-2">Workflow Designer</h2>
              <p className="text-sm max-w-md text-center">
                Select an active version to edit its states and transitions. Editing active versions will create a new draft version.
              </p>
              <button className="btn-ghost btn-sm mt-6 border border-surface-4">View Active Version</button>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-ink-disabled">
              Select a workflow to manage its states and transitions
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
