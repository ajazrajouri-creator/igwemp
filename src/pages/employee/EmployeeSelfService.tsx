import React, { } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User, Briefcase, FileText, Plus, Clock,
  CheckCircle, RotateCcw, AlertTriangle, 
  Phone, MapPin, Calendar, Award} from 'lucide-react';
import { useMyEmployeeProfile, useMyUpdateRequests } from '../../hooks/queries/useEmployeeSelfService';
import { isSupabaseConfigured } from '../../lib/supabase';

const IS_DEV_MODE = !isSupabaseConfigured;

// ─── Status Badge ─────────────────────────────────────────────────────────────
function RequestStatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string; icon: React.ReactNode }> = {
    PENDING:   { label: 'Pending Review',  cls: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: <Clock size={11} /> },
    IN_REVIEW: { label: 'In Review',       cls: 'bg-blue-100 text-blue-800 border-blue-200',       icon: <Clock size={11} /> },
    APPROVED:  { label: 'Approved',        cls: 'bg-green-100 text-green-800 border-green-200',    icon: <CheckCircle size={11} /> },
    RETURNED:  { label: 'Returned',        cls: 'bg-red-100 text-red-800 border-red-200',          icon: <RotateCcw size={11} /> },
    APPLIED:   { label: 'Applied',         cls: 'bg-emerald-100 text-emerald-800 border-emerald-200', icon: <CheckCircle size={11} /> },
    WITHDRAWN: { label: 'Withdrawn',       cls: 'bg-gray-100 text-gray-700 border-gray-200',       icon: null }};
  const s = map[status] ?? { label: status, cls: 'bg-gray-100 text-gray-700 border-gray-200', icon: null };
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${s.cls}`}>
      {s.icon}{s.label}
    </span>
  );
}

// ─── Profile Info Row ─────────────────────────────────────────────────────────
function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value?: string | null }) {
  return (
    <div className="flex items-start gap-3 py-2 border-b border-border last:border-b-0">
      <div className="text-ink-muted mt-0.5">{icon}</div>
      <div>
        <p className="text-xs text-ink-muted">{label}</p>
        <p className="text-sm font-medium text-ink">{value || '—'}</p>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function EmployeeSelfService() {
  const navigate = useNavigate();
  const { data: profile, isLoading: profileLoading } = useMyEmployeeProfile();
  const { data: requests, isLoading: requestsLoading } = useMyUpdateRequests();

  if (profileLoading) {
    return (
      <div className="p-6 space-y-4 animate-pulse">
        <div className="h-8 bg-surface-alt rounded w-48" />
        <div className="h-48 bg-surface-alt rounded-xl" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-4xl mx-auto">
      {IS_DEV_MODE && (
        <div className="px-3 py-1 bg-yellow-100 border border-yellow-300 rounded-full text-yellow-800 text-xs font-medium w-fit">
          UI REVIEW MOCK DATA — Teacher Login
        </div>
      )}

      {/* Page Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-ink">My Profile</h1>
          <p className="text-sm text-ink-muted">View your profile and submit correction requests</p>
        </div>
        <button
          id="btn-request-correction"
          onClick={() => navigate('/employee/update-request')}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={16} /> Request Correction
        </button>
      </div>

      {/* Important Notice */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800 flex items-start gap-2">
        <AlertTriangle size={14} className="mt-0.5 flex-shrink-0" />
        <span>
          <strong>Read-only view.</strong> You cannot edit your profile directly.
          All corrections must go through the official request process and require HOI/ZEO approval before being applied.
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Personal Info */}
        <div className="bg-white rounded-xl border border-border p-4">
          <h2 className="text-sm font-semibold text-ink mb-3 flex items-center gap-2">
            <User size={14} className="text-accent" /> Personal Information
          </h2>
          <InfoRow icon={<User size={14} />} label="Full Name" value={`${profile?.first_name} ${profile?.last_name}`} />
          <InfoRow icon={<Award size={14} />} label="Employee Code" value={profile?.employee_code} />
          <InfoRow icon={<Phone size={14} />} label="Mobile Number" value={profile?.mobile_no} />
          <InfoRow icon={<Calendar size={14} />} label="Date of Birth" value={profile?.date_of_birth} />
          <InfoRow icon={<MapPin size={14} />} label="Address" value={profile?.address} />
        </div>

        {/* Service Info */}
        <div className="bg-white rounded-xl border border-border p-4">
          <h2 className="text-sm font-semibold text-ink mb-3 flex items-center gap-2">
            <Briefcase size={14} className="text-accent" /> Service Details
          </h2>
          <InfoRow icon={<Award size={14} />} label="Designation" value={profile?.designation} />
          <InfoRow icon={<Award size={14} />} label="Cadre" value={profile?.cadre} />
          <InfoRow icon={<Briefcase size={14} />} label="Current Posting" value={profile?.current_posting} />
          <InfoRow icon={<FileText size={14} />} label="School / Office" value={profile?.current_office} />
          <InfoRow icon={<Calendar size={14} />} label="Initial Appointment" value={profile?.date_of_initial_appointment} />
        </div>
      </div>

      {/* My Correction Requests */}
      <div>
        <h2 className="text-base font-semibold text-ink mb-3 flex items-center gap-2">
          <FileText size={16} className="text-accent" /> My Correction Requests
        </h2>
        {requestsLoading ? (
          <div className="space-y-2">
            {[...Array(2)].map((_, i) => <div key={i} className="h-16 bg-surface-alt rounded-xl animate-pulse" />)}
          </div>
        ) : requests && requests.length > 0 ? (
          <div className="space-y-3">
            {requests.map((req: any) => (
              <div
                key={req.id}
                className={`bg-white rounded-xl border p-4 ${req.status === 'RETURNED' ? 'border-red-300' : 'border-border'}`}
              >
                <div className="flex items-start justify-between gap-2 flex-wrap">
                  <div>
                    <p className="text-sm font-semibold text-ink">
                      {req.request_type.replace(/_/g, ' ')}
                    </p>
                    <p className="text-xs text-ink-muted">
                      Submitted: {new Date(req.submitted_at).toLocaleDateString('en-IN')}
                    </p>
                    {req.proposed_value && (
                      <p className="text-xs text-ink-muted mt-0.5">
                        Proposed: <span className="text-ink font-medium">{req.proposed_value}</span>
                      </p>
                    )}
                  </div>
                  <RequestStatusBadge status={req.status} />
                </div>
                {req.status === 'RETURNED' && req.reviewer_remarks && (
                  <div className="mt-2 p-2 bg-red-50 rounded-lg border border-red-200">
                    <p className="text-xs text-red-700 font-medium">Returned Remarks:</p>
                    <p className="text-xs text-red-600">{req.reviewer_remarks}</p>
                    <button
                      className="mt-1 text-xs text-red-700 font-medium underline hover:no-underline"
                      onClick={() => navigate('/employee/update-request')}
                    >
                      Resubmit →
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-border p-8 text-center">
            <FileText size={32} className="text-ink-muted mx-auto mb-2" />
            <p className="text-sm text-ink-muted">No correction requests submitted yet.</p>
            <button
              className="mt-3 btn-primary text-sm"
              onClick={() => navigate('/employee/update-request')}
            >
              Submit a Request
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default EmployeeSelfService;
