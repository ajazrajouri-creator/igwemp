import { useState } from 'react';
import { useSectionQueue } from '../../hooks/queries/useWorkQueue';
import { Inbox, Play, CheckCircle, AlertTriangle, FileUp} from 'lucide-react';
import { useAuth } from '../../core/auth/AuthContext';

export function SectionQueuePage() {
  useAuth();
  // Using a stub section ID for the demo
  const mockSectionId = '11111111-1111-1111-1111-111111111111';
  const { data: queueItems, isLoading } = useSectionQueue(mockSectionId);
  const [activeTab, setActiveTab] = useState<'INBOX' | 'IN_PROGRESS' | 'PENDING_APPROVAL' | 'COMPLETED' | 'ESCALATED'>('INBOX');

  if (isLoading) return <div className="p-4 sm:p-8 text-ink-muted">Loading section queue...</div>;

  const filteredItems = queueItems?.filter(item => item.status === activeTab) || [];

  const tabs = [
    { id: 'INBOX', label: 'Inbox', icon: <Inbox size={16} /> },
    { id: 'IN_PROGRESS', label: 'In Progress', icon: <Play size={16} /> },
    { id: 'PENDING_APPROVAL', label: 'Pending Approval', icon: <FileUp size={16} /> },
    { id: 'COMPLETED', label: 'Completed', icon: <CheckCircle size={16} /> },
    { id: 'ESCALATED', label: 'Escalated', icon: <AlertTriangle size={16} /> },
  ] as const;

  return (
    <div className="space-y-4 sm:space-y-6 animate-enter">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-ink-primary">Section Queue</h1>
          <p className="text-xs sm:text-sm text-ink-muted">Manage cases routed to your section. Pick up tasks to process them.</p>
        </div>
      </div>

      <div className="flex border-b border-surface-4 overflow-x-auto hide-scrollbar">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 sm:px-6 py-3 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
              activeTab === tab.id 
                ? 'border-brand text-brand bg-brand/5' 
                : 'border-transparent text-ink-secondary hover:text-ink-primary hover:bg-surface-2'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      <div className="card p-0 overflow-hidden border-surface-4">
        {/* Desktop Table */}
        <table className="hidden sm:table w-full text-left text-sm">
          <thead className="bg-surface-2 border-b border-surface-4 text-ink-secondary">
            <tr>
              <th className="px-6 py-3 font-medium">Work Item ID</th>
              <th className="px-6 py-3 font-medium">Case Type</th>
              <th className="px-6 py-3 font-medium">Due Date</th>
              {activeTab !== 'INBOX' && <th className="px-6 py-3 font-medium">Picked Up By</th>}
              <th className="px-6 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-4">
            {filteredItems.map(item => (
              <tr key={item.id} className="hover:bg-surface-2/50 transition-colors">
                <td className="px-6 py-4 font-mono text-xs text-ink-secondary">
                  {item.id.substring(0, 8)}...
                </td>
                <td className="px-6 py-4 text-ink-primary font-medium">
                  {item.case?.case_type?.name || 'Unknown Type'}
                </td>
                <td className="px-6 py-4 text-ink-secondary">
                  {item.due_date ? new Date(item.due_date).toLocaleDateString() : 'None'}
                </td>
                {activeTab !== 'INBOX' && (
                  <td className="px-6 py-4 text-ink-primary">
                    {item.picked_up_by_user?.username || 'Unassigned'}
                  </td>
                )}
                <td className="px-6 py-4 text-right">
                  {activeTab === 'INBOX' ? (
                    <button className="btn-primary btn-sm">Pick Up</button>
                  ) : (
                    <button className="btn-ghost btn-sm text-brand border border-surface-4">Process</button>
                  )}
                </td>
              </tr>
            ))}
            {filteredItems.length === 0 && (
              <tr>
                <td colSpan={activeTab === 'INBOX' ? 4 : 5} className="px-6 py-12 text-center text-ink-muted">
                  <div className="flex flex-col items-center gap-2">
                    <Inbox size={32} className="text-surface-4" />
                    <p>No items in {tabs.find(t => t.id === activeTab)?.label}</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Mobile Card List */}
        <div className="sm:hidden flex flex-col divide-y divide-surface-4">
          {filteredItems.map(item => (
            <div key={item.id} className="p-4 active:bg-surface-2 transition-colors">
              <div className="flex justify-between items-start mb-2">
                <span className="font-mono text-[10px] text-ink-muted bg-surface-2 px-1.5 py-0.5 rounded">
                  #{item.id.substring(0, 8)}
                </span>
                {activeTab === 'INBOX' ? (
                  <button className="btn-primary btn-sm py-1 h-auto text-[10px]">Pick Up</button>
                ) : (
                  <button className="btn-ghost btn-sm py-1 h-auto text-[10px] text-brand border border-surface-4">Process</button>
                )}
              </div>
              <div className="font-medium text-ink-primary text-sm mb-2">{item.case?.case_type?.name || 'Unknown Type'}</div>
              <div className="flex justify-between items-end">
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] text-ink-secondary">
                    Due: {item.due_date ? new Date(item.due_date).toLocaleDateString() : 'None'}
                  </span>
                  {activeTab !== 'INBOX' && (
                    <span className="text-[10px] text-brand font-medium">
                      Picked up: {item.picked_up_by_user?.username || 'Unassigned'}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
          {filteredItems.length === 0 && (
            <div className="p-8 text-center text-ink-muted text-sm">
              <div className="flex flex-col items-center gap-2">
                <Inbox size={24} className="text-surface-4" />
                <p>No items in {tabs.find(t => t.id === activeTab)?.label}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
