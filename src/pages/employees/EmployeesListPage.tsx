import React, { useState } from 'react';
import { useEmployees } from '../../hooks/queries/useEmployees';
import { Users, Filter, Search, ChevronRight, MapPin, Briefcase } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function EmployeesListPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const { data: employees, isLoading } = useEmployees();
  const navigate = useNavigate();

  if (isLoading) return <div className="p-4 sm:p-8 text-ink-muted">Loading employee directory...</div>;

  // Filter logic
  const filtered = employees?.filter(e => 
    e.first_name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    e.employee_code?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-4 sm:space-y-6 animate-enter">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-ink-primary">Employee Directory</h1>
          <p className="text-xs sm:text-sm text-ink-muted">Search, filter, and manage staff records.</p>
        </div>
        <div className="flex gap-2">
          <button className="btn-secondary btn-sm flex-1 sm:flex-none flex justify-center items-center gap-2">
            <Filter size={16} /> Filters
          </button>
        </div>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1 w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-disabled" size={16} />
          <input 
            type="text" 
            placeholder="Search by name or code..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-surface-2 border border-surface-4 rounded-lg focus:outline-none focus:border-brand/50 text-sm"
          />
        </div>
      </div>

      <div className="card p-0 overflow-hidden border-surface-4">
        {/* Desktop Table */}
        <table className="hidden sm:table w-full text-left text-sm">
          <thead className="bg-surface-2 border-b border-surface-4 text-ink-secondary">
            <tr>
              <th className="px-6 py-3 font-medium">Employee</th>
              <th className="px-6 py-3 font-medium">Code</th>
              <th className="px-6 py-3 font-medium">Current Posting</th>
              <th className="px-6 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-4">
            {filtered?.map(emp => (
              <tr key={emp.employee_id} className="hover:bg-surface-2/50 transition-colors cursor-pointer" onClick={() => navigate(`/employees/${emp.employee_id}`)}>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-surface-3 flex items-center justify-center text-ink-secondary">
                      <Users size={14} />
                    </div>
                    <div>
                      <div className="font-bold text-ink-primary">{emp.first_name} {emp.last_name}</div>
                      <div className="text-[10px] text-ink-muted">{emp.gender}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 font-mono text-xs text-ink-secondary">{emp.employee_code}</td>
                <td className="px-6 py-4">
                  <div className="font-medium text-ink-primary">{emp.office_name || 'Unposted'}</div>
                  <div className="text-[10px] text-ink-muted">{emp.posting_nature}</div>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    emp.employment_status === 'ACTIVE' ? 'bg-green-500/10 text-green-500' : 'bg-surface-4 text-ink-muted'
                  }`}>
                    {emp.employment_status}
                  </span>
                </td>
              </tr>
            ))}
            {(!filtered || filtered.length === 0) && (
              <tr><td colSpan={4} className="px-6 py-8 text-center text-ink-muted">No employees found.</td></tr>
            )}
          </tbody>
        </table>

        {/* Mobile Card List */}
        <div className="sm:hidden flex flex-col divide-y divide-surface-4">
          {filtered?.map(emp => (
            <div 
              key={emp.employee_id} 
              className="p-4 active:bg-surface-2 transition-colors cursor-pointer"
              onClick={() => navigate(`/employees/${emp.employee_id}`)}
            >
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-brand/10 flex items-center justify-center text-brand">
                    <Users size={16} />
                  </div>
                  <div>
                    <div className="font-bold text-ink-primary text-sm">{emp.first_name} {emp.last_name}</div>
                    <div className="font-mono text-[10px] text-ink-secondary">{emp.employee_code}</div>
                  </div>
                </div>
                <span className={`px-2 py-1 rounded-full text-[10px] font-medium ${
                  emp.employment_status === 'ACTIVE' ? 'bg-green-500/10 text-green-500' : 'bg-surface-4 text-ink-muted'
                }`}>
                  {emp.employment_status}
                </span>
              </div>
              <div className="mt-3 bg-surface-2 rounded-md p-2 flex flex-col gap-1.5">
                <div className="flex items-start gap-2 text-xs text-ink-secondary">
                  <Briefcase size={12} className="mt-0.5 shrink-0" />
                  <span className="truncate">{emp.posting_nature || 'No active posting'}</span>
                </div>
                <div className="flex items-start gap-2 text-xs text-ink-secondary">
                  <MapPin size={12} className="mt-0.5 shrink-0" />
                  <span className="truncate">{emp.office_name || 'Unassigned'}</span>
                </div>
              </div>
            </div>
          ))}
          {(!filtered || filtered.length === 0) && (
            <div className="p-8 text-center text-ink-muted text-sm">No employees found.</div>
          )}
        </div>
      </div>
    </div>
  );
}
