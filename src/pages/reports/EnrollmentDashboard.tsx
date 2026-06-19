import { Users, GraduationCap, Building2, AlertTriangle } from 'lucide-react';
import { useEnrollmentSummary, useSeniorSecondarySummary } from '../../hooks/queries/useEnrollment';
import { isSupabaseConfigured } from '../../lib/supabase';

export const EnrollmentDashboard = () => {
  const { data: summary, isLoading } = useEnrollmentSummary();
  const { data: seniorSummary, isLoading: seniorLoading } = useSeniorSecondarySummary();

  const totalEnrollment = summary?.reduce((acc: any, curr: any) => acc + (curr.total_count || 0), 0) || 0;
  const totalBoys = summary?.reduce((acc: any, curr: any) => acc + (curr.male_count || 0), 0) || 0;
  const totalGirls = summary?.reduce((acc: any, curr: any) => acc + (curr.female_count || 0), 0) || 0;
  
  const lowEnrollmentSchools = summary?.filter((s: any) => s.total_count > 0 && s.total_count < 15) || [];
  const zeroEnrollmentSchools = summary?.filter((s: any) => s.total_count === 0) || [];

  if (isLoading || seniorLoading) {
    return <div className="p-8 text-center text-ink-muted animate-pulse">Loading dashboard data...</div>;
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 py-8 animate-enter">
      <div>
        <h1 className="text-2xl font-bold text-ink-primary">Enrollment Dashboard</h1>
        <p className="text-sm text-ink-muted mt-1">Real-time student statistics and enrollment tracking.</p>
        {!isSupabaseConfigured && (
          <span className="inline-block mt-2 bg-yellow-500/10 text-yellow-600 border border-yellow-500/20 px-2 py-0.5 rounded text-xs font-medium">UI REVIEW MOCK DATA</span>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-4 flex items-center gap-4 bg-surface-1 border-l-4 border-brand-500 shadow-sm">
          <div className="p-3 bg-brand-500/10 text-brand-600 rounded-lg">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-ink-muted">Total Students</p>
            <p className="text-2xl font-bold text-ink-primary">{totalEnrollment.toLocaleString()}</p>
          </div>
        </div>
        
        <div className="card p-4 flex items-center gap-4 bg-surface-1 border-l-4 border-blue-500 shadow-sm">
          <div className="p-3 bg-blue-500/10 text-blue-600 rounded-lg">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-ink-muted">Total Boys</p>
            <p className="text-2xl font-bold text-ink-primary">{totalBoys.toLocaleString()}</p>
          </div>
        </div>

        <div className="card p-4 flex items-center gap-4 bg-surface-1 border-l-4 border-pink-500 shadow-sm">
          <div className="p-3 bg-pink-500/10 text-pink-600 rounded-lg">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-ink-muted">Total Girls</p>
            <p className="text-2xl font-bold text-ink-primary">{totalGirls.toLocaleString()}</p>
          </div>
        </div>

        <div className="card p-4 flex items-center gap-4 bg-surface-1 border-l-4 border-emerald-500 shadow-sm">
          <div className="p-3 bg-emerald-500/10 text-emerald-600 rounded-lg">
            <Building2 className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-ink-muted">Reporting Schools</p>
            <p className="text-2xl font-bold text-ink-primary">{summary?.length || 0}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <div className="card p-6 shadow-sm border-surface-4">
          <h2 className="text-lg font-bold text-ink-primary mb-4 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            Attention Required
          </h2>
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-red-700 mb-2">Zero Enrollment Schools ({zeroEnrollmentSchools.length})</h3>
              <div className="bg-red-500/5 p-3 rounded-lg border border-red-500/20 max-h-32 overflow-y-auto">
                {zeroEnrollmentSchools.length > 0 ? (
                  <ul className="text-sm text-red-600 list-disc list-inside">
                    {zeroEnrollmentSchools.map((s: any, i: number) => <li key={i}>{s.office_name}</li>)}
                  </ul>
                ) : <span className="text-sm text-ink-muted">None detected.</span>}
              </div>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-yellow-700 mb-2">Low Enrollment Schools ({lowEnrollmentSchools.length})</h3>
              <div className="bg-yellow-500/5 p-3 rounded-lg border border-yellow-500/20 max-h-32 overflow-y-auto">
                {lowEnrollmentSchools.length > 0 ? (
                  <ul className="text-sm text-yellow-700 list-disc list-inside">
                    {lowEnrollmentSchools.map((s: any, i: number) => <li key={i}>{s.office_name} - {s.total_count} students</li>)}
                  </ul>
                ) : <span className="text-sm text-ink-muted">None detected.</span>}
              </div>
            </div>
          </div>
        </div>

        <div className="card p-0 shadow-sm border-surface-4 overflow-hidden">
          <div className="p-6 border-b border-surface-4">
            <h2 className="text-lg font-bold text-ink-primary flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-brand-500" />
              Senior Secondary Overview
            </h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-surface-2 border-b border-surface-4 text-ink-secondary">
                <tr>
                  <th className="px-6 py-3 font-medium">Stream</th>
                  <th className="px-6 py-3 font-medium text-right">Students</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-4">
                {seniorSummary?.length === 0 ? (
                  <tr><td colSpan={2} className="px-6 py-4 text-center text-ink-muted">No stream data available</td></tr>
                ) : (
                  seniorSummary?.map((s: any, i: number) => (
                    <tr key={i} className="hover:bg-surface-2/50">
                      <td className="px-6 py-4 font-medium text-ink-primary">
                        {s.stream_id} <span className="text-xs text-ink-muted ml-1">({s.office_name})</span>
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-brand-600">{s.total_count}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
