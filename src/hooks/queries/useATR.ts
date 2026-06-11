import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import type { ActionTakenReport } from '../../types';

export const atrKeys = {
  all: ['atrs'] as const,
  byCase: (caseId: string) => [...atrKeys.all, 'case', caseId] as const,
  byItem: (itemId: string) => [...atrKeys.all, 'work_item', itemId] as const,
};

export function useCaseATRs(caseId: string) {
  return useQuery({
    queryKey: atrKeys.byCase(caseId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('action_taken_reports')
        .select('*, submitter:submitted_by(username, party:party_id(*)), approver:approved_by(username)')
        .eq('case_id', caseId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as ActionTakenReport[];
    },
    enabled: !!caseId,
  });
}
