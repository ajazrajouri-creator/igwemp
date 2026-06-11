import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import type { Section, SectionMembership } from '../../types';

export const sectionKeys = {
  all: ['sections'] as const,
  byOffice: (officeId: string) => [...sectionKeys.all, 'office', officeId] as const,
  members: (sectionId: string) => [...sectionKeys.all, sectionId, 'members'] as const,
};

export function useOfficeSections(officeId: string | null) {
  return useQuery({
    queryKey: sectionKeys.byOffice(officeId!),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sections')
        .select('*, head:user_accounts(*)')
        .eq('office_id', officeId)
        .is('deleted_at', null)
        .order('section_name');
      
      if (error) throw error;
      return data as Section[];
    },
    enabled: !!officeId,
  });
}

export function useSectionMembers(sectionId: string | null) {
  return useQuery({
    queryKey: sectionKeys.members(sectionId!),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('section_memberships')
        .select('*, user:user_accounts(*, party:parties(*))')
        .eq('section_id', sectionId)
        .order('created_at');
      
      if (error) throw error;
      return data as SectionMembership[];
    },
    enabled: !!sectionId,
  });
}
