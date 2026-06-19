import { useState, useEffect } from 'react';
import { AlertCircle, Save, Send, Plus, Trash2, ShieldAlert, GraduationCap, Calendar, CheckCircle2, Navigation, Undo2 } from 'lucide-react';
import { useSchoolClassConfigurations, useEnrollmentSubmissions, useSubmitEnrollment } from '../../hooks/queries/useEnrollment';
import { isSupabaseConfigured } from '../../lib/supabase';

// Mock master data for UI purposes
const CLASS_LEVELS = [
  { id: 'c0', code: 'PRE_PRIMARY', name: 'Pre-Primary' },
  { id: 'c1', code: 'CLASS_1', name: 'Class 1' },
  { id: 'c2', code: 'CLASS_2', name: 'Class 2' },
  { id: 'c3', code: 'CLASS_3', name: 'Class 3' },
  { id: 'c4', code: 'CLASS_4', name: 'Class 4' },
  { id: 'c5', code: 'CLASS_5', name: 'Class 5' },
  { id: 'c6', code: 'CLASS_6', name: 'Class 6' },
  { id: 'c7', code: 'CLASS_7', name: 'Class 7' },
  { id: 'c8', code: 'CLASS_8', name: 'Class 8' },
  { id: 'c9', code: 'CLASS_9', name: 'Class 9' },
  { id: 'c10', code: 'CLASS_10', name: 'Class 10' },
  { id: 'c11', code: 'CLASS_11', name: 'Class 11' },
  { id: 'c12', code: 'CLASS_12', name: 'Class 12' },
];

const STREAMS = ['ARTS', 'SCIENCE', 'COMMERCE', 'VOCATIONAL'];

export const EnrollmentSubmissionForm = () => {
  const currentOfficeId = 'o1'; // mocked current HOI office
  const { data: configs, isLoading: configLoading } = useSchoolClassConfigurations(currentOfficeId);
  const { data: submissions } = useEnrollmentSubmissions({ officeId: currentOfficeId });
  const submitMutation = useSubmitEnrollment();
  
  const currentSubmission = submissions?.[0]; // Assume first is current session
  
  // Local state for forms
  const [classData, setClassData] = useState<Record<string, { male: number; female: number; other: number; cwsn: number }>>({});
  const [seniorData, setSeniorData] = useState<any[]>([]);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  useEffect(() => {
    if (configs) {
      const initial: Record<string, any> = {};
      configs.forEach(c => {
        const cls = CLASS_LEVELS.find(l => l.id === c.class_id || l.code === c.class_id || l.name === c.class_id);
        if (cls && !cls.code.includes('11') && !cls.code.includes('12')) {
          initial[c.class_id] = { male: 0, female: 0, other: 0, cwsn: 0 };
        }
      });
      setClassData(initial);
    }
  }, [configs]);

  const handleStandardClassChange = (classId: string, field: string, value: string) => {
    setClassData(prev => ({
      ...prev,
      [classId]: { ...prev[classId], [field]: parseInt(value) || 0 }
    }));
  };

  const addSeniorRow = (classId: string) => {
    setSeniorData([...seniorData, { id: Date.now(), class_id: classId, stream: 'ARTS', subject: '', male: 0, female: 0, other: 0, cwsn: 0 }]);
  };

  const removeSeniorRow = (id: number) => {
    setSeniorData(seniorData.filter(r => r.id !== id));
  };

  const updateSeniorRow = (id: number, field: string, value: string) => {
    setSeniorData(seniorData.map(r => r.id === id ? { ...r, [field]: field.includes('count') || field === 'male' || field === 'female' || field === 'other' || field === 'cwsn' ? parseInt(value) || 0 : value } : r));
  };

  const validateForm = () => {
    const errors: string[] = [];
    
    // Check if senior secondary requires streams
    const hasSeniorConfig = configs?.some(c => c.class_id.includes('11') || c.class_id.includes('12'));
    if (hasSeniorConfig && seniorData.length === 0) {
      errors.push("Missing required Class 11/12 subject details.");
    }
    
    seniorData.forEach(row => {
      if (!row.subject || row.subject.trim() === '') {
        errors.push(`Missing subject/group name for stream ${row.stream}`);
      }
    });

    const zeroClasses = Object.entries(classData).filter(([_, data]) => (data.male + data.female + data.other) === 0);
    if (zeroClasses.length > 0) {
      errors.push(`There are ${zeroClasses.length} standard classes with zero enrollment. Please verify this is correct.`);
    }

    setValidationErrors(errors);
    return errors.length === 0 || errors.every(e => e.includes('zero enrollment')); // Zero enrollment might just be a warning, but for this demo let's treat it as a warning that allows submission
  };

  const handleSubmit = () => {
    if (!validateForm()) return;
    
    if (currentSubmission) {
      submitMutation.mutate(currentSubmission.id);
    }
  };

  if (configLoading) return <div className="p-8 text-center text-ink-muted animate-pulse">Loading configurations...</div>;

  const allowedClasses = configs?.filter(c => c.is_allowed) || [];
  const standardClasses = allowedClasses.filter(c => {
    const cls = CLASS_LEVELS.find(l => l.id === c.class_id || l.code === c.class_id || l.name === c.class_id);
    return cls && !cls.code.includes('11') && !cls.code.includes('12');
  });
  
  const hasSeniorSecondary = allowedClasses.some(c => {
    const cls = CLASS_LEVELS.find(l => l.id === c.class_id || l.code === c.class_id || l.name === c.class_id);
    return cls && (cls.code.includes('11') || cls.code.includes('12'));
  });

  const class11Config = allowedClasses.find(c => {
    const cls = CLASS_LEVELS.find(l => l.id === c.class_id || l.code === c.class_id || l.name === c.class_id);
    return cls && cls.code.includes('11');
  });

  const class12Config = allowedClasses.find(c => {
    const cls = CLASS_LEVELS.find(l => l.id === c.class_id || l.code === c.class_id || l.name === c.class_id);
    return cls && cls.code.includes('12');
  });

  const status = currentSubmission?.status || 'DRAFT';
  const isEditable = status === 'DRAFT' || status === 'RETURNED';

  // Calculate standard totals
  let totalStandardBoys = 0;
  let totalStandardGirls = 0;
  let totalStandardOther = 0;
  let totalStandardCWSN = 0;

  Object.values(classData).forEach(d => {
    totalStandardBoys += d.male;
    totalStandardGirls += d.female;
    totalStandardOther += d.other;
    totalStandardCWSN += d.cwsn;
  });

  const grandStandardTotal = totalStandardBoys + totalStandardGirls + totalStandardOther;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-enter pb-32">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-ink-primary">Enrollment Submission</h1>
        <p className="text-sm text-ink-muted mt-1">Submit school roll for verification.</p>
        {!isSupabaseConfigured && (
          <span className="inline-block mt-2 bg-yellow-500/10 text-yellow-600 border border-yellow-500/20 px-2 py-0.5 rounded text-xs font-medium">UI REVIEW MOCK DATA</span>
        )}
      </div>

      {/* School Context Header */}
      <div className="card p-5 border-surface-4 shadow-sm bg-gradient-to-br from-surface-1 to-surface-2 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <div className="flex items-center gap-2 text-ink-secondary mb-1">
              <GraduationCap className="h-4 w-4" />
              <span className="text-xs font-semibold uppercase tracking-wider">School details</span>
            </div>
            <p className="font-bold text-ink-primary">Govt HSS Example</p>
            <p className="text-xs text-ink-muted">UDISE: 01020304050</p>
          </div>
          <div>
            <div className="flex items-center gap-2 text-ink-secondary mb-1">
              <Navigation className="h-4 w-4" />
              <span className="text-xs font-semibold uppercase tracking-wider">School Type</span>
            </div>
            <p className="font-bold text-ink-primary">HSS</p>
            <p className="text-xs text-ink-muted">Class 6 to Class 12</p>
          </div>
          <div>
            <div className="flex items-center gap-2 text-ink-secondary mb-1">
              <Calendar className="h-4 w-4" />
              <span className="text-xs font-semibold uppercase tracking-wider">Academic Session</span>
            </div>
            <p className="font-bold text-ink-primary">2026-2027</p>
            <p className="text-xs text-ink-muted">Current Active Session</p>
          </div>
          <div>
            <div className="flex items-center gap-2 text-ink-secondary mb-1">
              <ShieldAlert className="h-4 w-4" />
              <span className="text-xs font-semibold uppercase tracking-wider">Submission Status</span>
            </div>
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider mt-1 ${
              status === 'DRAFT' ? 'bg-surface-4 text-ink-primary' :
              status === 'RETURNED' ? 'bg-red-500/10 text-red-600 border border-red-500/20' :
              status === 'APPROVED' ? 'bg-green-500/10 text-green-600 border border-green-500/20' :
              'bg-yellow-500/10 text-yellow-600 border border-yellow-500/20'
            }`}>
              {status}
            </span>
          </div>
        </div>
      </div>

      {status === 'RETURNED' && currentSubmission?.reviewer_remarks && (
        <div className="mb-6 p-4 rounded-lg border border-red-200 bg-red-50 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
          <div>
            <h3 className="font-semibold text-red-800 text-sm">Submission Returned by Verification Officer</h3>
            <p className="text-sm text-red-700 mt-1">{currentSubmission.reviewer_remarks}</p>
          </div>
        </div>
      )}

      {!isEditable && (
        <div className="mb-6 p-4 rounded-lg border border-blue-200 bg-blue-50/50 flex items-start gap-3">
          <CheckCircle2 className="h-5 w-5 text-blue-600 mt-0.5" />
          <div>
            <h3 className="font-semibold text-blue-800 text-sm">View Only Mode</h3>
            <p className="text-sm text-blue-700 mt-1">This enrollment submission is currently in {status.toLowerCase()} status and cannot be modified.</p>
          </div>
        </div>
      )}

      {validationErrors.length > 0 && (
        <div className="mb-6 p-4 rounded-lg border border-orange-200 bg-orange-50 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5" />
          <div>
            <h3 className="font-semibold text-orange-800 text-sm">Validation Summary</h3>
            <ul className="list-disc list-inside text-sm text-orange-700 mt-1">
              {validationErrors.map((err, i) => <li key={i}>{err}</li>)}
            </ul>
          </div>
        </div>
      )}

      <div className="space-y-6">
        <div className="card p-0 sm:p-6 border-surface-4 overflow-hidden sm:rounded-xl">
          <div className="p-4 sm:p-0 mb-0 sm:mb-4 sm:border-b border-surface-4 sm:pb-2">
            <h2 className="text-lg font-semibold text-ink-primary">Standard Classes</h2>
            <p className="text-xs text-ink-muted">Enter aggregate student counts for standard classes.</p>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left hidden sm:table">
              <thead className="bg-surface-2 border-b border-surface-4 text-ink-secondary">
                <tr>
                  <th className="px-4 py-3 font-medium">Class</th>
                  <th className="px-4 py-3 font-medium w-24">Boys</th>
                  <th className="px-4 py-3 font-medium w-24">Girls</th>
                  <th className="px-4 py-3 font-medium w-24">Other</th>
                  <th className="px-4 py-3 font-bold text-ink-primary w-24">Total</th>
                  <th className="px-4 py-3 font-medium text-yellow-600 w-24">CWSN</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-4">
                {standardClasses.map(c => {
                  const cls = CLASS_LEVELS.find(l => l.id === c.class_id || l.code === c.class_id || l.name === c.class_id);
                  const data = classData[c.class_id] || { male: 0, female: 0, other: 0, cwsn: 0 };
                  const total = data.male + data.female + data.other;
                  
                  return (
                    <tr key={c.class_id} className="hover:bg-surface-2/50 transition-colors">
                      <td className="px-4 py-3 font-medium text-ink-primary">{cls?.name || c.class_id}</td>
                      <td className="px-4 py-2"><input type="number" min="0" value={data.male || ''} disabled={!isEditable} onChange={(e) => handleStandardClassChange(c.class_id, 'male', e.target.value)} className="w-full px-2 py-1.5 bg-surface-1 border border-surface-4 rounded-md focus:outline-none focus:border-brand-500 disabled:opacity-50 disabled:bg-surface-2" placeholder="0" /></td>
                      <td className="px-4 py-2"><input type="number" min="0" value={data.female || ''} disabled={!isEditable} onChange={(e) => handleStandardClassChange(c.class_id, 'female', e.target.value)} className="w-full px-2 py-1.5 bg-surface-1 border border-surface-4 rounded-md focus:outline-none focus:border-brand-500 disabled:opacity-50 disabled:bg-surface-2" placeholder="0" /></td>
                      <td className="px-4 py-2"><input type="number" min="0" value={data.other || ''} disabled={!isEditable} onChange={(e) => handleStandardClassChange(c.class_id, 'other', e.target.value)} className="w-full px-2 py-1.5 bg-surface-1 border border-surface-4 rounded-md focus:outline-none focus:border-brand-500 disabled:opacity-50 disabled:bg-surface-2" placeholder="0" /></td>
                      <td className="px-4 py-3 font-bold text-ink-primary bg-surface-2/30 text-center rounded">{total}</td>
                      <td className="px-4 py-2"><input type="number" min="0" value={data.cwsn || ''} disabled={!isEditable} onChange={(e) => handleStandardClassChange(c.class_id, 'cwsn', e.target.value)} className="w-full px-2 py-1.5 bg-surface-1 border border-surface-4 rounded-md focus:outline-none focus:border-brand-500 disabled:opacity-50 disabled:bg-surface-2" placeholder="0" /></td>
                    </tr>
                  );
                })}
                {standardClasses.length > 0 && (
                  <tr className="bg-surface-2/50 border-t-2 border-surface-4">
                    <td className="px-4 py-4 font-bold text-ink-primary">Grand Total</td>
                    <td className="px-4 py-4 font-bold text-ink-primary text-center">{totalStandardBoys}</td>
                    <td className="px-4 py-4 font-bold text-ink-primary text-center">{totalStandardGirls}</td>
                    <td className="px-4 py-4 font-bold text-ink-primary text-center">{totalStandardOther}</td>
                    <td className="px-4 py-4 font-bold text-brand-600 text-center text-lg">{grandStandardTotal}</td>
                    <td className="px-4 py-4 font-bold text-yellow-600 text-center">{totalStandardCWSN}</td>
                  </tr>
                )}
                {standardClasses.length === 0 && (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-ink-muted">No standard classes configured for this school.</td></tr>
                )}
              </tbody>
            </table>

            {/* Mobile View for Standard Classes */}
            <div className="sm:hidden divide-y divide-surface-4">
              {standardClasses.map(c => {
                const cls = CLASS_LEVELS.find(l => l.id === c.class_id || l.code === c.class_id || l.name === c.class_id);
                const data = classData[c.class_id] || { male: 0, female: 0, other: 0, cwsn: 0 };
                const total = data.male + data.female + data.other;
                return (
                  <div key={c.class_id} className="p-4 bg-surface-1">
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="font-bold text-ink-primary">{cls?.name || c.class_id}</h3>
                      <span className="bg-surface-2 px-2 py-1 rounded text-xs font-bold">Total: {total}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3 mb-2">
                      <div>
                        <label className="text-[10px] uppercase text-ink-muted font-semibold block mb-1">Boys</label>
                        <input type="number" min="0" value={data.male || ''} disabled={!isEditable} onChange={(e) => handleStandardClassChange(c.class_id, 'male', e.target.value)} className="w-full px-2 py-2 bg-surface-1 border border-surface-4 rounded-md focus:outline-none focus:border-brand-500 text-sm" placeholder="0" />
                      </div>
                      <div>
                        <label className="text-[10px] uppercase text-ink-muted font-semibold block mb-1">Girls</label>
                        <input type="number" min="0" value={data.female || ''} disabled={!isEditable} onChange={(e) => handleStandardClassChange(c.class_id, 'female', e.target.value)} className="w-full px-2 py-2 bg-surface-1 border border-surface-4 rounded-md focus:outline-none focus:border-brand-500 text-sm" placeholder="0" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] uppercase text-ink-muted font-semibold block mb-1">Other</label>
                        <input type="number" min="0" value={data.other || ''} disabled={!isEditable} onChange={(e) => handleStandardClassChange(c.class_id, 'other', e.target.value)} className="w-full px-2 py-2 bg-surface-1 border border-surface-4 rounded-md focus:outline-none focus:border-brand-500 text-sm" placeholder="0" />
                      </div>
                      <div>
                        <label className="text-[10px] uppercase text-yellow-600 font-semibold block mb-1">CWSN</label>
                        <input type="number" min="0" value={data.cwsn || ''} disabled={!isEditable} onChange={(e) => handleStandardClassChange(c.class_id, 'cwsn', e.target.value)} className="w-full px-2 py-2 bg-surface-1 border border-surface-4 rounded-md focus:outline-none focus:border-brand-500 text-sm" placeholder="0" />
                      </div>
                    </div>
                  </div>
                );
              })}
              {standardClasses.length > 0 && (
                <div className="p-4 bg-surface-2/50 border-t-2 border-surface-4">
                  <h3 className="font-bold text-ink-primary mb-3">Grand Total</h3>
                  <div className="grid grid-cols-2 gap-y-2 text-sm">
                    <div className="text-ink-muted">Total Boys: <span className="font-bold text-ink-primary float-right">{totalStandardBoys}</span></div>
                    <div className="text-ink-muted ml-4">Total Girls: <span className="font-bold text-ink-primary float-right">{totalStandardGirls}</span></div>
                    <div className="text-ink-muted">Total Other: <span className="font-bold text-ink-primary float-right">{totalStandardOther}</span></div>
                    <div className="text-yellow-600 ml-4">Total CWSN: <span className="font-bold text-yellow-600 float-right">{totalStandardCWSN}</span></div>
                    <div className="col-span-2 mt-2 pt-2 border-t border-surface-4 text-brand-600 text-lg font-bold flex justify-between">
                      <span>Overall Total</span>
                      <span>{grandStandardTotal}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {hasSeniorSecondary && (
          <div className="card p-4 sm:p-6 border-brand-500/30">
            <h2 className="text-lg font-semibold text-brand-600 mb-4 border-b border-surface-4 pb-2">Senior Secondary Enrollment</h2>
            <div className="bg-brand-500/10 text-brand-700 text-sm p-3 rounded-md mb-6 flex gap-2">
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
              <p>For Senior Secondary classes, enrollment must be provided stream-wise and subject-wise. Totals are automatically calculated.</p>
            </div>

            {[class11Config, class12Config].filter(Boolean).map(conf => {
              if (!conf) return null;
              const clsId = conf.class_id;
              const clsName = CLASS_LEVELS.find(l => l.id === clsId || l.code === clsId || l.name === clsId)?.name || 'Class 11/12';
              const rows = seniorData.filter(r => r.class_id === clsId);
              
              const classTotal = rows.reduce((acc, r) => acc + r.male + r.female + r.other, 0);

              return (
                <div key={clsId} className="mb-8 last:mb-0">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 bg-surface-2 p-3 rounded-lg border border-surface-4 gap-3 sm:gap-0">
                    <h3 className="font-bold text-ink-primary">{clsName}</h3>
                    <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                      <span className="text-sm font-semibold bg-surface-1 px-3 py-1.5 rounded border shadow-sm w-full sm:w-auto text-center sm:text-left">
                        Calculated Total: <span className="text-brand-600">{classTotal}</span>
                      </span>
                      {isEditable && (
                        <button className="btn-outline btn-sm w-full sm:w-auto justify-center" onClick={() => addSeniorRow(clsId)}>
                          <Plus className="h-4 w-4 mr-1" /> Add Subject Row
                        </button>
                      )}
                    </div>
                  </div>
                  
                  {rows.length > 0 ? (
                    <div className="overflow-x-auto border border-surface-4 rounded-lg hidden sm:block">
                      <table className="w-full text-sm text-left">
                        <thead className="bg-surface-2 text-ink-secondary text-xs uppercase tracking-wider">
                          <tr>
                            <th className="px-3 py-3 font-medium">Stream</th>
                            <th className="px-3 py-3 font-medium">Subject / Group</th>
                            <th className="px-3 py-3 font-medium w-20">Boys</th>
                            <th className="px-3 py-3 font-medium w-20">Girls</th>
                            <th className="px-3 py-3 font-medium w-20">Other</th>
                            <th className="px-3 py-3 font-bold w-20">Total</th>
                            <th className="px-3 py-3 w-16"></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-surface-4">
                          {rows.map((row) => {
                            const rowTotal = row.male + row.female + row.other;
                            return (
                              <tr key={row.id} className="hover:bg-surface-2/30">
                                <td className="px-2 py-2">
                                  <select 
                                    value={row.stream} 
                                    disabled={!isEditable}
                                    onChange={(e) => updateSeniorRow(row.id, 'stream', e.target.value)}
                                    className="w-full px-2 py-1.5 bg-surface-1 border border-surface-4 rounded-md focus:outline-none focus:border-brand-500 text-sm"
                                  >
                                    {STREAMS.map(s => <option key={s} value={s}>{s}</option>)}
                                  </select>
                                </td>
                                <td className="px-2 py-2">
                                  <input 
                                    type="text"
                                    value={row.subject} 
                                    disabled={!isEditable}
                                    onChange={(e) => updateSeniorRow(row.id, 'subject', e.target.value)} 
                                    placeholder="Physics, Arts Group A..." 
                                    className="w-full px-2 py-1.5 bg-surface-1 border border-surface-4 rounded-md focus:outline-none focus:border-brand-500 text-sm"
                                  />
                                </td>
                                <td className="px-2 py-2"><input type="number" min="0" disabled={!isEditable} value={row.male || ''} onChange={(e) => updateSeniorRow(row.id, 'male', e.target.value)} className="w-full px-2 py-1.5 bg-surface-1 border border-surface-4 rounded-md focus:outline-none focus:border-brand-500 text-sm disabled:opacity-50" placeholder="0" /></td>
                                <td className="px-2 py-2"><input type="number" min="0" disabled={!isEditable} value={row.female || ''} onChange={(e) => updateSeniorRow(row.id, 'female', e.target.value)} className="w-full px-2 py-1.5 bg-surface-1 border border-surface-4 rounded-md focus:outline-none focus:border-brand-500 text-sm disabled:opacity-50" placeholder="0" /></td>
                                <td className="px-2 py-2"><input type="number" min="0" disabled={!isEditable} value={row.other || ''} onChange={(e) => updateSeniorRow(row.id, 'other', e.target.value)} className="w-full px-2 py-1.5 bg-surface-1 border border-surface-4 rounded-md focus:outline-none focus:border-brand-500 text-sm disabled:opacity-50" placeholder="0" /></td>
                                <td className="px-3 py-2 text-center font-bold bg-surface-2 rounded text-brand-600">{rowTotal}</td>
                                <td className="px-2 py-2 text-center">
                                  {isEditable && (
                                    <button onClick={() => removeSeniorRow(row.id)} className="text-red-500 hover:bg-red-50 p-1 rounded-md h-8 w-8 inline-flex justify-center items-center">
                                      <Trash2 className="h-4 w-4" />
                                    </button>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center p-8 border border-dashed border-surface-4 rounded-lg bg-surface-1 text-ink-muted text-sm hidden sm:block">
                      No stream/subject data added yet for {clsName}. Click "Add Subject Row" to begin.
                    </div>
                  )}

                  {/* Mobile View for Senior Rows */}
                  <div className="sm:hidden space-y-4">
                    {rows.length === 0 && (
                      <div className="text-center p-6 border border-dashed border-surface-4 rounded-lg bg-surface-1 text-ink-muted text-sm">
                        No stream/subject data added yet for {clsName}. Click "Add Subject Row" to begin.
                      </div>
                    )}
                    {rows.map((row) => {
                      const rowTotal = row.male + row.female + row.other;
                      return (
                        <div key={row.id} className="p-4 bg-surface-1 border border-surface-4 rounded-lg relative">
                          {isEditable && (
                            <button onClick={() => removeSeniorRow(row.id)} className="absolute top-2 right-2 text-red-500 bg-red-50 p-1.5 rounded-full shadow-sm">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                          <div className="mb-3 pr-8">
                            <label className="text-[10px] uppercase text-ink-muted font-semibold block mb-1">Stream</label>
                            <select value={row.stream} disabled={!isEditable} onChange={(e) => updateSeniorRow(row.id, 'stream', e.target.value)} className="w-full px-2 py-2 bg-surface-1 border border-surface-4 rounded-md focus:outline-none focus:border-brand-500 text-sm">
                              {STREAMS.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                          </div>
                          <div className="mb-3">
                            <label className="text-[10px] uppercase text-ink-muted font-semibold block mb-1">Subject / Group</label>
                            <input type="text" value={row.subject} disabled={!isEditable} onChange={(e) => updateSeniorRow(row.id, 'subject', e.target.value)} placeholder="Physics, Arts Group A..." className="w-full px-2 py-2 bg-surface-1 border border-surface-4 rounded-md focus:outline-none focus:border-brand-500 text-sm" />
                          </div>
                          <div className="grid grid-cols-3 gap-2 mb-3">
                            <div>
                              <label className="text-[10px] uppercase text-ink-muted font-semibold block mb-1">Boys</label>
                              <input type="number" min="0" disabled={!isEditable} value={row.male || ''} onChange={(e) => updateSeniorRow(row.id, 'male', e.target.value)} className="w-full px-2 py-2 bg-surface-1 border border-surface-4 rounded-md focus:outline-none focus:border-brand-500 text-sm disabled:opacity-50" placeholder="0" />
                            </div>
                            <div>
                              <label className="text-[10px] uppercase text-ink-muted font-semibold block mb-1">Girls</label>
                              <input type="number" min="0" disabled={!isEditable} value={row.female || ''} onChange={(e) => updateSeniorRow(row.id, 'female', e.target.value)} className="w-full px-2 py-2 bg-surface-1 border border-surface-4 rounded-md focus:outline-none focus:border-brand-500 text-sm disabled:opacity-50" placeholder="0" />
                            </div>
                            <div>
                              <label className="text-[10px] uppercase text-ink-muted font-semibold block mb-1">Other</label>
                              <input type="number" min="0" disabled={!isEditable} value={row.other || ''} onChange={(e) => updateSeniorRow(row.id, 'other', e.target.value)} className="w-full px-2 py-2 bg-surface-1 border border-surface-4 rounded-md focus:outline-none focus:border-brand-500 text-sm disabled:opacity-50" placeholder="0" />
                            </div>
                          </div>
                          <div className="pt-2 border-t border-surface-4 flex justify-between items-center text-sm font-bold text-ink-primary">
                            <span>Row Total</span>
                            <span className="text-brand-600 bg-brand-50 px-2 py-0.5 rounded">{rowTotal}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Sticky Action Footer for Mobile & Desktop */}
      <div className="fixed sm:relative bottom-0 left-0 right-0 p-4 sm:p-0 bg-surface-1 sm:bg-transparent border-t border-surface-4 sm:border-transparent mt-8 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] sm:shadow-none z-10">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-end gap-3 sm:pt-4 sm:border-t sm:border-surface-4">
          {!isEditable ? (
            <>
              {status === 'SUBMITTED' && (
                <button className="btn-outline w-full sm:w-auto justify-center text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300">
                  <Undo2 className="h-4 w-4 mr-2" /> Withdraw Submission
                </button>
              )}
              <button className="btn-primary w-full sm:w-auto justify-center bg-surface-4 text-ink-muted border-none cursor-not-allowed hover:bg-surface-4" disabled>
                <CheckCircle2 className="h-4 w-4 mr-2" /> View Only
              </button>
            </>
          ) : (
            <>
              <button className="btn-outline w-full sm:w-auto justify-center bg-surface-1" onClick={validateForm}>
                <Save className="h-4 w-4 mr-2" /> {status === 'RETURNED' ? 'Save Changes' : 'Save Draft'}
              </button>
              <button className="btn-primary w-full sm:w-auto justify-center shadow-lg sm:shadow-none" onClick={handleSubmit} disabled={submitMutation.isPending}>
                <Send className="h-4 w-4 mr-2" />
                {submitMutation.isPending ? 'Submitting...' : status === 'RETURNED' ? 'Resubmit to ZEO/CEO' : 'Submit Enrollment'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
