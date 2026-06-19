import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Send, ArrowLeft, AlertTriangle, CheckCircle } from 'lucide-react';
import {
  REQUEST_TYPES,
  updateRequestSchema,
  type UpdateRequestFormData,
  type RequestTypeCode,
  buildProposedValues,
} from '../../lib/validations/employeeSelfService';
import { useSubmitUpdateRequest } from '../../hooks/queries/useEmployeeSelfService';
import { isSupabaseConfigured } from '../../lib/supabase';

const IS_DEV_MODE = !isSupabaseConfigured;

// ─── Dynamic field renderer per request type ─────────────────────────────────
function TypeFields({ type, register, errors }: { type: RequestTypeCode; register: any; errors: any }) {
  switch (type) {
    case 'MOBILE_UPDATE':
      return (
        <div>
          <label className="form-label">New Mobile Number *</label>
          <input id="field-new-mobile" type="tel" {...register('new_mobile')} className="input-field" placeholder="10-digit mobile number" maxLength={10} />
          {errors.new_mobile && <p className="form-error">{errors.new_mobile.message}</p>}
        </div>
      );
    case 'ADDRESS_UPDATE':
      return (
        <div className="space-y-3">
          <div>
            <label className="form-label">New Address *</label>
            <textarea id="field-new-address" {...register('new_address')} className="input-field min-h-[80px]" placeholder="Full address" />
            {errors.new_address && <p className="form-error">{errors.new_address.message}</p>}
          </div>
          <div>
            <label className="form-label">Village / Mohalla</label>
            <input id="field-new-village" type="text" {...register('new_village')} className="input-field" placeholder="Village (optional)" />
          </div>
          <div>
            <label className="form-label">District</label>
            <input id="field-new-district" type="text" {...register('new_district')} className="input-field" placeholder="District (optional)" />
          </div>
        </div>
      );
    case 'QUALIFICATION_UPDATE':
      return (
        <div className="space-y-3">
          <div>
            <label className="form-label">Qualification Name *</label>
            <input id="field-qual-name" type="text" {...register('qualification_name')} className="input-field" placeholder="e.g. M.Sc Physics" />
            {errors.qualification_name && <p className="form-error">{errors.qualification_name.message}</p>}
          </div>
          <div>
            <label className="form-label">Institution *</label>
            <input id="field-institution" type="text" {...register('institution')} className="input-field" placeholder="University / College name" />
            {errors.institution && <p className="form-error">{errors.institution.message}</p>}
          </div>
          <div>
            <label className="form-label">Passing Year *</label>
            <input id="field-passing-year" type="number" {...register('passing_year')} className="input-field" placeholder="e.g. 2023" />
            {errors.passing_year && <p className="form-error">{errors.passing_year.message}</p>}
          </div>
        </div>
      );
    case 'NAME_CORRECTION':
      return (
        <div className="space-y-3">
          <div>
            <label className="form-label">Corrected First Name *</label>
            <input id="field-first-name" type="text" {...register('corrected_first_name')} className="input-field" />
            {errors.corrected_first_name && <p className="form-error">{errors.corrected_first_name.message}</p>}
          </div>
          <div>
            <label className="form-label">Corrected Last Name *</label>
            <input id="field-last-name" type="text" {...register('corrected_last_name')} className="input-field" />
            {errors.corrected_last_name && <p className="form-error">{errors.corrected_last_name.message}</p>}
          </div>
          <div>
            <label className="form-label">Reason for Correction *</label>
            <textarea id="field-name-reason" {...register('correction_reason')} className="input-field" placeholder="e.g. Spelling error in service book" />
            {errors.correction_reason && <p className="form-error">{errors.correction_reason.message}</p>}
          </div>
        </div>
      );
    case 'DOB_CORRECTION':
      return (
        <div className="space-y-3">
          <div>
            <label className="form-label">Corrected Date of Birth *</label>
            <input id="field-dob" type="date" {...register('corrected_dob')} className="input-field" />
            {errors.corrected_dob && <p className="form-error">{errors.corrected_dob.message}</p>}
          </div>
          <div>
            <label className="form-label">Reason for Correction *</label>
            <textarea id="field-dob-reason" {...register('correction_reason')} className="input-field" placeholder="e.g. Error in service book, attaching matric certificate" />
            {errors.correction_reason && <p className="form-error">{errors.correction_reason.message}</p>}
          </div>
        </div>
      );
    case 'POSTING_CORRECTION':
    case 'SERVICE_RECORD_CORRECTION':
      return (
        <div>
          <label className="form-label">Correction Details *</label>
          <textarea id="field-correction-detail" {...register('correction_detail')} className="input-field min-h-[100px]" placeholder="Describe the correction needed in detail..." />
          {errors.correction_detail && <p className="form-error">{errors.correction_detail.message}</p>}
        </div>
      );
    default:
      return null;
  }
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function EmployeeUpdateRequestForm() {
  const navigate = useNavigate();
  const [selectedType, setSelectedType] = useState<RequestTypeCode | ''>('');
  const [submitted, setSubmitted] = useState(false);
  const submitMutation = useSubmitUpdateRequest();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<UpdateRequestFormData>({
    resolver: zodResolver(updateRequestSchema) as any,
  });

  const onSubmit = async (data: UpdateRequestFormData) => {
    const proposed = buildProposedValues(data);
    await submitMutation.mutateAsync({
      request_type: data.request_type,
      reason: data.reason,
      proposed_values: proposed,
      target_entity_type: 'PROFILE',
    });
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="p-6 max-w-lg mx-auto">
        <div className="bg-white rounded-2xl border border-border p-8 text-center shadow-md">
          <CheckCircle size={48} className="text-green-500 mx-auto mb-3" />
          <h2 className="text-xl font-bold text-ink mb-1">Request Submitted</h2>
          <p className="text-sm text-ink-muted">
            Your correction request has been submitted for HOI/ZEO review.
            You will be notified once it is processed.
          </p>
          {IS_DEV_MODE && (
            <p className="text-xs text-yellow-700 bg-yellow-50 border border-yellow-200 rounded-lg p-2 mt-3">
              DEV MODE: No actual DB write made. Status shown is simulated.
            </p>
          )}
          <div className="mt-5 flex flex-col sm:flex-row gap-2 justify-center">
            <button className="btn-outline" onClick={() => { setSubmitted(false); reset(); setSelectedType(''); }}>
              Submit Another
            </button>
            <button className="btn-primary" onClick={() => navigate('/employee/self-service')}>
              Back to My Profile
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-5">
      {IS_DEV_MODE && (
        <div className="px-3 py-1 bg-yellow-100 border border-yellow-300 rounded-full text-yellow-800 text-xs font-medium w-fit">
          UI REVIEW MOCK DATA — Employee Update Request
        </div>
      )}

      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/employee/self-service')} className="btn-ghost p-2 h-10 w-10 rounded-lg">
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-xl font-bold text-ink">Request a Correction</h1>
          <p className="text-xs text-ink-muted">All requests require HOI/ZEO review before being applied.</p>
        </div>
      </div>

      {/* Warning */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800 flex items-start gap-2">
        <AlertTriangle size={13} className="mt-0.5 flex-shrink-0" />
        <span>
          This request will be reviewed by your HOI or ZEO. Your profile will only be updated <strong>after approval</strong>.
          Direct edits to approved service data are not permitted.
        </span>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-xl border border-border p-5 space-y-5">
        {/* Request Type */}
        <div>
          <label className="form-label" htmlFor="field-request-type">Request Type *</label>
          <select
            id="field-request-type"
            {...register('request_type')}
            className="input-field"
            onChange={e => setSelectedType(e.target.value as RequestTypeCode)}
            value={selectedType}
          >
            <option value="">— Select request type —</option>
            {REQUEST_TYPES.map(t => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
          {errors.request_type && <p className="form-error">{(errors as any).request_type?.message}</p>}
        </div>

        {/* Dynamic Type-Specific Fields */}
        {selectedType && (
          <TypeFields type={selectedType} register={register} errors={errors} />
        )}

        {/* Reason */}
        {selectedType && (
          <div>
            <label className="form-label" htmlFor="field-reason">Reason for Request *</label>
            <textarea
              id="field-reason"
              {...register('reason')}
              className="input-field min-h-[80px]"
              placeholder="Explain why this correction is needed..."
            />
            {errors.reason && <p className="form-error">{(errors as any).reason?.message}</p>}
          </div>
        )}

        {/* Supporting Document Description */}
        {selectedType && (
          <div>
            <label className="form-label" htmlFor="field-doc-desc">Supporting Document (describe)</label>
            <input
              id="field-doc-desc"
              type="text"
              {...register('supporting_document_desc')}
              className="input-field"
              placeholder="e.g. Attaching Matric Certificate copy"
            />
          </div>
        )}

        {/* Submit */}
        <div className="flex justify-end gap-2 pt-2 border-t border-border">
          <button type="button" className="btn-outline" onClick={() => navigate('/employee/self-service')}>
            Cancel
          </button>
          <button
            id="btn-submit-request"
            type="submit"
            disabled={!selectedType || submitMutation.isPending}
            className="btn-primary flex items-center gap-2 disabled:opacity-50"
          >
            <Send size={14} />
            {submitMutation.isPending ? 'Submitting…' : 'Submit Request'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default EmployeeUpdateRequestForm;
