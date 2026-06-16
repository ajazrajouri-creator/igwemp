// ============================================================
// IGWEMP — Census Review Panel
// UI for District Admin to review census submissions
// ============================================================

import React, { useState } from 'react';
import { ShieldCheck, XCircle, Search, FileCheck, RefreshCw, CheckCircle2, Loader2, AlertTriangle } from 'lucide-react';
import { cn, formatDate } from '../../lib/utils';
import { useApproveCensusSubmission } from '../../hooks/queries/useCensusReview';

// Mock active vacant posts for abolition selection
const MOCK_VACANT_POSTS = [
  { id: 'post-101', post_number: '1', designation: 'Teacher', office: 'GHS Koteranka', status: 'ACTIVE', vacant_since: '2023-01-15' },
  { id: 'post-102', post_number: '2', designation: 'Teacher', office: 'GHS Koteranka', status: 'ACTIVE', vacant_since: '2024-06-01' },
];

// Mock Data
const MOCK_SUBMISSIONS = [
  {
    id: 'sub-001',
    office_name: 'BHS Peeri',
    submitted_by: 'Abdul Karim',
    submitted_at: '2026-06-15T10:00:00Z',
    status: 'SUBMITTED',
    total_posts: 12,
    discrepancies: 0,
  },
  {
    id: 'sub-002',
    office_name: 'GHS Koteranka',
    submitted_by: 'Zahida Parveen',
    submitted_at: '2026-06-14T14:30:00Z',
    status: 'SUBMITTED',
    total_posts: 8,
    discrepancies: 2, // e.g. claimed more posts than sanctioned
  },
  {
    id: 'sub-003',
    office_name: 'HSS Rajouri',
    submitted_by: 'Mohammad Tariq',
    submitted_at: '2026-06-13T09:15:00Z',
    status: 'APPROVED',
    total_posts: 45,
    discrepancies: 0,
  }
];

export function CensusReviewPanel() {
  const [filter, setFilter] = useState<'ALL' | 'SUBMITTED' | 'APPROVED' | 'RETURNED'>('SUBMITTED');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Abolition Selection Modal State
  const [showAbolitionModal, setShowAbolitionModal] = useState(false);
  const [activeSubmissionId, setActiveSubmissionId] = useState<string | null>(null);
  const [selectedForAbolition, setSelectedForAbolition] = useState<string[]>([]);
  const [approveError, setApproveError] = useState<string | null>(null);
  
  const approveMutation = useApproveCensusSubmission();
  const requiredAbolishCount = 2; // Mocked required count from 'discrepancies'

  const toggleAbolishSelection = (id: string) => {
    setSelectedForAbolition(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const filtered = MOCK_SUBMISSIONS.filter(s => {
    if (filter !== 'ALL' && s.status !== filter) return false;
    if (searchQuery && !s.office_name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-5 animate-enter max-w-6xl mx-auto">
      {/* Header */}
      <div className="page-header flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <ShieldCheck className="text-brand-400" />
            <span className="text-gradient-brand">Census Review Panel</span>
          </h1>
          <p className="page-subtitle">
            Review and approve physical post census submissions from subordinate offices.
          </p>
        </div>
        <div className="flex gap-2">
          <button className="btn-ghost btn-sm gap-2">
            <RefreshCw size={14} /> Refresh
          </button>
          <button className="btn-primary btn-sm gap-2">
            <FileCheck size={14} /> Bulk Approve (2)
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 justify-between items-center bg-surface-2 p-3 rounded-xl border border-surface-4">
        <div className="flex gap-1 p-1 bg-surface-3 rounded-lg w-full sm:w-auto overflow-x-auto">
          {(['ALL', 'SUBMITTED', 'APPROVED', 'RETURNED'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                'px-3 py-1.5 text-xs font-medium rounded-md transition-all whitespace-nowrap',
                filter === f ? 'bg-surface-1 shadow-card text-ink-primary' : 'text-ink-muted hover:text-ink-secondary'
              )}
            >
              {f === 'ALL' ? 'All Submissions' : f}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
          <input 
            type="text" 
            placeholder="Search by school name..." 
            className="input w-full pl-9 py-1.5 text-sm"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Grid */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-surface-2 border-b border-surface-4 text-xs uppercase text-ink-muted">
              <tr>
                <th className="px-5 py-3 font-medium">Institution</th>
                <th className="px-5 py-3 font-medium">Submitted By</th>
                <th className="px-5 py-3 font-medium">Submitted At</th>
                <th className="px-5 py-3 font-medium">Total Posts</th>
                <th className="px-5 py-3 font-medium">Discrepancies</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-4">
              {filtered.map(sub => (
                <tr key={sub.id} className="hover:bg-surface-3/30 transition-colors">
                  <td className="px-5 py-4 font-medium text-ink-primary">{sub.office_name}</td>
                  <td className="px-5 py-4 text-ink-secondary">{sub.submitted_by}</td>
                  <td className="px-5 py-4 text-ink-muted">{formatDate(sub.submitted_at, 'short')}</td>
                  <td className="px-5 py-4 font-medium">{sub.total_posts}</td>
                  <td className="px-5 py-4">
                    {sub.discrepancies > 0 ? (
                      <span className="badge bg-red-950/40 text-red-400 border-red-900/50">
                        {sub.discrepancies} Issue{sub.discrepancies > 1 ? 's' : ''}
                      </span>
                    ) : (
                      <span className="text-green-400/80 text-xs font-medium flex items-center gap-1">
                        <CheckCircle2 size={12} /> Clean
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    <span className={cn(
                      'badge text-[10px]',
                      sub.status === 'APPROVED' ? 'bg-green-950/40 text-green-400 border-green-900/50' :
                      sub.status === 'SUBMITTED' ? 'bg-blue-950/40 text-blue-400 border-blue-900/50' :
                      'bg-orange-950/40 text-orange-400 border-orange-900/50'
                    )}>
                      {sub.status}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right space-x-2">
                    {sub.status === 'SUBMITTED' && (
                      <>
                        <button 
                          onClick={() => {
                            if (sub.discrepancies > 0) {
                              setActiveSubmissionId(sub.id);
                              setShowAbolitionModal(true);
                              setSelectedForAbolition([]);
                              setApproveError(null);
                            }
                          }}
                          className="btn-ghost btn-sm text-green-400 hover:bg-green-400/10 hover:border-green-400/20 px-2"
                        >
                          <ShieldCheck size={14} className="mr-1" /> Approve
                        </button>
                        <button className="btn-ghost btn-sm text-orange-400 hover:bg-orange-400/10 hover:border-orange-400/20 px-2">
                          <XCircle size={14} className="mr-1" /> Return
                        </button>
                      </>
                    )}
                    <button className="btn-ghost btn-sm px-2">View</button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-ink-muted">
                    No submissions found matching your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      {/* Abolition Modal */}
      {showAbolitionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-surface-1 w-full max-w-2xl rounded-xl border border-surface-4 shadow-2xl p-6 flex flex-col gap-6 animate-enter scale-95 origin-center">
            <div>
              <h2 className="text-xl font-bold text-ink-primary flex items-center gap-2">
                <ShieldCheck className="text-orange-400" /> Resolution Required: Abolish Posts
              </h2>
              <p className="text-ink-secondary mt-1">
                The school reported <strong>{requiredAbolishCount} fewer</strong> posts than currently active in the database. 
                You must select {requiredAbolishCount} active, vacant posts to abolish before approving this census.
              </p>
            </div>

            <div className="border border-surface-4 rounded-lg overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="bg-surface-2 border-b border-surface-4 text-xs uppercase text-ink-muted">
                  <tr>
                    <th className="px-4 py-2 w-10"></th>
                    <th className="px-4 py-2 font-medium">Post ID</th>
                    <th className="px-4 py-2 font-medium">Designation</th>
                    <th className="px-4 py-2 font-medium">Vacant Since</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-4">
                  {MOCK_VACANT_POSTS.map(post => (
                    <tr key={post.id} className="hover:bg-surface-3/30 transition-colors">
                      <td className="px-4 py-3">
                        <input 
                          type="checkbox" 
                          className="rounded border-surface-4 bg-surface-2 text-brand-500 focus:ring-brand-500/30"
                          checked={selectedForAbolition.includes(post.id)}
                          onChange={() => toggleAbolishSelection(post.id)}
                        />
                      </td>
                      <td className="px-4 py-3 font-mono text-xs">{post.id} (Post #{post.post_number})</td>
                      <td className="px-4 py-3">{post.designation}</td>
                      <td className="px-4 py-3 text-ink-muted">{post.vacant_since}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-between items-center bg-surface-2 p-3 rounded-lg border border-surface-4">
              <div className="text-sm">
                <span className="font-bold text-ink-primary">{selectedForAbolition.length}</span> / {requiredAbolishCount} Selected
              </div>
              <div className="flex gap-3">
                <button 
                  className="btn-ghost"
                  onClick={() => setShowAbolitionModal(false)}
                  disabled={approveMutation.isPending}
                >
                  Cancel
                </button>
                <button 
                  className="btn-primary"
                  disabled={selectedForAbolition.length !== requiredAbolishCount || approveMutation.isPending}
                  onClick={() => {
                    setApproveError(null);
                    if (!activeSubmissionId) return;
                    
                    approveMutation.mutate(
                      { 
                        submission_id: activeSubmissionId, 
                        selected_abolition_post_ids: selectedForAbolition 
                      },
                      {
                        onSuccess: (res) => {
                          setShowAbolitionModal(false);
                          // In a real app we might show a toast with res.message
                        },
                        onError: (err) => {
                          setApproveError(err.message || 'Failed to approve census submission');
                        }
                      }
                    );
                  }}
                >
                  {approveMutation.isPending ? <Loader2 className="animate-spin mr-2" size={14} /> : null}
                  Confirm & Approve
                </button>
              </div>
            </div>
            {approveError && (
              <div className="bg-red-950/20 text-red-400 p-3 rounded-lg border border-red-900/30 flex gap-2 text-sm">
                <AlertTriangle size={16} className="shrink-0" />
                <p>{approveError}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
