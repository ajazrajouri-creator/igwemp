import { ArrowLeft, Save } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { StudentFullFormData } from '../../lib/validations/students';
import { studentFullFormSchema } from '../../lib/validations/students';
import { useCreateStudent } from '../../hooks/queries/useStudents';

export const StudentProfileForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isNew = !id || id === 'new';
  
  const createMutation = useCreateStudent();
  
  const { register, handleSubmit, formState: { errors } } = useForm<StudentFullFormData>({
    resolver: zodResolver(studentFullFormSchema) as any,
    defaultValues: {
      profile: {
        is_cwsn: false,
      } as any
    }
  });

  const onSubmit = (data: StudentFullFormData) => {
    createMutation.mutate(data, {
      onSuccess: () => {
        navigate('/students');
      }
    });
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 animate-enter">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => navigate('/students')} className="btn-ghost p-2 h-10 w-10">
          <ArrowLeft className="h-5 w-5 text-ink-muted" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-ink-primary">
            {isNew ? 'Register New Student' : 'Edit Student Profile'}
          </h1>
          <p className="text-sm text-ink-muted">
            Fill out the student identity and current enrollment details below.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="card p-6 border-surface-4">
          <h2 className="text-lg font-medium text-ink-primary mb-4 border-b border-surface-4 pb-2">Student Identity</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-ink-secondary mb-1">Student Name *</label>
              <input type="text" {...register('profile.student_name')} placeholder="Full name" className={`w-full px-3 py-2 bg-surface-1 border rounded-md text-sm focus:outline-none focus:border-brand-500 ${errors.profile?.student_name ? 'border-red-500' : 'border-surface-4'}`} />
              {errors.profile?.student_name && <p className="text-red-500 text-xs mt-1">{errors.profile.student_name.message}</p>}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-ink-secondary mb-1">Date of Birth</label>
              <input type="date" {...register('profile.date_of_birth')} className={`w-full px-3 py-2 bg-surface-1 border rounded-md text-sm focus:outline-none focus:border-brand-500 ${errors.profile?.date_of_birth ? 'border-red-500' : 'border-surface-4'}`} />
              {errors.profile?.date_of_birth && <p className="text-red-500 text-xs mt-1">{errors.profile.date_of_birth.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-ink-secondary mb-1">Gender</label>
              <select {...register('profile.gender_id')} className="w-full px-3 py-2 bg-surface-1 border border-surface-4 rounded-md text-sm focus:outline-none focus:border-brand-500">
                <option value="">Select Gender...</option>
                <option value="m1">Male</option>
                <option value="f1">Female</option>
                <option value="o1">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-ink-secondary mb-1">Mobile No</label>
              <input type="text" {...register('profile.mobile_no')} placeholder="10-digit number" className={`w-full px-3 py-2 bg-surface-1 border rounded-md text-sm focus:outline-none focus:border-brand-500 ${errors.profile?.mobile_no ? 'border-red-500' : 'border-surface-4'}`} />
              {errors.profile?.mobile_no && <p className="text-red-500 text-xs mt-1">{errors.profile.mobile_no.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-ink-secondary mb-1">Father's Name</label>
              <input type="text" {...register('profile.father_name')} className="w-full px-3 py-2 bg-surface-1 border border-surface-4 rounded-md text-sm focus:outline-none focus:border-brand-500" />
            </div>

            <div>
              <label className="block text-sm font-medium text-ink-secondary mb-1">Mother's Name</label>
              <input type="text" {...register('profile.mother_name')} className="w-full px-3 py-2 bg-surface-1 border border-surface-4 rounded-md text-sm focus:outline-none focus:border-brand-500" />
            </div>

            <div>
              <label className="block text-sm font-medium text-ink-secondary mb-1">Guardian's Name</label>
              <input type="text" {...register('profile.guardian_name')} className="w-full px-3 py-2 bg-surface-1 border border-surface-4 rounded-md text-sm focus:outline-none focus:border-brand-500" />
            </div>

            <div className="md:col-span-2">
              <label className="flex items-center gap-2 text-sm font-medium text-ink-secondary">
                <input type="checkbox" {...register('profile.is_cwsn')} className="rounded border-surface-4 text-brand-500 focus:ring-brand-500" />
                Child With Special Needs (CWSN)
              </label>
            </div>
          </div>
        </div>

        {isNew && (
          <div className="card p-6 border-surface-4">
            <h2 className="text-lg font-medium text-ink-primary mb-4 border-b border-surface-4 pb-2">Initial Enrollment</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-ink-secondary mb-1">Academic Session *</label>
                <select {...register('enrollment.academic_session_id')} className="w-full px-3 py-2 bg-surface-1 border border-surface-4 rounded-md text-sm focus:outline-none focus:border-brand-500">
                  <option value="">Select Session...</option>
                  <option value="sess1">2026-2027</option>
                </select>
                {errors.enrollment?.academic_session_id && <p className="text-red-500 text-xs mt-1">{errors.enrollment.academic_session_id.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-ink-secondary mb-1">Class *</label>
                <select {...register('enrollment.class_id')} className="w-full px-3 py-2 bg-surface-1 border border-surface-4 rounded-md text-sm focus:outline-none focus:border-brand-500">
                  <option value="">Select Class...</option>
                  <option value="c1">Class 1</option>
                  <option value="c2">Class 2</option>
                </select>
                {errors.enrollment?.class_id && <p className="text-red-500 text-xs mt-1">{errors.enrollment.class_id.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-ink-secondary mb-1">Section</label>
                <input type="text" {...register('enrollment.section_name')} placeholder="A, B, C..." className="w-full px-3 py-2 bg-surface-1 border border-surface-4 rounded-md text-sm focus:outline-none focus:border-brand-500" />
              </div>

              <div>
                <label className="block text-sm font-medium text-ink-secondary mb-1">Roll No</label>
                <input type="text" {...register('enrollment.roll_no')} className="w-full px-3 py-2 bg-surface-1 border border-surface-4 rounded-md text-sm focus:outline-none focus:border-brand-500" />
              </div>

              <div>
                <label className="block text-sm font-medium text-ink-secondary mb-1">Enrollment Date *</label>
                <input type="date" {...register('enrollment.enrollment_date')} className={`w-full px-3 py-2 bg-surface-1 border rounded-md text-sm focus:outline-none focus:border-brand-500 ${errors.enrollment?.enrollment_date ? 'border-red-500' : 'border-surface-4'}`} />
                {errors.enrollment?.enrollment_date && <p className="text-red-500 text-xs mt-1">{errors.enrollment.enrollment_date.message}</p>}
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-4">
          <button type="button" className="btn-outline" onClick={() => navigate('/students')}>
            Cancel
          </button>
          <button type="submit" className="btn-primary" disabled={createMutation.isPending}>
            <Save className="h-4 w-4 mr-2" />
            {createMutation.isPending ? 'Saving...' : 'Save Profile'}
          </button>
        </div>
      </form>
    </div>
  );
};
