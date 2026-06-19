import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';

const IS_DEV_MODE = !isSupabaseConfigured;

// Types
export interface InfrastructureSubmission {
  id: string;
  tenant_id: string;
  census_cycle_id: string;
  office_id: string;
  office_path: string;
  status: 'DRAFT' | 'SUBMITTED' | 'IN_REVIEW' | 'RETURNED' | 'APPROVED' | 'COMMITTED';
  reviewer_remarks?: string;
  office_name?: string; // joined or mocked
}

export interface DeficiencyReport {
  tenant_id: string;
  office_id: string;
  office_path: string;
  office_name: string;
  deficiency_type: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  latest_snapshot_id: string;
  last_updated: string;
}

// Mocks
const MOCK_SUBMISSIONS: InfrastructureSubmission[] = [
  { id: 'sub-1', tenant_id: 't1', census_cycle_id: 'c1', office_id: 'o1', office_path: '1.2.3', status: 'SUBMITTED', office_name: 'Primary School A' },
  { id: 'sub-2', tenant_id: 't1', census_cycle_id: 'c1', office_id: 'o2', office_path: '1.2.4', status: 'RETURNED', reviewer_remarks: 'Missing boundary wall photo', office_name: 'Middle School B' },
  { id: 'sub-3', tenant_id: 't1', census_cycle_id: 'c1', office_id: 'o3', office_path: '1.2.5', status: 'IN_REVIEW', office_name: 'High School C' },
];

const MOCK_DEFICIENCIES: DeficiencyReport[] = [
  { tenant_id: 't1', office_id: 'o1', office_path: '1.2.3', office_name: 'Primary School A', deficiency_type: 'NO_GIRLS_TOILET', severity: 'CRITICAL', latest_snapshot_id: 'snap-1', last_updated: new Date().toISOString() },
  { tenant_id: 't1', office_id: 'o2', office_path: '1.2.4', office_name: 'Middle School B', deficiency_type: 'NO_DRINKING_WATER', severity: 'CRITICAL', latest_snapshot_id: 'snap-2', last_updated: new Date().toISOString() },
  { tenant_id: 't1', office_id: 'o3', office_path: '1.2.5', office_name: 'High School C', deficiency_type: 'NO_ELECTRICITY', severity: 'HIGH', latest_snapshot_id: 'snap-3', last_updated: new Date().toISOString() },
];

// Hooks
export const useInfrastructureSubmissions = (officeId?: string) => {
  return useQuery({
    queryKey: ['infrastructure_submissions', officeId],
    queryFn: async () => {
      if (IS_DEV_MODE) {
        return officeId ? MOCK_SUBMISSIONS.filter(s => s.office_id === officeId) : MOCK_SUBMISSIONS;
      }
      let q = supabase.from('school_infrastructure_submissions').select('*, offices(name)');
      if (officeId) {
        q = q.eq('office_id', officeId);
      }
      const { data, error } = await q;
      if (error) throw error;
      return data.map((d: any) => ({ ...d, office_name: d.offices?.name }));
    },
  });
};

export const useApproveInfrastructureSubmission = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ submissionId, remarks }: { submissionId: string; remarks?: string }) => {
      if (IS_DEV_MODE) {
        const sub = MOCK_SUBMISSIONS.find(s => s.id === submissionId);
        if (sub) {
          sub.status = 'COMMITTED';
          sub.reviewer_remarks = remarks;
        }
        return { success: true };
      }
      const { data, error } = await supabase.rpc('approve_infrastructure_submission', {
        p_submission_id: submissionId,
        p_remarks: remarks || null
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['infrastructure_submissions'] });
      queryClient.invalidateQueries({ queryKey: ['infrastructure_deficiencies'] });
    }
  });
};

export const useReturnInfrastructureSubmission = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ submissionId, remarks }: { submissionId: string; remarks: string }) => {
      if (IS_DEV_MODE) {
        const sub = MOCK_SUBMISSIONS.find(s => s.id === submissionId);
        if (sub) {
          sub.status = 'RETURNED';
          sub.reviewer_remarks = remarks;
        }
        return { success: true };
      }
      const { error } = await supabase
        .from('school_infrastructure_submissions')
        .update({ status: 'RETURNED', reviewer_remarks: remarks })
        .eq('id', submissionId);
      if (error) throw error;
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['infrastructure_submissions'] });
    }
  });
};

export const useDeficiencies = () => {
  return useQuery({
    queryKey: ['infrastructure_deficiencies'],
    queryFn: async () => {
      if (IS_DEV_MODE) {
        return MOCK_DEFICIENCIES;
      }
      const { data, error } = await supabase.from('v_school_infrastructure_deficiency').select('*');
      if (error) throw error;
      return data as DeficiencyReport[];
    }
  });
};
