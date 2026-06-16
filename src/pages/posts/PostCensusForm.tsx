// ============================================================
// IGWEMP — Post Census Form
// UI for HOI to submit their school's physical post census
// ============================================================

import React, { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Trash2, Save, Send, AlertTriangle, FileText, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../core/auth/AuthContext';
import { cn } from '../../lib/utils';

// Mock Master Data
const DESIGNATIONS = [
  { id: 'desig-1', name: 'Master' },
  { id: 'desig-2', name: 'Teacher' },
  { id: 'desig-3', name: 'Principal' },
  { id: 'desig-4', name: 'Headmaster' }
];

const POST_NATURES = [
  { id: 'pn-1', name: 'Substantive' },
  { id: 'pn-2', name: 'Temporary' },
  { id: 'pn-3', name: 'Supernumerary' }
];

const censusItemSchema = z.object({
  id: z.string().optional(),
  designation_id: z.string().min(1, 'Required'),
  post_nature_id: z.string().min(1, 'Required'),
  sanction_order_ref: z.string().min(3, 'Required'),
  remarks: z.string().optional()
});

const censusFormSchema = z.object({
  items: z.array(censusItemSchema).min(1, 'At least one post must be declared')
});

type CensusFormValues = z.infer<typeof censusFormSchema>;

export function PostCensusForm() {
  const { user } = useAuth();
  const [status, setStatus] = useState<'DRAFT' | 'SUBMITTED'>('DRAFT');

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isDirty, isValid }
  } = useForm<CensusFormValues>({
    resolver: zodResolver(censusFormSchema),
    defaultValues: {
      items: [
        { designation_id: '', post_nature_id: '', sanction_order_ref: '', remarks: '' }
      ]
    }
  });

  const { fields, append, remove } = useFieldArray({
    name: 'items',
    control
  });

  const onSubmit = (data: CensusFormValues) => {
    console.log('Submitted Census Data:', data);
    setStatus('SUBMITTED');
  };

  const handleSaveDraft = () => {
    console.log('Saved Draft');
    // Save draft logic here
  };

  if (status === 'SUBMITTED') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 animate-enter">
        <div className="w-20 h-20 rounded-2xl bg-green-950/30 flex items-center justify-center text-4xl text-green-400">
          <CheckCircle2 size={40} />
        </div>
        <div className="text-center">
          <h1 className="text-xl font-bold text-ink-primary">Census Submitted</h1>
          <p className="text-sm text-ink-muted mt-2 max-w-md">
            Your physical post census has been forwarded to the Zonal/District office for review.
          </p>
        </div>
        <button className="btn-primary" onClick={() => window.history.back()}>
          Return to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-enter max-w-5xl mx-auto pb-24">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <FileText className="text-brand-400" />
            <span className="text-gradient-brand">Physical Post Census</span>
          </h1>
          <p className="page-subtitle">
            Declare the sanctioned physical posts for your institution.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="badge bg-yellow-950/30 text-yellow-400 border-transparent">
            Cycle: 2026-27 Phase 1
          </span>
        </div>
      </div>

      <div className="bg-blue-950/20 border border-blue-900/30 rounded-xl p-4 flex gap-3 text-sm">
        <AlertTriangle className="text-blue-400 shrink-0" size={18} />
        <div className="text-blue-200">
          <strong>Important Instructions:</strong>
          <ul className="list-disc ml-5 mt-1 opacity-80 space-y-1">
            <li>Ensure each physical post has a unique entry (row-per-post).</li>
            <li>Provide the exact Government Order (GO) reference for the sanction.</li>
            <li>Submission requires explicit approval from the reviewing authority.</li>
          </ul>
        </div>
      </div>

      {/* Form Area */}
      <form onSubmit={handleSubmit(onSubmit)} className="card">
        <div className="p-5 border-b border-surface-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-ink-primary">Sanctioned Posts List</h2>
          <span className="text-xs text-ink-muted">{fields.length} rows</span>
        </div>

        <div className="p-0 overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead className="bg-surface-2/50 text-ink-muted text-xs uppercase">
              <tr>
                <th className="px-4 py-3 font-medium">#</th>
                <th className="px-4 py-3 font-medium">Designation</th>
                <th className="px-4 py-3 font-medium">Post Nature</th>
                <th className="px-4 py-3 font-medium">Sanction Order Ref</th>
                <th className="px-4 py-3 font-medium">Remarks</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-4">
              {fields.map((field, index) => (
                <tr key={field.id} className="hover:bg-surface-2/30 transition-colors">
                  <td className="px-4 py-3 text-ink-muted">{index + 1}</td>
                  <td className="px-4 py-3">
                    <select
                      className={cn("input py-1.5 px-2 w-48", errors.items?.[index]?.designation_id && "border-red-500/50")}
                      {...register(`items.${index}.designation_id` as const)}
                    >
                      <option value="">Select Designation...</option>
                      {DESIGNATIONS.map(d => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      className={cn("input py-1.5 px-2 w-36", errors.items?.[index]?.post_nature_id && "border-red-500/50")}
                      {...register(`items.${index}.post_nature_id` as const)}
                    >
                      <option value="">Select Nature...</option>
                      {POST_NATURES.map(n => (
                        <option key={n.id} value={n.id}>{n.name}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="text"
                      className={cn("input py-1.5 px-2", errors.items?.[index]?.sanction_order_ref && "border-red-500/50")}
                      placeholder="e.g. Govt Order No. 123"
                      {...register(`items.${index}.sanction_order_ref` as const)}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="text"
                      className="input py-1.5 px-2"
                      placeholder="Optional remarks"
                      {...register(`items.${index}.remarks` as const)}
                    />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      className="text-ink-disabled hover:text-red-400 transition-colors p-1"
                      onClick={() => remove(index)}
                      disabled={fields.length === 1}
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {fields.length === 0 && (
            <div className="p-8 text-center text-ink-muted">
              No posts declared yet. Click "Add Row" to begin.
            </div>
          )}
        </div>

        <div className="p-4 border-t border-surface-4 bg-surface-2/30">
          <button
            type="button"
            className="btn-ghost btn-sm text-brand-400 gap-1.5"
            onClick={() => append({ designation_id: '', post_nature_id: '', sanction_order_ref: '', remarks: '' })}
          >
            <Plus size={14} /> Add Row
          </button>
        </div>
      </form>

      {/* Floating Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 sm:left-64 sm:right-0 p-4 bg-surface-1/80 backdrop-blur-md border-t border-surface-3 flex items-center justify-between z-40">
        <div className="text-xs text-ink-muted">
          {isDirty ? 'Unsaved changes' : 'All changes saved'}
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            className="btn-ghost"
            onClick={handleSaveDraft}
          >
            <Save size={16} className="mr-2" />
            Save Draft
          </button>
          <button
            type="submit"
            className="btn-primary"
            disabled={!isValid}
            onClick={handleSubmit(onSubmit)}
          >
            <Send size={16} className="mr-2" />
            Submit Census
          </button>
        </div>
      </div>
    </div>
  );
}
