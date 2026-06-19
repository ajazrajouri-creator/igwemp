import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  School, Users, UserCheck, ClipboardList, Building2,
  FileText, AlertTriangle, CheckCircle, Clock, RotateCcw,
  ChevronRight, GraduationCap, TrendingUp, Bell,
} from 'lucide-react';
import { useSchoolDashboardSummary } from '../../hooks/queries/useSchoolPortal';
import { isSupabaseConfigured } from '../../lib/supabase';

const IS_DEV_MODE = !isSupabaseConfigured;
const MOCK_OFFICE_ID = 'mock-office-hss-peeri';

// ─── Status Badge ────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    DRAFT: { label: 'Draft', cls: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
    SUBMITTED: { label: 'Submitted', cls: 'bg-blue-100 text-blue-800 border-blue-200' },
    IN_REVIEW: { label: 'In Review', cls: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
    RETURNED: { label: 'Returned', cls: 'bg-red-100 text-red-800 border-red-200' },
    APPROVED: { label: 'Approved', cls: 'bg-green-100 text-green-800 border-green-200' },
    COMMITTED: { label: 'Committed', cls: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  };
  const s = map[status] ?? { label: status, cls: 'bg-gray-100 text-gray-700 border-gray-200' };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${s.cls}`}>
      {s.label}
    </span>
  );
}

// ─── Quick Stat Card ─────────────────────────────────────────────────────────
function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string | number; color: string }) {
  return (
    <div className="bg-white rounded-xl border border-border p-4 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold text-ink">{value}</p>
        <p className="text-xs text-ink-muted">{label}</p>
      </div>
    </div>
  );
}

// ─── Submission Module Card ───────────────────────────────────────────────────
function ModuleCard({
  title, status, route, icon, remarks
}: {
  title: string; status: string; route: string; icon: React.ReactNode; remarks?: string | null;
}) {
  const navigate = useNavigate();
  const isReturned = status === 'RETURNED';
  return (
    <div
      className={`bg-white rounded-xl border p-4 cursor-pointer hover:shadow-md transition-all group ${isReturned ? 'border-red-300 bg-red-50' : 'border-border'}`}
      onClick={() => navigate(route)}
      role="button"
      tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && navigate(route)}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isReturned ? 'bg-red-100 text-red-600' : 'bg-accent/10 text-accent'}`}>
            {icon}
          </div>
          <div>
            <p className="font-semibold text-ink text-sm">{title}</p>
            <StatusBadge status={status} />
          </div>
        </div>
        <ChevronRight size={16} className="text-ink-muted group-hover:text-accent transition-colors mt-1" />
      </div>
      {isReturned && remarks && (
        <div className="mt-3 p-2 bg-red-100 rounded-lg border border-red-200">
          <p className="text-xs text-red-700 font-medium flex items-center gap-1">
            <AlertTriangle size={12} /> Returned Remarks
          </p>
          <p className="text-xs text-red-600 mt-0.5">{remarks}</p>
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function SchoolDashboard() {
  const navigate = useNavigate();
  const { data: summary, isLoading } = useSchoolDashboardSummary(MOCK_OFFICE_ID);

  if (isLoading) {
    return (
      <div className="p-6 space-y-4 animate-pulse">
        <div className="h-8 bg-surface-alt rounded w-64" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-surface-alt rounded-xl" />)}
        </div>
      </div>
    );
  }

  const s = summary!;

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-5xl mx-auto">
      {/* DEV badge */}
      {IS_DEV_MODE && (
        <div className="px-3 py-1 bg-yellow-100 border border-yellow-300 rounded-full text-yellow-800 text-xs font-medium w-fit">
          UI REVIEW MOCK DATA
        </div>
      )}

      {/* School Context Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-violet-600 rounded-2xl p-5 text-white shadow-lg">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
            <School size={28} className="text-white" />
          </div>
          <div className="min-w-0">
            <h1 className="text-xl font-bold leading-tight">{s.school_name}</h1>
            <p className="text-indigo-200 text-sm mt-0.5">
              {s.school_type} &nbsp;·&nbsp; {s.zone}
            </p>
            {s.udise_code && (
              <p className="text-indigo-200 text-xs mt-0.5">UDISE: {s.udise_code}</p>
            )}
          </div>
          <div className="ml-auto flex-shrink-0">
            <span className="bg-white/20 text-white text-xs px-2 py-0.5 rounded-full">
              HOI View
            </span>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard icon={<GraduationCap size={20} className="text-blue-600" />} label="Total Students" value={s.total_students} color="bg-blue-50" />
        <StatCard icon={<UserCheck size={20} className="text-emerald-600" />} label="Total Employees" value={s.total_employees} color="bg-emerald-50" />
        <StatCard icon={<TrendingUp size={20} className="text-amber-600" />} label="Vacant Posts" value={s.vacant_posts} color="bg-amber-50" />
        <StatCard icon={<ClipboardList size={20} className="text-purple-600" />} label="Pending Tasks" value={s.pending_tasks} color="bg-purple-50" />
      </div>

      {/* Submission Status */}
      <div>
        <h2 className="text-base font-semibold text-ink mb-3 flex items-center gap-2">
          <FileText size={16} className="text-accent" /> Submission Status
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <ModuleCard
            title="Infrastructure Census"
            status={s.infrastructure_status}
            route="/infrastructure/census"
            icon={<Building2 size={18} />}
            remarks={null}
          />
          <ModuleCard
            title="Student Enrollment"
            status={s.enrollment_status}
            route="/enrollment/submission"
            icon={<GraduationCap size={18} />}
            remarks={null}
          />
          <ModuleCard
            title="Post Census"
            status={s.post_census_status}
            route="/posts/census"
            icon={<ClipboardList size={18} />}
            remarks={
              s.returned_submissions.find(r => r.module === 'Post Census')?.remarks
            }
          />
        </div>
      </div>

      {/* Returned Submissions Alert */}
      {s.returned_submissions.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-red-700 flex items-center gap-2 mb-3">
            <RotateCcw size={14} /> Returned Submissions — Action Required
          </h3>
          <div className="space-y-2">
            {s.returned_submissions.map(r => (
              <div key={r.id} className="bg-white rounded-lg border border-red-200 p-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-ink">{r.module}</span>
                  <StatusBadge status={r.status} />
                </div>
                <p className="text-xs text-red-700 mt-1">{r.remarks}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div>
        <h2 className="text-base font-semibold text-ink mb-3 flex items-center gap-2">
          <CheckCircle size={16} className="text-accent" /> Quick Actions
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
          {[
            { label: 'My Work Queue', icon: <Clock size={16} />, route: '/work-queue' },
            { label: 'Employees', icon: <Users size={16} />, route: '/employees' },
            { label: 'Students', icon: <GraduationCap size={16} />, route: '/students' },
            { label: 'Orders', icon: <Bell size={16} />, route: '/orders' },
          ].map(a => (
            <button
              key={a.route}
              onClick={() => navigate(a.route)}
              className="flex items-center gap-2 p-3 bg-white border border-border rounded-xl text-sm font-medium text-ink hover:bg-surface-alt hover:border-accent/40 transition-all"
            >
              <span className="text-accent">{a.icon}</span>
              {a.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default SchoolDashboard;
