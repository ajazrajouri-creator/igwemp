import { useState } from 'react';
import { CheckCircle, XCircle, Search,  Eye } from 'lucide-react';
import { useEnrollmentSubmissions, useApproveEnrollment, useReturnEnrollment } from '../../hooks/queries/useEnrollment';

export const EnrollmentReviewPanel = () => {
  const { data: submissions, isLoading } = useEnrollmentSubmissions();
  const approveMutation = useApproveEnrollment();
  const returnMutation = useReturnEnrollment();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubmission, setSelectedSubmission] = useState<any>(null);
  const [returnRemarks, setReturnRemarks] = useState('');

  const filtered = submissions?.filter(s => 
    s.status === 'SUBMITTED' || s.status === 'IN_REVIEW' || s.status === 'RETURNED'
  ).filter(s => {
    if (searchTerm && !s.office_name?.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  const handleApprove = (id: string) => {
    approveMutation.mutate(id, {
      onSuccess: () => setSelectedSubmission(null)
    });
  };

  const handleReturn = (id: string) => {
    if (!returnRemarks.trim()) {
      alert("Please enter return remarks");
      return;
    }
    returnMutation.mutate({ submissionId: id, remarks: returnRemarks }, {
      onSuccess: () => {
        setSelectedSubmission(null);
        setReturnRemarks('');
      }
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 animate-enter">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-ink-primary">Enrollment Review Panel</h1>
        <p className="text-sm text-ink-muted mt-1">Verify and approve school roll submissions.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 border-r border-surface-4 pr-6">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-muted" />
            <input 
              type="text"
              placeholder="Search schools..." 
              className="w-full pl-9 pr-3 py-2 bg-surface-1 border border-surface-4 rounded-md text-sm focus:outline-none focus:border-brand-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
            {isLoading ? (
              <div className="space-y-3">
                {[1,2,3].map(i => <div key={i} className="h-20 animate-pulse bg-surface-2 rounded-xl" />)}
              </div>
            ) : filtered?.length === 0 ? (
              <div className="text-center py-8 text-ink-muted text-sm">No pending submissions found.</div>
            ) : (
              filtered?.map(sub => (
                <div 
                  key={sub.id} 
                  className={`card p-3 cursor-pointer transition-colors ${selectedSubmission?.id === sub.id ? 'border-brand-500 ring-1 ring-brand-500 bg-brand-500/5' : 'border-surface-4 hover:border-surface-4/80'}`}
                  onClick={() => setSelectedSubmission(sub)}
                >
                  <div className="flex justify-between items-start">
                    <h3 className="font-medium text-sm text-ink-primary">{sub.office_name}</h3>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${sub.status === 'SUBMITTED' ? 'bg-yellow-500/10 text-yellow-600 border border-yellow-500/20' : 'bg-surface-4 text-ink-muted'}`}>
                      {sub.status}
                    </span>
                  </div>
                  <p className="text-xs text-ink-muted mt-1">Submitted: {new Date(sub.submitted_at || sub.created_at).toLocaleDateString()}</p>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="lg:col-span-2">
          {selectedSubmission ? (
            <div className="card p-6 border-surface-4">
              <div className="border-b border-surface-4 pb-4 mb-4">
                <h2 className="text-xl font-bold text-ink-primary">{selectedSubmission.office_name}</h2>
                <p className="text-sm text-ink-muted">Session: 2026-2027</p>
              </div>

              <div className="bg-surface-2 p-4 rounded-lg mb-6 border border-surface-4">
                <h3 className="font-semibold text-ink-secondary mb-3 text-sm uppercase">Class-wise Summary</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-surface-1 p-3 rounded shadow-sm border border-surface-4 text-center">
                    <p className="text-xs text-ink-muted">Total Enrollment</p>
                    <p className="text-2xl font-bold text-ink-primary">120</p>
                  </div>
                  <div className="bg-surface-1 p-3 rounded shadow-sm border border-surface-4 text-center">
                    <p className="text-xs text-ink-muted">Boys</p>
                    <p className="text-2xl font-bold text-blue-600">65</p>
                  </div>
                  <div className="bg-surface-1 p-3 rounded shadow-sm border border-surface-4 text-center">
                    <p className="text-xs text-ink-muted">Girls</p>
                    <p className="text-2xl font-bold text-pink-600">55</p>
                  </div>
                  <div className="bg-surface-1 p-3 rounded shadow-sm border border-surface-4 text-center">
                    <p className="text-xs text-ink-muted">CWSN</p>
                    <p className="text-2xl font-bold text-yellow-600">3</p>
                  </div>
                </div>
              </div>

              <div className="border-t border-surface-4 pt-6 space-y-4">
                <h3 className="font-medium text-ink-primary">Review Actions</h3>
                
                <div className="flex gap-4">
                  <button 
                    className="btn-primary flex-1 bg-green-600 hover:bg-green-700 text-white" 
                    onClick={() => handleApprove(selectedSubmission.id)}
                    disabled={approveMutation.isPending || returnMutation.isPending}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Approve Submission
                  </button>
                </div>
                
                <div className="mt-6 p-4 border border-red-100 rounded-lg bg-red-50/50">
                  <label className="block text-sm font-medium text-red-800 mb-2">Return with Remarks</label>
                  <input 
                    type="text"
                    placeholder="Provide detailed reasons for return..." 
                    value={returnRemarks}
                    onChange={(e) => setReturnRemarks(e.target.value)}
                    className="w-full mb-3 px-3 py-2 bg-surface-1 border border-red-200 rounded-md focus:outline-none focus:border-red-500"
                  />
                  <button 
                    className="btn-primary bg-red-600 hover:bg-red-700 text-white" 
                    onClick={() => handleReturn(selectedSubmission.id)}
                    disabled={!returnRemarks.trim() || returnMutation.isPending}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Return to School
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-ink-muted border-2 border-dashed border-surface-4 rounded-lg p-12 bg-surface-2">
              <Eye className="h-12 w-12 text-surface-4 mb-4" />
              <p className="text-lg font-medium text-ink-primary">No Submission Selected</p>
              <p className="text-sm text-ink-muted mt-1 text-center max-w-sm">
                Select a school from the left panel to review their enrollment submission and approve or return it.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
