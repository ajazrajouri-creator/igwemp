import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useEmployeeProfile, useEmployeePostings } from '../../hooks/queries/useEmployees';
import { ArrowLeft, User, Briefcase, FileText, Settings, Award, Edit, Shield } from 'lucide-react';

export function EmployeeProfilePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: profile, isLoading } = useEmployeeProfile(id!);
  const { data: postings } = useEmployeePostings(id!);
  
  const [activeTab, setActiveTab] = useState<'PERSONAL' | 'SERVICE' | 'POSTINGS' | 'ARRANGEMENTS' | 'RESPONSIBILITIES' | 'QUALIFICATIONS' | 'DOCUMENTS'>('PERSONAL');

  if (isLoading) return <div className="p-8 text-ink-muted">Loading profile...</div>;
  if (!profile) return <div className="p-8 text-red-500">Profile not found</div>;

  const tabs = [
    { id: 'PERSONAL', label: 'Personal Info', icon: <User size={14} /> },
    { id: 'SERVICE', label: 'Service Record', icon: <Briefcase size={14} /> },
    { id: 'POSTINGS', label: 'Postings', icon: <MapPinIcon /> },
    { id: 'ARRANGEMENTS', label: 'Arrangements', icon: <Settings size={14} /> },
    { id: 'RESPONSIBILITIES', label: 'Responsibilities', icon: <Shield size={14} /> },
    { id: 'QUALIFICATIONS', label: 'Qualifications', icon: <Award size={14} /> },
    { id: 'DOCUMENTS', label: 'Documents', icon: <FileText size={14} /> },
  ] as const;

  return (
    <div className="space-y-4 sm:space-y-6 animate-enter pb-20 sm:pb-0">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-surface-3 rounded-lg text-ink-muted transition-colors">
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-surface-3 border-2 border-surface-2 flex items-center justify-center text-ink-secondary text-xl font-bold uppercase">
              {profile.person?.first_name?.[0]}{profile.person?.last_name?.[0] || ''}
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-ink-primary">
                {profile.person?.first_name} {profile.person?.last_name}
              </h1>
              <div className="text-xs sm:text-sm text-ink-muted font-mono mt-0.5">
                {profile.employee_code} · {profile.employment_status}
              </div>
            </div>
          </div>
          <button className="btn-primary btn-sm flex items-center gap-2 justify-center" onClick={() => alert('Change request workflow stub')}>
            <Edit size={14} /> Update Request
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-surface-4 overflow-x-auto hide-scrollbar bg-surface-1 sm:bg-transparent sticky top-0 z-10 pt-2 sm:pt-0">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 sm:px-6 py-3 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap transition-colors ${
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

      {/* Content */}
      <div className="bg-surface-2 border border-surface-4 rounded-xl p-4 sm:p-6 min-h-[50vh]">
        
        {activeTab === 'PERSONAL' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-1">
              <div className="text-xs text-ink-muted">Date of Birth</div>
              <div className="text-sm font-medium text-ink-primary">{profile.person?.dob || 'Not provided'}</div>
            </div>
            <div className="space-y-1">
              <div className="text-xs text-ink-muted">Gender</div>
              <div className="text-sm font-medium text-ink-primary">{profile.person?.gender || 'Not provided'}</div>
            </div>
            <div className="space-y-1">
              <div className="text-xs text-ink-muted">Aadhaar (Masked)</div>
              <div className="text-sm font-mono text-ink-primary">
                {profile.person?.aadhaar_last4 ? 'XXXX-XXXX-' + profile.person.aadhaar_last4 : 'Not provided'}
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-xs text-ink-muted">PAN (Masked)</div>
              <div className="text-sm font-mono text-ink-primary">
                {profile.person?.pan_masked ? profile.person.pan_masked : 'Not provided'}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'POSTINGS' && (
          <div className="space-y-4">
            {postings?.map(p => (
              <div key={p.id} className="p-4 border border-surface-4 rounded-lg bg-surface-1">
                <div className="flex justify-between items-start mb-2">
                  <div className="font-bold text-ink-primary text-sm">{p.office?.office_name}</div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full ${p.status === 'ACTIVE' ? 'bg-green-500/10 text-green-500' : 'bg-surface-4 text-ink-muted'}`}>
                    {p.status}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div><span className="text-ink-muted">Nature:</span> {p.posting_nature}</div>
                  <div><span className="text-ink-muted">From:</span> {p.effective_from}</div>
                  <div><span className="text-ink-muted">To:</span> {p.effective_to || 'Present'}</div>
                </div>
              </div>
            ))}
            {(!postings || postings.length === 0) && (
              <div className="text-sm text-ink-muted text-center py-8">No posting history available.</div>
            )}
          </div>
        )}

        {activeTab !== 'PERSONAL' && activeTab !== 'POSTINGS' && (
          <div className="flex flex-col items-center justify-center min-h-[30vh] text-ink-muted">
            <Settings size={32} className="mb-4 opacity-50" />
            <p className="text-sm">This tab content is under development.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function MapPinIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
      <circle cx="12" cy="10" r="3"></circle>
    </svg>
  );
}
