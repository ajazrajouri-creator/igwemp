import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import type { StudentEnrollmentSubmission, SchoolClassConfiguration } from '../../types';

const IS_DEV_MODE = !isSupabaseConfigured;

const MOCK_CONFIGS: SchoolClassConfiguration[] = [
  { id: 'conf1', tenant_id: 't1', office_id: 'o1', office_path: '1.2.3', school_type_id: 'HSS', class_id: 'CLASS_6', is_allowed: true, is_active: true, effective_from: new Date().toISOString(), effective_to: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'conf2', tenant_id: 't1', office_id: 'o1', office_path: '1.2.3', school_type_id: 'HSS', class_id: 'CLASS_7', is_allowed: true, is_active: true, effective_from: new Date().toISOString(), effective_to: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'conf3', tenant_id: 't1', office_id: 'o1', office_path: '1.2.3', school_type_id: 'HSS', class_id: 'CLASS_8', is_allowed: true, is_active: true, effective_from: new Date().toISOString(), effective_to: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'conf4', tenant_id: 't1', office_id: 'o1', office_path: '1.2.3', school_type_id: 'HSS', class_id: 'CLASS_9', is_allowed: true, is_active: true, effective_from: new Date().toISOString(), effective_to: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'conf5', tenant_id: 't1', office_id: 'o1', office_path: '1.2.3', school_type_id: 'HSS', class_id: 'CLASS_10', is_allowed: true, is_active: true, effective_from: new Date().toISOString(), effective_to: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'conf6', tenant_id: 't1', office_id: 'o1', office_path: '1.2.3', school_type_id: 'HSS', class_id: 'CLASS_11', is_allowed: true, is_active: true, effective_from: new Date().toISOString(), effective_to: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'conf7', tenant_id: 't1', office_id: 'o1', office_path: '1.2.3', school_type_id: 'HSS', class_id: 'CLASS_12', is_allowed: true, is_active: true, effective_from: new Date().toISOString(), effective_to: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
];

const MOCK_SUBMISSIONS: StudentEnrollmentSubmission[] = [
  { id: 'sub1', tenant_id: 't1', academic_session_id: '2026-2027', office_id: 'o1', office_path: '1.2.3', status: 'DRAFT', submitted_at: null, reviewed_at: null, reviewer_remarks: null, approved_at: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
];

export const useSchoolClassConfigurations = (officeId?: string) => {
  return useQuery({
    queryKey: ['school_class_configurations', officeId],
    queryFn: async () => {
      if (IS_DEV_MODE) {
        return officeId ? MOCK_CONFIGS.filter(c => c.office_id === officeId) : MOCK_CONFIGS;
      }
      let q = supabase.from('school_class_configurations').select('*, master_data_items!class_id(code, name)').eq('is_active', true);
      if (officeId) {
        q = q.eq('office_id', officeId);
      }
      const { data, error } = await q;
      if (error) throw error;
      return data;
    }
  });
};

export const useEnrollmentSubmissions = (filters?: { officeId?: string; status?: string }) => {
  return useQuery({
    queryKey: ['enrollment_submissions', filters],
    queryFn: async () => {
      if (IS_DEV_MODE) {
        let res = MOCK_SUBMISSIONS;
        if (filters?.officeId) res = res.filter(s => s.office_id === filters.officeId);
        if (filters?.status) res = res.filter(s => s.status === filters.status);
        return res;
      }
      let q = supabase.from('student_enrollment_submissions').select('*, offices(name)');
      if (filters?.officeId) q = q.eq('office_id', filters.officeId);
      if (filters?.status) q = q.eq('status', filters.status);
      const { data, error } = await q;
      if (error) throw error;
      return data.map((d: any) => ({ ...d, office_name: d.offices?.name }));
    }
  });
};

export const useEnrollmentSummary = () => {
  return useQuery({
    queryKey: ['v_school_enrollment_summary'],
    queryFn: async () => {
      if (IS_DEV_MODE) {
        return [
          { office_name: 'Primary School A', total_count: 100, male_count: 50, female_count: 50, other_count: 0, cwsn_count: 5 }
        ];
      }
      const { data, error } = await supabase.from('v_school_enrollment_summary').select('*');
      if (error) throw error;
      return data;
    }
  });
};

export const useSeniorSecondarySummary = () => {
  return useQuery({
    queryKey: ['v_senior_secondary_enrollment_summary'],
    queryFn: async () => {
      if (IS_DEV_MODE) {
        return [
          { office_name: 'HSS Zone B', stream_id: 'SCIENCE', total_count: 50 }
        ];
      }
      const { data, error } = await supabase.from('v_senior_secondary_enrollment_summary').select('*');
      if (error) throw error;
      return data;
    }
  });
};

export const useSubmitEnrollment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (submissionId: string) => {
      if (IS_DEV_MODE) return { success: true };
      const { data, error } = await supabase.rpc('submit_enrollment_submission', { p_submission_id: submissionId });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enrollment_submissions'] });
    }
  });
};

export const useApproveEnrollment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (submissionId: string) => {
      if (IS_DEV_MODE) return { success: true };
      const { data, error } = await supabase.rpc('approve_enrollment_submission', { p_submission_id: submissionId });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enrollment_submissions'] });
      queryClient.invalidateQueries({ queryKey: ['v_school_enrollment_summary'] });
      queryClient.invalidateQueries({ queryKey: ['v_senior_secondary_enrollment_summary'] });
    }
  });
};

export const useReturnEnrollment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ submissionId, remarks }: { submissionId: string; remarks: string }) => {
      if (IS_DEV_MODE) return { success: true };
      const { data, error } = await supabase.rpc('return_enrollment_submission', { p_submission_id: submissionId, p_remarks: remarks });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enrollment_submissions'] });
    }
  });
};
