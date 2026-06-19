import { useState } from 'react';
import { Users, Search, Plus, FileSpreadsheet } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useStudents } from '../../hooks/queries/useStudents';
import { isSupabaseConfigured } from '../../lib/supabase';

export const StudentRegister = () => {
  const navigate = useNavigate();
  const { data: students, isLoading } = useStudents();
  const [searchTerm, setSearchTerm] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [genderFilter, setGenderFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('ACTIVE');

  const filteredStudents = students?.filter(s => {
    if (searchTerm && !s.student_name.toLowerCase().includes(searchTerm.toLowerCase()) && !s.admission_no?.includes(searchTerm)) return false;
    if (genderFilter && s.gender_id !== genderFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-enter">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-ink-primary flex items-center gap-2">
            <Users className="h-6 w-6 text-brand-500" />
            Student Register
          </h1>
          <p className="text-ink-muted text-sm mt-1">Manage student profiles and enrollment records</p>
          {!isSupabaseConfigured && (
            <span className="inline-block mt-2 bg-yellow-500/10 text-yellow-600 border border-yellow-500/20 px-2 py-0.5 rounded text-xs font-medium">UI REVIEW MOCK DATA</span>
          )}
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <button onClick={() => navigate('/students/import')} className="btn-ghost w-full sm:w-auto">
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Bulk Import
          </button>
          <button onClick={() => navigate('/students/new')} className="btn-primary w-full sm:w-auto">
            <Plus className="h-4 w-4 mr-2" />
            Add Student
          </button>
        </div>
      </div>

      <div className="card p-4 border-surface-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="text-xs font-medium text-ink-secondary mb-1 block">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-muted" />
              <input 
                type="text"
                placeholder="Name or Admission No..." 
                className="w-full pl-9 pr-3 py-2 bg-surface-1 border border-surface-4 rounded-md text-sm focus:outline-none focus:border-brand-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-ink-secondary mb-1 block">Class</label>
            <select 
              className="w-full px-3 py-2 bg-surface-1 border border-surface-4 rounded-md text-sm focus:outline-none focus:border-brand-500"
              value={classFilter} 
              onChange={(e) => setClassFilter(e.target.value)}
            >
              <option value="">All Classes</option>
              <option value="PRE_PRIMARY">Pre-Primary</option>
              <option value="CLASS_1">Class 1</option>
              <option value="CLASS_6">Class 6</option>
              <option value="CLASS_11">Class 11</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-ink-secondary mb-1 block">Gender</label>
            <select 
              className="w-full px-3 py-2 bg-surface-1 border border-surface-4 rounded-md text-sm focus:outline-none focus:border-brand-500"
              value={genderFilter} 
              onChange={(e) => setGenderFilter(e.target.value)}
            >
              <option value="">All</option>
              <option value="m1">Male</option>
              <option value="f1">Female</option>
              <option value="o1">Other</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-ink-secondary mb-1 block">Status</label>
            <select 
              className="w-full px-3 py-2 bg-surface-1 border border-surface-4 rounded-md text-sm focus:outline-none focus:border-brand-500"
              value={statusFilter} 
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="TRANSFERRED_OUT">Transferred Out</option>
            </select>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className="h-32 animate-pulse bg-surface-2 rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredStudents?.map((student) => (
            <div 
              key={student.id} 
              className="card p-4 hover:shadow-md transition-shadow cursor-pointer border-surface-4 group relative overflow-hidden"
              onClick={() => navigate(`/students/${student.id}`)}
            >
              <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <button className="btn-ghost p-1 h-8 w-8 rounded-full">
                  <span className="sr-only">Edit</span>
                  <svg className="h-4 w-4 text-ink-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
              
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-medium text-ink-primary group-hover:text-brand-500 transition-colors">{student.student_name}</h3>
                  <p className="text-sm text-ink-muted">Adm No: <span className="font-medium text-ink-secondary">{student.admission_no || 'N/A'}</span></p>
                </div>
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  student.is_active ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-surface-4 text-ink-muted'
                }`}>
                  {student.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
              
              <div className="space-y-2 mt-4 pt-4 border-t border-surface-3">
                <div className="flex justify-between text-sm">
                  <span className="text-ink-muted">Parent/Guardian:</span>
                  <span className="text-ink-primary font-medium">{student.father_name || student.guardian_name || 'N/A'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-ink-muted">DOB:</span>
                  <span className="text-ink-primary font-medium">{student.date_of_birth ? new Date(student.date_of_birth).toLocaleDateString() : 'N/A'}</span>
                </div>
                {student.is_cwsn && (
                  <div className="mt-2 flex">
                    <span className="bg-yellow-500/10 text-yellow-600 border border-yellow-500/20 px-2 py-0.5 rounded text-xs font-medium">CWSN</span>
                  </div>
                )}
              </div>
            </div>
          ))}
          {filteredStudents?.length === 0 && (
            <div className="col-span-full py-12 text-center text-ink-muted bg-surface-1 rounded-lg border border-surface-4 border-dashed">
              <Users className="h-10 w-10 mx-auto text-surface-4 mb-3" />
              <p>No students found matching your filters.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
