import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import type { Case, WorkItem } from '../../types';

export const caseKeys = {
  all: ['cases'] as const,
  list: () => [...caseKeys.all, 'list'] as const,
  detail: (id: string) => [...caseKeys.all, 'detail', id] as const,
  workItems: (caseId: string) => [...caseKeys.all, 'work_items', caseId] as const,
};

export function useCases() {
  return useQuery({
    queryKey: caseKeys.list(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cases')
        .select('*, case_type:case_type_id(*), current_state:current_state_id(*), parent_order:parent_order_id(*)')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Case[];
    },
  });
}

export function useCase(id: string) {
  return useQuery({
    queryKey: caseKeys.detail(id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cases')
        .select('*, case_type:case_type_id(*), current_state:current_state_id(*), parent_order:parent_order_id(*), parent_case:parent_case_id(*)')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data as Case;
    },
    enabled: !!id,
  });
}

export function useCaseWorkItems(caseId: string) {
  return useQuery({
    queryKey: caseKeys.workItems(caseId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('work_items')
        .select('*, assigned_user:assigned_user_id(username, party:party_id(*)), assigned_section:assigned_section_id(*), assigned_office:assigned_office_id(*), picked_up_by_user:picked_up_by(username)')
        .eq('case_id', caseId)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      return data as WorkItem[];
    },
    enabled: !!caseId,
  });
}
