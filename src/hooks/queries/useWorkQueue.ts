import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import type { WorkItem } from '../../types';

export const queueKeys = {
  all: ['queue'] as const,
  section: (sectionId: string) => [...queueKeys.all, 'section', sectionId] as const,
  user: (userId: string) => [...queueKeys.all, 'user', userId] as const,
};

export function useSectionQueue(sectionId: string) {
  return useQuery({
    queryKey: queueKeys.section(sectionId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('work_items')
        .select('*, case:case_id(*, case_type:case_type_id(*), current_state:current_state_id(*)), picked_up_by_user:picked_up_by(username)')
        .eq('assigned_section_id', sectionId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as WorkItem[];
    },
    enabled: !!sectionId,
  });
}

export function useMyQueue(userId: string) {
  return useQuery({
    queryKey: queueKeys.user(userId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('work_items')
        .select('*, case:case_id(*, case_type:case_type_id(*), current_state:current_state_id(*))')
        .eq('assigned_user_id', userId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as WorkItem[];
    },
    enabled: !!userId,
  });
}
