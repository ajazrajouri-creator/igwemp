import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2, ClipboardList, GraduationCap, 
     Filter, Search,
   AlertTriangle, Eye} from 'lucide-react';
import { isSupabaseConfigured } from '../../lib/supabase';

const IS_DEV_MODE = !isSupabaseConfigured;

// ─── Mock Data ─────────────────────────────────────────────────────────────
const MOCK_SCHOOL_SUBMISSIONS = [
  {
    school_id: 's1',
    school_name: 'Govt HSS Peeri',
    school_type: 'HSS',
    infrastructure: 'SUBMITTED',
    enrollment: 'DRAFT',
    post_census: 'RETURNED',
    employee_requests: 2},
  {
    school_id: 's2',
    school_name: 'Govt MS Mendhar',
    school_type: 'MS',
    infrastructure: 'APPROVED',
    enrollment: 'SUBMITTED',
    post_census: 'SUBMITTED',
    employee_requests: 0},
  {
    school_id: 's3',
    school_name: 'Govt PS Thanna Mandi',
    school_type: 'PS',
    infrastructure: 'SUBMITTED',
    enrollment: 'SUBMITTED',
    post_census: 'DRAFT',
    employee_requests: 1},
];

const MOCK_EMPLOYEE_REQUESTS = [
  { id: 'r1', employee_name: 'Meenakshi Sharma', school: 'Govt HSS Peeri', type: 'MOBILE_UPDATE', status: 'PENDING', submitted_at: '2026-06-10' },
  { id: 'r2', employee_name: 'Ratan Kumar', school: 'Govt HSS Peeri', type: 'QUALIFICATION_UPDATE', status: 'PENDING', submitted_at: '2026-06-12' },
  { id: 'r3', employee_name: 'Anjali Devi', school: 'Govt PS Thanna Mandi', type: 'NAME_CORRECTION', status: 'RETURNED', submitted_at: '2026-06-05' },
];

type ModuleFilter = 'ALL' | 'INFRASTRUCTURE' | 'ENROLLMENT' | 'POST_CENSUS' | 'EMPLOYEE_REQUESTS';
type StatusFilter = 'ALL' | 'DRAFT' | 'SUBMITTED' | 'RETURNED' | 'APPROVED';

// ─── Status Badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    DRAFT:     'bg-yellow-100 text-yellow-800 border-yellow-200',
    SUBMITTED: 'bg-blue-100 text-blue-800 border-blue-200',
    IN_REVIEW: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    RETURNED:  'bg-red-100 text-red-800 border-red-200',
    APPROVED:  'bg-green-100 text-green-800 border-green-200',
    COMMITTED: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    PENDING:   'bg-yellow-100 text-yellow-800 border-yellow-200'};
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${map[status] ?? 'bg-gray-100 text-gray-700 border-gray-200'}`}>
      {status.replace(/_/g, ' ')}
    </span>
  );
}

// ─── School Row ───────────────────────────────────────────────────────────────
function SchoolRow({ school, moduleFilter, navigate }: { school: typeof MOCK_SCHOOL_SUBMISSIONS[0]; moduleFilter: ModuleFilter; navigate: ReturnType<typeof useNavigate> }) {
  const hasPending = school.infrastructure === 'SUBMITTED' || school.enrollment === 'SUBMITTED' || school.post_census === 'SUBMITTED';
  const hasReturned = school.post_census === 'RETURNED';

  return (
    <div className={`bg-white rounded-xl border p-4 ${hasReturned ? 'border-red-300' : hasPending ? 'border-blue-200' : 'border-border'}`}>
      <div className="flex items-start justify-between gap-2 flex-wrap">
        <div>
          <div className="flex items-center gap-2">
            <Building2 size={14} className="text-accent" />
            <span className="font-semibold text-ink text-sm">{school.school_name}</span>
            <span className="text-xs text-ink-muted bg-surface-alt px-2 py-0.5 rounded-full">{school.school_type}</span>
          </div>
          {school.employee_requests > 0 && (
            <p className="text-xs text-amber-700 mt-1 flex items-center gap-1">
              <AlertTriangle size={11} /> {school.employee_requests} pending employee request(s)
            </p>
          )}
        </div>
        <button
          className="btn-ghost text-xs flex items-center gap-1 text-accent"
          onClick={() => navigate(`/schools/${school.school_id}`)}
        >
          <Eye size={12} /> View School
        </button>
      </div>

      {/* Submission status row */}
      <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2">
        {(moduleFilter === 'ALL' || moduleFilter === 'INFRASTRUCTURE') && (
          <div className="flex items-center justify-between bg-surface-alt rounded-lg px-3 py-2">
            <span className="text-xs text-ink-muted flex items-center gap-1">
              <Building2 size={11} /> Infrastructure
            </span>
            <div className="flex items-center gap-1">
              <StatusBadge status={school.infrastructure} />
              {school.infrastructure === 'SUBMITTED' && (
                <button
                  className="text-xs text-blue-700 font-medium hover:underline"
                  onClick={() => navigate('/infrastructure/review')}
                >
                  Review
                </button>
              )}
            </div>
          </div>
        )}
        {(moduleFilter === 'ALL' || moduleFilter === 'ENROLLMENT') && (
          <div className="flex items-center justify-between bg-surface-alt rounded-lg px-3 py-2">
            <span className="text-xs text-ink-muted flex items-center gap-1">
              <GraduationCap size={11} /> Enrollment
            </span>
            <div className="flex items-center gap-1">
              <StatusBadge status={school.enrollment} />
              {school.enrollment === 'SUBMITTED' && (
                <button
                  className="text-xs text-blue-700 font-medium hover:underline"
                  onClick={() => navigate('/enrollment/review')}
                >
                  Review
                </button>
              )}
            </div>
          </div>
        )}
        {(moduleFilter === 'ALL' || moduleFilter === 'POST_CENSUS') && (
          <div className="flex items-center justify-between bg-surface-alt rounded-lg px-3 py-2">
            <span className="text-xs text-ink-muted flex items-center gap-1">
              <ClipboardList size={11} /> Post Census
            </span>
            <div className="flex items-center gap-1">
              <StatusBadge status={school.post_census} />
              {(school.post_census === 'SUBMITTED' || school.post_census === 'RETURNED') && (
                <button
                  className="text-xs text-blue-700 font-medium hover:underline"
                  onClick={() => navigate('/posts/review')}
                >
                  Review
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function ZeoReviewDashboard() {
  const navigate = useNavigate();
  const [moduleFilter, setModuleFilter] = useState<ModuleFilter>('ALL');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredSchools = MOCK_SCHOOL_SUBMISSIONS.filter(s => {
    if (searchQuery && !s.school_name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (statusFilter === 'ALL') return true;
    const relevantStatuses = [s.infrastructure, s.enrollment, s.post_census];
    return relevantStatuses.some(st => st === statusFilter);
  });

  const pendingCount = MOCK_SCHOOL_SUBMISSIONS.filter(s =>
    s.infrastructure === 'SUBMITTED' || s.enrollment === 'SUBMITTED' || s.post_census === 'SUBMITTED'
  ).length;

  const returnedCount = MOCK_SCHOOL_SUBMISSIONS.filter(s =>
    s.infrastructure === 'RETURNED' || s.enrollment === 'RETURNED' || s.post_census === 'RETURNED'
  ).length;

  const totalEmployeeRequests = MOCK_EMPLOYEE_REQUESTS.filter(r => r.status === 'PENDING').length;

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-5xl mx-auto">
      {IS_DEV_MODE && (
        <div className="px-3 py-1 bg-yellow-100 border border-yellow-300 rounded-full text-yellow-800 text-xs font-medium w-fit">
          UI REVIEW MOCK DATA — ZEO Peeri Login
        </div>
      )}

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-ink">ZEO Review Dashboard</h1>
        <p className="text-sm text-ink-muted">Zone: Peeri &nbsp;·&nbsp; Manage submissions from your zone's schools</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl border border-border p-4 text-center">
          <p className="text-2xl font-bold text-blue-600">{pendingCount}</p>
          <p className="text-xs text-ink-muted mt-0.5">Schools Pending Review</p>
        </div>
        <div className="bg-white rounded-xl border border-border p-4 text-center">
          <p className="text-2xl font-bold text-red-500">{returnedCount}</p>
          <p className="text-xs text-ink-muted mt-0.5">Schools with Returns</p>
        </div>
        <div className="bg-white rounded-xl border border-border p-4 text-center">
          <p className="text-2xl font-bold text-amber-600">{totalEmployeeRequests}</p>
          <p className="text-xs text-ink-muted mt-0.5">Employee Requests Pending</p>
        </div>
        <div className="bg-white rounded-xl border border-border p-4 text-center">
          <p className="text-2xl font-bold text-green-600">
            {MOCK_SCHOOL_SUBMISSIONS.filter(s => s.infrastructure === 'APPROVED' && s.enrollment !== 'DRAFT').length}
          </p>
          <p className="text-xs text-ink-muted mt-0.5">Submissions Approved</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-border p-4 space-y-3">
        <div className="flex items-center gap-2 text-sm font-medium text-ink">
          <Filter size={14} /> Filters
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Search */}
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
            <input
              id="filter-search"
              type="text"
              placeholder="Search school..."
              className="input-field pl-8"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
          {/* Module */}
          <select
            id="filter-module"
            className="input-field"
            value={moduleFilter}
            onChange={e => setModuleFilter(e.target.value as ModuleFilter)}
          >
            <option value="ALL">All Modules</option>
            <option value="INFRASTRUCTURE">Infrastructure</option>
            <option value="ENROLLMENT">Enrollment</option>
            <option value="POST_CENSUS">Post Census</option>
            <option value="EMPLOYEE_REQUESTS">Employee Requests</option>
          </select>
          {/* Status */}
          <select
            id="filter-status"
            className="input-field"
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as StatusFilter)}
          >
            <option value="ALL">All Statuses</option>
            <option value="DRAFT">Draft</option>
            <option value="SUBMITTED">Submitted</option>
            <option value="RETURNED">Returned</option>
            <option value="APPROVED">Approved</option>
          </select>
        </div>
      </div>

      {/* School Submissions List */}
      {moduleFilter !== 'EMPLOYEE_REQUESTS' ? (
        <div className="space-y-3">
          <h2 className="text-base font-semibold text-ink">
            Schools — {filteredSchools.length} shown
          </h2>
          {filteredSchools.length === 0 ? (
            <div className="bg-white rounded-xl border border-border p-8 text-center text-ink-muted text-sm">
              No schools match the current filters.
            </div>
          ) : (
            filteredSchools.map(s => (
              <SchoolRow key={s.school_id} school={s} moduleFilter={moduleFilter} navigate={navigate} />
            ))
          )}
        </div>
      ) : (
        /* Employee Requests Tab */
        <div className="space-y-3">
          <h2 className="text-base font-semibold text-ink">
            Employee Update Requests — {MOCK_EMPLOYEE_REQUESTS.length} total
          </h2>
          {MOCK_EMPLOYEE_REQUESTS.map(req => (
            <div
              key={req.id}
              className={`bg-white rounded-xl border p-4 ${req.status === 'RETURNED' ? 'border-red-300' : 'border-border'}`}
            >
              <div className="flex items-start justify-between gap-2 flex-wrap">
                <div>
                  <p className="font-semibold text-ink text-sm">{req.employee_name}</p>
                  <p className="text-xs text-ink-muted">{req.school} &nbsp;·&nbsp; {req.type.replace(/_/g, ' ')}</p>
                  <p className="text-xs text-ink-muted">Submitted: {req.submitted_at}</p>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={req.status} />
                  {req.status === 'PENDING' && (
                    <div className="flex gap-1">
                      <button className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded-lg font-medium hover:bg-green-200">
                        Approve
                      </button>
                      <button className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded-lg font-medium hover:bg-red-200">
                        Return
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ZeoReviewDashboard;
